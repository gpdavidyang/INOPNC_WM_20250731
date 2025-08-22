-- 303_unify_admin_permissions.sql
-- admin 권한을 system_admin과 동일하게 통합
-- admin = 본사관리자/시스템관리자 (데스크탑 UI 전용)

-- =====================================================
-- 1. 기존 정책 제거
-- =====================================================

-- attendance_records 정책 제거
DROP POLICY IF EXISTS "attendance_access_policy" ON attendance_records;

-- daily_reports 정책 제거
DROP POLICY IF EXISTS "daily_reports_access_policy" ON daily_reports;

-- documents 정책 제거
DROP POLICY IF EXISTS "documents_access_policy" ON documents;

-- profiles 정책 제거
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- sites 정책 제거
DROP POLICY IF EXISTS "sites_access_policy" ON sites;

-- notifications 정책 제거
DROP POLICY IF EXISTS "notifications_access_policy" ON notifications;

-- =====================================================
-- 2. 통합된 admin 권한으로 새로운 정책 생성
-- =====================================================

-- 1. attendance_records 정책
CREATE POLICY "attendance_access_policy" ON attendance_records
FOR ALL USING (
  -- admin과 system_admin은 모든 데이터 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin')
  OR 
  -- 본인 데이터는 항상 접근 가능
  user_id = auth.uid()
  OR
  -- 현장관리자는 배정된 현장 데이터 접근
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'site_manager'
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR
  -- 일반 사용자도 같은 현장 팀원 데이터 조회 가능
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 2. daily_reports 정책
CREATE POLICY "daily_reports_access_policy" ON daily_reports
FOR ALL USING (
  -- admin과 system_admin은 모든 데이터 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin')
  OR 
  -- 본인이 작성한 작업일지
  created_by = auth.uid()
  OR
  -- 현장관리자는 배정된 현장 작업일지 접근
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'site_manager'
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR
  -- 같은 현장 팀원들의 작업일지 조회
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 3. documents 정책
CREATE POLICY "documents_access_policy" ON documents
FOR ALL USING (
  -- admin과 system_admin은 모든 문서 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin')
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

-- 4. profiles 정책 (SELECT)
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
  -- admin과 system_admin은 모든 프로필 조회
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
    LIMIT 1
  )
  OR
  -- 본인 프로필
  id = auth.uid()
  OR
  -- 현장관리자는 배정된 현장의 팀원 프로필 조회
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'site_manager'
      LIMIT 1
    )
    AND
    id IN (
      SELECT user_id FROM site_assignments sa1
      WHERE sa1.site_id IN (
        SELECT site_id FROM site_assignments sa2
        WHERE sa2.user_id = auth.uid() 
        AND sa2.is_active = true
      )
      AND sa1.is_active = true
    )
  )
  OR
  -- 같은 현장 팀원 프로필 조회
  id IN (
    SELECT user_id FROM site_assignments sa1
    WHERE sa1.site_id IN (
      SELECT site_id FROM site_assignments sa2
      WHERE sa2.user_id = auth.uid() 
      AND sa2.is_active = true
    )
    AND sa1.is_active = true
  )
);

-- 5. profiles 정책 (INSERT) - 회원가입시 프로필 생성용
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK (
  -- 본인 프로필만 생성 가능
  id = auth.uid()
);

-- 6. profiles 정책 (UPDATE)
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (
  -- admin과 system_admin은 모든 프로필 수정
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
    LIMIT 1
  )
  OR
  -- 본인 프로필만 수정 가능
  id = auth.uid()
  OR
  -- 현장관리자는 배정된 현장 팀원 프로필 수정
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'site_manager'
      LIMIT 1
    )
    AND
    id IN (
      SELECT user_id FROM site_assignments sa1
      WHERE sa1.site_id IN (
        SELECT site_id FROM site_assignments sa2
        WHERE sa2.user_id = auth.uid() 
        AND sa2.is_active = true
      )
      AND sa1.is_active = true
    )
  )
);

-- 7. sites 정책
CREATE POLICY "sites_access_policy" ON sites
FOR ALL USING (
  -- admin과 system_admin은 모든 현장 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin')
  OR
  -- 배정된 현장만 접근
  id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 8. notifications 정책
CREATE POLICY "notifications_access_policy" ON notifications
FOR ALL USING (
  -- admin과 system_admin은 모든 알림 접근
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin')
  OR
  -- 본인 알림만 접근
  user_id = auth.uid()
);

-- 9. site_assignments 정책
DROP POLICY IF EXISTS "site_assignments_access_policy" ON site_assignments;

CREATE POLICY "site_assignments_access_policy" ON site_assignments
FOR ALL USING (
  -- admin과 system_admin은 모든 배정 관리
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'system_admin')
  OR
  -- 본인 배정 정보 조회
  user_id = auth.uid()
  OR
  -- 현장관리자는 자신이 관리하는 현장의 배정 정보 관리
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'site_manager'
    AND
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- =====================================================
-- 3. 역할 설명 코멘트 추가
-- =====================================================

COMMENT ON COLUMN profiles.role IS '사용자 역할: worker(작업자-모바일), site_manager(현장관리자-모바일), customer_manager(고객사관리자-모바일), admin(본사관리자/시스템관리자-데스크탑), system_admin(deprecated)';

-- =====================================================
-- 4. 기존 system_admin 계정을 admin으로 마이그레이션 (선택사항)
-- =====================================================

-- system_admin 역할을 가진 사용자를 admin으로 변경
-- (실제 운영 환경에서는 신중하게 검토 후 실행)
-- UPDATE profiles 
-- SET role = 'admin', 
--     updated_at = NOW()
-- WHERE role = 'system_admin';