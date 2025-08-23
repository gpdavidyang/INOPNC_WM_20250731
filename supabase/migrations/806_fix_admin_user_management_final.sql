-- Fix RLS policies for admin user management - FINAL VERSION
-- This migration allows admin users to view all profiles in user management

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Admin and user profile access" ON profiles;

-- Create comprehensive SELECT policy for profiles
CREATE POLICY "Admin and user profile access" ON profiles
  FOR SELECT
  USING (
    -- Allow users to see their own profile
    auth.uid()::text = id::text
    OR
    -- Allow admin/system_admin to see all profiles
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id::text = auth.uid()::text
      AND admin_profile.role IN ('admin', 'system_admin')
      LIMIT 1
    )
  );

-- Drop and recreate UPDATE policy
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;

CREATE POLICY "Admin can update profiles" ON profiles
  FOR UPDATE
  USING (
    -- Users can update their own profile
    auth.uid()::text = id::text
    OR
    -- Admin can update any profile
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id::text = auth.uid()::text
      AND admin_profile.role IN ('admin', 'system_admin')
      LIMIT 1
    )
  );

-- Drop and recreate INSERT policy
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;

CREATE POLICY "Admin can insert profiles" ON profiles
  FOR INSERT
  WITH CHECK (
    -- Admin can create profiles for others
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id::text = auth.uid()::text
      AND admin_profile.role IN ('admin', 'system_admin')
      LIMIT 1
    )
    OR
    -- Users can be auto-created (for first login)
    auth.uid()::text = id::text
  );

-- Verify RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;