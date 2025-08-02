-- 🎯 간단한 현장 데이터 생성 SQL
-- manager_name, safety_manager_name 컬럼이 없으므로 제거하고 실행

-- 1. 현재 상태 확인
SELECT 
  '=== 현재 현장 수 ===' as info,
  COUNT(*) as total_sites
FROM public.sites;

-- 2. 테스트 현장 데이터 생성 (간단 버전)
INSERT INTO public.sites (
  id,
  name, 
  address, 
  description, 
  status, 
  start_date, 
  end_date,
  construction_manager_phone, 
  safety_manager_phone,
  accommodation_name, 
  accommodation_address,
  work_process, 
  work_section, 
  component_name,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '강남 A현장', 
  '서울시 강남구 테헤란로 123', 
  '강남 지역 주상복합 건설 현장', 
  'active', 
  '2024-01-15'::date, 
  '2024-12-30'::date,
  '010-1234-5678',
  '010-8765-4321',
  '강남 A현장 숙소',
  '서울시 강남구 역삼동 456',
  '슬라브 타설',
  '지하 1층',
  '기둥 C1-C5 구간',
  NOW(),
  NOW()
);

-- 3. 생성된 현장 확인
SELECT 
  '=== 생성된 현장 확인 ===' as info;

SELECT 
  id,
  name,
  address,
  work_process,
  work_section,
  component_name,
  status
FROM public.sites
WHERE name = '강남 A현장';

-- 4. 현재 사용자에게 현장 배정
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

-- 5. 배정 결과 확인
SELECT 
  '=== 현재 사용자 배정 확인 ===' as info;

SELECT 
  sa.id,
  sa.site_id,
  sa.user_id,
  sa.assigned_date,
  sa.is_active,
  sa.role,
  s.name as site_name,
  s.address as site_address
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;

-- 6. 함수 테스트
SELECT 
  '=== get_current_user_site 함수 테스트 ===' as info;

SELECT * FROM public.get_current_user_site(auth.uid());

-- 완료 메시지
SELECT '🎉 간단 설정 완료! 이제 현장정보 페이지를 새로고침하세요!' as result;