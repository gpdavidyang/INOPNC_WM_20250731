-- 🎯 올바른 사용자에게 현장 배정
-- 웹 앱에서 사용하는 테스트 계정에 배정

-- ==========================================
-- 1. 테스트 계정들에게 현장 배정
-- ==========================================

-- worker@inopnc.com 사용자에게 강남 A현장 배정
INSERT INTO public.site_assignments (
  id,
  site_id,
  user_id,
  assigned_date,
  is_active,
  role,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  s.id as site_id,
  u.id as user_id,
  CURRENT_DATE,
  true,
  'worker',
  NOW(),
  NOW()
FROM public.sites s
CROSS JOIN auth.users u
WHERE s.name = '강남 A현장' 
  AND u.email = 'worker@inopnc.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.site_assignments sa 
    WHERE sa.site_id = s.id 
      AND sa.user_id = u.id 
      AND sa.is_active = true
  );

-- manager@inopnc.com 사용자에게도 강남 A현장 배정
INSERT INTO public.site_assignments (
  id,
  site_id,
  user_id,
  assigned_date,
  is_active,
  role,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  s.id as site_id,
  u.id as user_id,
  CURRENT_DATE,
  true,
  'site_manager',
  NOW(),
  NOW()
FROM public.sites s
CROSS JOIN auth.users u
WHERE s.name = '강남 A현장' 
  AND u.email = 'manager@inopnc.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.site_assignments sa 
    WHERE sa.site_id = s.id 
      AND sa.user_id = u.id 
      AND sa.is_active = true
  );

-- admin@inopnc.com 사용자에게도 강남 A현장 배정
INSERT INTO public.site_assignments (
  id,
  site_id,
  user_id,
  assigned_date,
  is_active,
  role,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  s.id as site_id,
  u.id as user_id,
  CURRENT_DATE,
  true,
  'site_manager',
  NOW(),
  NOW()
FROM public.sites s
CROSS JOIN auth.users u
WHERE s.name = '강남 A현장' 
  AND u.email = 'admin@inopnc.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.site_assignments sa 
    WHERE sa.site_id = s.id 
      AND sa.user_id = u.id 
      AND sa.is_active = true
  );

-- ==========================================
-- 2. 배정 결과 확인
-- ==========================================
SELECT 
  '=== 배정 완료 확인 ===' as info;

SELECT 
  u.email,
  s.name as site_name,
  sa.role,
  sa.is_active,
  sa.assigned_date
FROM public.site_assignments sa
JOIN auth.users u ON sa.user_id = u.id
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.is_active = true
  AND u.email IN ('worker@inopnc.com', 'manager@inopnc.com', 'admin@inopnc.com')
ORDER BY u.email;

-- ==========================================
-- 3. 각 사용자별 함수 테스트
-- ==========================================
SELECT 
  '=== worker@inopnc.com 사용자 현장 확인 ===' as info;

SELECT * FROM public.get_current_user_site(
  (SELECT id FROM auth.users WHERE email = 'worker@inopnc.com')
);

SELECT 
  '=== manager@inopnc.com 사용자 현장 확인 ===' as info;

SELECT * FROM public.get_current_user_site(
  (SELECT id FROM auth.users WHERE email = 'manager@inopnc.com')
);

-- 완료 메시지
SELECT '🎉 테스트 계정들에 현장 배정 완료! 이제 웹 앱에서 확인하세요!' as result;