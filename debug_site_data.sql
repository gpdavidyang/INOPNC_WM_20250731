-- 현장관리자 계정 상태 및 사이트 할당 확인
-- 1. manager@inopnc.com과 production@inopnc.com 계정 확인
SELECT 
  'profiles' as table_name,
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE email IN ('manager@inopnc.com', 'production@inopnc.com')
ORDER BY email;

-- 2. 모든 사이트 데이터 확인
SELECT 
  'sites' as table_name,
  id,
  name,
  address,
  created_at
FROM sites
ORDER BY name;

-- 3. site_assignments/site_memberships 테이블 확인
-- (테이블명이 정확하지 않을 수 있으니 둘 다 시도)
SELECT 
  'site_assignments' as table_name,
  sa.id,
  sa.user_id,
  sa.site_id,
  sa.role,
  sa.is_active,
  p.email,
  s.name as site_name
FROM site_assignments sa
JOIN profiles p ON sa.user_id = p.id
JOIN sites s ON sa.site_id = s.id
WHERE p.email IN ('manager@inopnc.com', 'production@inopnc.com')
ORDER BY p.email;

-- 4. daily_reports 데이터 확인
SELECT 
  'daily_reports' as table_name,
  COUNT(*) as report_count,
  site_id,
  s.name as site_name
FROM daily_reports dr
JOIN sites s ON dr.site_id = s.id
GROUP BY site_id, s.name
ORDER BY s.name;

-- 5. 현재 RLS 정책 상태 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('sites', 'site_assignments', 'daily_reports', 'attendance_records')
ORDER BY tablename, policyname;