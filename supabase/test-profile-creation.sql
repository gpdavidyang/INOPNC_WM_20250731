-- Test profile creation manually
-- This script helps verify that profile creation works correctly

-- 1. Check existing users and their profiles
SELECT 
  au.id, 
  au.email, 
  au.created_at,
  p.full_name,
  p.role,
  p.status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- 2. Check if the trigger exists
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgname = 'on_auth_user_created';

-- 3. Check if the function exists
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';