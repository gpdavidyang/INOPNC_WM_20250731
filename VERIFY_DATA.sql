-- 🔍 데이터 검증 SQL
-- 모든 현장과 배정 데이터 확인

-- 1. 현재 사용자 정보
SELECT 
  '=== 현재 사용자 ===' as info,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- 2. 모든 현장 데이터 확인
SELECT 
  '=== 전체 현장 목록 ===' as info;

SELECT 
  id,
  name,
  address,
  status,
  work_process,
  work_section,
  created_at
FROM public.sites
ORDER BY created_at DESC;

-- 3. 모든 배정 데이터 확인
SELECT 
  '=== 전체 배정 목록 ===' as info;

SELECT 
  sa.id,
  sa.user_id,
  sa.site_id,
  sa.is_active,
  sa.assigned_date,
  s.name as site_name,
  u.email as user_email
FROM public.site_assignments sa
LEFT JOIN public.sites s ON sa.site_id = s.id
LEFT JOIN auth.users u ON sa.user_id = u.id
ORDER BY sa.created_at DESC;

-- 4. 현재 사용자의 배정 상태
SELECT 
  '=== 현재 사용자 배정 ===' as info;

SELECT 
  sa.*,
  s.name as site_name
FROM public.site_assignments sa
LEFT JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid();

-- 5. 테이블 구조 확인
SELECT 
  '=== sites 테이블 컬럼 ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sites'
ORDER BY ordinal_position;