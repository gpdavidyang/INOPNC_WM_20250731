-- Notification logs table (extend existing)
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS engagement_status VARCHAR(50) DEFAULT 'sent' CHECK (engagement_status IN ('sent', 'delivered', 'clicked', 'engaged', 'dismissed')),
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Notification engagement tracking
CREATE TABLE IF NOT EXISTS notification_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_id UUID,
  notification_type VARCHAR(100),
  engagement_type VARCHAR(50) NOT NULL CHECK (engagement_type IN (
    'deep_link_navigation',
    'notification_received_foreground',
    'notification_clicked',
    'notification_dismissed',
    'action_performed'
  )),
  action VARCHAR(100),
  target_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  engaged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_clicked_at ON notification_logs(clicked_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_engagement_status ON notification_logs(engagement_status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_organization_id ON notification_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent_at ON notification_logs(user_id, sent_at DESC);

CREATE INDEX idx_notification_engagement_user_id ON notification_engagement(user_id);
CREATE INDEX idx_notification_engagement_notification_id ON notification_engagement(notification_id);
CREATE INDEX idx_notification_engagement_type ON notification_engagement(engagement_type);
CREATE INDEX idx_notification_engagement_engaged_at ON notification_engagement(engaged_at DESC);

-- RLS policies
ALTER TABLE notification_engagement ENABLE ROW LEVEL SECURITY;

-- Users can view their own engagement data
CREATE POLICY "Users can view own engagement" ON notification_engagement
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own engagement records
CREATE POLICY "Users can log own engagement" ON notification_engagement
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all engagement data for analytics
CREATE POLICY "Admins can view all engagement" ON notification_engagement
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'system_admin', 'site_manager')
    )
  );

-- Update trigger for organization_id in notification_logs
CREATE OR REPLACE FUNCTION set_notification_log_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from the user's profile
  SELECT organization_id INTO NEW.organization_id
  FROM profiles
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_log_organization_trigger
  BEFORE INSERT ON notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_log_organization();

-- Analytics views for better performance
CREATE OR REPLACE VIEW notification_analytics_summary AS
SELECT 
  nl.notification_type,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN nl.status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN nl.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN nl.clicked_at IS NOT NULL THEN 1 END) as clicked,
  COUNT(CASE WHEN nl.engagement_status = 'engaged' THEN 1 END) as engaged,
  ROUND(
    COUNT(CASE WHEN nl.status = 'delivered' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as delivery_rate,
  ROUND(
    COUNT(CASE WHEN nl.clicked_at IS NOT NULL THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN nl.status = 'delivered' THEN 1 END), 0) * 100, 2
  ) as click_rate,
  DATE(nl.sent_at) as date,
  nl.organization_id
FROM notification_logs nl
WHERE nl.sent_at >= NOW() - INTERVAL '30 days'
GROUP BY nl.notification_type, DATE(nl.sent_at), nl.organization_id;

-- Grant access to views
GRANT SELECT ON notification_analytics_summary TO authenticated;