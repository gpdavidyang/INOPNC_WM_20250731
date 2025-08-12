-- Fix RLS Policy Violations for Production Environment (CORRECTED VERSION)
-- This script addresses the Row-Level Security policy issues causing 503/401 errors
-- Fixed PostgreSQL function error 42883

-- =============================================================================
-- ANALYTICS_METRICS TABLE RLS POLICY FIXES
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "analytics_metrics_access_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_insert_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_update_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_delete_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_select_policy" ON analytics_metrics;

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
    (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR organization_id IS NULL)
  )
  OR
  -- Workers can see their organization's aggregated data
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'worker'
    AND
    (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR organization_id IS NULL)
  )
  OR
  -- Allow access to system-generated metrics with NULL organization_id
  organization_id IS NULL
);

-- Policy 2: INSERT - Allow system and applications to insert analytics data
CREATE POLICY "analytics_metrics_insert_policy" ON analytics_metrics
FOR INSERT 
TO authenticated
WITH CHECK (
  -- System admins can insert anything
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- Allow inserts with NULL organization_id for system-generated metrics
  organization_id IS NULL
  OR
  -- Admins and site managers can insert for their organization
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager')
    AND
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  OR
  -- Allow inserts for the user's organization
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Policy 3: UPDATE - Allow authorized updates
CREATE POLICY "analytics_metrics_update_policy" ON analytics_metrics
FOR UPDATE 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager')
    AND
    (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR organization_id IS NULL)
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
DROP POLICY IF EXISTS "push_subscriptions_select_policy" ON push_subscriptions;

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

-- Check if the aggregate_daily_analytics function exists before granting permissions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'aggregate_daily_analytics') THEN
        -- Grant execute permissions on analytics functions to authenticated users
        EXECUTE 'GRANT EXECUTE ON FUNCTION aggregate_daily_analytics(UUID, UUID, DATE) TO authenticated';
        RAISE NOTICE 'Granted execute permission on aggregate_daily_analytics function';
    ELSE
        RAISE NOTICE 'aggregate_daily_analytics function does not exist - skipping permission grant';
    END IF;
END $$;

-- Ensure authenticated users can access necessary tables
GRANT SELECT, INSERT, UPDATE ON analytics_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify policies are created correctly
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    SUBSTRING(qual, 1, 100) as qual_preview 
FROM pg_policies 
WHERE tablename IN ('analytics_metrics', 'push_subscriptions')
ORDER BY tablename, policyname;

-- Show table permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_name IN ('analytics_metrics', 'push_subscriptions')
AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'RLS POLICY FIX COMPLETED SUCCESSFULLY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Fixed issues:';
    RAISE NOTICE '- analytics_metrics table RLS policies updated';
    RAISE NOTICE '- push_subscriptions table RLS policies updated';
    RAISE NOTICE '- Function permissions granted (if functions exist)';
    RAISE NOTICE '- Table access permissions granted to authenticated users';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected result: 503 and 401 errors should now be resolved.';
    RAISE NOTICE 'Test your application at the production URL to verify the fix.';
    RAISE NOTICE '=============================================================================';
END $$;