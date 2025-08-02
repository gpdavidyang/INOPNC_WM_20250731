-- 🔍 디버그 전용 SQL (데이터 확인만)
-- 수정 없이 현재 상태만 확인

-- ==========================================
-- 1. 현재 데이터 상태 확인
-- ==========================================
SELECT '=== 현재 현장 데이터 ===' as info;
SELECT id, name, address, status, work_process, work_section, component_name 
FROM public.sites;

SELECT '=== 현재 배정 데이터 ===' as info;
SELECT sa.id, sa.user_id, sa.site_id, sa.is_active, sa.assigned_date, s.name as site_name 
FROM public.site_assignments sa
LEFT JOIN public.sites s ON sa.site_id = s.id;

-- ==========================================
-- 2. 현재 사용자 정보
-- ==========================================
SELECT '=== 현재 사용자 정보 ===' as info;
SELECT auth.uid() as user_id, 
       (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- ==========================================
-- 3. 현재 사용자의 배정 상태
-- ==========================================
SELECT '=== 현재 사용자의 활성 배정 ===' as info;
SELECT 
  sa.id,
  sa.site_id,
  sa.is_active,
  sa.assigned_date,
  s.name as site_name,
  s.address,
  s.work_process,
  s.work_section
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;

-- ==========================================
-- 4. 데이터베이스 함수 존재 여부
-- ==========================================
SELECT '=== 데이터베이스 함수 목록 ===' as info;
SELECT proname, prosrc IS NOT NULL as has_source
FROM pg_proc 
WHERE proname IN ('get_current_user_site', 'get_user_site_history');

-- ==========================================
-- 5. 함수 호출 테스트 (있다면)
-- ==========================================
SELECT '=== get_current_user_site 함수 결과 ===' as info;
-- 함수가 있으면 실행, 없으면 주석처리
SELECT * FROM public.get_current_user_site(auth.uid());

SELECT '=== get_user_site_history 함수 결과 ===' as info;
-- 함수가 있으면 실행, 없으면 주석처리
SELECT * FROM public.get_user_site_history(auth.uid());

-- ==========================================
-- 6. 통계
-- ==========================================
SELECT '=== 데이터 통계 ===' as info;
SELECT 
  (SELECT COUNT(*) FROM public.sites) as total_sites,
  (SELECT COUNT(*) FROM public.site_assignments) as total_assignments,
  (SELECT COUNT(*) FROM public.site_assignments WHERE is_active = true) as active_assignments,
  (SELECT COUNT(*) FROM public.site_assignments WHERE user_id = auth.uid()) as user_assignments,
  (SELECT COUNT(*) FROM public.site_assignments WHERE user_id = auth.uid() AND is_active = true) as user_active_assignments;