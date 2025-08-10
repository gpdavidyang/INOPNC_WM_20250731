-- 303_fix_profiles_recursion_final.sql
-- profiles 테이블의 무한 재귀 문제 최종 해결
-- 단순하고 안전한 정책으로 전면 재구성

-- =====================================================
-- 1. 기존 profiles 정책 모두 제거
-- =====================================================

DROP POLICY IF EXISTS "profiles_access_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- =====================================================
-- 2. 새로운 단순화된 profiles 정책
-- =====================================================

-- SELECT 정책: 본인 프로필만 조회 가능
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
  -- 모든 인증된 사용자가 자신의 프로필 접근 가능
  id = auth.uid()
);

-- INSERT 정책: 본인 프로필만 생성 가능
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK (
  -- 본인 프로필만 생성 가능
  id = auth.uid()
);

-- UPDATE 정책: 본인 프로필만 수정 가능
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (
  -- 본인 프로필만 수정 가능
  id = auth.uid()
);

-- =====================================================
-- 3. 다른 테이블 정책도 단순화 (재귀 제거)
-- =====================================================

-- attendance_records 정책 재생성
DROP POLICY IF EXISTS "attendance_access_policy" ON attendance_records;

CREATE POLICY "attendance_access_policy" ON attendance_records
FOR ALL USING (
  -- 본인 데이터 접근
  user_id = auth.uid()
  OR
  -- 같은 현장 팀원 데이터 접근
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- daily_reports 정책 재생성
DROP POLICY IF EXISTS "daily_reports_access_policy" ON daily_reports;

CREATE POLICY "daily_reports_access_policy" ON daily_reports
FOR ALL USING (
  -- 본인이 작성한 작업일지
  created_by = auth.uid()
  OR
  -- 같은 현장 팀원들의 작업일지 접근
  site_id IN (
    SELECT site_id FROM site_assignments 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- notifications 정책 재생성
DROP POLICY IF EXISTS "notifications_access_policy" ON notifications;

CREATE POLICY "notifications_access_policy" ON notifications
FOR ALL USING (
  -- 본인에게 온 알림만
  user_id = auth.uid()
);

-- documents 정책 재생성
DROP POLICY IF EXISTS "documents_access_policy" ON documents;

CREATE POLICY "documents_access_policy" ON documents
FOR ALL USING (
  -- 본인이 업로드한 문서
  uploaded_by = auth.uid()
  OR
  -- 공유된 문서 (같은 현장)
  (
    is_public = true 
    AND 
    site_id IN (
      SELECT site_id FROM site_assignments 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- =====================================================
-- 4. 정책 상태 확인
-- =====================================================

SELECT 'RLS 정책 최종 수정 완료 - 무한 재귀 문제 해결' as status;

-- 참고: 이 마이그레이션은 profiles 테이블에서 역할 기반 접근 제어를 제거하고
-- 단순한 본인 데이터 접근만 허용합니다. 
-- 관리자 권한은 애플리케이션 레벨에서 처리하도록 변경됩니다.