-- 600_production_security_hardening.sql
-- Production Security Hardening for INOPNC Work Management System
-- Implements comprehensive security audit, monitoring, and compliance features

-- =====================================================
-- 1. SECURITY AUDIT SYSTEM
-- =====================================================

-- Enhanced activity logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- Table name that was affected
  entity_id TEXT NOT NULL,   -- ID of the affected record
  action TEXT NOT NULL,      -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,          -- Store email for audit even if user is deleted
  user_role TEXT,           -- Store role at time of action
  details JSONB,            -- Old and new values for changes
  ip_address INET,          -- Client IP address
  user_agent TEXT,          -- Client user agent
  session_id TEXT,          -- Session identifier
  request_id TEXT,          -- Request correlation ID
  severity TEXT DEFAULT 'INFO', -- INFO, WARN, ERROR, CRITICAL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Add indexes for common queries
  CONSTRAINT activity_logs_action_check CHECK (action IN (
    'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT', 
    'PASSWORD_CHANGE', 'ROLE_CHANGE', 'EXPORT', 'IMPORT', 'API_ACCESS'
  )),
  CONSTRAINT activity_logs_severity_check CHECK (severity IN (
    'INFO', 'WARN', 'ERROR', 'CRITICAL'
  ))
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON activity_logs(severity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ip_address ON activity_logs(ip_address);

-- Composite indexes for common audit queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_action ON activity_logs(entity_type, action, created_at DESC);

-- =====================================================
-- 2. SECURITY MONITORING FUNCTIONS
-- =====================================================

-- Function to get client IP from request context
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS INET AS $$
BEGIN
  -- Try to get IP from various headers set by proxies/load balancers
  RETURN COALESCE(
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'x-real-ip',
    '0.0.0.0'::inet
  );
EXCEPTION WHEN OTHERS THEN
  RETURN '0.0.0.0'::inet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user agent from request
CREATE OR REPLACE FUNCTION get_user_agent()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.headers', true)::json->>'user-agent';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced audit trigger function with security context
CREATE OR REPLACE FUNCTION security_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  current_user_role TEXT;
  old_data JSONB;
  new_data JSONB;
  changed_fields JSONB;
BEGIN
  -- Get current user context
  current_user_id := auth.uid();
  
  -- Get user details from profile
  IF current_user_id IS NOT NULL THEN
    SELECT email, role INTO current_user_email, current_user_role
    FROM profiles WHERE id = current_user_id;
  END IF;

  -- Determine what changed and log appropriately
  IF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    
    INSERT INTO activity_logs (
      entity_type, entity_id, action, user_id, user_email, user_role,
      details, ip_address, user_agent, severity
    ) VALUES (
      TG_TABLE_NAME, 
      COALESCE(NEW.id::text, gen_random_uuid()::text),
      'INSERT',
      current_user_id,
      current_user_email,
      current_user_role,
      jsonb_build_object('new', new_data),
      get_client_ip(),
      get_user_agent(),
      CASE WHEN TG_TABLE_NAME IN ('profiles', 'site_assignments', 'documents') THEN 'WARN' ELSE 'INFO' END
    );
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Calculate changed fields only
    SELECT jsonb_object_agg(key, jsonb_build_object('old', old_data->key, 'new', new_data->key))
    INTO changed_fields
    FROM jsonb_each(new_data)
    WHERE old_data->key IS DISTINCT FROM new_data->key;
    
    -- Only log if there are actual changes
    IF changed_fields != '{}'::jsonb THEN
      INSERT INTO activity_logs (
        entity_type, entity_id, action, user_id, user_email, user_role,
        details, ip_address, user_agent, severity
      ) VALUES (
        TG_TABLE_NAME,
        OLD.id::text,
        'UPDATE',
        current_user_id,
        current_user_email,
        current_user_role,
        jsonb_build_object('changed', changed_fields),
        get_client_ip(),
        get_user_agent(),
        CASE 
          WHEN changed_fields ? 'role' OR changed_fields ? 'is_active' THEN 'WARN'
          WHEN TG_TABLE_NAME = 'profiles' THEN 'INFO'
          ELSE 'INFO'
        END
      );
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    
    INSERT INTO activity_logs (
      entity_type, entity_id, action, user_id, user_email, user_role,
      details, ip_address, user_agent, severity
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id::text,
      'DELETE',
      current_user_id,
      current_user_email,
      current_user_role,
      jsonb_build_object('deleted', old_data),
      get_client_ip(),
      get_user_agent(),
      'WARN' -- Deletions are always important
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. APPLY AUDIT TRIGGERS TO CRITICAL TABLES
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
DROP TRIGGER IF EXISTS audit_sites_trigger ON sites;
DROP TRIGGER IF EXISTS audit_site_assignments_trigger ON site_assignments;
DROP TRIGGER IF EXISTS audit_daily_reports_trigger ON daily_reports;
DROP TRIGGER IF EXISTS audit_attendance_records_trigger ON attendance_records;
DROP TRIGGER IF EXISTS audit_documents_trigger ON documents;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION security_audit_trigger();

CREATE TRIGGER audit_sites_trigger
    AFTER INSERT OR UPDATE OR DELETE ON sites
    FOR EACH ROW EXECUTE FUNCTION security_audit_trigger();

CREATE TRIGGER audit_site_assignments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON site_assignments
    FOR EACH ROW EXECUTE FUNCTION security_audit_trigger();

CREATE TRIGGER audit_daily_reports_trigger
    AFTER INSERT OR UPDATE OR DELETE ON daily_reports
    FOR EACH ROW EXECUTE FUNCTION security_audit_trigger();

CREATE TRIGGER audit_attendance_records_trigger
    AFTER INSERT OR UPDATE OR DELETE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION security_audit_trigger();

CREATE TRIGGER audit_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION security_audit_trigger();

-- =====================================================
-- 4. SECURITY MONITORING VIEWS
-- =====================================================

-- View for security incidents
CREATE OR REPLACE VIEW security_incidents AS
SELECT 
  id,
  entity_type,
  entity_id,
  action,
  user_id,
  user_email,
  user_role,
  ip_address,
  user_agent,
  details,
  created_at,
  severity
FROM activity_logs
WHERE severity IN ('WARN', 'ERROR', 'CRITICAL')
   OR action IN ('DELETE', 'ROLE_CHANGE', 'PASSWORD_CHANGE')
   OR (action = 'LOGIN' AND details->>'failed' = 'true')
ORDER BY created_at DESC;

-- View for failed login attempts
CREATE OR REPLACE VIEW failed_login_attempts AS
SELECT 
  user_email,
  ip_address,
  user_agent,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt,
  MIN(created_at) as first_attempt
FROM activity_logs
WHERE action = 'LOGIN' 
  AND details->>'success' = 'false'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_email, ip_address, user_agent
HAVING COUNT(*) >= 3
ORDER BY attempt_count DESC, last_attempt DESC;

-- View for suspicious IP addresses
CREATE OR REPLACE VIEW suspicious_ips AS
SELECT 
  ip_address,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN action = 'LOGIN' THEN 1 END) as login_attempts,
  COUNT(CASE WHEN severity IN ('WARN', 'ERROR', 'CRITICAL') THEN 1 END) as security_events,
  MAX(created_at) as last_activity
FROM activity_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND ip_address != '127.0.0.1'::inet
GROUP BY ip_address
HAVING COUNT(DISTINCT user_id) > 5 
    OR COUNT(*) > 100
    OR COUNT(CASE WHEN severity IN ('WARN', 'ERROR', 'CRITICAL') THEN 1 END) > 5
ORDER BY security_events DESC, total_requests DESC;

-- =====================================================
-- 5. DATA EXPORT TRACKING
-- =====================================================

-- Table to track data exports for compliance
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  export_type TEXT NOT NULL, -- 'user_data', 'site_reports', 'analytics', etc.
  table_names TEXT[] NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  export_format TEXT NOT NULL DEFAULT 'json', -- 'json', 'csv', 'pdf'
  reason TEXT, -- 'gdpr_request', 'business_report', 'audit', etc.
  ip_address INET,
  user_agent TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'started', -- 'started', 'completed', 'failed'
  error_message TEXT,
  retention_days INTEGER DEFAULT 30,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT data_exports_status_check CHECK (status IN ('started', 'completed', 'failed')),
  CONSTRAINT data_exports_format_check CHECK (export_format IN ('json', 'csv', 'pdf', 'excel'))
);

-- Index for data exports
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_created_at ON data_exports(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);

-- =====================================================
-- 6. RLS POLICIES FOR AUDIT TABLES
-- =====================================================

-- Enable RLS on audit tables
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- Activity logs: Only admins and system admins can view
CREATE POLICY "activity_logs_admin_access" ON activity_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
  )
);

-- Users can view their own activity logs
CREATE POLICY "activity_logs_user_own_access" ON activity_logs
FOR SELECT USING (
  user_id = auth.uid()
);

-- Data exports: Users can view their own exports, admins can view all
CREATE POLICY "data_exports_user_access" ON data_exports
FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
  )
);

-- Users can create their own data export records
CREATE POLICY "data_exports_user_create" ON data_exports
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Users can update their own data export records
CREATE POLICY "data_exports_user_update" ON data_exports
FOR UPDATE USING (
  user_id = auth.uid()
);

-- =====================================================
-- 7. SECURITY CONFIGURATION FUNCTIONS
-- =====================================================

-- Function to check if user has admin privileges
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
  p_action TEXT,
  p_user_email TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    user_email,
    details,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    'auth',
    COALESCE(auth.uid()::text, p_user_email, 'anonymous'),
    p_action,
    auth.uid(),
    p_user_email,
    jsonb_build_object('success', p_success) || p_details,
    get_client_ip(),
    get_user_agent(),
    CASE WHEN p_success THEN 'INFO' ELSE 'WARN' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. AUTOMATED CLEANUP PROCEDURES
-- =====================================================

-- Function to clean up old audit logs (keep last 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete audit logs older than 2 years, except critical events
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '2 years'
    AND severity NOT IN ('ERROR', 'CRITICAL')
    AND action NOT IN ('DELETE', 'ROLE_CHANGE', 'PASSWORD_CHANGE');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  INSERT INTO activity_logs (
    entity_type, entity_id, action, details, severity
  ) VALUES (
    'system', 'audit_cleanup', 'CLEANUP',
    jsonb_build_object('deleted_count', deleted_count),
    'INFO'
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Partitioning for activity_logs by month (for large datasets)
-- This would be implemented if the audit log grows very large

-- Analyze tables to update statistics
ANALYZE activity_logs;
ANALYZE data_exports;

-- =====================================================
-- 10. COMPLETION VERIFICATION
-- =====================================================

-- Create a function to verify all security components are installed
CREATE OR REPLACE FUNCTION verify_security_hardening()
RETURNS TABLE(
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH security_checks AS (
    SELECT 'activity_logs_table' as component, 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') 
                THEN 'OK' ELSE 'MISSING' END as status,
           'Audit logging table' as details
    
    UNION ALL
    
    SELECT 'audit_triggers' as component,
           CASE WHEN COUNT(*) >= 6 THEN 'OK' ELSE 'INCOMPLETE' END as status,
           COUNT(*)::text || ' triggers installed' as details
    FROM information_schema.triggers 
    WHERE trigger_name LIKE 'audit_%_trigger'
    
    UNION ALL
    
    SELECT 'security_views' as component,
           CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'INCOMPLETE' END as status,
           COUNT(*)::text || ' security views created' as details
    FROM information_schema.views 
    WHERE view_name IN ('security_incidents', 'failed_login_attempts', 'suspicious_ips')
    
    UNION ALL
    
    SELECT 'rls_policies' as component,
           CASE WHEN COUNT(*) >= 4 THEN 'OK' ELSE 'INCOMPLETE' END as status,
           COUNT(*)::text || ' RLS policies on audit tables' as details
    FROM pg_policies 
    WHERE tablename IN ('activity_logs', 'data_exports')
  )
  SELECT * FROM security_checks;
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT * FROM verify_security_hardening();

-- Insert completion log
INSERT INTO activity_logs (
  entity_type, entity_id, action, details, severity
) VALUES (
  'system', 'security_hardening', 'DEPLOYMENT',
  jsonb_build_object(
    'migration', '600_production_security_hardening.sql',
    'components', jsonb_build_array(
      'audit_logging', 'security_monitoring', 'data_export_tracking',
      'automated_cleanup', 'rls_policies', 'performance_optimization'
    )
  ),
  'INFO'
);

SELECT 'Production security hardening completed successfully' as status;