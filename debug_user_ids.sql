-- Debug User ID Mismatch Issue
-- Run these queries in Supabase SQL Editor to verify the problem

-- 1. Check who you are in SQL Editor (this will be your admin account)
SELECT 
  'SQL Editor User' as context,
  auth.uid() as user_id,
  auth.email() as email;

-- 2. Check all users in auth.users to find the web app test user
SELECT 
  'All Auth Users' as context,
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- 3. Check all site assignments to see which user has assignments
SELECT 
  'All Site Assignments' as context,
  sa.id,
  sa.user_id,
  u.email,
  s.name as site_name,
  sa.is_active,
  sa.assigned_date
FROM site_assignments sa
LEFT JOIN auth.users u ON u.id = sa.user_id
LEFT JOIN sites s ON s.id = sa.site_id
ORDER BY sa.created_at DESC;

-- 4. Check if the SQL Editor user (admin) has any site assignments
SELECT 
  'SQL Editor User Assignments' as context,
  sa.*,
  s.name as site_name
FROM site_assignments sa
LEFT JOIN sites s ON s.id = sa.site_id
WHERE sa.user_id = auth.uid();

-- 5. Check which sites exist
SELECT 
  'All Sites' as context,
  id,
  name,
  created_at
FROM sites
ORDER BY created_at DESC;

-- 6. Test the database functions with your admin user ID
SELECT 
  'Admin User Site Function' as context,
  * 
FROM get_current_user_site(auth.uid());

-- 7. Find the test user (worker@inopnc.com) and check their assignments
SELECT 
  'Test User Check' as context,
  u.id as user_id,
  u.email,
  sa.id as assignment_id,
  s.name as site_name,
  sa.is_active
FROM auth.users u
LEFT JOIN site_assignments sa ON sa.user_id = u.id
LEFT JOIN sites s ON s.id = sa.site_id
WHERE u.email = 'worker@inopnc.com';