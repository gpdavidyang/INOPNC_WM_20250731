-- 304_fix_all_rls_policies_final.sql
-- 모든 RLS 정책을 단순하고 안전하게 재구성
-- 무한 재귀 및 순환 참조 완전 제거

-- =====================================================
-- 1. sites 정책 정리
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage sites" ON sites;
DROP POLICY IF EXISTS "Users can view sites" ON sites;
DROP POLICY IF EXISTS "sites_access_policy" ON sites;

-- 모든 인증된 사용자가 sites를 볼 수 있음
CREATE POLICY "sites_select_policy" ON sites
FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- INSERT/UPDATE/DELETE는 애플리케이션 레벨에서 처리
CREATE POLICY "sites_modify_policy" ON sites
FOR INSERT WITH CHECK (false);

-- =====================================================
-- 2. site_assignments 정책 정리
-- =====================================================

DROP POLICY IF EXISTS "site_assignments_select_policy" ON site_assignments;
DROP POLICY IF EXISTS "site_assignments_modify_policy" ON site_assignments;

-- 모든 인증된 사용자가 site_assignments를 볼 수 있음
CREATE POLICY "site_assignments_select_policy" ON site_assignments
FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- =====================================================
-- 3. attendance_records 정책 재생성
-- =====================================================

DROP POLICY IF EXISTS "attendance_access_policy" ON attendance_records;

-- 출근 기록 접근 정책
CREATE POLICY "attendance_select_policy" ON attendance_records
FOR SELECT USING (
  -- 본인 데이터
  user_id = auth.uid()
  OR
  -- 같은 현장의 데이터 (site_assignments 테이블 참조)
  EXISTS (
    SELECT 1 
    FROM site_assignments sa1
    WHERE sa1.user_id = auth.uid() 
    AND sa1.is_active = true
    AND sa1.site_id = attendance_records.site_id
  )
);

CREATE POLICY "attendance_insert_policy" ON attendance_records
FOR INSERT WITH CHECK (
  -- 본인 출근 기록만 생성 가능
  user_id = auth.uid()
);

CREATE POLICY "attendance_update_policy" ON attendance_records
FOR UPDATE USING (
  -- 본인 출근 기록만 수정 가능
  user_id = auth.uid()
);

-- =====================================================
-- 4. daily_reports 정책 재생성
-- =====================================================

DROP POLICY IF EXISTS "daily_reports_access_policy" ON daily_reports;

CREATE POLICY "daily_reports_select_policy" ON daily_reports
FOR SELECT USING (
  -- 본인이 작성한 작업일지
  created_by = auth.uid()
  OR
  -- 같은 현장의 작업일지
  EXISTS (
    SELECT 1 
    FROM site_assignments sa1
    WHERE sa1.user_id = auth.uid() 
    AND sa1.is_active = true
    AND sa1.site_id = daily_reports.site_id
  )
);

CREATE POLICY "daily_reports_insert_policy" ON daily_reports
FOR INSERT WITH CHECK (
  -- 본인 작업일지만 생성 가능
  created_by = auth.uid()
);

CREATE POLICY "daily_reports_update_policy" ON daily_reports
FOR UPDATE USING (
  -- 본인 작업일지만 수정 가능
  created_by = auth.uid()
);

-- =====================================================
-- 5. 정책 상태 확인
-- =====================================================

SELECT 'RLS 정책 최종 정리 완료' as status;