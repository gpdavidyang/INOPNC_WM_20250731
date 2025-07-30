-- Create demo profiles for manually created users
-- Replace the UUIDs with actual user IDs from the Authentication tab

-- Example: After creating users in Supabase Auth, run this with correct user IDs
/*
INSERT INTO profiles (id, email, full_name, phone, role, organization_id, site_id, status) VALUES
  ('USER_ID_HERE', 'worker@inopnc.com', '김철수', '010-1234-5678', 'worker', 'org-1', 'site-1', 'active'),
  ('USER_ID_HERE', 'manager@inopnc.com', '박현장', '010-2345-6789', 'site_manager', 'org-1', 'site-1', 'active'),
  ('USER_ID_HERE', 'customer@partner.com', '이파트너', '010-3456-7890', 'customer_manager', 'org-2', NULL, 'active'),
  ('USER_ID_HERE', 'admin@inopnc.com', '최관리', '010-4567-8901', 'admin', 'org-1', NULL, 'active'),
  ('USER_ID_HERE', 'system@inopnc.com', '시스템관리자', '010-5678-9012', 'system_admin', NULL, NULL, 'active')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id,
  site_id = EXCLUDED.site_id;
*/