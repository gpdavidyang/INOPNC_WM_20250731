-- 803_unify_admin_roles.sql
-- system_admin 역할을 admin으로 통합

-- =====================================================
-- 1. profiles 테이블의 system_admin을 admin으로 변경
-- =====================================================

UPDATE profiles 
SET role = 'admin'
WHERE role = 'system_admin';

-- davidswyang@gmail.com 계정도 admin으로 변경
UPDATE profiles 
SET role = 'admin'
WHERE email = 'davidswyang@gmail.com';

-- =====================================================
-- 2. site_assignments 테이블도 동일하게 변경
-- =====================================================

UPDATE site_assignments 
SET role = 'admin'
WHERE role = 'system_admin';

-- =====================================================
-- 3. RLS 정책 업데이트 (system_admin 제거, admin만 사용)
-- =====================================================

-- profiles 테이블 정책 재생성
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- sites 테이블 정책
DROP POLICY IF EXISTS "Admins can manage all sites" ON sites;
CREATE POLICY "Admins can manage all sites"
ON sites FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- daily_reports 테이블 정책
DROP POLICY IF EXISTS "Admins can view all reports" ON daily_reports;
CREATE POLICY "Admins can view all reports"
ON daily_reports FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- documents 테이블 정책
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
CREATE POLICY "Admins can manage all documents"
ON documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- =====================================================
-- 4. 체크 제약 조건 업데이트
-- =====================================================

-- profiles 테이블의 role 체크 제약 조건 재생성
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('worker', 'site_manager', 'customer_manager', 'admin'));

-- site_assignments 테이블의 role 체크 제약 조건
ALTER TABLE site_assignments 
DROP CONSTRAINT IF EXISTS site_assignments_role_check;

ALTER TABLE site_assignments 
ADD CONSTRAINT site_assignments_role_check 
CHECK (role IN ('worker', 'site_manager', 'customer_manager', 'admin'));

-- =====================================================
-- 5. 함수 업데이트
-- =====================================================

-- create_profile_for_user 함수 업데이트
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    CASE 
      -- davidswyang@gmail.com은 admin
      WHEN NEW.email = 'davidswyang@gmail.com' THEN 'admin'
      -- 기본 역할 설정
      WHEN NEW.email LIKE '%@inopnc.com' THEN 
        CASE 
          WHEN NEW.email = 'admin@inopnc.com' THEN 'admin'
          WHEN NEW.email = 'manager@inopnc.com' THEN 'site_manager'
          WHEN NEW.email = 'customer@inopnc.com' THEN 'customer_manager'
          ELSE 'worker'
        END
      WHEN NEW.email LIKE '%@partner.com' THEN 'customer_manager'
      ELSE 'worker'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. 뷰 업데이트
-- =====================================================

-- user_site_assignments 뷰 재생성
CREATE OR REPLACE VIEW user_site_assignments AS
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
JOIN sites s ON sa.site_id = s.id
WHERE p.role IN ('worker', 'site_manager', 'customer_manager', 'admin');

-- =====================================================
-- 7. 데이터 검증
-- =====================================================

DO $$
DECLARE
  v_admin_count INTEGER;
  v_system_admin_count INTEGER;
BEGIN
  -- admin 계정 수 확인
  SELECT COUNT(*) INTO v_admin_count 
  FROM profiles 
  WHERE role = 'admin';
  
  -- system_admin 계정 수 확인 (0이어야 함)
  SELECT COUNT(*) INTO v_system_admin_count 
  FROM profiles 
  WHERE role = 'system_admin';
  
  RAISE NOTICE 'Admin accounts: %', v_admin_count;
  RAISE NOTICE 'System_admin accounts (should be 0): %', v_system_admin_count;
  
  -- davidswyang@gmail.com 계정 확인
  PERFORM 1 FROM profiles 
  WHERE email = 'davidswyang@gmail.com' 
  AND role = 'admin';
  
  IF FOUND THEN
    RAISE NOTICE '✅ davidswyang@gmail.com is now admin';
  ELSE
    RAISE WARNING '⚠️ davidswyang@gmail.com role update may have failed';
  END IF;
END $$;

-- =====================================================
-- 8. 통계 업데이트
-- =====================================================

ANALYZE profiles;
ANALYZE site_assignments;