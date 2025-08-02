-- 🔍 데이터베이스 상태 확인 SQL
-- Supabase 대시보드 → SQL Editor에서 실행하여 데이터 상태 확인

-- ==========================================
-- 1. 현재 사용자 확인
-- ==========================================
SELECT 
  '=== 현재 로그인 사용자 ===' as info,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- ==========================================
-- 2. 현장 데이터 확인
-- ==========================================
SELECT 
  '=== 생성된 현장 목록 ===' as info;
  
SELECT 
  id,
  name,
  address,
  work_process,
  work_section,
  component_name,
  manager_name,
  safety_manager_name,
  status,
  start_date,
  end_date,
  created_at
FROM public.sites
ORDER BY created_at DESC;

-- ==========================================
-- 3. 사용자 배정 데이터 확인
-- ==========================================
SELECT 
  '=== 현재 사용자의 현장 배정 내역 ===' as info;

SELECT 
  sa.id,
  sa.site_id,
  sa.user_id,
  sa.assigned_date,
  sa.unassigned_date,
  sa.is_active,
  sa.role,
  s.name as site_name,
  s.address as site_address
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid()
ORDER BY sa.assigned_date DESC;

-- ==========================================
-- 4. 활성 배정만 확인
-- ==========================================
SELECT 
  '=== 현재 활성 배정 ===' as info;

SELECT 
  sa.id,
  sa.site_id,
  sa.user_id,
  sa.assigned_date,
  sa.is_active,
  sa.role,
  s.name as site_name,
  s.address as site_address,
  s.work_process,
  s.work_section
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;

-- ==========================================
-- 5. 데이터베이스 함수 테스트
-- ==========================================
SELECT 
  '=== get_current_user_site 함수 테스트 ===' as info;

SELECT * FROM public.get_current_user_site(auth.uid());

SELECT 
  '=== get_user_site_history 함수 테스트 ===' as info;

SELECT * FROM public.get_user_site_history(auth.uid());

-- ==========================================
-- 6. 뷰 테스트
-- ==========================================
SELECT 
  '=== current_site_assignments 뷰 테스트 ===' as info;

SELECT * FROM public.current_site_assignments 
WHERE user_id = auth.uid();

-- ==========================================
-- 7. RLS 정책 확인
-- ==========================================
SELECT 
  '=== RLS 정책 상태 확인 ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('sites', 'site_assignments')
ORDER BY tablename;

-- ==========================================
-- 8. 함수 존재 여부 확인
-- ==========================================
SELECT 
  '=== 함수 존재 여부 확인 ===' as info;

SELECT 
  proname as function_name,
  prosrc IS NOT NULL as has_source
FROM pg_proc 
WHERE proname IN ('get_current_user_site', 'get_user_site_history');