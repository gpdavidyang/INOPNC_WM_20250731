-- Notification system tables
-- 알림 시스템을 위한 테이블 생성

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'approval', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- 관련 엔티티 참조 (optional)
  related_entity_type TEXT CHECK (related_entity_type IN ('daily_report', 'material_request', 'user', 'site', 'document')),
  related_entity_id UUID,
  
  -- 알림 액션 URL (optional)
  action_url TEXT,
  
  -- 만료 시간 (optional)
  expires_at TIMESTAMPTZ
);

-- 알림 템플릿 테이블
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'approval', 'system')),
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- 사용 가능한 변수 목록
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 알림 설정 테이블
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, notification_type)
);

-- 알림 로그 테이블 (선택적 - 알림 전송 이력 추적용)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notification_logs_notification_id ON notification_logs(notification_id);

-- RLS 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 알림은 해당 사용자만 볼 수 있음
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 알림 읽음 상태는 본인만 업데이트 가능
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 시스템과 관리자는 알림 생성 가능
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE id IN (
        SELECT user_id FROM profiles WHERE role IN ('admin', 'system_admin')
      )
    ) OR auth.uid() = created_by
  );

-- 알림 템플릿은 관리자만 관리
CREATE POLICY "Admins can manage notification templates" ON notification_templates
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE id IN (
        SELECT user_id FROM profiles WHERE role IN ('admin', 'system_admin')
      )
    )
  );

-- 사용자는 자신의 알림 설정만 관리
CREATE POLICY "Users can manage their notification preferences" ON user_notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 기본 알림 템플릿 삽입
INSERT INTO notification_templates (code, name, type, title_template, message_template, variables) VALUES
  ('daily_report_submitted', '일일보고서 제출', 'info', '일일보고서가 제출되었습니다', '{{user_name}}님이 {{site_name}} 현장의 일일보고서를 제출했습니다.', '["user_name", "site_name", "report_date"]'),
  ('daily_report_approved', '일일보고서 승인', 'success', '일일보고서가 승인되었습니다', '{{report_date}} 일자 일일보고서가 승인되었습니다.', '["report_date", "approver_name"]'),
  ('daily_report_rejected', '일일보고서 반려', 'error', '일일보고서가 반려되었습니다', '{{report_date}} 일자 일일보고서가 반려되었습니다. 사유: {{reason}}', '["report_date", "reason", "approver_name"]'),
  ('material_low_stock', '자재 재고 부족', 'warning', 'NPC-1000 재고 부족 경고', '{{site_name}} 현장의 NPC-1000 재고가 {{remaining_amount}}kg 남았습니다.', '["site_name", "remaining_amount"]'),
  ('material_request_created', '자재 요청 생성', 'info', '새로운 자재 요청', '{{site_name}} 현장에서 {{material_amount}}kg의 NPC-1000을 요청했습니다.', '["site_name", "material_amount", "requester_name"]'),
  ('user_assigned_to_site', '현장 배정', 'info', '새로운 현장에 배정되었습니다', '{{site_name}} 현장에 배정되었습니다.', '["site_name", "assigned_by"]'),
  ('system_maintenance', '시스템 공지', 'system', '시스템 점검 안내', '{{maintenance_date}} {{maintenance_time}}에 시스템 점검이 예정되어 있습니다.', '["maintenance_date", "maintenance_time", "duration"]');

-- 알림 생성 함수
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_template_code TEXT,
  p_variables JSONB DEFAULT '{}',
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_template notification_templates%ROWTYPE;
  v_title TEXT;
  v_message TEXT;
  v_notification_id UUID;
BEGIN
  -- 템플릿 조회
  SELECT * INTO v_template FROM notification_templates WHERE code = p_template_code AND is_active = true;
  
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Notification template not found: %', p_template_code;
  END IF;
  
  -- 변수 치환
  v_title := v_template.title_template;
  v_message := v_template.message_template;
  
  -- JSONB 변수를 사용하여 텍스트 치환
  FOR key, value IN SELECT * FROM jsonb_each_text(p_variables) LOOP
    v_title := REPLACE(v_title, '{{' || key || '}}', value);
    v_message := REPLACE(v_message, '{{' || key || '}}', value);
  END LOOP;
  
  -- 알림 생성
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    related_entity_type,
    related_entity_id,
    action_url,
    created_by
  ) VALUES (
    p_user_id,
    v_template.type,
    v_title,
    v_message,
    p_variables,
    p_related_entity_type,
    p_related_entity_id,
    p_action_url,
    auth.uid()
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 읽지 않은 알림 개수 조회 함수
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM notifications 
    WHERE user_id = p_user_id 
      AND read = false 
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 알림 읽음 처리 함수
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET read = true, read_at = NOW() 
  WHERE id = p_notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 모든 알림 읽음 처리 함수
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET read = true, read_at = NOW() 
  WHERE user_id = p_user_id AND read = false;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;