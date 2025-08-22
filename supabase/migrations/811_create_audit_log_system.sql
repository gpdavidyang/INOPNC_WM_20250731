-- Audit Log System Tables
-- 감사 로그 시스템을 위한 테이블

-- 1. 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'auth', 'system')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  user_id UUID,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  user_role VARCHAR(30),
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_url TEXT,
  request_body JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  details JSONB,
  changes JSONB,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
  error_message TEXT,
  session_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 감사 정책 테이블 (어떤 액션을 로깅할지 정의)
CREATE TABLE IF NOT EXISTS audit_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  log_level VARCHAR(20) DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  retention_days INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, action_type)
);

-- 3. 감사 보고서 설정 테이블
CREATE TABLE IF NOT EXISTS audit_report_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filters JSONB,
  schedule VARCHAR(50), -- cron expression
  recipients TEXT[], -- email addresses
  format VARCHAR(20) DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'json')),
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_report_configs ENABLE ROW LEVEL SECURITY;

-- Audit Logs Policies
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- Audit Policies
CREATE POLICY "Only system admins can manage audit policies" ON audit_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'system_admin'
    )
  );

-- Audit Report Configs
CREATE POLICY "Admins can manage audit reports" ON audit_report_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_audit_log(
  p_action VARCHAR,
  p_action_type VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id VARCHAR DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email VARCHAR;
  v_user_name VARCHAR;
  v_user_role VARCHAR;
  v_log_id UUID;
BEGIN
  -- Get current user info
  SELECT id, email, full_name, role INTO v_user_id, v_user_email, v_user_name, v_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Insert audit log
  INSERT INTO audit_logs (
    action, action_type, entity_type, entity_id,
    user_id, user_email, user_name, user_role,
    details, changes, status, error_message
  ) VALUES (
    p_action, p_action_type, p_entity_type, p_entity_id,
    v_user_id, v_user_email, v_user_name, v_user_role,
    p_details, p_changes, p_status, p_error_message
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR;
  v_action_type VARCHAR;
  v_entity_id VARCHAR;
  v_changes JSONB;
BEGIN
  -- Determine action type
  CASE TG_OP
    WHEN 'INSERT' THEN
      v_action_type := 'create';
      v_action := TG_TABLE_NAME || ' 생성';
      v_entity_id := NEW.id::VARCHAR;
      v_changes := jsonb_build_object('new', to_jsonb(NEW));
    WHEN 'UPDATE' THEN
      v_action_type := 'update';
      v_action := TG_TABLE_NAME || ' 수정';
      v_entity_id := NEW.id::VARCHAR;
      v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    WHEN 'DELETE' THEN
      v_action_type := 'delete';
      v_action := TG_TABLE_NAME || ' 삭제';
      v_entity_id := OLD.id::VARCHAR;
      v_changes := jsonb_build_object('old', to_jsonb(OLD));
  END CASE;
  
  -- Create audit log
  PERFORM create_audit_log(
    v_action,
    v_action_type,
    TG_TABLE_NAME,
    v_entity_id,
    NULL,
    v_changes
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_sites_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sites
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_documents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_daily_reports_trigger
  AFTER INSERT OR UPDATE OR DELETE ON daily_reports
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Function to clean old audit logs
CREATE OR REPLACE FUNCTION clean_old_audit_logs()
RETURNS void AS $$
DECLARE
  v_retention_days INTEGER;
BEGIN
  -- Get retention days from policies or use default
  SELECT COALESCE(MIN(retention_days), 90) INTO v_retention_days
  FROM audit_policies
  WHERE is_enabled = TRUE;
  
  -- Delete old logs
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 day' * v_retention_days;
END;
$$ LANGUAGE plpgsql;

-- Function to generate audit report
CREATE OR REPLACE FUNCTION generate_audit_report(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_action_type VARCHAR DEFAULT NULL,
  p_entity_type VARCHAR DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  action VARCHAR,
  action_type VARCHAR,
  entity_type VARCHAR,
  user_email VARCHAR,
  status VARCHAR,
  count BIGINT,
  first_occurrence TIMESTAMP WITH TIME ZONE,
  last_occurrence TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.action,
    al.action_type,
    al.entity_type,
    al.user_email,
    al.status,
    COUNT(*) as count,
    MIN(al.created_at) as first_occurrence,
    MAX(al.created_at) as last_occurrence
  FROM audit_logs al
  WHERE al.created_at BETWEEN p_start_date AND p_end_date
    AND (p_action_type IS NULL OR al.action_type = p_action_type)
    AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
  GROUP BY al.action, al.action_type, al.entity_type, al.user_email, al.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert default audit policies
INSERT INTO audit_policies (entity_type, action_type, is_enabled, log_level, retention_days)
VALUES 
  ('profiles', 'create', TRUE, 'info', 365),
  ('profiles', 'update', TRUE, 'info', 365),
  ('profiles', 'delete', TRUE, 'warning', 365),
  ('sites', 'create', TRUE, 'info', 180),
  ('sites', 'update', TRUE, 'info', 180),
  ('sites', 'delete', TRUE, 'warning', 365),
  ('documents', 'create', TRUE, 'info', 90),
  ('documents', 'read', FALSE, 'debug', 30),
  ('documents', 'update', TRUE, 'info', 90),
  ('documents', 'delete', TRUE, 'warning', 180),
  ('daily_reports', 'create', TRUE, 'info', 90),
  ('daily_reports', 'update', TRUE, 'info', 90),
  ('daily_reports', 'delete', TRUE, 'warning', 180),
  ('auth', 'auth', TRUE, 'info', 90),
  ('system', 'system', TRUE, 'info', 365)
ON CONFLICT DO NOTHING;

-- Insert sample audit logs
INSERT INTO audit_logs (action, action_type, entity_type, user_email, user_name, user_role, status)
VALUES 
  ('시스템 초기화 완료', 'system', 'system', 'system@inopnc.com', '시스템', 'system', 'success'),
  ('감사 로그 시스템 활성화', 'system', 'audit_logs', 'admin@inopnc.com', '관리자', 'admin', 'success')
ON CONFLICT DO NOTHING;