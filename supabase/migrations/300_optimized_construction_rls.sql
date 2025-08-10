-- 300_optimized_construction_rls.sql
-- 최적화된 건설 현장 관리 시스템 RLS 정책
-- 기존 정책들을 제거하고 계층적 권한 구조로 재구축

-- =====================================================
-- 1. 기존 정책 정리
-- =====================================================

-- 기존 정책들 제거 (충돌 방지)
DROP POLICY IF EXISTS "attendance_records_policy" ON attendance_records;
DROP POLICY IF EXISTS "daily_reports_policy" ON daily_reports;
DROP POLICY IF EXISTS "documents_policy" ON documents;
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "sites_policy" ON sites;
DROP POLICY IF EXISTS "site_assignments_policy" ON site_assignments;
DROP POLICY IF EXISTS "notifications_policy" ON notifications;

-- 기존 헬퍼 함수들 제거
DROP FUNCTION IF EXISTS auth.user_role();
DROP FUNCTION IF EXISTS auth.user_sites();

-- =====================================================
-- 2. 헬퍼 함수들 생성
-- =====================================================

-- 사용자 역할 확인 함수
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid()),
    'anonymous'
  );
$$;

-- 사용자가 접근할 수 있는 현장 ID들 반환
CREATE OR REPLACE FUNCTION auth.user_sites()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN auth.user_role() IN ('system_admin') THEN
      -- 시스템 관리자는 모든 현장 접근
      (SELECT array_agg(id) FROM sites WHERE id IS NOT NULL)
    WHEN auth.user_role() IN ('admin', 'site_manager') THEN
      -- 관리자와 현장관리자는 배정된 현장들 접근
      (SELECT COALESCE(
        array_agg(DISTINCT site_id), 
        ARRAY[]::uuid[]
      ) FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true)
    ELSE
      -- 일반 사용자는 배정된 현장만 접근
      (SELECT COALESCE(
        array_agg(site_id), 
        ARRAY[]::uuid[]
      ) FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true)
  END;
$$;

-- =====================================================
-- 3. 최적화된 RLS 정책들
-- =====================================================

-- 1. attendance_records 정책
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimized_attendance_policy" ON attendance_records
FOR ALL USING (
  CASE
    WHEN auth.user_role() = 'system_admin' THEN true
    WHEN auth.user_role() IN ('admin', 'site_manager') THEN
      site_id = ANY(auth.user_sites()) OR user_id = auth.uid()
    ELSE
      user_id = auth.uid() OR site_id = ANY(auth.user_sites())
  END
);

-- 2. daily_reports 정책  
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimized_daily_reports_policy" ON daily_reports
FOR ALL USING (
  CASE
    WHEN auth.user_role() = 'system_admin' THEN true
    WHEN auth.user_role() IN ('admin', 'site_manager') THEN
      site_id = ANY(auth.user_sites()) OR created_by = auth.uid()
    ELSE
      created_by = auth.uid() OR site_id = ANY(auth.user_sites())
  END
);

-- 3. documents 정책
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimized_documents_policy" ON documents
FOR ALL USING (
  CASE
    WHEN auth.user_role() = 'system_admin' THEN true
    WHEN auth.user_role() IN ('admin', 'site_manager') THEN
      is_public = true OR owner_id = auth.uid() OR site_id = ANY(auth.user_sites())
    ELSE
      is_public = true OR owner_id = auth.uid() OR site_id = ANY(auth.user_sites())
  END
);

-- 4. profiles 정책 (본인 정보 + 관리자는 팀원 정보)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimized_profiles_policy" ON profiles
FOR ALL USING (
  CASE
    WHEN auth.user_role() = 'system_admin' THEN true
    WHEN auth.user_role() IN ('admin', 'site_manager') THEN
      id = auth.uid() OR 
      id IN (SELECT user_id FROM site_assignments WHERE site_id = ANY(auth.user_sites()) AND is_active = true)
    ELSE
      id = auth.uid()
  END
);

-- 5. sites 정책
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimized_sites_policy" ON sites
FOR ALL USING (
  CASE
    WHEN auth.user_role() = 'system_admin' THEN true
    ELSE
      id = ANY(auth.user_sites())
  END
);

-- 6. site_assignments 정책
ALTER TABLE site_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimized_site_assignments_policy" ON site_assignments
FOR ALL USING (
  CASE
    WHEN auth.user_role() = 'system_admin' THEN true
    WHEN auth.user_role() IN ('admin', 'site_manager') THEN
      site_id = ANY(auth.user_sites()) OR user_id = auth.uid()
    ELSE
      user_id = auth.uid()
  END
);

-- 7. notifications 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimized_notifications_policy" ON notifications
FOR ALL USING (
  CASE
    WHEN auth.user_role() = 'system_admin' THEN true
    ELSE
      recipient_id = auth.uid()
  END
);

-- =====================================================
-- 4. 성능 최적화 인덱스
-- =====================================================

-- attendance_records 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_attendance_site_user_date 
ON attendance_records(site_id, user_id, work_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_user_recent
ON attendance_records(user_id, work_date DESC) 
WHERE work_date >= CURRENT_DATE - INTERVAL '30 days';

-- daily_reports 최적화 인덱스  
CREATE INDEX IF NOT EXISTS idx_daily_reports_site_date
ON daily_reports(site_id, work_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_reports_created_by
ON daily_reports(created_by, work_date DESC);

-- site_assignments 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_site_assignments_user_active
ON site_assignments(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_site_assignments_site_active  
ON site_assignments(site_id, is_active) WHERE is_active = true;

-- profiles 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role) WHERE role IS NOT NULL;

-- =====================================================
-- 5. 권한 검증 함수 (테스트용)
-- =====================================================

-- 사용자 권한 테스트 함수
CREATE OR REPLACE FUNCTION test_user_permissions(test_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  user_role text;
  user_sites uuid[];
BEGIN
  -- 사용자 역할 확인
  SELECT role INTO user_role FROM profiles WHERE id = test_user_id;
  
  -- 사용자 현장들 확인
  SELECT array_agg(site_id) INTO user_sites 
  FROM site_assignments 
  WHERE user_id = test_user_id AND is_active = true;
  
  -- 결과 JSON 구성
  SELECT json_build_object(
    'user_id', test_user_id,
    'user_role', COALESCE(user_role, 'unknown'),
    'user_sites', COALESCE(user_sites, ARRAY[]::uuid[]),
    'site_count', COALESCE(array_length(user_sites, 1), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 6. 마이그레이션 완료 로그
-- =====================================================

-- 마이그레이션 로그 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS migration_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_name text NOT NULL,
  applied_at timestamp with time zone DEFAULT now(),
  description text
);

-- 이 마이그레이션 로그 기록
INSERT INTO migration_logs (migration_name, description) VALUES (
  '300_optimized_construction_rls',
  '최적화된 건설 현장 관리 시스템 RLS 정책 적용 - 계층적 권한 구조로 개선'
);

-- 마이그레이션 완료 확인용 주석
-- ✅ 최적화된 RLS 정책 적용 완료
-- 🔹 시스템 관리자: 모든 데이터 접근
-- 🔹 관리자/현장관리자: 배정된 현장 + 팀 데이터 접근  
-- 🔹 일반 사용자: 본인 데이터 + 배정된 현장 데이터 접근
-- 🔹 현장별 데이터 격리: 다른 현장 데이터는 접근 불가