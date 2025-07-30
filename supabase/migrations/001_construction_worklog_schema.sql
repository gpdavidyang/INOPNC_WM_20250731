-- 건설 작업일지 관리 시스템 데이터베이스 스키마
-- INOPNC (이노피앤씨)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 사용자 및 조직 관련 테이블
-- =====================================================

-- 사용자 프로필 (auth.users 확장)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'site_manager', 'customer_manager', 'admin', 'system_admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0
);

-- 조직 (회사/부서)
CREATE TABLE public.organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('head_office', 'branch_office', 'department')),
  parent_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  description TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 사용자-조직 연결
CREATE TABLE public.user_organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, organization_id)
);

-- =====================================================
-- 2. 현장 관련 테이블
-- =====================================================

-- 현장 정보
CREATE TABLE public.sites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  
  -- 담당자 정보 (전화번호만)
  construction_manager_phone TEXT,
  safety_manager_phone TEXT,
  
  -- 숙소 정보
  accommodation_name TEXT,
  accommodation_address TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  start_date DATE NOT NULL,
  end_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 현장 작업자 배정
CREATE TABLE public.site_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  unassigned_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(site_id, user_id, assigned_date)
);

-- =====================================================
-- 3. 작업일지 관련 테이블
-- =====================================================

-- 작업일지 
CREATE TABLE public.daily_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  
  -- 작업 정보
  member_name TEXT NOT NULL,  -- 부재명 (슬라브, 거더, 기둥, 기타)
  process_type TEXT NOT NULL, -- 공정 (균열, 면, 마감, 기타)
  total_workers INTEGER DEFAULT 0,
  
  -- NPC-1000 자재 관리
  npc1000_incoming DECIMAL(10,2) DEFAULT 0,
  npc1000_used DECIMAL(10,2) DEFAULT 0,
  npc1000_remaining DECIMAL(10,2) DEFAULT 0,
  
  -- 문제 및 조치사항
  issues TEXT,
  
  -- 메타 정보
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(site_id, work_date, created_by)
);

-- 작업자별 공수 관리
CREATE TABLE public.daily_report_workers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  daily_report_id UUID REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  work_hours DECIMAL(4,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 4. 출근/급여 관리 테이블
-- =====================================================

-- 출근 기록
CREATE TABLE public.attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  work_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'holiday', 'sick_leave', 'vacation')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, work_date)
);

-- 급여 정보
CREATE TABLE public.salary_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_salary DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 5. 문서 관리 테이블
-- =====================================================

-- 문서함
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- 문서 유형 및 위치
  document_type TEXT CHECK (document_type IN ('personal', 'shared', 'blueprint', 'report', 'certificate', 'other')),
  folder_path TEXT,
  
  -- 권한 및 공유
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  
  -- 관련 엔티티
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 문서 공유 권한
CREATE TABLE public.document_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_with_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'delete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(document_id, shared_with_id)
);

-- =====================================================
-- 6. 알림 및 공지사항 테이블
-- =====================================================

-- 공지사항
CREATE TABLE public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_roles TEXT[], -- 대상 역할 배열
  target_sites UUID[], -- 대상 현장 배열
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 알림
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 7. 활동 로그 테이블
-- =====================================================

-- 활동 로그
CREATE TABLE public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 8. 승인 관리 테이블
-- =====================================================

-- 승인 요청
CREATE TABLE public.approval_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('daily_report', 'document', 'leave', 'expense', 'other')),
  entity_id UUID NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  comments TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 9. 인덱스 생성
-- =====================================================

-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_sites_status ON public.sites(status);
CREATE INDEX idx_site_assignments_active ON public.site_assignments(site_id, user_id) WHERE is_active = true;
CREATE INDEX idx_daily_reports_site_date ON public.daily_reports(site_id, work_date);
CREATE INDEX idx_daily_reports_status ON public.daily_reports(status);
CREATE INDEX idx_attendance_user_date ON public.attendance_records(user_id, work_date);
CREATE INDEX idx_documents_owner ON public.documents(owner_id);
CREATE INDEX idx_documents_site ON public.documents(site_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);

-- =====================================================
-- 10. Row Level Security (RLS) 활성화
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_report_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. RLS 정책 정의
-- =====================================================

-- Profiles 정책
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Sites 정책
CREATE POLICY "Sites are viewable by authenticated users" ON public.sites
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage sites" ON public.sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
    )
  );

-- Daily Reports 정책
CREATE POLICY "Daily reports viewable by site members" ON public.daily_reports
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.site_assignments
        WHERE site_id = daily_reports.site_id
        AND user_id = auth.uid()
        AND is_active = true
      ) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
      )
    )
  );

CREATE POLICY "Workers can create own daily reports" ON public.daily_reports
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workers can update own draft reports" ON public.daily_reports
  FOR UPDATE USING (
    auth.uid() = created_by AND status = 'draft'
  );

-- Attendance 정책
CREATE POLICY "Users can view own attendance" ON public.attendance_records
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('site_manager', 'admin', 'system_admin')
    )
  );

CREATE POLICY "Users can create own attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents 정책
CREATE POLICY "Documents viewable by owner or shared users" ON public.documents
  FOR SELECT USING (
    owner_id = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM public.document_shares
      WHERE document_id = documents.id AND shared_with_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
    )
  );

-- Notifications 정책
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 12. 함수 및 트리거
-- =====================================================

-- 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 생성 시 프로필 자동 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거들
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_sites_updated_at BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_daily_reports_updated_at BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- NPC-1000 자재 부족 알림 함수
CREATE OR REPLACE FUNCTION public.check_npc1000_shortage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.npc1000_remaining < 50 THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    SELECT 
      p.id,
      'NPC-1000 자재 부족 경고',
      FORMAT('현장 %s의 NPC-1000 잔량이 %s kg입니다. 보충이 필요합니다.', 
        (SELECT name FROM public.sites WHERE id = NEW.site_id),
        NEW.npc1000_remaining),
      'warning',
      FORMAT('/sites/%s/materials', NEW.site_id)
    FROM public.profiles p
    WHERE p.role IN ('site_manager', 'admin', 'system_admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NPC-1000 부족 알림 트리거
CREATE TRIGGER check_npc1000_shortage_trigger
  AFTER INSERT OR UPDATE OF npc1000_remaining ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.check_npc1000_shortage();

-- =====================================================
-- 13. 초기 데이터 (선택사항)
-- =====================================================

-- 기본 조직 생성
INSERT INTO public.organizations (name, type, description) VALUES
  ('INOPNC 본사', 'head_office', '이노피앤씨 본사'),
  ('디에이치 방배', 'branch_office', '디에이치 방배 현장 사무소');

-- 시스템 관리자 계정 생성 안내
-- 주의: 실제 운영환경에서는 Supabase Auth를 통해 계정을 생성해야 합니다
-- 아래는 예시입니다:
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at) VALUES
-- ('admin@inopnc.com', crypt('password123', gen_salt('bf')), now());

COMMENT ON SCHEMA public IS '건설 작업일지 관리 시스템 - INOPNC';