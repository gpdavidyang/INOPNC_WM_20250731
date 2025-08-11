-- Fix missing database columns that are causing login failures
-- This migration ensures all tables have the required columns for authentication to work

-- =====================================================
-- 1. Check and fix profiles table structure
-- =====================================================

DO $$
BEGIN
    -- Add organization_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN organization_id UUID;
        RAISE NOTICE 'Added organization_id column to profiles table';
    END IF;

    -- Add site_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'site_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN site_id UUID;
        RAISE NOTICE 'Added site_id column to profiles table';
    END IF;

    -- Add login_count if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'login_count'
    ) THEN
        ALTER TABLE profiles ADD COLUMN login_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added login_count column to profiles table';
    END IF;

    -- Add last_login_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login_at column to profiles table';
    END IF;

    -- Add notification_preferences if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'notification_preferences'
    ) THEN
        ALTER TABLE profiles ADD COLUMN notification_preferences JSONB;
        RAISE NOTICE 'Added notification_preferences column to profiles table';
    END IF;
END $$;

-- =====================================================
-- 2. Check and fix sites table structure
-- =====================================================

DO $$
BEGIN
    -- Add organization_id to sites if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sites' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE sites ADD COLUMN organization_id UUID;
        RAISE NOTICE 'Added organization_id column to sites table';
    END IF;
END $$;

-- =====================================================
-- 3. Create default organizations if they don't exist
-- =====================================================

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'head_office' CHECK (type IN ('head_office', 'branch_office', 'department')),
    parent_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    description TEXT,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default organizations
INSERT INTO organizations (id, name, type, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'INOPNC', 'head_office', 'INOPNC Head Office'),
  ('22222222-2222-2222-2222-222222222222', 'Customer Corp', 'branch_office', 'Customer Organization')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- =====================================================
-- 4. Update sites table with organization_id if missing
-- =====================================================

-- Add organization_id to existing sites if they don't have one
UPDATE sites 
SET organization_id = '11111111-1111-1111-1111-111111111111' 
WHERE organization_id IS NULL;

-- Create default site if it doesn't exist
INSERT INTO sites (id, name, address, organization_id, start_date, status) VALUES
  ('33333333-3333-3333-3333-333333333333', '강남 A현장', 'Seoul, South Korea', '11111111-1111-1111-1111-111111111111', '2025-01-01', 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  organization_id = EXCLUDED.organization_id;

-- =====================================================
-- 5. Add foreign key constraints if they don't exist
-- =====================================================

DO $$
BEGIN
    -- Add foreign key for profiles.organization_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_organization_id_fkey'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id);
        RAISE NOTICE 'Added foreign key constraint for profiles.organization_id';
    END IF;

    -- Add foreign key for profiles.site_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_site_id_fkey'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_site_id_fkey 
        FOREIGN KEY (site_id) REFERENCES sites(id);
        RAISE NOTICE 'Added foreign key constraint for profiles.site_id';
    END IF;

    -- Add foreign key for sites.organization_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sites_organization_id_fkey'
    ) THEN
        ALTER TABLE sites 
        ADD CONSTRAINT sites_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id);
        RAISE NOTICE 'Added foreign key constraint for sites.organization_id';
    END IF;
END $$;

-- =====================================================
-- 6. Update existing profiles with proper organization and site
-- =====================================================

-- Update existing profiles to have proper organization and site assignments
UPDATE profiles SET
  role = CASE 
    WHEN email = 'admin@inopnc.com' THEN 'admin'
    WHEN email = 'manager@inopnc.com' THEN 'site_manager'
    WHEN email = 'production@inopnc.com' THEN 'site_manager'
    WHEN email = 'worker@inopnc.com' THEN 'worker'
    WHEN email = 'customer@inopnc.com' THEN 'customer_manager'
    WHEN email = 'customer@partner.com' THEN 'customer_manager'
    WHEN email = 'system@inopnc.com' THEN 'system_admin'
    WHEN email = 'davidswyang@gmail.com' THEN 'system_admin'
    ELSE COALESCE(role, 'worker')
  END,
  organization_id = CASE 
    WHEN email IN ('admin@inopnc.com', 'manager@inopnc.com', 'production@inopnc.com', 'worker@inopnc.com', 'system@inopnc.com', 'davidswyang@gmail.com') 
      THEN '11111111-1111-1111-1111-111111111111'
    WHEN email IN ('customer@inopnc.com', 'customer@partner.com') 
      THEN '22222222-2222-2222-2222-222222222222'
    ELSE COALESCE(organization_id, '11111111-1111-1111-1111-111111111111')
  END,
  site_id = CASE 
    WHEN email IN ('manager@inopnc.com', 'production@inopnc.com', 'worker@inopnc.com') 
      THEN '33333333-3333-3333-3333-333333333333'
    ELSE site_id
  END,
  status = COALESCE(status, 'active'),
  login_count = COALESCE(login_count, 0)
WHERE email IN ('admin@inopnc.com', 'manager@inopnc.com', 'production@inopnc.com', 'worker@inopnc.com', 'customer@inopnc.com', 'customer@partner.com', 'system@inopnc.com', 'davidswyang@gmail.com');

-- =====================================================
-- 7. Create or update user_organizations table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Create user_organizations entries for existing users
INSERT INTO user_organizations (user_id, organization_id, is_primary)
SELECT 
  p.id,
  p.organization_id,
  true
FROM profiles p
WHERE p.organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  is_primary = true;

-- =====================================================
-- 8. Create or update site_assignments table
-- =====================================================

CREATE TABLE IF NOT EXISTS site_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_date DATE DEFAULT CURRENT_DATE,
  unassigned_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, user_id, assigned_date)
);

-- Create site_assignments for users with site access
INSERT INTO site_assignments (site_id, user_id, assigned_date, is_active)
SELECT 
  p.site_id,
  p.id,
  CURRENT_DATE,
  true
FROM profiles p
WHERE p.site_id IS NOT NULL
ON CONFLICT (site_id, user_id, assigned_date) DO UPDATE SET
  is_active = true;

-- =====================================================
-- 9. Enable RLS on new tables if not already enabled
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. Create basic RLS policies for new tables
-- =====================================================

-- Organizations policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- User organizations policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
CREATE POLICY "Users can view their organization memberships" ON user_organizations
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Site assignments policies
DROP POLICY IF EXISTS "Users can view their site assignments" ON site_assignments;
CREATE POLICY "Users can view their site assignments" ON site_assignments
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin', 'site_manager')
    )
  );

-- =====================================================
-- 11. Create helpful indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_site_id ON profiles(site_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_sites_organization_id ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_site_assignments_user_id ON site_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_site_assignments_site_id ON site_assignments(site_id);

-- =====================================================
-- 12. Success message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Database column fix completed successfully. Missing columns added and data populated.';
END $$;