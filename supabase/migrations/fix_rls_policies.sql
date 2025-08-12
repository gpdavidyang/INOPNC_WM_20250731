-- Fix RLS Policy Violations for Production Environment
-- This script addresses the Row-Level Security policy issues causing 503/401 errors

-- =============================================================================
-- ANALYTICS_METRICS TABLE RLS POLICY FIXES
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "analytics_metrics_access_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_insert_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_update_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_delete_policy" ON analytics_metrics;

-- Create comprehensive RLS policies for analytics_metrics table
-- Policy 1: SELECT - Allow authenticated users to read analytics data
CREATE POLICY "analytics_metrics_select_policy" ON analytics_metrics
FOR SELECT 
TO authenticated
USING (
  -- System admins can see all data
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- Organization admins and site managers can see their organization's data
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager', 'customer_manager')
    AND
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  OR
  -- Workers can see their organization's aggregated data
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'worker'
    AND
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- Policy 2: INSERT - Allow system and applications to insert analytics data
CREATE POLICY "analytics_metrics_insert_policy" ON analytics_metrics
FOR INSERT 
TO authenticated
WITH CHECK (
  -- System admins can insert anything
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- Admins and site managers can insert for their organization
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager')
    AND
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  OR
  -- Allow inserts with NULL organization_id for system-generated metrics
  organization_id IS NULL
  OR
  -- Allow inserts for the user's organization
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Policy 3: UPDATE - Allow authorized updates
CREATE POLICY "analytics_metrics_update_policy" ON analytics_metrics
FOR UPDATE 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('system_admin', 'admin', 'site_manager')
  AND
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
    OR
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- Policy 4: DELETE - Restrict to system admins only
CREATE POLICY "analytics_metrics_delete_policy" ON analytics_metrics
FOR DELETE 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- =============================================================================
-- PUSH_SUBSCRIPTIONS TABLE RLS POLICY FIXES
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "push_subscriptions_access_policy" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_policy" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update_policy" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_policy" ON push_subscriptions;

-- Create comprehensive RLS policies for push_subscriptions table
-- Policy 1: SELECT - Users can see their own subscriptions
CREATE POLICY "push_subscriptions_select_policy" ON push_subscriptions
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- Policy 2: INSERT - Users can create their own subscriptions
CREATE POLICY "push_subscriptions_insert_policy" ON push_subscriptions
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- Policy 3: UPDATE - Users can update their own subscriptions
CREATE POLICY "push_subscriptions_update_policy" ON push_subscriptions
FOR UPDATE 
TO authenticated
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- Policy 4: DELETE - Users can delete their own subscriptions
CREATE POLICY "push_subscriptions_delete_policy" ON push_subscriptions
FOR DELETE 
TO authenticated
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- =============================================================================
-- FUNCTION ACCESS FIXES
-- =============================================================================

-- Grant execute permissions on analytics functions to authenticated users
GRANT EXECUTE ON FUNCTION aggregate_daily_analytics(UUID, UUID, DATE) TO authenticated;

-- Ensure the function can access necessary tables
GRANT SELECT, INSERT, UPDATE ON analytics_metrics TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('analytics_metrics', 'push_subscriptions')
ORDER BY tablename, policyname;

-- Test RLS policy functionality
-- (These are comments for manual testing after applying the migration)
-- Test 1: SELECT analytics_metrics as authenticated user
-- Test 2: INSERT sample data as authenticated user  
-- Test 3: Call aggregate_daily_analytics function
-- Test 4: Access push_subscriptions as authenticated user

-- =============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- =============================================================================

/*
This migration addresses the following RLS policy violations:
1. analytics_metrics table - Error 42501: "new row violates row-level security policy"
2. push_subscriptions table - 401 unauthorized access errors

Key changes:
1. Relaxed INSERT policy for analytics_metrics to allow NULL organization_id
2. Added proper role-based access control for all operations
3. Granted necessary function execution permissions
4. Ensured authenticated users can access tables they need

Apply this migration in Supabase Dashboard:
1. Go to SQL Editor
2. Paste this entire script
3. Click "Run" to execute
4. Verify no errors in the output
5. Test the application functionality

Expected result: 503 and 401 errors should be resolved.
*/