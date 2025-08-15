-- Create missing tables that are causing 401 errors in production
-- Based on debug script results: data_exports, monitoring_metrics, system_metrics

-- Table: data_exports
-- For tracking data export operations
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('attendance', 'daily_reports', 'analytics', 'full_backup')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_size BIGINT,
  parameters JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Table: monitoring_metrics
-- For application performance and health monitoring
CREATE TABLE IF NOT EXISTS monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type VARCHAR(20) DEFAULT 'gauge' CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
  tags JSONB DEFAULT '{}'::jsonb,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: system_metrics
-- For system-wide performance metrics
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_category VARCHAR(50) NOT NULL CHECK (metric_category IN ('performance', 'security', 'usage', 'error')),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit VARCHAR(20), -- e.g., 'ms', 'bytes', 'count', 'percent'
  context JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_created_at ON data_exports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name ON monitoring_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp ON monitoring_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_site_id ON monitoring_metrics(site_id);

CREATE INDEX IF NOT EXISTS idx_system_metrics_category ON system_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);

-- Enable RLS on all tables
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_exports
CREATE POLICY "data_exports_select_policy" ON data_exports
FOR SELECT USING (
  -- Users can view their own exports
  user_id = auth.uid()
  OR
  -- Admins can view all exports
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
    LIMIT 1
  )
);

CREATE POLICY "data_exports_insert_policy" ON data_exports
FOR INSERT WITH CHECK (
  -- Users can create exports for themselves
  user_id = auth.uid()
);

CREATE POLICY "data_exports_update_policy" ON data_exports
FOR UPDATE USING (
  -- Users can update their own exports
  user_id = auth.uid()
  OR
  -- System can update status
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
    LIMIT 1
  )
);

-- RLS Policies for monitoring_metrics
CREATE POLICY "monitoring_metrics_select_policy" ON monitoring_metrics
FOR SELECT USING (
  -- All authenticated users can view monitoring metrics
  auth.uid() IS NOT NULL
);

CREATE POLICY "monitoring_metrics_insert_policy" ON monitoring_metrics
FOR INSERT WITH CHECK (
  -- All authenticated users can insert metrics
  auth.uid() IS NOT NULL
);

-- RLS Policies for system_metrics  
CREATE POLICY "system_metrics_select_policy" ON system_metrics
FOR SELECT USING (
  -- All authenticated users can view system metrics
  auth.uid() IS NOT NULL
);

CREATE POLICY "system_metrics_insert_policy" ON system_metrics
FOR INSERT WITH CHECK (
  -- System and admin users can insert system metrics
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
    LIMIT 1
  )
);

-- Comments for documentation
COMMENT ON TABLE data_exports IS 'Tracks user data export requests and their status';
COMMENT ON TABLE monitoring_metrics IS 'Application performance and health monitoring data';
COMMENT ON TABLE system_metrics IS 'System-wide performance and operational metrics';