-- =====================================================
-- Comprehensive Authentication System Fix
-- This migration fixes all authentication-related issues
-- =====================================================

-- 1. First, let's add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);

-- 2. Create organizations if they don't exist
INSERT INTO public.organizations (id, name, type, description, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'INOPNC', 'head_office', 'INOPNC Head Office', true),
  ('22222222-2222-2222-2222-222222222222', 'Customer Corp', 'branch_office', 'Customer Organization', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create sites if they don't exist
INSERT INTO public.sites (id, name, address, start_date, status, organization_id)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Site 1', 'Seoul, South Korea', '2025-01-01', 'active', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 4. Fix handle_new_user function to properly set up profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  site_id_var UUID;
  user_role TEXT;
BEGIN
  -- Extract role from metadata or set default
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'worker');
  
  -- Determine organization based on email domain
  IF new.email LIKE '%@inopnc.com' THEN
    org_id := '11111111-1111-1111-1111-111111111111'; -- INOPNC
  ELSIF new.email LIKE '%@customer.com' THEN
    org_id := '22222222-2222-2222-2222-222222222222'; -- Customer
  ELSE
    -- For other emails, assign to INOPNC by default
    org_id := '11111111-1111-1111-1111-111111111111';
  END IF;
  
  -- Determine site assignment based on role
  IF user_role IN ('worker', 'site_manager') AND org_id = '11111111-1111-1111-1111-111111111111' THEN
    site_id_var := '33333333-3333-3333-3333-333333333333'; -- Site 1
  ELSE
    site_id_var := NULL;
  END IF;
  
  -- Handle special case for davidswyang@gmail.com
  IF new.email = 'davidswyang@gmail.com' THEN
    user_role := 'system_admin';
  END IF;
  
  -- Insert or update profile
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    role, 
    organization_id, 
    site_id, 
    status,
    created_at,
    updated_at
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    user_role,
    org_id,
    site_id_var,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = COALESCE(EXCLUDED.role, profiles.role),
    organization_id = COALESCE(EXCLUDED.organization_id, profiles.organization_id),
    site_id = COALESCE(EXCLUDED.site_id, profiles.site_id),
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update existing user profiles with proper data
UPDATE public.profiles SET
  role = CASE 
    WHEN email = 'admin@inopnc.com' THEN 'admin'
    WHEN email = 'manager@inopnc.com' THEN 'site_manager'
    WHEN email = 'worker@inopnc.com' THEN 'worker'
    WHEN email = 'customer@inopnc.com' THEN 'customer_manager'
    WHEN email = 'davidswyang@gmail.com' THEN 'system_admin'
    ELSE role
  END,
  organization_id = CASE 
    WHEN email IN ('admin@inopnc.com', 'manager@inopnc.com', 'worker@inopnc.com', 'davidswyang@gmail.com') 
      THEN '11111111-1111-1111-1111-111111111111'
    WHEN email = 'customer@inopnc.com' 
      THEN '22222222-2222-2222-2222-222222222222'
    ELSE organization_id
  END,
  site_id = CASE 
    WHEN email IN ('manager@inopnc.com', 'worker@inopnc.com') 
      THEN '33333333-3333-3333-3333-333333333333'
    ELSE site_id
  END,
  status = 'active',
  updated_at = NOW()
WHERE email IN ('admin@inopnc.com', 'manager@inopnc.com', 'worker@inopnc.com', 'customer@inopnc.com', 'davidswyang@gmail.com');

-- 6. Create user_organizations entries for existing users
INSERT INTO public.user_organizations (user_id, organization_id, is_primary)
SELECT 
  p.id,
  p.organization_id,
  true
FROM public.profiles p
WHERE p.organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  is_primary = true;

-- 7. Create site_assignments for users with site access
INSERT INTO public.site_assignments (site_id, user_id, assigned_date, is_active)
SELECT 
  p.site_id,
  p.id,
  CURRENT_DATE,
  true
FROM public.profiles p
WHERE p.site_id IS NOT NULL
ON CONFLICT (site_id, user_id, assigned_date) DO UPDATE SET
  is_active = true;

-- 8. Drop existing RLS policies to recreate them properly
DO $$ 
BEGIN
  -- Drop all existing policies on profiles table
  DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
  
  -- Drop all existing policies on organizations table
  DROP POLICY IF EXISTS "Organizations viewable by members" ON public.organizations;
  DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
  
  -- Drop all existing policies on sites table
  DROP POLICY IF EXISTS "Sites are viewable by authenticated users" ON public.sites;
  DROP POLICY IF EXISTS "Only admins can manage sites" ON public.sites;
  DROP POLICY IF EXISTS "Sites viewable by assigned users" ON public.sites;
END $$;

-- 9. Create comprehensive RLS policies

-- Profiles table policies
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Organizations table policies
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      UNION
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "System admins can manage organizations" ON public.organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role = 'system_admin'
    )
  );

-- Sites table policies
CREATE POLICY "Users can view assigned sites" ON public.sites
  FOR SELECT USING (
    id IN (
      SELECT site_id FROM public.profiles WHERE id = auth.uid()
      UNION
      SELECT site_id FROM public.site_assignments WHERE user_id = auth.uid() AND is_active = true
    )
    OR organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin', 'customer_manager')
    )
  );

CREATE POLICY "Admins can manage sites" ON public.sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Daily Reports policies (update existing)
DROP POLICY IF EXISTS "Daily reports viewable by site members" ON public.daily_reports;
CREATE POLICY "Users can view reports based on role" ON public.daily_reports
  FOR SELECT USING (
    -- System admin and admin can see all
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
    OR
    -- Site managers can see reports from their sites
    (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND role = 'site_manager'
      )
      AND site_id IN (
        SELECT site_id FROM public.profiles WHERE id = auth.uid()
        UNION
        SELECT site_id FROM public.site_assignments WHERE user_id = auth.uid() AND is_active = true
      )
    )
    OR
    -- Workers can see their own reports
    (
      created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND role = 'worker'
      )
    )
    OR
    -- Customer managers can see reports from their organization's sites
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'customer_manager'
      )
      AND site_id IN (
        SELECT s.id FROM public.sites s
        WHERE s.organization_id IN (
          SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Work logs policies
DROP POLICY IF EXISTS "Users can view their site data" ON public.work_logs;
CREATE POLICY "Users can view work logs based on role" ON public.work_logs
  FOR SELECT USING (
    daily_report_id IN (
      SELECT id FROM public.daily_reports
      WHERE (
        -- Admins see all
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() 
          AND role IN ('admin', 'system_admin')
        )
        OR
        -- Site managers see their site's logs
        (
          site_id IN (
            SELECT site_id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT site_id FROM public.site_assignments WHERE user_id = auth.uid() AND is_active = true
          )
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'site_manager'
          )
        )
        OR
        -- Workers see logs they created
        (
          created_by = auth.uid()
        )
        OR
        -- Customer managers see their organization's logs
        (
          site_id IN (
            SELECT s.id FROM public.sites s
            WHERE s.organization_id IN (
              SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
          )
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role = 'customer_manager'
          )
        )
      )
    )
  );

-- Attendance records policies (update existing)
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance_records;
CREATE POLICY "Users can view attendance based on role" ON public.attendance_records
  FOR SELECT USING (
    -- Users can see their own attendance
    worker_id = auth.uid()
    OR
    -- Managers can see attendance for their sites
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('site_manager', 'admin', 'system_admin')
      AND (
        p.role IN ('admin', 'system_admin')
        OR
        daily_report_id IN (
          SELECT dr.id FROM public.daily_reports dr
          WHERE dr.site_id IN (
            SELECT site_id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT site_id FROM public.site_assignments WHERE user_id = auth.uid() AND is_active = true
          )
        )
      )
    )
  );

-- 10. Create helper functions for role checking
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_can_access_site(user_id UUID, check_site_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id
    AND (
      -- System admin and admin can access all sites
      p.role IN ('system_admin', 'admin')
      OR
      -- Direct site assignment
      p.site_id = check_site_id
      OR
      -- Site assignment through site_assignments table
      EXISTS (
        SELECT 1 FROM public.site_assignments sa
        WHERE sa.user_id = user_id
        AND sa.site_id = check_site_id
        AND sa.is_active = true
      )
      OR
      -- Customer manager can access organization's sites
      (
        p.role = 'customer_manager'
        AND EXISTS (
          SELECT 1 FROM public.sites s
          WHERE s.id = check_site_id
          AND s.organization_id = p.organization_id
        )
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create a function to get complete user profile with joins
CREATE OR REPLACE FUNCTION public.get_user_profile_complete(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  status TEXT,
  avatar_url TEXT,
  organization_id UUID,
  organization_name TEXT,
  site_id UUID,
  site_name TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.role,
    p.status,
    p.avatar_url,
    p.organization_id,
    o.name as organization_name,
    p.site_id,
    s.name as site_name,
    p.last_login_at,
    p.login_count
  FROM public.profiles p
  LEFT JOIN public.organizations o ON p.organization_id = o.id
  LEFT JOIN public.sites s ON p.site_id = s.id
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_site TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_complete TO authenticated;

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_site_id ON public.profiles(site_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_site_assignments_user_id ON public.site_assignments(user_id) WHERE is_active = true;

-- 14. Add audit logging for authentication events
CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'login_failed', 'password_changed', 'profile_updated')),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_user_id ON public.auth_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_auth_audit_event_type ON public.auth_audit_logs(event_type, created_at DESC);

-- Enable RLS on auth_audit_logs
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs, admins can see all
CREATE POLICY "Users can view own audit logs" ON public.auth_audit_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Authentication system fix completed successfully.';
END $$;