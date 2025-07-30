-- Demo users seed data for testing
-- All passwords are 'password123'

-- First, create demo organizations
INSERT INTO organizations (id, name, business_number, address, phone, status) VALUES
  ('org-1', '이노피앤씨', '123-45-67890', '서울특별시 강남구 테헤란로 123', '02-1234-5678', 'active'),
  ('org-2', '건설파트너사', '234-56-78901', '서울특별시 서초구 서초대로 456', '02-2345-6789', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create demo sites
INSERT INTO sites (id, organization_id, name, address, start_date, end_date, status) VALUES
  ('site-1', 'org-1', '강남 오피스빌딩 신축공사', '서울특별시 강남구 테헤란로 123', '2025-01-01', '2026-12-31', 'active'),
  ('site-2', 'org-1', '판교 물류센터 건설', '경기도 성남시 분당구 판교로 456', '2025-02-01', '2025-12-31', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create demo users with Supabase Auth
DO $$
DECLARE
  user_id1 uuid;
  user_id2 uuid;
  user_id3 uuid;
  user_id4 uuid;
  user_id5 uuid;
BEGIN
  -- Create worker user
  user_id1 := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (
    user_id1,
    '00000000-0000-0000-0000-000000000000',
    'worker@inopnc.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  INSERT INTO profiles (id, email, full_name, phone, role, organization_id, site_id, status)
  VALUES (user_id1, 'worker@inopnc.com', '김철수', '010-1234-5678', 'worker', 'org-1', 'site-1', 'active');

  -- Create site manager user
  user_id2 := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (
    user_id2,
    '00000000-0000-0000-0000-000000000000',
    'manager@inopnc.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  INSERT INTO profiles (id, email, full_name, phone, role, organization_id, site_id, status)
  VALUES (user_id2, 'manager@inopnc.com', '박현장', '010-2345-6789', 'site_manager', 'org-1', 'site-1', 'active');

  -- Create customer manager user
  user_id3 := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (
    user_id3,
    '00000000-0000-0000-0000-000000000000',
    'customer@partner.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  INSERT INTO profiles (id, email, full_name, phone, role, organization_id, status)
  VALUES (user_id3, 'customer@partner.com', '이파트너', '010-3456-7890', 'customer_manager', 'org-2', 'active');

  -- Create admin user
  user_id4 := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (
    user_id4,
    '00000000-0000-0000-0000-000000000000',
    'admin@inopnc.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  INSERT INTO profiles (id, email, full_name, phone, role, organization_id, status)
  VALUES (user_id4, 'admin@inopnc.com', '최관리', '010-4567-8901', 'admin', 'org-1', 'active');

  -- Create system admin user
  user_id5 := gen_random_uuid();
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (
    user_id5,
    '00000000-0000-0000-0000-000000000000',
    'system@inopnc.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  INSERT INTO profiles (id, email, full_name, phone, role, status)
  VALUES (user_id5, 'system@inopnc.com', '시스템관리자', '010-5678-9012', 'system_admin', 'active');
END $$;