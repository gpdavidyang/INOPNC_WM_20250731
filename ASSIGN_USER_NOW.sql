-- 🎯 사용자 현장 배정 SQL
-- 현장은 있으니 사용자를 배정하기만 하면 됨

-- 1. 현재 상황 확인
SELECT '=== 현재 사용자 ===' as info;
SELECT auth.uid() as user_id, 
       (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

SELECT '=== 사용 가능한 현장 ===' as info;
SELECT id, name, address, status 
FROM public.sites 
WHERE status = 'active'
ORDER BY name;

-- 2. 강남 A현장에 현재 사용자 배정
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
  s.id,
  auth.uid(),
  CURRENT_DATE,
  true,
  'worker',
  NOW(),
  NOW()
FROM public.sites s
WHERE s.name = '강남 A현장' 
  AND s.status = 'active'
  AND auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.site_assignments sa 
    WHERE sa.site_id = s.id 
      AND sa.user_id = auth.uid() 
      AND sa.is_active = true
  );

-- 3. 배정 결과 확인
SELECT '=== 배정 완료 확인 ===' as info;
SELECT 
  sa.id,
  sa.site_id,
  sa.user_id,
  sa.assigned_date,
  sa.is_active,
  sa.role,
  s.name as site_name,
  s.address,
  s.work_process,
  s.work_section,
  s.component_name
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;

-- 4. 함수 테스트
SELECT '=== get_current_user_site 함수 테스트 ===' as info;
SELECT * FROM public.get_current_user_site(auth.uid());

-- 5. 최종 통계
SELECT '=== 최종 통계 ===' as info;
SELECT 
  (SELECT COUNT(*) FROM public.sites) as total_sites,
  (SELECT COUNT(*) FROM public.site_assignments WHERE is_active = true) as active_assignments,
  (SELECT COUNT(*) FROM public.site_assignments WHERE user_id = auth.uid() AND is_active = true) as user_active_assignments;

-- 완료 메시지
SELECT '🎉 배정 완료! 이제 현장정보가 표시됩니다!' as result;