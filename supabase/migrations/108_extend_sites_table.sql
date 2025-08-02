-- 현장 정보 테이블 확장
-- 홈 탭의 실제 현장 정보 표시를 위한 추가 컬럼들

-- sites 테이블에 상세 정보 컬럼 추가
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS work_process TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS work_section TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS component_name TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS safety_manager_name TEXT;

-- site_assignments 테이블에 역할 컬럼 추가
ALTER TABLE public.site_assignments ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'worker' 
  CHECK (role IN ('worker', 'site_manager', 'supervisor'));

-- 기존 컬럼에 대한 설명 추가 (주석)
COMMENT ON COLUMN public.sites.work_process IS '작업공정 (예: 슬라브 타설, 철근 배근 등)';
COMMENT ON COLUMN public.sites.work_section IS '작업구간 (예: 지하 1층, B동 3층 등)';
COMMENT ON COLUMN public.sites.component_name IS '부재명 (예: 기둥 C1-C5 구간)';
COMMENT ON COLUMN public.sites.manager_name IS '건축 담당자 이름';
COMMENT ON COLUMN public.sites.safety_manager_name IS '안전 담당자 이름';
COMMENT ON COLUMN public.site_assignments.role IS '현장에서의 역할 (worker: 작업자, site_manager: 현장관리자, supervisor: 감독관)';

-- 성능 최적화를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_site_assignments_user_active 
  ON public.site_assignments(user_id, is_active) WHERE is_active = true;

-- 현재 활성 배정만 조회하는 뷰 생성 (성능 최적화)
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

-- 뷰에 대한 RLS 정책 (뷰는 기본 테이블의 RLS를 상속받음)
-- 추가 보안을 위한 함수 생성
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

-- 샘플 데이터 추가 (개발/테스트용)
-- 기존 sites 테이블에 상세 정보 업데이트
UPDATE public.sites 
SET 
  work_process = CASE 
    WHEN name LIKE '%A현장%' THEN '슬라브 타설'
    WHEN name LIKE '%B현장%' THEN '철근 배근'
    WHEN name LIKE '%C현장%' THEN '거푸집 설치'
    ELSE '콘크리트 양생'
  END,
  work_section = CASE 
    WHEN name LIKE '%A현장%' THEN '지하 1층'
    WHEN name LIKE '%B현장%' THEN '지상 3층'
    WHEN name LIKE '%C현장%' THEN '지상 1층'
    ELSE '지하 2층'
  END,
  component_name = CASE 
    WHEN name LIKE '%A현장%' THEN '기둥 C1-C5 구간'
    WHEN name LIKE '%B현장%' THEN '보 B1-B10 구간'
    WHEN name LIKE '%C현장%' THEN '슬라브 S1 구역'
    ELSE '벽체 W1-W5 구간'
  END,
  manager_name = CASE 
    WHEN name LIKE '%A현장%' THEN '김건축'
    WHEN name LIKE '%B현장%' THEN '박현장'
    WHEN name LIKE '%C현장%' THEN '이관리'
    ELSE '최담당'
  END,
  safety_manager_name = CASE 
    WHEN name LIKE '%A현장%' THEN '이안전'
    WHEN name LIKE '%B현장%' THEN '김안전'
    WHEN name LIKE '%C현장%' THEN '박안전'
    ELSE '최안전'
  END
WHERE work_process IS NULL OR work_process = '';

-- 현장이 없는 경우를 위한 기본 현장 생성 (이미 없는 경우에만)
INSERT INTO public.sites (
  name, address, description, status, start_date, end_date,
  construction_manager_phone, safety_manager_phone,
  accommodation_name, accommodation_address,
  work_process, work_section, component_name,
  manager_name, safety_manager_name
)
SELECT 
  '강남 A현장', 
  '서울시 강남구 테헤란로 123', 
  '강남 지역 주상복합 건설 현장', 
  'active', 
  '2024-01-15'::DATE, 
  '2024-08-30'::DATE,
  '010-1234-5678',
  '010-8765-4321',
  '강남 A현장 숙소',
  '서울시 강남구 역삼동 456',
  '슬라브 타설',
  '지하 1층',
  '기둥 C1-C5 구간',
  '김건축',
  '이안전'
WHERE NOT EXISTS (SELECT 1 FROM public.sites WHERE name = '강남 A현장');