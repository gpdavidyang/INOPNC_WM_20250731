-- 🎯 수동 현장 배정 SQL
-- 현재 로그인한 사용자에게 강남 A현장을 직접 배정

-- ==========================================
-- 1. 현재 상황 확인
-- ==========================================
SELECT 
  '=== 배정 전 현재 상황 ===' as info,
  auth.uid() as current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email;

SELECT 
  '=== 사용 가능한 현장 목록 ===' as info;
SELECT id, name, address, status FROM public.sites WHERE status = 'active';

SELECT 
  '=== 현재 모든 배정 내역 ===' as info;
SELECT 
  sa.user_id,
  sa.site_id,
  sa.is_active,
  s.name as site_name
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
ORDER BY sa.assigned_date DESC;

-- ==========================================
-- 2. 기존 활성 배정 모두 비활성화 (안전조치)
-- ==========================================
UPDATE public.site_assignments 
SET 
  is_active = false, 
  unassigned_date = CURRENT_DATE
WHERE user_id = auth.uid() AND is_active = true;

-- ==========================================
-- 3. 강남 A현장에 현재 사용자 배정
-- ==========================================
INSERT INTO public.site_assignments (
  site_id,
  user_id,
  assigned_date,
  is_active,
  role
)
SELECT 
  s.id as site_id,
  auth.uid() as user_id,
  CURRENT_DATE as assigned_date,
  true as is_active,
  'worker' as role
FROM public.sites s
WHERE s.name = '강남 A현장'
  AND s.status = 'active'
  AND auth.uid() IS NOT NULL;

-- ==========================================
-- 4. 배정 결과 확인
-- ==========================================
SELECT 
  '=== 배정 완료 후 확인 ===' as info;

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
  s.work_section,
  s.component_name,
  s.manager_name,
  s.safety_manager_name
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;

-- ==========================================
-- 5. 데이터베이스 함수 재테스트
-- ==========================================
SELECT 
  '=== 함수 재테스트 - get_current_user_site ===' as info;

SELECT * FROM public.get_current_user_site(auth.uid());

SELECT 
  '=== 활성 배정 수 재확인 ===' as info,
  COUNT(*) as active_assignments
FROM public.site_assignments 
WHERE user_id = auth.uid() AND is_active = true;

-- 완료 메시지
SELECT '🎉 현장 배정 완료! 이제 웹사이트를 새로고침하세요!' as result;