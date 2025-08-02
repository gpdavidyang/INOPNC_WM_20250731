-- Analytics Aggregation Functions
-- Task 4: Data aggregation functions for comprehensive analytics

-- 1. Function to aggregate daily report completion metrics
CREATE OR REPLACE FUNCTION calculate_daily_report_metrics(
  p_organization_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_reports INTEGER,
  completed_reports INTEGER,
  pending_reports INTEGER,
  rejected_reports INTEGER,
  completion_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_reports,
    COUNT(CASE WHEN dr.status = 'approved' THEN 1 END)::INTEGER as completed_reports,
    COUNT(CASE WHEN dr.status IN ('draft', 'submitted') THEN 1 END)::INTEGER as pending_reports,
    COUNT(CASE WHEN dr.status = 'rejected' THEN 1 END)::INTEGER as rejected_reports,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(CASE WHEN dr.status = 'approved' THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END as completion_rate
  FROM daily_reports dr
  JOIN sites s ON dr.site_id = s.id
  WHERE s.organization_id = p_organization_id
    AND (p_site_id IS NULL OR dr.site_id = p_site_id)
    AND dr.work_date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to calculate material usage trends
CREATE OR REPLACE FUNCTION calculate_material_usage_metrics(
  p_organization_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  metric_date DATE,
  npc1000_received DECIMAL(10,2),
  npc1000_used DECIMAL(10,2),
  npc1000_remaining DECIMAL(10,2),
  usage_efficiency DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.work_date as metric_date,
    SUM(dr.npc1000_incoming) as npc1000_received,
    SUM(dr.npc1000_used) as npc1000_used,
    AVG(dr.npc1000_remaining) as npc1000_remaining,
    CASE 
      WHEN SUM(dr.npc1000_incoming) > 0 
      THEN ROUND((SUM(dr.npc1000_used) / SUM(dr.npc1000_incoming)) * 100, 2)
      ELSE 0
    END as usage_efficiency
  FROM daily_reports dr
  JOIN sites s ON dr.site_id = s.id
  WHERE s.organization_id = p_organization_id
    AND (p_site_id IS NULL OR dr.site_id = p_site_id)
    AND dr.work_date BETWEEN p_start_date AND p_end_date
    AND dr.status = 'approved'
  GROUP BY dr.work_date
  ORDER BY dr.work_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to calculate attendance patterns and labor hours
CREATE OR REPLACE FUNCTION calculate_attendance_metrics(
  p_organization_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_workers INTEGER,
  present_workers INTEGER,
  absent_workers INTEGER,
  attendance_rate DECIMAL(5,2),
  total_labor_hours DECIMAL(10,2),
  avg_labor_hours DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH worker_stats AS (
    SELECT 
      COUNT(DISTINCT wa.worker_id) as total_assigned,
      COUNT(DISTINCT ar.worker_id) as present,
      SUM(COALESCE(ar.labor_hours, 0)) as labor_hours
    FROM worker_assignments wa
    LEFT JOIN attendance_records ar ON 
      wa.worker_id = ar.worker_id 
      AND ar.date = p_date
      AND ar.status = 'present'
    JOIN sites s ON wa.site_id = s.id
    WHERE s.organization_id = p_organization_id
      AND (p_site_id IS NULL OR wa.site_id = p_site_id)
      AND p_date BETWEEN wa.start_date AND COALESCE(wa.end_date, p_date)
  )
  SELECT 
    total_assigned::INTEGER as total_workers,
    present::INTEGER as present_workers,
    (total_assigned - present)::INTEGER as absent_workers,
    CASE 
      WHEN total_assigned > 0 
      THEN ROUND((present::NUMERIC / total_assigned) * 100, 2)
      ELSE 0
    END as attendance_rate,
    labor_hours as total_labor_hours,
    CASE 
      WHEN present > 0 
      THEN ROUND(labor_hours / present, 2)
      ELSE 0
    END as avg_labor_hours
  FROM worker_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to calculate equipment utilization
CREATE OR REPLACE FUNCTION calculate_equipment_utilization(
  p_organization_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_equipment INTEGER,
  in_use INTEGER,
  available INTEGER,
  in_maintenance INTEGER,
  utilization_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH equipment_status AS (
    SELECT 
      e.id,
      e.status,
      CASE 
        WHEN ec.checkout_date <= p_date AND (ec.return_date IS NULL OR ec.return_date >= p_date) 
        THEN TRUE 
        ELSE FALSE 
      END as is_checked_out
    FROM equipment e
    LEFT JOIN equipment_checkouts ec ON e.id = ec.equipment_id
    JOIN sites s ON e.site_id = s.id
    WHERE s.organization_id = p_organization_id
      AND (p_site_id IS NULL OR e.site_id = p_site_id)
  )
  SELECT 
    COUNT(DISTINCT id)::INTEGER as total_equipment,
    COUNT(DISTINCT CASE WHEN is_checked_out THEN id END)::INTEGER as in_use,
    COUNT(DISTINCT CASE WHEN status = 'available' AND NOT is_checked_out THEN id END)::INTEGER as available,
    COUNT(DISTINCT CASE WHEN status = 'maintenance' THEN id END)::INTEGER as in_maintenance,
    CASE 
      WHEN COUNT(DISTINCT id) > 0 
      THEN ROUND((COUNT(DISTINCT CASE WHEN is_checked_out THEN id END)::NUMERIC / COUNT(DISTINCT id)) * 100, 2)
      ELSE 0
    END as utilization_rate
  FROM equipment_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to calculate site productivity score
CREATE OR REPLACE FUNCTION calculate_site_productivity(
  p_organization_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  productivity_score DECIMAL(5,2),
  work_efficiency DECIMAL(5,2),
  issue_resolution_rate DECIMAL(5,2),
  approval_efficiency DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH productivity_metrics AS (
    SELECT 
      -- Work efficiency based on reports vs workers
      CASE 
        WHEN COUNT(DISTINCT ar.worker_id) > 0 
        THEN (COUNT(DISTINCT dr.id)::NUMERIC / COUNT(DISTINCT ar.worker_id)) * 100
        ELSE 0
      END as work_efficiency,
      -- Issue resolution rate
      CASE 
        WHEN COUNT(CASE WHEN dr.issues IS NOT NULL THEN 1 END) > 0
        THEN (COUNT(CASE WHEN dr.issues IS NOT NULL AND dr.status = 'approved' THEN 1 END)::NUMERIC / 
              COUNT(CASE WHEN dr.issues IS NOT NULL THEN 1 END)) * 100
        ELSE 100
      END as issue_resolution,
      -- Approval efficiency (approved vs total)
      CASE 
        WHEN COUNT(dr.id) > 0
        THEN (COUNT(CASE WHEN dr.status = 'approved' THEN 1 END)::NUMERIC / COUNT(dr.id)) * 100
        ELSE 0
      END as approval_efficiency
    FROM sites s
    LEFT JOIN daily_reports dr ON s.id = dr.site_id AND dr.work_date = p_date
    LEFT JOIN attendance_records ar ON s.id = ar.site_id AND ar.date = p_date AND ar.status = 'present'
    WHERE s.organization_id = p_organization_id
      AND (p_site_id IS NULL OR s.id = p_site_id)
  )
  SELECT 
    ROUND((work_efficiency * 0.4 + issue_resolution * 0.3 + approval_efficiency * 0.3), 2) as productivity_score,
    ROUND(work_efficiency, 2) as work_efficiency,
    ROUND(issue_resolution, 2) as issue_resolution_rate,
    ROUND(approval_efficiency, 2) as approval_efficiency
  FROM productivity_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Master aggregation function that combines all metrics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(
  p_organization_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
  v_report_metrics RECORD;
  v_attendance_metrics RECORD;
  v_equipment_metrics RECORD;
  v_productivity_metrics RECORD;
  v_material_metrics RECORD;
BEGIN
  -- Get all metrics
  SELECT * INTO v_report_metrics 
  FROM calculate_daily_report_metrics(p_organization_id, p_site_id, p_date);
  
  SELECT * INTO v_attendance_metrics 
  FROM calculate_attendance_metrics(p_organization_id, p_site_id, p_date);
  
  SELECT * INTO v_equipment_metrics 
  FROM calculate_equipment_utilization(p_organization_id, p_site_id, p_date);
  
  SELECT * INTO v_productivity_metrics 
  FROM calculate_site_productivity(p_organization_id, p_site_id, p_date);
  
  -- Get material metrics for the day
  SELECT 
    COALESCE(SUM(npc1000_received), 0) as received,
    COALESCE(SUM(npc1000_used), 0) as used,
    COALESCE(AVG(npc1000_remaining), 0) as remaining
  INTO v_material_metrics
  FROM calculate_material_usage_metrics(p_organization_id, p_site_id, p_date, p_date);
  
  -- Insert or update daily stats
  INSERT INTO analytics_daily_stats (
    organization_id,
    site_id,
    stat_date,
    total_reports,
    completed_reports,
    pending_reports,
    rejected_reports,
    report_completion_rate,
    total_workers,
    present_workers,
    absent_workers,
    attendance_rate,
    total_labor_hours,
    npc1000_received,
    npc1000_used,
    npc1000_remaining,
    material_efficiency_rate,
    total_equipment,
    equipment_in_use,
    equipment_maintenance,
    equipment_utilization_rate,
    productivity_score,
    issues_reported,
    issues_resolved
  ) VALUES (
    p_organization_id,
    p_site_id,
    p_date,
    v_report_metrics.total_reports,
    v_report_metrics.completed_reports,
    v_report_metrics.pending_reports,
    v_report_metrics.rejected_reports,
    v_report_metrics.completion_rate,
    v_attendance_metrics.total_workers,
    v_attendance_metrics.present_workers,
    v_attendance_metrics.absent_workers,
    v_attendance_metrics.attendance_rate,
    v_attendance_metrics.total_labor_hours,
    v_material_metrics.received,
    v_material_metrics.used,
    v_material_metrics.remaining,
    CASE 
      WHEN v_material_metrics.received > 0 
      THEN ROUND((v_material_metrics.used / v_material_metrics.received) * 100, 2)
      ELSE 0
    END,
    v_equipment_metrics.total_equipment,
    v_equipment_metrics.in_use,
    v_equipment_metrics.in_maintenance,
    v_equipment_metrics.utilization_rate,
    v_productivity_metrics.productivity_score,
    0, -- Issues reported (to be calculated separately)
    0  -- Issues resolved (to be calculated separately)
  )
  ON CONFLICT (organization_id, site_id, stat_date) 
  DO UPDATE SET
    total_reports = EXCLUDED.total_reports,
    completed_reports = EXCLUDED.completed_reports,
    pending_reports = EXCLUDED.pending_reports,
    rejected_reports = EXCLUDED.rejected_reports,
    report_completion_rate = EXCLUDED.report_completion_rate,
    total_workers = EXCLUDED.total_workers,
    present_workers = EXCLUDED.present_workers,
    absent_workers = EXCLUDED.absent_workers,
    attendance_rate = EXCLUDED.attendance_rate,
    total_labor_hours = EXCLUDED.total_labor_hours,
    npc1000_received = EXCLUDED.npc1000_received,
    npc1000_used = EXCLUDED.npc1000_used,
    npc1000_remaining = EXCLUDED.npc1000_remaining,
    material_efficiency_rate = EXCLUDED.material_efficiency_rate,
    total_equipment = EXCLUDED.total_equipment,
    equipment_in_use = EXCLUDED.equipment_in_use,
    equipment_maintenance = EXCLUDED.equipment_maintenance,
    equipment_utilization_rate = EXCLUDED.equipment_utilization_rate,
    productivity_score = EXCLUDED.productivity_score,
    updated_at = NOW();
    
  -- Also insert individual metrics for time-series tracking
  INSERT INTO analytics_metrics (metric_type, organization_id, site_id, metric_date, metric_value, metric_count)
  VALUES 
    ('daily_report_completion', p_organization_id, p_site_id, p_date, v_report_metrics.completion_rate, v_report_metrics.total_reports),
    ('attendance_rate', p_organization_id, p_site_id, p_date, v_attendance_metrics.attendance_rate, v_attendance_metrics.total_workers),
    ('equipment_utilization', p_organization_id, p_site_id, p_date, v_equipment_metrics.utilization_rate, v_equipment_metrics.total_equipment),
    ('site_productivity', p_organization_id, p_site_id, p_date, v_productivity_metrics.productivity_score, 1)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to run daily aggregation for all sites
CREATE OR REPLACE FUNCTION run_daily_analytics_aggregation(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
  v_site RECORD;
BEGIN
  -- Aggregate for each site
  FOR v_site IN 
    SELECT DISTINCT s.id, s.organization_id 
    FROM sites s 
    WHERE s.is_active = TRUE
  LOOP
    PERFORM aggregate_daily_analytics(v_site.organization_id, v_site.id, p_date);
  END LOOP;
  
  -- Also aggregate organization-level metrics (site_id = NULL)
  FOR v_site IN 
    SELECT DISTINCT organization_id 
    FROM sites 
    WHERE is_active = TRUE
  LOOP
    PERFORM aggregate_daily_analytics(v_site.organization_id, NULL, p_date);
  END LOOP;
  
  -- Refresh materialized view
  PERFORM refresh_analytics_dashboard();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to calculate historical trends
CREATE OR REPLACE FUNCTION get_analytics_trends(
  p_organization_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_metric_type VARCHAR(100) DEFAULT 'all',
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  metric_date DATE,
  metric_type VARCHAR(100),
  metric_value DECIMAL(10,2),
  change_from_previous DECIMAL(5,2),
  trend_direction VARCHAR(10)
) AS $$
BEGIN
  RETURN QUERY
  WITH metric_data AS (
    SELECT 
      am.metric_date,
      am.metric_type,
      am.metric_value,
      LAG(am.metric_value) OVER (PARTITION BY am.metric_type ORDER BY am.metric_date) as previous_value
    FROM analytics_metrics am
    WHERE am.organization_id = p_organization_id
      AND (p_site_id IS NULL OR am.site_id = p_site_id)
      AND (p_metric_type = 'all' OR am.metric_type = p_metric_type)
      AND am.metric_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
  )
  SELECT 
    md.metric_date,
    md.metric_type,
    md.metric_value,
    CASE 
      WHEN md.previous_value IS NOT NULL AND md.previous_value > 0
      THEN ROUND(((md.metric_value - md.previous_value) / md.previous_value) * 100, 2)
      ELSE 0
    END as change_from_previous,
    CASE 
      WHEN md.previous_value IS NULL THEN 'new'
      WHEN md.metric_value > md.previous_value THEN 'up'
      WHEN md.metric_value < md.previous_value THEN 'down'
      ELSE 'stable'
    END as trend_direction
  FROM metric_data md
  ORDER BY md.metric_date DESC, md.metric_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create scheduled job to run daily aggregation (using pg_cron if available)
-- Note: This requires pg_cron extension to be enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('daily-analytics-aggregation', '0 1 * * *', 'SELECT run_daily_analytics_aggregation();');

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_daily_report_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_material_usage_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_attendance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_equipment_utilization TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_site_productivity TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_trends TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_daily_analytics TO service_role;
GRANT EXECUTE ON FUNCTION run_daily_analytics_aggregation TO service_role;