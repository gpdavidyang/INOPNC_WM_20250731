-- Fix RLS policies for admin user management
-- Allow admin users to view all profiles in user management

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Create new policy for admin access to all profiles
CREATE POLICY "Admin can view all profiles" ON profiles
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

-- Also ensure admin can update user profiles
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

CREATE POLICY "Admin can update all profiles" ON profiles
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

-- Ensure admin can insert new profiles
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