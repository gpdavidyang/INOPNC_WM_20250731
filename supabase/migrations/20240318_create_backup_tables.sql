-- Create backup-related tables for INOPNC Work Management System
-- Migration: 20240318_create_backup_tables.sql

-- Backup configurations table
CREATE TABLE IF NOT EXISTS backup_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('full', 'incremental', 'differential')),
  schedule TEXT, -- Cron expression
  enabled BOOLEAN DEFAULT true,
  retention_days INTEGER DEFAULT 30 CHECK (retention_days >= 0),
  include_files BOOLEAN DEFAULT true,
  include_database BOOLEAN DEFAULT true,
  compression BOOLEAN DEFAULT true,
  encryption BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup jobs table
CREATE TABLE IF NOT EXISTS backup_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES backup_configs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('full', 'incremental', 'differential')),
  trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'scheduled', 'auto')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  file_path TEXT,
  file_size BIGINT CHECK (file_size >= 0),
  compressed_size BIGINT CHECK (compressed_size >= 0),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Backup schedules table
CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  config_id UUID NOT NULL REFERENCES backup_configs(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Seoul',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup monitoring and alerts table
CREATE TABLE IF NOT EXISTS backup_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES backup_configs(id) ON DELETE CASCADE,
  alert_email TEXT,
  alert_webhook TEXT,
  failure_threshold INTEGER DEFAULT 3 CHECK (failure_threshold > 0),
  size_threshold BIGINT CHECK (size_threshold >= 0),
  duration_threshold INTEGER CHECK (duration_threshold >= 0), -- seconds
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup restore jobs table
CREATE TABLE IF NOT EXISTS backup_restore_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_job_id UUID NOT NULL REFERENCES backup_jobs(id) ON DELETE CASCADE,
  target_database TEXT,
  include_files BOOLEAN DEFAULT true,
  overwrite_existing BOOLEAN DEFAULT false,
  restore_point TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  restored_items JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_backup_jobs_config_id ON backup_jobs(config_id);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_started_at ON backup_jobs(started_at);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_type_status ON backup_jobs(type, status);

CREATE INDEX IF NOT EXISTS idx_backup_schedules_config_id ON backup_schedules(config_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_enabled ON backup_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_run ON backup_schedules(next_run);

CREATE INDEX IF NOT EXISTS idx_backup_monitoring_config_id ON backup_monitoring(config_id);
CREATE INDEX IF NOT EXISTS idx_backup_monitoring_enabled ON backup_monitoring(enabled);

CREATE INDEX IF NOT EXISTS idx_backup_restore_jobs_backup_job_id ON backup_restore_jobs(backup_job_id);
CREATE INDEX IF NOT EXISTS idx_backup_restore_jobs_status ON backup_restore_jobs(status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_backup_configs_updated_at
  BEFORE UPDATE ON backup_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_schedules_updated_at
  BEFORE UPDATE ON backup_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_monitoring_updated_at
  BEFORE UPDATE ON backup_monitoring
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE backup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_restore_jobs ENABLE ROW LEVEL SECURITY;

-- Backup configs policies - Only admins can manage backup configurations
CREATE POLICY "backup_configs_admin_all" ON backup_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Backup jobs policies - Admins can view all, others can view their own organization's
CREATE POLICY "backup_jobs_admin_all" ON backup_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "backup_jobs_view_org" ON backup_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('site_manager', 'customer_manager')
    )
  );

-- Backup schedules policies - Only admins
CREATE POLICY "backup_schedules_admin_all" ON backup_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Backup monitoring policies - Only admins
CREATE POLICY "backup_monitoring_admin_all" ON backup_monitoring
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Backup restore jobs policies - Only admins can create, but can view their own
CREATE POLICY "backup_restore_jobs_admin_create" ON backup_restore_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "backup_restore_jobs_view_own" ON backup_restore_jobs
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "backup_restore_jobs_admin_update" ON backup_restore_jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Insert default backup configurations
INSERT INTO backup_configs (name, description, type, schedule, retention_days, include_files, include_database, compression) VALUES
('일일 전체 백업', '매일 새벽 2시에 실행되는 전체 백업', 'full', '0 2 * * *', 7, true, true, true),
('주간 증분 백업', '매주 일요일 새벽 3시에 실행되는 증분 백업', 'incremental', '0 3 * * 0', 30, true, true, true),
('데이터베이스 전용 백업', '매일 새벽 1시에 실행되는 데이터베이스 전용 백업', 'full', '0 1 * * *', 14, false, true, true)
ON CONFLICT DO NOTHING;

-- Insert default schedules for the configs
INSERT INTO backup_schedules (name, cron_expression, config_id, next_run) 
SELECT 
  bc.name || ' 스케줄',
  bc.schedule,
  bc.id,
  NOW() + INTERVAL '1 day'
FROM backup_configs bc 
WHERE bc.schedule IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create a view for backup statistics
CREATE OR REPLACE VIEW backup_stats AS
SELECT 
  bc.id as config_id,
  bc.name as config_name,
  COUNT(bj.id) as total_jobs,
  COUNT(CASE WHEN bj.status = 'completed' THEN 1 END) as successful_jobs,
  COUNT(CASE WHEN bj.status = 'failed' THEN 1 END) as failed_jobs,
  COALESCE(SUM(bj.file_size), 0) as total_size,
  COALESCE(SUM(bj.compressed_size), 0) as total_compressed_size,
  AVG(EXTRACT(EPOCH FROM (bj.completed_at - bj.started_at))) as avg_duration_seconds,
  MAX(bj.completed_at) as last_backup_time,
  MIN(bj.completed_at) as first_backup_time
FROM backup_configs bc
LEFT JOIN backup_jobs bj ON bc.id = bj.config_id
GROUP BY bc.id, bc.name;

-- Grant access to the view
GRANT SELECT ON backup_stats TO authenticated;