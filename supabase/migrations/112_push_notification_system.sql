-- Push Notification System Enhancement
-- 푸시 알림 시스템 강화를 위한 스키마 확장

-- 프로필 테이블에 푸시 알림 관련 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription_updated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "push_enabled": false,
  "material_approvals": true,
  "daily_report_reminders": true,
  "safety_alerts": true,
  "equipment_maintenance": true,
  "site_announcements": false,
  "quiet_hours_enabled": false,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "sound_enabled": true,
  "vibration_enabled": true,
  "show_previews": true,
  "group_notifications": true
}';

-- 예약된 알림 테이블
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  user_ids UUID[] DEFAULT NULL,
  site_ids UUID[] DEFAULT NULL,
  roles TEXT[] DEFAULT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('material_approval', 'daily_report_reminder', 'safety_alert', 'equipment_maintenance', 'site_announcement')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 로그 테이블 확장 (기존 테이블 수정)
-- 푸시 알림 전송 로그를 위한 컬럼 추가
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS notification_type TEXT;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id);
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 1;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

-- status 컬럼의 제약 조건 업데이트
ALTER TABLE notification_logs DROP CONSTRAINT IF EXISTS notification_logs_status_check;
ALTER TABLE notification_logs ADD CONSTRAINT notification_logs_status_check 
  CHECK (status IN ('sent', 'failed', 'pending', 'delivered', 'expired', 'retry'));

-- 알림 분석을 위한 뷰
CREATE OR REPLACE VIEW notification_analytics AS
SELECT 
  notification_type,
  status,
  DATE_TRUNC('day', sent_at) as date,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'delivered')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as delivery_rate
FROM notification_logs 
WHERE sent_at IS NOT NULL
GROUP BY notification_type, status, DATE_TRUNC('day', sent_at)
ORDER BY date DESC, notification_type;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_push_subscription ON profiles(push_subscription);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_at ON scheduled_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_created_by ON scheduled_notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- RLS 정책
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- 예약된 알림 정책 - 생성자와 관리자만 접근 가능
CREATE POLICY "Users can view their scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (
    auth.uid() = created_by OR 
    auth.uid() IN (
      SELECT id FROM auth.users WHERE id IN (
        SELECT user_id FROM profiles WHERE role IN ('admin', 'system_admin')
      )
    )
  );

CREATE POLICY "Authorized users can create scheduled notifications" ON scheduled_notifications
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (
      SELECT id FROM auth.users WHERE id IN (
        SELECT user_id FROM profiles WHERE role IN ('admin', 'system_admin', 'site_manager')
      )
    )
  );

CREATE POLICY "Authorized users can update scheduled notifications" ON scheduled_notifications
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() IN (
      SELECT id FROM auth.users WHERE id IN (
        SELECT user_id FROM profiles WHERE role IN ('admin', 'system_admin')
      )
    )
  );

-- 예약된 알림 처리 함수
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_notification scheduled_notifications%ROWTYPE;
  v_processed_count INTEGER := 0;
BEGIN
  -- 처리할 예약된 알림 조회 (현재 시간보다 이전에 예약된 것들)
  FOR v_notification IN 
    SELECT * FROM scheduled_notifications 
    WHERE status = 'pending' 
      AND scheduled_at <= NOW() 
    ORDER BY scheduled_at ASC
    LIMIT 100 -- 한 번에 최대 100개씩 처리
  LOOP
    -- 상태를 처리 중으로 변경
    UPDATE scheduled_notifications 
    SET status = 'processing', updated_at = NOW() 
    WHERE id = v_notification.id;
    
    -- 여기서 실제 푸시 알림 전송 로직을 호출해야 함
    -- 이는 애플리케이션 코드에서 처리됨
    
    v_processed_count := v_processed_count + 1;
  END LOOP;
  
  RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 만료된 푸시 구독 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_push_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  v_cleaned_count INTEGER;
BEGIN
  -- 30일 이상 업데이트되지 않은 푸시 구독 제거
  UPDATE profiles 
  SET push_subscription = NULL, push_subscription_updated_at = NULL
  WHERE push_subscription IS NOT NULL 
    AND (push_subscription_updated_at IS NULL OR push_subscription_updated_at < NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
  RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 알림 통계 함수
CREATE OR REPLACE FUNCTION get_notification_stats(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_notification_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  notification_type TEXT,
  total_sent INTEGER,
  delivered INTEGER,
  failed INTEGER,
  delivery_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nl.notification_type,
    COUNT(*)::INTEGER as total_sent,
    COUNT(*) FILTER (WHERE nl.status = 'delivered')::INTEGER as delivered,
    COUNT(*) FILTER (WHERE nl.status = 'failed')::INTEGER as failed,
    ROUND(
      COUNT(*) FILTER (WHERE nl.status = 'delivered')::numeric / 
      NULLIF(COUNT(*), 0) * 100, 2
    ) as delivery_rate
  FROM notification_logs nl
  WHERE nl.sent_at::date BETWEEN p_start_date AND p_end_date
    AND (p_notification_type IS NULL OR nl.notification_type = p_notification_type)
    AND nl.notification_type IS NOT NULL
  GROUP BY nl.notification_type
  ORDER BY total_sent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 푸시 구독 등록/해제 함수
CREATE OR REPLACE FUNCTION update_push_subscription(
  p_user_id UUID,
  p_subscription JSONB,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    push_subscription = p_subscription,
    push_subscription_updated_at = NOW(),
    user_agent = p_user_agent
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 알림 선호도 업데이트 함수
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    notification_preferences = notification_preferences || p_preferences,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 만료된 알림 정리 함수 (기존 함수 확장)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_cleaned_count INTEGER;
BEGIN
  -- 30일 이상 된 읽은 알림 삭제
  DELETE FROM notifications 
  WHERE read = true 
    AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
  
  -- 90일 이상 된 알림 로그 삭제
  DELETE FROM notification_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- 완료된 예약 알림 정리 (30일 이상)
  DELETE FROM scheduled_notifications 
  WHERE status IN ('completed', 'failed', 'cancelled')
    AND updated_at < NOW() - INTERVAL '30 days';
  
  RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 푸시 알림 템플릿 추가
INSERT INTO notification_templates (code, name, type, title_template, message_template, variables) VALUES
  ('push_material_approval', '자재 승인 요청', 'approval', '자재 요청 승인 필요', '{{material_name}} 자재 요청이 승인을 기다리고 있습니다', '["material_name", "site_name", "requester_name"]'),
  ('push_daily_report_reminder', '작업일지 리마인더', 'info', '작업일지 작성 리마인더', '오늘의 작업일지를 작성해주세요', '["site_name"]'),
  ('push_safety_alert', '안전 경고', 'error', '⚠️ 안전 경고', '{{message}}', '["message", "site_name", "incident_type"]'),
  ('push_equipment_maintenance', '장비 정비 알림', 'warning', '장비 정비 알림', '{{equipment_name}} 정비 시간입니다', '["equipment_name", "site_name", "maintenance_type"]'),
  ('push_site_announcement', '현장 공지', 'info', '📢 {{title}}', '{{message}}', '["title", "message", "site_name"]')
ON CONFLICT (code) DO NOTHING;

-- 자동 정리 작업을 위한 cron job 설정 (pg_cron 확장이 있을 경우)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');
-- SELECT cron.schedule('cleanup-push-subscriptions', '0 3 * * 0', 'SELECT cleanup_expired_push_subscriptions();');

-- 권한 부여 (서비스 역할에 대한 함수 실행 권한)
GRANT EXECUTE ON FUNCTION process_scheduled_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_push_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION get_notification_stats(DATE, DATE, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_push_subscription(UUID, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_notification_preferences(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO service_role;