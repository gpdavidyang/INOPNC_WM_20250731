-- 802_fix_foreign_key_relationships.sql
-- profiles와 site_assignments 간의 외래 키 관계 수정 및 PostgREST 스키마 캐시 갱신

-- =====================================================
-- 1. 외래 키 제약 조건 재생성
-- =====================================================

-- 기존 외래 키 제약 조건 삭제 (있는 경우)
ALTER TABLE site_assignments 
DROP CONSTRAINT IF EXISTS site_assignments_user_id_fkey;

ALTER TABLE site_assignments 
DROP CONSTRAINT IF EXISTS site_assignments_site_id_fkey;

-- 외래 키 제약 조건 재생성 with proper naming
ALTER TABLE site_assignments
ADD CONSTRAINT site_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE site_assignments
ADD CONSTRAINT site_assignments_site_id_fkey 
FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;

-- =====================================================
-- 2. 인덱스 최적화
-- =====================================================

-- 기존 인덱스 정리
DROP INDEX IF EXISTS idx_site_assignments_user_id;
DROP INDEX IF EXISTS idx_site_assignments_site_id;
DROP INDEX IF EXISTS idx_site_assignments_role;
DROP INDEX IF EXISTS idx_site_assignments_user_role;
DROP INDEX IF EXISTS idx_site_assignments_site_role;
DROP INDEX IF EXISTS idx_site_assignments_user_site;

-- 최적화된 인덱스 재생성
CREATE INDEX idx_site_assignments_user_id ON site_assignments(user_id);
CREATE INDEX idx_site_assignments_site_id ON site_assignments(site_id);
CREATE INDEX idx_site_assignments_role ON site_assignments(role) WHERE is_active = true;
CREATE INDEX idx_site_assignments_user_site_active ON site_assignments(user_id, site_id) WHERE is_active = true;
CREATE INDEX idx_site_assignments_assigned_date ON site_assignments(assigned_date DESC);

-- =====================================================
-- 3. RLS 정책 재생성 (명확한 이름으로)
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own site assignments" ON site_assignments;
DROP POLICY IF EXISTS "Admins can manage all site assignments" ON site_assignments;
DROP POLICY IF EXISTS "Site managers can view assignments for their sites" ON site_assignments;

-- 새로운 정책 생성
CREATE POLICY "site_assignments_select_own"
ON site_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "site_assignments_select_admin"
ON site_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'system_admin')
  )
);

CREATE POLICY "site_assignments_insert_admin"
ON site_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'system_admin')
  )
);

CREATE POLICY "site_assignments_update_admin"
ON site_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'system_admin')
  )
);

CREATE POLICY "site_assignments_delete_admin"
ON site_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'system_admin')
  )
);

-- =====================================================
-- 4. 필수 데이터 확인 및 생성
-- =====================================================

-- role 컬럼이 없는 경우 추가
ALTER TABLE site_assignments 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'worker';

-- 기존 데이터의 role 업데이트 (null인 경우)
UPDATE site_assignments sa
SET role = COALESCE(sa.role, p.role, 'worker')
FROM profiles p
WHERE sa.user_id = p.id
AND sa.role IS NULL;

-- =====================================================
-- 5. 뷰 생성 (PostgREST가 관계를 인식하도록)
-- =====================================================

-- 기존 뷰 삭제
DROP VIEW IF EXISTS user_site_assignments;

-- 사용자-현장 배정 정보 뷰
CREATE VIEW user_site_assignments AS
SELECT 
  sa.id AS assignment_id,
  sa.user_id,
  p.id AS profile_id,
  p.full_name,
  p.email,
  p.phone,
  p.role AS global_role,
  sa.site_id,
  s.name AS site_name,
  s.address AS site_address,
  s.status AS site_status,
  sa.role AS site_role,
  sa.assigned_date,
  sa.unassigned_date,
  sa.is_active,
  sa.created_at,
  sa.updated_at
FROM site_assignments sa
JOIN profiles p ON sa.user_id = p.id
JOIN sites s ON sa.site_id = s.id;

-- 뷰에 대한 권한 설정
GRANT SELECT ON user_site_assignments TO authenticated;

-- =====================================================
-- 6. 함수 생성 (관계 쿼리 지원)
-- =====================================================

-- 사용자의 현장 목록 가져오기
CREATE OR REPLACE FUNCTION get_user_sites(p_user_id UUID)
RETURNS TABLE (
  site_id UUID,
  site_name VARCHAR,
  site_address TEXT,
  role VARCHAR,
  assigned_date DATE,
  is_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    sa.site_id,
    s.name AS site_name,
    s.address AS site_address,
    sa.role,
    sa.assigned_date,
    sa.is_active
  FROM site_assignments sa
  JOIN sites s ON sa.site_id = s.id
  WHERE sa.user_id = p_user_id
  ORDER BY sa.is_active DESC, sa.assigned_date DESC;
$$;

-- 현장의 사용자 목록 가져오기
CREATE OR REPLACE FUNCTION get_site_users(p_site_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  role VARCHAR,
  assigned_date DATE,
  is_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    sa.user_id,
    p.full_name,
    p.email,
    p.phone,
    sa.role,
    sa.assigned_date,
    sa.is_active
  FROM site_assignments sa
  JOIN profiles p ON sa.user_id = p.id
  WHERE sa.site_id = p_site_id
  ORDER BY sa.is_active DESC, sa.role, p.full_name;
$$;

-- =====================================================
-- 7. 테스트 데이터 생성
-- =====================================================

-- 테스트 계정들에 대한 site_assignments 확인 및 생성
DO $$
DECLARE
  v_site_id UUID;
  v_user_id UUID;
BEGIN
  -- 첫 번째 활성 사이트 가져오기
  SELECT id INTO v_site_id 
  FROM sites 
  WHERE status = 'active' 
  LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    -- 각 테스트 계정에 대해 assignment 생성
    FOR v_user_id IN 
      SELECT id FROM profiles 
      WHERE email IN (
        'davidswyang@gmail.com',
        'admin@inopnc.com',
        'manager@inopnc.com',
        'worker@inopnc.com',
        'customer@inopnc.com'
      )
    LOOP
      -- 이미 존재하지 않으면 생성
      INSERT INTO site_assignments (site_id, user_id, role, is_active)
      SELECT 
        v_site_id,
        v_user_id,
        CASE 
          WHEN p.email = 'davidswyang@gmail.com' THEN 'system_admin'
          WHEN p.email = 'admin@inopnc.com' THEN 'admin'
          WHEN p.email = 'manager@inopnc.com' THEN 'site_manager'
          WHEN p.email = 'customer@inopnc.com' THEN 'customer_manager'
          ELSE 'worker'
        END,
        true
      FROM profiles p
      WHERE p.id = v_user_id
      ON CONFLICT (site_id, user_id, assigned_date) 
      DO UPDATE SET 
        role = EXCLUDED.role,
        is_active = true;
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 8. 통계 업데이트 및 캐시 갱신
-- =====================================================

-- 테이블 통계 업데이트
ANALYZE site_assignments;
ANALYZE profiles;
ANALYZE sites;

-- PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- 9. 검증 쿼리
-- =====================================================

-- 관계가 올바르게 설정되었는지 확인
DO $$
BEGIN
  RAISE NOTICE 'Site assignments count: %', (SELECT COUNT(*) FROM site_assignments);
  RAISE NOTICE 'Active assignments: %', (SELECT COUNT(*) FROM site_assignments WHERE is_active = true);
  RAISE NOTICE 'Users with assignments: %', (SELECT COUNT(DISTINCT user_id) FROM site_assignments);
  RAISE NOTICE 'Sites with users: %', (SELECT COUNT(DISTINCT site_id) FROM site_assignments);
END $$;