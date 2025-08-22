-- Create audit_logs table for tracking all system actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  entity_name VARCHAR(255),
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_site_id ON audit_logs(site_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'system_admin')
  )
);

-- RLS Policy: System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to automatically log profile changes
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_name,
    user_role,
    action,
    entity_type,
    entity_id,
    entity_name,
    changes,
    created_at
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.email, OLD.email),
    COALESCE(NEW.full_name, OLD.full_name),
    COALESCE(NEW.role, OLD.role),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'profile',
    COALESCE(NEW.id::text, OLD.id::text),
    COALESCE(NEW.full_name, OLD.full_name),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile changes
CREATE TRIGGER audit_profile_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION audit_profile_changes();

-- Function to log site changes
CREATE OR REPLACE FUNCTION audit_site_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    changes,
    site_id,
    created_at
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'site',
    COALESCE(NEW.id::text, OLD.id::text),
    COALESCE(NEW.name, OLD.name),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    COALESCE(NEW.id, OLD.id),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for site changes
CREATE TRIGGER audit_site_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON sites
FOR EACH ROW
EXECUTE FUNCTION audit_site_changes();

-- Function to log daily report changes
CREATE OR REPLACE FUNCTION audit_daily_report_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    changes,
    site_id,
    created_at
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'daily_report',
    COALESCE(NEW.id::text, OLD.id::text),
    COALESCE(NEW.title, OLD.title),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    COALESCE(NEW.site_id, OLD.site_id),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for daily report changes
CREATE TRIGGER audit_daily_report_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON daily_reports
FOR EACH ROW
EXECUTE FUNCTION audit_daily_report_changes();

-- Function to manually log actions (for use in application code)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id VARCHAR,
  p_entity_name VARCHAR DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_profile RECORD;
  v_log_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get user profile
  SELECT email, full_name, role INTO v_user_profile
  FROM profiles
  WHERE id = v_user_id;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_name,
    user_role,
    action,
    entity_type,
    entity_id,
    entity_name,
    changes,
    metadata,
    status,
    error_message,
    created_at
  ) VALUES (
    v_user_id,
    v_user_profile.email,
    v_user_profile.full_name,
    v_user_profile.role,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_changes,
    p_metadata,
    p_status,
    p_error_message,
    NOW()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;