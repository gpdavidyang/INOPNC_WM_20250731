-- Analytics Dashboard Infrastructure Schema
-- Task 4: Create Analytics Dashboard Infrastructure
-- This migration creates the necessary tables and functions for comprehensive analytics

-- 1. Analytics Metrics Table (Time-series data storage)
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100) NOT NULL CHECK (metric_type IN (
    'daily_report_completion',
    'material_usage',
    'attendance_rate',
    'equipment_utilization',
    'site_productivity',
    'safety_incidents',
    'approval_time',
    'worker_efficiency'
  )),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  metric_count INTEGER DEFAULT 0,
  dimensions JSONB DEFAULT '{}'::jsonb, -- Additional dimensions like worker_id, equipment_id, etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Aggregated Daily Statistics Table
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  
  -- Daily Report Metrics
  total_reports INTEGER DEFAULT 0,
  completed_reports INTEGER DEFAULT 0,
  pending_reports INTEGER DEFAULT 0,
  rejected_reports INTEGER DEFAULT 0,
  report_completion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Attendance Metrics
  total_workers INTEGER DEFAULT 0,
  present_workers INTEGER DEFAULT 0,
  absent_workers INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,2) DEFAULT 0,
  total_labor_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Material Metrics
  npc1000_received DECIMAL(10,2) DEFAULT 0,
  npc1000_used DECIMAL(10,2) DEFAULT 0,
  npc1000_remaining DECIMAL(10,2) DEFAULT 0,
  material_efficiency_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Equipment Metrics
  total_equipment INTEGER DEFAULT 0,
  equipment_in_use INTEGER DEFAULT 0,
  equipment_maintenance INTEGER DEFAULT 0,
  equipment_utilization_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Productivity Metrics
  productivity_score DECIMAL(5,2) DEFAULT 0,
  issues_reported INTEGER DEFAULT 0,
  issues_resolved INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, site_id, stat_date)
);

-- 3. Real-time Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Analytics Cache Table (for expensive calculations)
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  cache_type VARCHAR(100) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  cached_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Data Retention Configuration Table
CREATE TABLE IF NOT EXISTS analytics_retention_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100) NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL DEFAULT 365,
  archive_enabled BOOLEAN DEFAULT TRUE,
  compression_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_metrics_lookup ON analytics_metrics(organization_id, site_id, metric_type, metric_date DESC);
CREATE INDEX idx_analytics_metrics_date ON analytics_metrics(metric_date DESC);
CREATE INDEX idx_analytics_daily_stats_lookup ON analytics_daily_stats(organization_id, site_id, stat_date DESC);
CREATE INDEX idx_analytics_daily_stats_date ON analytics_daily_stats(stat_date DESC);
CREATE INDEX idx_analytics_events_unprocessed ON analytics_events(processed, event_timestamp) WHERE processed = FALSE;
CREATE INDEX idx_analytics_events_lookup ON analytics_events(organization_id, site_id, event_type, event_timestamp DESC);
CREATE INDEX idx_analytics_cache_lookup ON analytics_cache(cache_key, expires_at);
CREATE INDEX idx_analytics_cache_cleanup ON analytics_cache(expires_at) WHERE expires_at < NOW();

-- Enable RLS for all tables
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_retention_policy ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_metrics
CREATE POLICY "Site managers can view their site metrics" ON analytics_metrics
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM site_members 
      WHERE site_id = analytics_metrics.site_id 
      AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE organization_id = analytics_metrics.organization_id 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "System can insert metrics" ON analytics_metrics
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for analytics_daily_stats
CREATE POLICY "Site managers can view their site stats" ON analytics_daily_stats
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM site_members 
      WHERE site_id = analytics_daily_stats.site_id 
      AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE organization_id = analytics_daily_stats.organization_id 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "System can manage daily stats" ON analytics_daily_stats
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for analytics_events
CREATE POLICY "Users can create events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Site managers can view their site events" ON analytics_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM site_members 
      WHERE site_id = analytics_events.site_id 
      AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE organization_id = analytics_events.organization_id 
      AND role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for analytics_cache
CREATE POLICY "Site managers can view cached data" ON analytics_cache
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM site_members 
      WHERE site_id = analytics_cache.site_id 
      AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE organization_id = analytics_cache.organization_id 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "System can manage cache" ON analytics_cache
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for analytics_retention_policy
CREATE POLICY "Only admins can view retention policies" ON analytics_retention_policy
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Only system admins can manage retention policies" ON analytics_retention_policy
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'system_admin'
    )
  );

-- Create update timestamp trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_analytics_metrics_updated_at
  BEFORE UPDATE ON analytics_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_daily_stats_updated_at
  BEFORE UPDATE ON analytics_daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_cache_updated_at
  BEFORE UPDATE ON analytics_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_retention_policy_updated_at
  BEFORE UPDATE ON analytics_retention_policy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default retention policies
INSERT INTO analytics_retention_policy (metric_type, retention_days, archive_enabled, compression_enabled)
VALUES 
  ('daily_report_completion', 365, TRUE, TRUE),
  ('material_usage', 730, TRUE, TRUE),
  ('attendance_rate', 365, TRUE, FALSE),
  ('equipment_utilization', 365, TRUE, TRUE),
  ('site_productivity', 730, TRUE, TRUE),
  ('safety_incidents', 1825, TRUE, FALSE), -- 5 years for safety
  ('approval_time', 180, FALSE, TRUE),
  ('worker_efficiency', 365, TRUE, TRUE)
ON CONFLICT (metric_type) DO NOTHING;

-- Create materialized view for performance dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_dashboard_summary AS
SELECT 
  ads.organization_id,
  ads.site_id,
  s.name as site_name,
  ads.stat_date,
  ads.report_completion_rate,
  ads.attendance_rate,
  ads.equipment_utilization_rate,
  ads.productivity_score,
  ads.total_labor_hours,
  ads.npc1000_used,
  ads.issues_reported,
  ads.issues_resolved,
  CASE 
    WHEN ads.issues_reported > 0 
    THEN ROUND((ads.issues_resolved::numeric / ads.issues_reported) * 100, 2)
    ELSE 100
  END as issue_resolution_rate
FROM analytics_daily_stats ads
LEFT JOIN sites s ON ads.site_id = s.id
WHERE ads.stat_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY ads.stat_date DESC;

-- Create index on materialized view
CREATE INDEX idx_analytics_dashboard_summary_lookup 
ON analytics_dashboard_summary(organization_id, site_id, stat_date DESC);

-- Grant permissions
GRANT SELECT ON analytics_dashboard_summary TO authenticated;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_analytics_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_dashboard_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_analytics_dashboard() TO authenticated;