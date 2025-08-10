-- 301_simple_rls_policies.sql  
-- 간단하고 실용적인 RLS 정책 적용
-- auth 스키마 함수 대신 직접 조건 사용

-- =====================================================
-- 1. 기존 정책 정리
-- =====================================================

-- 기존 정책들 제거
DROP POLICY IF EXISTS "optimized_attendance_policy" ON attendance_records;
DROP POLICY IF EXISTS "optimized_daily_reports_policy" ON daily_reports;
DROP POLICY IF EXISTS "optimized_documents_policy" ON documents;
DROP POLICY IF EXISTS "optimized_profiles_policy" ON profiles;
DROP POLICY IF EXISTS "optimized_sites_policy" ON sites;
DROP POLICY IF EXISTS "optimized_site_assignments_policy" ON site_assignments;
DROP POLICY IF EXISTS "optimized_notifications_policy" ON notifications;

-- =====================================================
-- 2. 간단하고 실용적인 RLS 정책들
-- =====================================================

-- 1. attendance_records 정책 (현장별 + 역할별 접근)
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_access_policy" ON attendance_records
FOR ALL USING (
  -- 시스템 관리자는 모든 데이터 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR 
  -- 본인 데이터는 항상 접근 가능
  user_id = auth.uid()
  OR
  -- 관리자/현장관리자는 배정된 현장 데이터 접근
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager')
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR
  -- 일반 사용자도 같은 현장 팀원 데이터 접근 (현장 공유)
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 2. daily_reports 정책
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_reports_access_policy" ON daily_reports
FOR ALL USING (
  -- 시스템 관리자는 모든 데이터 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR 
  -- 본인이 작성한 작업일지
  created_by = auth.uid()
  OR
  -- 관리자/현장관리자는 배정된 현장 작업일지 접근
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager')
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR
  -- 같은 현장 팀원들의 작업일지 접근 (현장 공유)
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 3. documents 정책 (공개 문서 + 현장 문서)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_access_policy" ON documents
FOR ALL USING (
  -- 시스템 관리자는 모든 문서 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- 공개 문서는 모든 인증된 사용자가 접근
  is_public = true
  OR
  -- 본인이 소유한 문서
  owner_id = auth.uid()
  OR
  -- 배정된 현장의 문서들
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 4. profiles 정책 (본인 정보 + 같은 현장 팀원 정보)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_access_policy" ON profiles
FOR ALL USING (
  -- 시스템 관리자는 모든 프로필 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- 본인 프로필
  id = auth.uid()
  OR
  -- 관리자/현장관리자는 배정된 현장의 팀원 프로필 접근
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager')
    AND 
    id IN (
      SELECT sa1.user_id 
      FROM site_assignments sa1
      INNER JOIN site_assignments sa2 ON sa1.site_id = sa2.site_id
      WHERE sa2.user_id = auth.uid() AND sa1.is_active = true AND sa2.is_active = true
    )
  )
  OR
  -- 같은 현장 팀원들의 기본 정보 접근 (협업용)
  id IN (
    SELECT sa1.user_id 
    FROM site_assignments sa1
    INNER JOIN site_assignments sa2 ON sa1.site_id = sa2.site_id
    WHERE sa2.user_id = auth.uid() AND sa1.is_active = true AND sa2.is_active = true
  )
);

-- 5. sites 정책 (배정된 현장만)
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sites_access_policy" ON sites
FOR ALL USING (
  -- 시스템 관리자는 모든 현장 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- 배정된 현장만 접근
  id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 6. site_assignments 정책
ALTER TABLE site_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_assignments_access_policy" ON site_assignments
FOR ALL USING (
  -- 시스템 관리자는 모든 배정 정보 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- 본인의 배정 정보
  user_id = auth.uid()
  OR
  -- 관리자/현장관리자는 같은 현장의 배정 정보 접근
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager')
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- 7. notifications 정책 (본인 알림만)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_access_policy" ON notifications
FOR ALL USING (
  -- 시스템 관리자는 모든 알림 접근 (관리용)
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- 본인에게 온 알림만
  recipient_id = auth.uid()
);

-- =====================================================
-- 3. 추가 보안 강화
-- =====================================================

-- markup_documents 정책 (도면 마킹)
ALTER TABLE markup_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "markup_documents_access_policy" ON markup_documents
FOR ALL USING (
  -- 시스템 관리자는 모든 마크업 문서 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- 본인이 생성한 마크업 문서
  created_by = auth.uid()
  OR
  -- 공유된 마크업 문서이고 같은 현장에 배정된 경우
  (
    location = 'shared'
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR
  -- 개인 마크업 문서는 본인만
  (location = 'personal' AND created_by = auth.uid())
);

-- =====================================================
-- 4. 성능 최적화를 위한 추가 인덱스
-- =====================================================

-- RLS 정책 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_id_role 
ON profiles(id, role);

CREATE INDEX IF NOT EXISTS idx_site_assignments_compound
ON site_assignments(user_id, site_id, is_active);

-- =====================================================
-- 5. 테스트 및 검증
-- =====================================================

-- 권한 테스트를 위한 뷰 생성
CREATE OR REPLACE VIEW user_permissions_summary AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  array_agg(DISTINCT sa.site_id) FILTER (WHERE sa.is_active = true) as active_sites,
  count(DISTINCT sa.site_id) FILTER (WHERE sa.is_active = true) as active_site_count
FROM profiles p
LEFT JOIN site_assignments sa ON p.id = sa.user_id
WHERE p.id = auth.uid() -- 본인 정보만 조회 (RLS 적용)
GROUP BY p.id, p.email, p.full_name, p.role;

-- =====================================================
-- 6. 마이그레이션 완료 로그
-- =====================================================

INSERT INTO migration_logs (migration_name, description) VALUES (
  '301_simple_rls_policies',
  '간단하고 실용적인 RLS 정책 적용 - 현장별 데이터 격리 + 역할별 접근 권한'
);

-- 완료 메시지
SELECT 'RLS 정책 적용 완료 - 이제 사용자들이 적절한 데이터에 접근할 수 있습니다.' as status;