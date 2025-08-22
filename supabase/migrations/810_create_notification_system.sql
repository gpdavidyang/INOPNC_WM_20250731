-- Integrated Notification System Tables
-- 통합 알림 시스템을 위한 테이블

-- 1. 시스템 알림 테이블
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(30) NOT NULL CHECK (type IN ('announcement', 'request', 'approval', 'document', 'material', 'salary', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category VARCHAR(100) NOT NULL,
  source VARCHAR(100),
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_role VARCHAR(30),
  target_site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. 알림 수신자 테이블 (다중 수신자 지원)
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES system_notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(notification_id, user_id)
);

-- 3. 알림 설정 테이블 (사용자별 알림 선호도)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  announcement_enabled BOOLEAN DEFAULT TRUE,
  request_enabled BOOLEAN DEFAULT TRUE,
  approval_enabled BOOLEAN DEFAULT TRUE,
  document_enabled BOOLEAN DEFAULT TRUE,
  material_enabled BOOLEAN DEFAULT TRUE,
  salary_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sys_notifications_type ON system_notifications(type);
CREATE INDEX IF NOT EXISTS idx_sys_notifications_priority ON system_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_sys_notifications_target_user ON system_notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_sys_notifications_target_role ON system_notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_sys_notifications_target_site ON system_notifications(target_site_id);
CREATE INDEX IF NOT EXISTS idx_sys_notifications_created ON system_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_notifications_read ON system_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_sys_notifications_archived ON system_notifications(is_archived);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_user ON notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_read ON notification_recipients(is_read);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- System Notifications Policies
CREATE POLICY "Users can view their own notifications" ON system_notifications
  FOR SELECT USING (
    target_user_id = auth.uid() OR
    target_role IN (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) OR
    target_site_id IN (
      SELECT site_id FROM site_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM notification_recipients 
      WHERE notification_id = system_notifications.id 
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admins can manage all notifications" ON system_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Users can update their own notification status" ON system_notifications
  FOR UPDATE USING (
    target_user_id = auth.uid()
  ) WITH CHECK (
    target_user_id = auth.uid()
  );

-- Notification Recipients Policies
CREATE POLICY "Users can view their own recipient records" ON notification_recipients
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own recipient records" ON notification_recipients
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can manage all recipient records" ON notification_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Notification Preferences Policies
CREATE POLICY "Users can view their own preferences" ON notification_preferences
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can manage their own preferences" ON notification_preferences
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_priority VARCHAR DEFAULT 'medium',
  p_category VARCHAR DEFAULT 'General',
  p_source VARCHAR DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_target_role VARCHAR DEFAULT NULL,
  p_target_site_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert the notification
  INSERT INTO system_notifications (
    type, title, message, priority, category, source,
    target_user_id, target_role, target_site_id,
    action_url, metadata
  ) VALUES (
    p_type, p_title, p_message, p_priority, p_category, p_source,
    p_target_user_id, p_target_role, p_target_site_id,
    p_action_url, p_metadata
  ) RETURNING id INTO v_notification_id;
  
  -- If target_role is specified, add all users with that role as recipients
  IF p_target_role IS NOT NULL THEN
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT v_notification_id, id FROM profiles WHERE role = p_target_role
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- If target_site_id is specified, add all users from that site as recipients
  IF p_target_site_id IS NOT NULL THEN
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT v_notification_id, user_id FROM site_memberships 
    WHERE site_id = p_target_site_id AND status = 'active'
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update main notification if it's targeted to this user
  UPDATE system_notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = p_notification_id AND target_user_id = p_user_id;
  
  -- Update recipient record
  UPDATE notification_recipients
  SET is_read = TRUE, read_at = NOW()
  WHERE notification_id = p_notification_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM system_notifications n
  WHERE (
    (n.target_user_id = p_user_id AND NOT n.is_read) OR
    EXISTS (
      SELECT 1 FROM notification_recipients r
      WHERE r.notification_id = n.id 
      AND r.user_id = p_user_id 
      AND NOT r.is_read
    )
  ) AND NOT n.is_archived
  AND (n.expires_at IS NULL OR n.expires_at > NOW());
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample notifications
INSERT INTO system_notifications (type, title, message, priority, category, source)
VALUES 
  ('system', '시스템 업데이트 완료', '새로운 기능이 추가되었습니다.', 'low', '시스템', 'System'),
  ('announcement', '안전 교육 일정 안내', '다음 주 월요일 오전 9시 안전 교육이 있습니다.', 'high', '교육', 'HR Department'),
  ('material', 'NPC-1000 재고 부족 경고', '현재 재고가 100개 미만입니다.', 'high', '자재관리', 'Inventory System')
ON CONFLICT DO NOTHING;