-- 🚀 QUICK FIX V2: ON CONFLICT 에러 해결된 버전
-- Supabase 대시보드 → SQL Editor에서 이 전체 내용을 복사해서 실행하세요

-- ==========================================
-- 1단계: 테이블 확장 (새 컬럼 추가)
-- ==========================================

-- sites 테이블에 상세 정보 컬럼 추가
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS work_process TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS work_section TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS component_name TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS safety_manager_name TEXT;

-- site_assignments 테이블에 역할 컬럼 추가
ALTER TABLE public.site_assignments ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'worker' 
  CHECK (role IN ('worker', 'site_manager', 'supervisor'));

-- ==========================================
-- 2단계: 필수 인덱스 생성
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_site_assignments_user_active 
  ON public.site_assignments(user_id, is_active) WHERE is_active = true;

-- ==========================================
-- 3단계: 필수 뷰 생성
-- ==========================================

CREATE OR REPLACE VIEW public.current_site_assignments AS
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
  s.manager_name,
  s.construction_manager_phone,
  s.safety_manager_name,
  s.safety_manager_phone,
  s.accommodation_name,
  s.accommodation_address,
  s.status as site_status,
  s.start_date,
  s.end_date
FROM public.site_assignments sa
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.is_active = true AND s.status = 'active';

-- ==========================================
-- 4단계: 필수 함수 생성
-- ==========================================

-- 현재 사용자 현장 조회 함수
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
    csa.manager_name,
    csa.construction_manager_phone,
    csa.safety_manager_name,
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

-- 사용자 현장 이력 조회 함수
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

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION public.get_current_user_site(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_site_history(UUID) TO authenticated;

-- ==========================================
-- 5단계: 테스트 현장 데이터 생성 (ON CONFLICT 에러 해결)
-- ==========================================

-- 강남 A현장이 이미 존재하는지 확인하고 없으면 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sites WHERE name = '강남 A현장') THEN
    INSERT INTO public.sites (
      name, address, description, status, start_date, end_date,
      construction_manager_phone, safety_manager_phone,
      accommodation_name, accommodation_address,
      work_process, work_section, component_name,
      manager_name, safety_manager_name
    ) VALUES (
      '강남 A현장', 
      '서울시 강남구 테헤란로 123', 
      '강남 지역 주상복합 건설 현장', 
      'active', 
      '2024-01-15', 
      '2024-12-30',
      '010-1234-5678',
      '010-8765-4321',
      '강남 A현장 숙소',
      '서울시 강남구 역삼동 456',
      '슬라브 타설',
      '지하 1층',
      '기둥 C1-C5 구간',
      '김건축',
      '이안전'
    );
  END IF;
END $$;

-- 서초 B현장이 이미 존재하는지 확인하고 없으면 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sites WHERE name = '서초 B현장') THEN
    INSERT INTO public.sites (
      name, address, description, status, start_date, end_date,
      construction_manager_phone, safety_manager_phone,
      accommodation_name, accommodation_address,
      work_process, work_section, component_name,
      manager_name, safety_manager_name
    ) VALUES (
      '서초 B현장', 
      '서울시 서초구 반포대로 200', 
      '서초 지역 오피스텔 건설 현장', 
      'active', 
      '2024-03-01', 
      '2024-11-30',
      '010-2345-6789',
      '010-9876-5432',
      '서초 B현장 숙소',
      '서울시 서초구 방배동 789',
      '철근 배근',
      '지상 3층',
      '보 B1-B10 구간',
      '박현장',
      '김안전'
    );
  END IF;
END $$;

-- ==========================================
-- 6단계: 현재 사용자에게 현장 배정 (ON CONFLICT 에러 해결)
-- ==========================================

-- 먼저 현재 사용자의 기존 활성 배정을 비활성화
UPDATE public.site_assignments 
SET is_active = false, unassigned_date = CURRENT_DATE
WHERE user_id = auth.uid() AND is_active = true;

-- 현재 사용자에게 강남 A현장 배정
INSERT INTO public.site_assignments (
  site_id, 
  user_id, 
  assigned_date, 
  is_active,
  role
) 
SELECT 
  s.id,
  auth.uid(),
  CURRENT_DATE,
  true,
  'worker'
FROM public.sites s 
WHERE s.name = '강남 A현장'
  AND auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.site_assignments sa 
    WHERE sa.site_id = s.id 
      AND sa.user_id = auth.uid() 
      AND sa.is_active = true
  );

-- 이전 현장 이력도 추가 (테스트용) - 중복 방지
INSERT INTO public.site_assignments (
  site_id, 
  user_id, 
  assigned_date,
  unassigned_date,
  is_active,
  role
) 
SELECT 
  s.id,
  auth.uid(),
  '2024-01-01'::DATE,
  '2024-02-28'::DATE,
  false,
  'worker'
FROM public.sites s 
WHERE s.name = '서초 B현장'
  AND auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.site_assignments sa 
    WHERE sa.site_id = s.id 
      AND sa.user_id = auth.uid() 
      AND sa.assigned_date = '2024-01-01'::DATE
  );

-- ==========================================
-- 7단계: 결과 확인
-- ==========================================

-- 현재 사용자의 현장 배정 확인
SELECT 
  '=== 현재 배정된 현장 ===' as info,
  s.name as site_name,
  s.address,
  s.work_process,
  s.work_section,
  s.component_name,
  s.manager_name,
  s.safety_manager_name,
  sa.role,
  sa.assigned_date
FROM public.sites s
JOIN public.site_assignments sa ON s.id = sa.site_id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;

-- 함수 테스트
SELECT '=== 함수 테스트 결과 ===' as info;
SELECT * FROM public.get_current_user_site(auth.uid());

-- 현장 목록 확인
SELECT '=== 생성된 현장 목록 ===' as info;
SELECT name, address, work_process, work_section, manager_name FROM public.sites;

-- 배정 내역 확인
SELECT '=== 사용자 배정 내역 ===' as info;
SELECT 
  sites.name as site_name,
  site_assignments.assigned_date,
  site_assignments.unassigned_date,
  site_assignments.is_active,
  site_assignments.role
FROM public.site_assignments
JOIN public.sites ON site_assignments.site_id = sites.id
WHERE site_assignments.user_id = auth.uid()
ORDER BY site_assignments.assigned_date DESC;

-- 완료 메시지
SELECT '🎉 V2 설정 완료! 이제 현장정보 페이지를 새로고침하세요!' as result;