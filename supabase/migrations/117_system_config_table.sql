-- Create system_config table for storing application configuration
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(255) NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Ensure unique config keys per organization
  UNIQUE(config_key, organization_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_org ON system_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_config_updated ON system_config(updated_at);

-- RLS Policies
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- System admins can manage all configurations
CREATE POLICY "system_admins_all_access" ON system_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'system_admin'
    )
  );

-- Organization admins can manage their organization's configurations
CREATE POLICY "org_admins_org_access" ON system_config
  FOR ALL
  USING (
    organization_id IN (
      SELECT profiles.organization_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can read configurations from their organization
CREATE POLICY "users_read_org_config" ON system_config
  FOR SELECT
  USING (
    organization_id IN (
      SELECT profiles.organization_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Insert default performance budget configuration for existing organizations
INSERT INTO system_config (config_key, config_value, organization_id, description)
SELECT 
  'performance_budgets',
  '[
    {
      "name": "Largest Contentful Paint",
      "metric": "LCP",
      "thresholds": {"good": 2500, "warning": 4000, "critical": 6000},
      "unit": "ms",
      "enabled": true
    },
    {
      "name": "Interaction to Next Paint",
      "metric": "INP", 
      "thresholds": {"good": 200, "warning": 500, "critical": 1000},
      "unit": "ms",
      "enabled": true
    },
    {
      "name": "Cumulative Layout Shift",
      "metric": "CLS",
      "thresholds": {"good": 0.1, "warning": 0.25, "critical": 0.5},
      "unit": "",
      "enabled": true
    },
    {
      "name": "API Response Time",
      "metric": "api_response_time",
      "thresholds": {"good": 200, "warning": 500, "critical": 1000},
      "unit": "ms",
      "enabled": true
    }
  ]'::jsonb,
  id,
  'Default performance budget configuration'
FROM organizations
ON CONFLICT (config_key, organization_id) DO NOTHING;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE PROCEDURE update_system_config_updated_at();