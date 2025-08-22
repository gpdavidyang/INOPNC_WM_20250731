-- 800_fix_site_assignments_role_column.sql
-- site_assignments 테이블에 role 컬럼 추가 및 관련 수정

-- 1. site_assignments 테이블에 role 컬럼 추가
ALTER TABLE site_assignments 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'worker';

-- 2. 기존 데이터에 대해 사용자의 프로필 role을 기반으로 업데이트
UPDATE site_assignments sa
SET role = p.role
FROM profiles p
WHERE sa.user_id = p.id;

-- 3. site_assignments 테이블에 대한 RLS 정책 재생성
DROP POLICY IF EXISTS "Users can view their own site assignments" ON site_assignments;
DROP POLICY IF EXISTS "Admins can manage all site assignments" ON site_assignments;
DROP POLICY IF EXISTS "Site managers can view assignments for their sites" ON site_assignments;

-- 사용자가 자신의 site_assignments 조회 가능
CREATE POLICY "Users can view their own site assignments"
ON site_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 관리자는 모든 site_assignments 관리 가능
CREATE POLICY "Admins can manage all site assignments"
ON site_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'system_admin')
  )
);

-- 현장 관리자는 자신이 관리하는 현장의 assignments 조회 가능
CREATE POLICY "Site managers can view assignments for their sites"
ON site_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'site_manager'
  )
  AND
  site_id IN (
    SELECT site_id FROM site_assignments
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_site_assignments_role ON site_assignments(role);
CREATE INDEX IF NOT EXISTS idx_site_assignments_user_role ON site_assignments(user_id, role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_site_assignments_site_role ON site_assignments(site_id, role) WHERE is_active = true;

-- 5. 샘플 데이터 업데이트 (테스트 계정들)
UPDATE site_assignments sa
SET role = CASE 
  WHEN p.email = 'manager@inopnc.com' THEN 'site_manager'
  WHEN p.email = 'admin@inopnc.com' THEN 'admin'
  WHEN p.email = 'davidswyang@gmail.com' THEN 'system_admin'
  WHEN p.email = 'production@inopnc.com' THEN 'site_manager'
  WHEN p.email = 'customer@inopnc.com' THEN 'customer_manager'
  ELSE 'worker'
END
FROM profiles p
WHERE sa.user_id = p.id
AND p.email IN ('manager@inopnc.com', 'admin@inopnc.com', 'davidswyang@gmail.com', 'production@inopnc.com', 'customer@inopnc.com', 'worker@inopnc.com');

-- 6. 함수 생성 - 사용자의 현장별 역할 가져오기
CREATE OR REPLACE FUNCTION get_user_site_role(p_user_id UUID, p_site_id UUID)
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM site_assignments
    WHERE user_id = p_user_id
    AND site_id = p_site_id
    AND is_active = true
    ORDER BY assigned_date DESC
    LIMIT 1
  );
END;
$$;

-- 7. 뷰 생성 - 사용자와 현장 정보를 조인한 뷰
CREATE OR REPLACE VIEW user_site_details AS
SELECT 
  sa.id AS assignment_id,
  sa.user_id,
  p.full_name AS user_name,
  p.email AS user_email,
  p.phone AS user_phone,
  p.role AS user_global_role,
  sa.site_id,
  s.name AS site_name,
  s.address AS site_address,
  sa.role AS site_role,
  sa.assigned_date,
  sa.is_active,
  sa.created_at,
  sa.updated_at
FROM site_assignments sa
JOIN profiles p ON sa.user_id = p.id
JOIN sites s ON sa.site_id = s.id;

-- 뷰에 대한 권한 설정
GRANT SELECT ON user_site_details TO authenticated;

-- 8. 테이블 코멘트 추가
COMMENT ON COLUMN site_assignments.role IS '현장에서의 역할 (worker, site_manager 등)';
COMMENT ON TABLE site_assignments IS '사용자별 현장 배정 정보 관리 테이블';
COMMENT ON VIEW user_site_details IS '사용자-현장 배정 상세 정보 뷰';