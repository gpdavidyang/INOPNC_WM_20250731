-- Test site data creation
-- This file can be run in Supabase SQL editor to create test data

-- First, create the extended columns if they don't exist (run migration 108 first)
-- Then insert test site and assignment data

-- Insert a test site if it doesn't exist
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
) ON CONFLICT (name) DO NOTHING;

-- Get the site ID
-- You'll need to replace 'your-user-id' with actual user ID from auth.users
-- To find your user ID, run: SELECT id, email FROM auth.users;

-- Insert site assignment for current user (replace with actual user ID)
/*
INSERT INTO public.site_assignments (
  site_id, 
  user_id, 
  assigned_date, 
  is_active,
  role
) VALUES (
  (SELECT id FROM public.sites WHERE name = '강남 A현장' LIMIT 1),
  'your-user-id-here',
  '2024-08-01',
  true,
  'worker'
) ON CONFLICT (site_id, user_id, assigned_date) DO NOTHING;
*/

-- Check current user's site assignment
SELECT 
  s.name as site_name,
  s.address,
  s.work_process,
  s.work_section,
  s.component_name,
  s.manager_name,
  s.safety_manager_name,
  sa.role,
  sa.assigned_date,
  sa.is_active
FROM public.sites s
JOIN public.site_assignments sa ON s.id = sa.site_id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;