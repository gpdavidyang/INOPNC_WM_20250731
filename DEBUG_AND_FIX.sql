-- 🔍 디버그 및 최종 해결 SQL
-- 문제를 정확히 파악하고 해결

-- ==========================================
-- 1. 현재 데이터 상태 확인
-- ==========================================
SELECT '=== 현재 현장 데이터 ===' as info;
SELECT id, name, address, status FROM public.sites;

SELECT '=== 현재 배정 데이터 ===' as info;
SELECT sa.*, s.name as site_name 
FROM public.site_assignments sa
LEFT JOIN public.sites s ON sa.site_id = s.id;

-- ==========================================
-- 2. 데이터베이스 함수 상태 확인
-- ==========================================
SELECT '=== 데이터베이스 함수 존재 여부 ===' as info;
SELECT proname FROM pg_proc WHERE proname IN ('get_current_user_site', 'get_user_site_history');

-- ==========================================
-- 3. 뷰 상태 확인
-- ==========================================
SELECT '=== current_site_assignments 뷰 존재 여부 ===' as info;
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname = 'current_site_assignments';

-- ==========================================
-- 4. 함수가 없다면 생성 (마이그레이션 재실행)
-- ==========================================

-- 기존 뷰 삭제 후 재생성
DROP VIEW IF EXISTS public.current_site_assignments CASCADE;

-- 뷰 생성
CREATE VIEW public.current_site_assignments AS
SELECT 
  sa.id,
  sa.site_id,
  sa.user_id,
  sa.assigned_date,
  sa.role,
  s.name as site_name,
  s.address as site_address,
  s.work_process,
  s.work_section,
  s.component_name,
  s.construction_manager_phone,
  s.safety_manager_phone,
  s.accommodation_name,
  s.accommodation_address,
  s.status as site_status,
  s.start_date,
  s.end_date
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.is_active = true AND s.status = 'active';

-- get_current_user_site 함수 생성
CREATE OR REPLACE FUNCTION public.get_current_user_site(user_uuid UUID)
RETURNS TABLE (
  site_id UUID,
  site_name TEXT,
  site_address TEXT,
  work_process TEXT,
  work_section TEXT,
  component_name TEXT,
  manager_name TEXT,
  construction_manager_phone TEXT,
  safety_manager_name TEXT,
  safety_manager_phone TEXT,
  accommodation_name TEXT,
  accommodation_address TEXT,
  assigned_date DATE,
  user_role TEXT,
  site_status TEXT,
  start_date DATE,
  end_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csa.site_id,
    csa.site_name,
    csa.site_address,
    csa.work_process,
    csa.work_section,
    csa.component_name,
    'N/A'::TEXT as manager_name,  -- manager_name 컬럼이 없으므로 기본값
    csa.construction_manager_phone,
    'N/A'::TEXT as safety_manager_name,  -- safety_manager_name 컬럼이 없으므로 기본값
    csa.safety_manager_phone,
    csa.accommodation_name,
    csa.accommodation_address,
    csa.assigned_date,
    csa.role as user_role,
    csa.site_status,
    csa.start_date,
    csa.end_date
  FROM public.current_site_assignments csa
  WHERE csa.user_id = user_uuid;
END;
$$;

-- get_user_site_history 함수 생성
CREATE OR REPLACE FUNCTION public.get_user_site_history(user_uuid UUID)
RETURNS TABLE (
  site_id UUID,
  site_name TEXT,
  site_address TEXT,
  work_process TEXT,
  work_section TEXT,
  assigned_date DATE,
  unassigned_date DATE,
  user_role TEXT,
  site_status TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.name as site_name,
    s.address as site_address,
    s.work_process,
    s.work_section,
    sa.assigned_date,
    sa.unassigned_date,
    sa.role as user_role,
    s.status as site_status,
    s.start_date,
    s.end_date,
    sa.is_active
  FROM public.site_assignments sa
  JOIN public.sites s ON sa.site_id = s.id
  WHERE sa.user_id = user_uuid
  ORDER BY sa.assigned_date DESC, sa.is_active DESC;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.get_current_user_site(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_site_history(UUID) TO authenticated;

-- ==========================================
-- 5. 현재 사용자 ID 확인
-- ==========================================
SELECT '=== 현재 사용자 정보 ===' as info;
SELECT auth.uid() as user_id, 
       (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- ==========================================
-- 6. 함수 테스트
-- ==========================================
SELECT '=== 함수 작동 테스트 ===' as info;
SELECT * FROM public.get_current_user_site(auth.uid());
SELECT * FROM public.get_user_site_history(auth.uid());

-- ==========================================
-- 7. 최종 상태 확인
-- ==========================================
SELECT '=== 최종 데이터 확인 ===' as info;
SELECT 
  '현장 수: ' || COUNT(*) as sites_count
FROM public.sites;

SELECT 
  '활성 배정 수: ' || COUNT(*) as active_assignments
FROM public.site_assignments 
WHERE is_active = true;

SELECT 
  '현재 사용자 배정: ' || COUNT(*) as user_assignments
FROM public.site_assignments 
WHERE user_id = auth.uid() AND is_active = true;

-- 완료 메시지
SELECT '🔍 디버그 완료! 위 결과를 확인하세요.' as result;