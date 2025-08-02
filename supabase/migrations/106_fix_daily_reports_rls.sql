-- Fix daily_reports RLS policies
-- 기존의 충돌하는 정책들을 모두 제거하고 새로운 통합 정책 적용

-- 1. 기존 daily_reports 정책 모두 제거
DROP POLICY IF EXISTS "Daily reports viewable by site members" ON public.daily_reports;
DROP POLICY IF EXISTS "Workers can create own daily reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Workers can update own draft reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Users can view their site data" ON daily_reports;
DROP POLICY IF EXISTS "Users can view reports based on role" ON public.daily_reports;
DROP POLICY IF EXISTS "daily_reports_select_site" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_insert_workers" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_update_own_or_manager" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_approve_managers" ON daily_reports;

-- 2. daily_reports 테이블에 RLS 활성화
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- 3. 간단하고 명확한 새 정책들 생성

-- 모든 인증된 사용자가 볼 수 있음 (임시 - 디버깅용)
CREATE POLICY "daily_reports_select_all" ON daily_reports
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 인증된 사용자가 생성 가능
CREATE POLICY "daily_reports_insert_auth" ON daily_reports
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 본인이 작성한 보고서는 수정 가능
CREATE POLICY "daily_reports_update_own" ON daily_reports
    FOR UPDATE USING (created_by = auth.uid());

-- 본인이 작성한 보고서는 삭제 가능  
CREATE POLICY "daily_reports_delete_own" ON daily_reports
    FOR DELETE USING (created_by = auth.uid());

-- 4. 필요한 함수들 확인 및 생성
-- user_site_ids 함수가 없다면 기본 함수 생성
CREATE OR REPLACE FUNCTION user_site_ids() 
RETURNS UUID[] AS $$
BEGIN
  -- 현재 사용자의 site_id 반환 (profiles 테이블에서)
  RETURN ARRAY(
    SELECT COALESCE(site_id, '00000000-0000-0000-0000-000000000000'::UUID)
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_admin 함수 확인 및 생성
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_manager_or_above 함수 확인 및 생성
CREATE OR REPLACE FUNCTION is_manager_or_above() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('site_manager', 'admin', 'system_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;