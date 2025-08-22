-- 801_fix_profiles_site_assignments_relationship.sql
-- profiles와 site_assignments 간의 외래 키 관계 수정

-- 1. 기존 외래 키 제약 조건 확인 및 재생성
-- 먼저 기존 외래 키 제약이 있는지 확인하고 없으면 생성
DO $$
BEGIN
  -- user_id에 대한 외래 키가 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_name = 'site_assignments'
    AND constraint_name LIKE '%user_id%fkey'
  ) THEN
    ALTER TABLE site_assignments
    ADD CONSTRAINT site_assignments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- site_id에 대한 외래 키가 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_name = 'site_assignments'
    AND constraint_name LIKE '%site_id%fkey'
  ) THEN
    ALTER TABLE site_assignments
    ADD CONSTRAINT site_assignments_site_id_fkey 
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. 인덱스 재생성 (성능 최적화)
DROP INDEX IF EXISTS idx_site_assignments_user_id;
DROP INDEX IF EXISTS idx_site_assignments_site_id;
DROP INDEX IF EXISTS idx_site_assignments_user_role;
DROP INDEX IF EXISTS idx_site_assignments_site_role;

CREATE INDEX idx_site_assignments_user_id ON site_assignments(user_id);
CREATE INDEX idx_site_assignments_site_id ON site_assignments(site_id);
CREATE INDEX idx_site_assignments_user_site ON site_assignments(user_id, site_id) WHERE is_active = true;
CREATE INDEX idx_site_assignments_role ON site_assignments(role) WHERE is_active = true;

-- 3. PostgREST가 관계를 인식하도록 스키마 캐시 새로고침을 위한 함수
CREATE OR REPLACE FUNCTION refresh_schema_cache()
RETURNS void
LANGUAGE sql
AS $$
  -- PostgREST 스키마 캐시를 새로고침하기 위한 더미 함수
  SELECT 1;
$$;

-- 4. 샘플 데이터 생성 (테스트용)
-- 기존 테스트 계정들에 대한 site_assignments 확인 및 생성
DO $$
DECLARE
  v_site_id UUID;
  v_user_id UUID;
BEGIN
  -- 첫 번째 활성 사이트 가져오기
  SELECT id INTO v_site_id FROM sites WHERE status = 'active' LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    -- davidswyang@gmail.com 계정에 대한 assignment 생성
    SELECT id INTO v_user_id FROM profiles WHERE email = 'davidswyang@gmail.com';
    IF v_user_id IS NOT NULL THEN
      INSERT INTO site_assignments (site_id, user_id, role, is_active)
      VALUES (v_site_id, v_user_id, 'system_admin', true)
      ON CONFLICT (site_id, user_id, assigned_date) DO UPDATE
      SET role = 'system_admin', is_active = true;
    END IF;
    
    -- admin@inopnc.com 계정에 대한 assignment 생성
    SELECT id INTO v_user_id FROM profiles WHERE email = 'admin@inopnc.com';
    IF v_user_id IS NOT NULL THEN
      INSERT INTO site_assignments (site_id, user_id, role, is_active)
      VALUES (v_site_id, v_user_id, 'admin', true)
      ON CONFLICT (site_id, user_id, assigned_date) DO UPDATE
      SET role = 'admin', is_active = true;
    END IF;
    
    -- manager@inopnc.com 계정에 대한 assignment 생성
    SELECT id INTO v_user_id FROM profiles WHERE email = 'manager@inopnc.com';
    IF v_user_id IS NOT NULL THEN
      INSERT INTO site_assignments (site_id, user_id, role, is_active)
      VALUES (v_site_id, v_user_id, 'site_manager', true)
      ON CONFLICT (site_id, user_id, assigned_date) DO UPDATE
      SET role = 'site_manager', is_active = true;
    END IF;
    
    -- worker@inopnc.com 계정에 대한 assignment 생성
    SELECT id INTO v_user_id FROM profiles WHERE email = 'worker@inopnc.com';
    IF v_user_id IS NOT NULL THEN
      INSERT INTO site_assignments (site_id, user_id, role, is_active)
      VALUES (v_site_id, v_user_id, 'worker', true)
      ON CONFLICT (site_id, user_id, assigned_date) DO UPDATE
      SET role = 'worker', is_active = true;
    END IF;
  END IF;
END $$;

-- 5. 통계 정보 업데이트
ANALYZE site_assignments;
ANALYZE profiles;
ANALYZE sites;

-- 6. 권한 확인 및 설정
GRANT SELECT ON site_assignments TO authenticated;
GRANT ALL ON site_assignments TO service_role;

-- 7. 스키마 캐시 새로고침 알림
NOTIFY pgrst, 'reload schema';