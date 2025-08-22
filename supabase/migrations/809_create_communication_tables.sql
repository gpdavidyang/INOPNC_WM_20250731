-- Communication Management System Tables
-- 공지사항 및 본사 요청사항 관리를 위한 테이블

-- 1. 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'notice' CHECK (type IN ('notice', 'alert', 'info', 'warning')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'workers', 'managers', 'partners', 'admins')),
  is_active BOOLEAN DEFAULT TRUE,
  is_pinned BOOLEAN DEFAULT FALSE,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 본사 요청사항 테이블
CREATE TABLE IF NOT EXISTS headquarters_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  category VARCHAR(30) DEFAULT 'general' CHECK (category IN ('general', 'technical', 'administrative', 'complaint', 'suggestion', 'other')),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  response TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  resolved_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 공지사항 읽음 기록 테이블
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_announcements_valid ON announcements(valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_requests_requester ON headquarters_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_site ON headquarters_requests(site_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON headquarters_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_category ON headquarters_requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_urgency ON headquarters_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_requests_date ON headquarters_requests(request_date DESC);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_reads(announcement_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE headquarters_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Announcements Policies
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (
    is_active = TRUE AND
    (valid_from IS NULL OR valid_from <= NOW()) AND
    (valid_until IS NULL OR valid_until >= NOW())
  );

CREATE POLICY "Admins can manage all announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Headquarters Requests Policies
CREATE POLICY "Users can create their own requests" ON headquarters_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id
  );

CREATE POLICY "Users can view their own requests" ON headquarters_requests
  FOR SELECT USING (
    requester_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Users can update their pending requests" ON headquarters_requests
  FOR UPDATE USING (
    requester_id = auth.uid() AND status = 'pending'
  );

CREATE POLICY "Admins can manage all requests" ON headquarters_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Site managers can view requests from their sites" ON headquarters_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM site_memberships 
      WHERE site_id = headquarters_requests.site_id 
      AND user_id = auth.uid()
      AND role = 'site_manager'
      AND status = 'active'
    )
  );

-- Announcement Reads Policies
CREATE POLICY "Users can mark announcements as read" ON announcement_reads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view their own read records" ON announcement_reads
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Function to update view count
CREATE OR REPLACE FUNCTION increment_announcement_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE announcements 
  SET view_count = view_count + 1
  WHERE id = NEW.announcement_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment view count when announcement is read
CREATE TRIGGER increment_view_count_on_read
  AFTER INSERT ON announcement_reads
  FOR EACH ROW
  EXECUTE FUNCTION increment_announcement_view_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON headquarters_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample announcements
INSERT INTO announcements (title, content, type, priority, target_audience, is_pinned)
VALUES 
  ('시스템 정기 점검 안내', '매주 일요일 새벽 2시-4시 시스템 점검이 진행됩니다.', 'info', 'medium', 'all', true),
  ('안전관리 강화 공지', '현장 안전모 착용을 의무화합니다. 미착용시 작업 불가합니다.', 'alert', 'high', 'workers', false),
  ('파트너사 정산 일정', '월말 정산은 매월 25일에 진행됩니다.', 'notice', 'medium', 'partners', false),
  ('긴급 작업 중단 명령', '기상악화로 인한 모든 옥외 작업 즉시 중단', 'warning', 'critical', 'all', true),
  ('신규 기능 업데이트', '모바일 앱에 출퇴근 기능이 추가되었습니다.', 'info', 'low', 'all', false)
ON CONFLICT DO NOTHING;