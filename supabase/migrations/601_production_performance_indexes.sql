-- 601_production_performance_indexes.sql
-- Production Performance Optimization for INOPNC Work Management System
-- Creates comprehensive indexes for optimal query performance

-- =====================================================
-- 1. CORE BUSINESS QUERY OPTIMIZATIONS
-- =====================================================

-- Daily Reports Performance (Most frequently accessed data)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reports_site_user_date 
ON daily_reports(site_id, created_by, work_date DESC)
WHERE is_deleted = false OR is_deleted IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reports_status_priority 
ON daily_reports(status, priority, created_at DESC)
WHERE is_deleted = false OR is_deleted IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reports_recent_active 
ON daily_reports(work_date DESC, status)
WHERE work_date >= CURRENT_DATE - INTERVAL '30 days' 
AND (is_deleted = false OR is_deleted IS NULL);

-- Attendance Records Performance (Critical for payroll)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_user_site_date 
ON attendance_records(user_id, site_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_site_date_status 
ON attendance_records(site_id, date DESC, status)
WHERE date >= CURRENT_DATE - INTERVAL '90 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_labor_hours 
ON attendance_records(date DESC, labor_hours)
WHERE labor_hours > 0;

-- Site Assignments (Critical for access control)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_assignments_active_user 
ON site_assignments(user_id, site_id, assigned_at DESC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_assignments_active_site 
ON site_assignments(site_id, role, assigned_at DESC) 
WHERE is_active = true;

-- =====================================================
-- 2. AUTHENTICATION AND SECURITY INDEXES
-- =====================================================

-- Profiles table optimization (Authentication bottleneck)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email_active 
ON profiles(email) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_site 
ON profiles(role, is_active, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_last_login 
ON profiles(last_login_at DESC) 
WHERE last_login_at IS NOT NULL;

-- Activity logs for security monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_recent 
ON activity_logs(user_id, created_at DESC)
WHERE created_at >= NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_security_events 
ON activity_logs(action, severity, created_at DESC)
WHERE severity IN ('WARN', 'ERROR', 'CRITICAL');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_ip_suspicious 
ON activity_logs(ip_address, created_at DESC)
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- =====================================================
-- 3. DOCUMENT MANAGEMENT INDEXES
-- =====================================================

-- Documents table (File access patterns)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_site_type_date 
ON documents(site_id, document_type, created_at DESC)
WHERE is_deleted = false OR is_deleted IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_creator_recent 
ON documents(created_by, created_at DESC)
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
AND (is_deleted = false OR is_deleted IS NULL);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_public_access 
ON documents(is_public, document_type, created_at DESC)
WHERE is_public = true AND (is_deleted = false OR is_deleted IS NULL);

-- Markup documents (Blueprint system)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_markup_documents_location_user 
ON markup_documents(location, created_by, created_at DESC)
WHERE is_deleted = false OR is_deleted IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_markup_documents_site_recent 
ON markup_documents(site_id, updated_at DESC)
WHERE site_id IS NOT NULL AND (is_deleted = false OR is_deleted IS NULL);

-- =====================================================
-- 4. MATERIAL MANAGEMENT INDEXES
-- =====================================================

-- Materials and inventory tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materials_npc_code 
ON materials(npc_1000_code, is_active)
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_inventory_site_material 
ON material_inventory(site_id, material_id, last_updated DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_inventory_low_stock 
ON material_inventory(site_id, current_stock, minimum_stock)
WHERE current_stock <= minimum_stock;

-- Material requests workflow
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_requests_status_site 
ON material_requests(status, site_id, requested_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_requests_approval 
ON material_requests(status, requested_date DESC)
WHERE status IN ('pending_approval', 'approved');

-- =====================================================
-- 5. NOTIFICATION AND COMMUNICATION INDEXES
-- =====================================================

-- Notifications performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_recent 
ON notifications(notification_type, created_at DESC)
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Push subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_subscriptions_user_active 
ON push_subscriptions(user_id, is_active)
WHERE is_active = true;

-- =====================================================
-- 6. ANALYTICS AND REPORTING INDEXES
-- =====================================================

-- Analytics events for dashboard performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_date 
ON analytics_events(user_id, event_date DESC)
WHERE event_date >= CURRENT_DATE - INTERVAL '90 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_type_date 
ON analytics_events(event_type, event_date DESC)
WHERE event_date >= CURRENT_DATE - INTERVAL '30 days';

-- Performance metrics tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_performance 
ON analytics_events(event_type, event_date DESC)
WHERE event_type IN ('page_load', 'api_call', 'user_interaction')
AND event_date >= CURRENT_DATE - INTERVAL '7 days';

-- =====================================================
-- 7. JSON/JSONB COLUMN OPTIMIZATIONS
-- =====================================================

-- GIN indexes for JSON searching
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reports_metadata_gin 
ON daily_reports USING gin(metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_metadata_gin 
ON analytics_events USING gin(metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_details_gin 
ON activity_logs USING gin(details)
WHERE details IS NOT NULL;

-- Specific JSON path indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_preferences_theme 
ON profiles((preferences->>'theme'))
WHERE preferences IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_config_feature_flags 
ON system_config USING gin((config_value->'feature_flags'))
WHERE config_key = 'features' AND config_value IS NOT NULL;

-- =====================================================
-- 8. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Dashboard summary queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dashboard_daily_summary 
ON daily_reports(site_id, work_date DESC, status, created_by)
WHERE work_date >= CURRENT_DATE - INTERVAL '7 days'
AND (is_deleted = false OR is_deleted IS NULL);

-- Attendance summary for payroll
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_payroll_summary 
ON attendance_records(user_id, date DESC, labor_hours, overtime_hours)
WHERE date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month');

-- Site activity overview
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_activity_overview 
ON daily_reports(site_id, status, work_date DESC, priority)
WHERE work_date >= CURRENT_DATE - INTERVAL '30 days'
AND (is_deleted = false OR is_deleted IS NULL);

-- =====================================================
-- 9. PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- =====================================================

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_active_recent_login 
ON profiles(last_login_at DESC, role)
WHERE is_active = true AND last_login_at >= NOW() - INTERVAL '30 days';

-- Pending approvals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reports_pending_approval 
ON daily_reports(site_id, created_at DESC, created_by)
WHERE status = 'pending_approval';

-- Emergency/high priority items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reports_high_priority 
ON daily_reports(site_id, work_date DESC, status)
WHERE priority IN ('high', 'urgent');

-- Recent file uploads
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_recent_uploads 
ON documents(created_at DESC, file_size, document_type)
WHERE created_at >= NOW() - INTERVAL '24 hours'
AND (is_deleted = false OR is_deleted IS NULL);

-- =====================================================
-- 10. COVERING INDEXES FOR READ-HEAVY QUERIES
-- =====================================================

-- User profile summary (includes commonly fetched fields)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_summary_covering 
ON profiles(id, email, full_name, role, is_active, last_login_at)
WHERE is_active = true;

-- Site assignment summary
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_assignments_summary_covering 
ON site_assignments(user_id, site_id, role, assigned_at, is_active);

-- Daily reports list view
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reports_list_covering 
ON daily_reports(site_id, work_date DESC, status, priority, weather_conditions, created_by)
WHERE (is_deleted = false OR is_deleted IS NULL);

-- =====================================================
-- 11. STATISTICAL ANALYSIS UPDATES
-- =====================================================

-- Update table statistics for query planner
ANALYZE profiles;
ANALYZE sites;
ANALYZE site_assignments;
ANALYZE daily_reports;
ANALYZE attendance_records;
ANALYZE documents;
ANALYZE markup_documents;
ANALYZE materials;
ANALYZE material_inventory;
ANALYZE material_requests;
ANALYZE notifications;
ANALYZE analytics_events;
ANALYZE activity_logs;

-- =====================================================
-- 12. INDEX MONITORING SETUP
-- =====================================================

-- Create view to monitor index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'LOW_USAGE'
        WHEN idx_scan < 100 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC, pg_relation_size(indexrelid) DESC;

-- Create view for index maintenance recommendations
CREATE OR REPLACE VIEW index_maintenance_recommendations AS
WITH index_stats AS (
    SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_relation_size(indexrelid) as index_size_bytes
    FROM pg_stat_user_indexes
)
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(index_size_bytes) as index_size,
    idx_scan as scans,
    CASE 
        WHEN idx_scan = 0 AND index_size_bytes > 1048576 THEN 'CONSIDER_DROPPING'
        WHEN idx_scan < 10 AND index_size_bytes > 10485760 THEN 'LOW_USAGE_LARGE_SIZE'
        WHEN idx_tup_read > 0 AND idx_tup_fetch = 0 THEN 'INDEX_ONLY_SCANS_OPPORTUNITY'
        ELSE 'OK'
    END as recommendation
FROM index_stats
WHERE schemaname = 'public'
ORDER BY index_size_bytes DESC;

-- =====================================================
-- 13. PERFORMANCE VALIDATION QUERIES
-- =====================================================

-- Function to test critical query performance
CREATE OR REPLACE FUNCTION test_query_performance()
RETURNS TABLE(
    query_name TEXT,
    execution_time_ms NUMERIC,
    rows_returned BIGINT,
    status TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count BIGINT;
BEGIN
    -- Test 1: Dashboard daily reports query
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count
    FROM daily_reports dr
    JOIN site_assignments sa ON sa.site_id = dr.site_id
    WHERE sa.user_id = auth.uid()
      AND sa.is_active = true
      AND dr.work_date >= CURRENT_DATE - INTERVAL '7 days'
      AND (dr.is_deleted = false OR dr.is_deleted IS NULL);
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'dashboard_daily_reports'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        row_count,
        CASE WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 100 THEN 'FAST' 
             WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 500 THEN 'ACCEPTABLE'
             ELSE 'SLOW' END;
    
    -- Test 2: User attendance summary
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count
    FROM attendance_records ar
    WHERE ar.user_id = auth.uid()
      AND ar.date >= date_trunc('month', CURRENT_DATE);
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'user_attendance_summary'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        row_count,
        CASE WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 50 THEN 'FAST'
             WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 200 THEN 'ACCEPTABLE'
             ELSE 'SLOW' END;
    
    -- Test 3: Site documents listing
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count
    FROM documents d
    JOIN site_assignments sa ON sa.site_id = d.site_id
    WHERE sa.user_id = auth.uid()
      AND sa.is_active = true
      AND (d.is_deleted = false OR d.is_deleted IS NULL);
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'site_documents_listing'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        row_count,
        CASE WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 200 THEN 'FAST'
             WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 1000 THEN 'ACCEPTABLE'
             ELSE 'SLOW' END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 14. COMPLETION AND VERIFICATION
-- =====================================================

-- Log the completion of performance optimization
INSERT INTO activity_logs (
    entity_type, entity_id, action, details, severity
) VALUES (
    'system', 'performance_optimization', 'DEPLOYMENT',
    jsonb_build_object(
        'migration', '601_production_performance_indexes.sql',
        'indexes_created', (
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_%'
        ),
        'tables_analyzed', jsonb_build_array(
            'profiles', 'sites', 'site_assignments', 'daily_reports',
            'attendance_records', 'documents', 'markup_documents',
            'materials', 'material_inventory', 'notifications', 'analytics_events'
        )
    ),
    'INFO'
);

-- Show index creation summary
SELECT 'Production performance indexes created successfully' as status,
       COUNT(*) as total_indexes_created
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
  AND indexdef LIKE '%CONCURRENTLY%';

-- Display performance optimization summary
SELECT 
    'Performance Optimization Complete' as summary,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    pg_size_pretty(sum(pg_relation_size(indexrelid))) as total_index_size
FROM pg_stat_user_indexes;