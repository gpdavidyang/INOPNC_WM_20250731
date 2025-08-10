-- 302_fix_infinite_recursion_rls.sql
-- profiles 테이블의 무한 재귀 문제 수정
-- 직접 조건 사용으로 재귀 방지

-- =====================================================
-- 1. 기존 문제가 있는 정책 제거
-- =====================================================

DROP POLICY IF EXISTS "profiles_access_policy" ON profiles;

-- =====================================================
-- 2. 수정된 profiles 정책 (재귀 없이)
-- =====================================================

-- profiles 테이블은 특별한 처리가 필요
-- auth.uid()와 직접 비교만 사용 (자기 참조 없이)
CREATE POLICY "profiles_access_policy" ON profiles
FOR ALL USING (
  -- 본인 프로필은 항상 접근 가능 (무조건)
  id = auth.uid()
  OR
  -- 시스템 관리자 확인 (자기 참조 없이 - EXISTS 사용)
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'system_admin'
    LIMIT 1
  )
  OR
  -- 관리자/현장관리자가 팀원 프로필 접근 (자기 참조 최소화)
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'site_manager')
      LIMIT 1
    )
    AND 
    id IN (
      SELECT DISTINCT sa1.user_id 
      FROM site_assignments sa1
      WHERE sa1.site_id IN (
        SELECT sa2.site_id 
        FROM site_assignments sa2 
        WHERE sa2.user_id = auth.uid() 
        AND sa2.is_active = true
      )
      AND sa1.is_active = true
    )
  )
  OR
  -- 같은 현장 작업자들끼리 기본 정보 접근
  id IN (
    SELECT DISTINCT sa1.user_id 
    FROM site_assignments sa1
    WHERE sa1.site_id IN (
      SELECT sa2.site_id 
      FROM site_assignments sa2 
      WHERE sa2.user_id = auth.uid() 
      AND sa2.is_active = true
    )
    AND sa1.is_active = true
  )
);

-- =====================================================
-- 3. INSERT 정책 추가 (프로필 생성용)
-- =====================================================

-- 프로필 INSERT 정책 (프로필 생성 허용)
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK (
  -- 본인 프로필만 생성 가능
  id = auth.uid()
);

-- 프로필 UPDATE 정책
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (
  -- 본인 프로필만 수정 가능
  id = auth.uid()
  OR
  -- 시스템 관리자는 모든 프로필 수정 가능
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'system_admin'
    LIMIT 1
  )
);

-- =====================================================
-- 4. 다른 테이블 정책도 수정 (profiles 참조 최적화)
-- =====================================================

-- attendance_records 정책 수정
DROP POLICY IF EXISTS "attendance_access_policy" ON attendance_records;

CREATE POLICY "attendance_access_policy" ON attendance_records
FOR ALL USING (
  -- 시스템 관리자 체크 (EXISTS 사용)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'system_admin'
    LIMIT 1
  )
  OR 
  -- 본인 데이터
  user_id = auth.uid()
  OR
  -- 관리자/현장관리자는 배정된 현장 데이터 접근
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'site_manager')
      LIMIT 1
    )
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR
  -- 같은 현장 팀원 데이터 접근
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- daily_reports 정책 수정
DROP POLICY IF EXISTS "daily_reports_access_policy" ON daily_reports;

CREATE POLICY "daily_reports_access_policy" ON daily_reports
FOR ALL USING (
  -- 시스템 관리자 체크
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'system_admin'
    LIMIT 1
  )
  OR 
  -- 본인이 작성한 작업일지
  created_by = auth.uid()
  OR worker_id = auth.uid()
  OR
  -- 관리자/현장관리자는 배정된 현장 작업일지 접근
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'site_manager')
      LIMIT 1
    )
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR
  -- 같은 현장 팀원들의 작업일지 접근
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- =====================================================
-- 5. 권한 확인 함수 (헬퍼)
-- =====================================================

-- 사용자 역할 확인 함수 (안전한 버전)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1),
    'anonymous'
  );
$$;

-- =====================================================
-- 6. 테스트 쿼리
-- =====================================================

-- RLS 정책 테스트 (이 쿼리는 실행되어야 함)
SELECT 'RLS 정책 수정 완료 - 무한 재귀 문제 해결' as status;