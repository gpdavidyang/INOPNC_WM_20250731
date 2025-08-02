-- Fix User Assignment Issue
-- This assigns the web app test user to the site instead of the admin user

-- Step 1: Find the test user ID (worker@inopnc.com)
-- Copy this user_id for use in the next step
SELECT 
  'Find Test User' as context,
  id as test_user_id,
  email
FROM auth.users 
WHERE email = 'worker@inopnc.com';

-- Step 2: Find the site ID for 강남 A현장
SELECT 
  'Find Site' as context,
  id as site_id,
  name
FROM sites 
WHERE name = '강남 A현장';

-- Step 3: Clear any existing assignments for the test user
-- Replace 'TEST_USER_ID_HERE' with the actual user ID from Step 1
/*
UPDATE site_assignments 
SET is_active = false, 
    unassigned_date = CURRENT_DATE 
WHERE user_id = 'TEST_USER_ID_HERE' 
  AND is_active = true;
*/

-- Step 4: Assign the test user to 강남 A현장
-- Replace both IDs with the actual values from Steps 1 and 2
/*
INSERT INTO site_assignments (
  user_id,
  site_id,
  assigned_date,
  is_active,
  role
) VALUES (
  'TEST_USER_ID_HERE',  -- Replace with test user ID
  'SITE_ID_HERE',       -- Replace with site ID
  CURRENT_DATE,
  true,
  'worker'
);
*/

-- Step 5: Verify the assignment
-- Replace 'TEST_USER_ID_HERE' with the actual user ID
/*
SELECT 
  'Verify Assignment' as context,
  sa.id,
  u.email,
  s.name as site_name,
  sa.is_active,
  sa.assigned_date
FROM site_assignments sa
JOIN auth.users u ON u.id = sa.user_id
JOIN sites s ON s.id = sa.site_id
WHERE sa.user_id = 'TEST_USER_ID_HERE'
  AND sa.is_active = true;
*/

-- Step 6: Test the function with the test user ID
-- Replace 'TEST_USER_ID_HERE' with the actual user ID
/*
SELECT 
  'Test Function' as context,
  *
FROM get_current_user_site('TEST_USER_ID_HERE');
*/