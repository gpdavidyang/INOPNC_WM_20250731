-- 🎯 최종 해결: 현장정보 기능 완전 복구
-- Supabase 대시보드 → SQL Editor에서 실행

-- ==========================================
-- 1. 현재 상태 확인
-- ==========================================
SELECT 
  '=== 현재 사용자 ===' as info,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

SELECT 
  '=== 현재 현장 수 ===' as info,
  COUNT(*) as total_sites
FROM public.sites;

SELECT 
  '=== 현재 배정 수 ===' as info,
  COUNT(*) as total_assignments
FROM public.site_assignments;

-- ==========================================
-- 2. 기존 데이터 정리 (필요시)
-- ==========================================
-- 기존 배정 삭제 (안전 조치)
DELETE FROM public.site_assignments WHERE site_id IN (
  SELECT id FROM public.sites WHERE name IN ('강남 A현장', '서초 B현장')
);

-- 기존 테스트 현장 삭제 (중복 방지)
DELETE FROM public.sites WHERE name IN ('강남 A현장', '서초 B현장');

-- ==========================================
-- 3. 테스트 현장 데이터 생성
-- ==========================================
INSERT INTO public.sites (
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
  manager_name, 
  safety_manager_name,
  created_at,
  updated_at
) VALUES 
(
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
  '김건축',
  '이안전',
  NOW(),
  NOW()
),
(
  '서초 B현장', 
  '서울시 서초구 반포대로 200', 
  '서초 지역 오피스텔 건설 현장', 
  'active', 
  '2024-03-01'::date, 
  '2024-11-30'::date,
  '010-2345-6789',
  '010-9876-5432',
  '서초 B현장 숙소',
  '서울시 서초구 방배동 789',
  '철근 배근',
  '지상 3층',
  '보 B1-B10 구간',
  '박현장',
  '김안전',
  NOW(),
  NOW()
);

-- ==========================================
-- 4. 현재 사용자에게 현장 배정
-- ==========================================
-- 현재 사용자의 기존 모든 배정 비활성화
UPDATE public.site_assignments 
SET 
  is_active = false, 
  unassigned_date = CURRENT_DATE,
  updated_at = NOW()
WHERE user_id = auth.uid() AND is_active = true;

-- 현재 사용자를 강남 A현장에 배정
INSERT INTO public.site_assignments (
  site_id,
  user_id,
  assigned_date,
  is_active,
  role,
  created_at,
  updated_at
)
SELECT 
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
  AND auth.uid() IS NOT NULL;

-- 과거 배정 이력 추가 (테스트용)
INSERT INTO public.site_assignments (
  site_id,
  user_id,
  assigned_date,
  unassigned_date,
  is_active,
  role,
  created_at,
  updated_at
)
SELECT 
  s.id,
  auth.uid(),
  '2024-01-01'::date,
  '2024-02-28'::date,
  false,
  'worker',
  '2024-01-01'::timestamp,
  '2024-02-28'::timestamp
FROM public.sites s
WHERE s.name = '서초 B현장' 
  AND s.status = 'active'
  AND auth.uid() IS NOT NULL;

-- ==========================================
-- 5. 결과 확인
-- ==========================================
SELECT 
  '=== 생성된 현장 확인 ===' as info;

SELECT 
  id,
  name,
  address,
  work_process,
  work_section,
  component_name,
  manager_name,
  safety_manager_name,
  status
FROM public.sites
WHERE name IN ('강남 A현장', '서초 B현장')
ORDER BY name;

SELECT 
  '=== 사용자 배정 확인 ===' as info;

SELECT 
  sa.id,
  sa.site_id,
  sa.user_id,
  sa.assigned_date,
  sa.unassigned_date,
  sa.is_active,
  sa.role,
  s.name as site_name
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid()
ORDER BY sa.assigned_date DESC;

SELECT 
  '=== 활성 배정 확인 ===' as info;

SELECT 
  sa.id,
  s.name as site_name,
  s.address,
  s.work_process,
  s.work_section,
  s.manager_name,
  s.safety_manager_name,
  sa.role,
  sa.assigned_date
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;

-- ==========================================
-- 6. 데이터베이스 함수 테스트
-- ==========================================
SELECT 
  '=== get_current_user_site 함수 테스트 ===' as info;

SELECT * FROM public.get_current_user_site(auth.uid());

SELECT 
  '=== get_user_site_history 함수 테스트 ===' as info;

SELECT * FROM public.get_user_site_history(auth.uid());

-- ==========================================
-- 7. 통계 확인
-- ==========================================
SELECT 
  '=== 최종 통계 ===' as info,
  (SELECT COUNT(*) FROM public.sites WHERE status = 'active') as active_sites,
  (SELECT COUNT(*) FROM public.site_assignments WHERE is_active = true) as active_assignments,
  (SELECT COUNT(*) FROM public.site_assignments WHERE user_id = auth.uid() AND is_active = true) as user_active_assignments;

-- 완료 메시지
SELECT '🎉 최종 설정 완료! 현장정보 페이지를 새로고침하세요!' as result;