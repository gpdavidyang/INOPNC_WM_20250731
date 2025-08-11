-- Fix analytics RLS policies to handle missing dependencies gracefully
-- This prevents 500 errors when referenced tables don't exist or have no data

-- 1. Update analytics_metrics RLS policies to be more resilient
DROP POLICY IF EXISTS "Site managers can view their site metrics" ON analytics_metrics;

CREATE POLICY "Site managers can view their site metrics" ON analytics_metrics
  FOR SELECT USING (
    -- System admin access
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'system_admin'
    ) OR
    -- Organization admin access
    (organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
    )) OR
    -- Site manager access (with fallback if site_members doesn't exist)
    (site_id IS NOT NULL AND (
      -- Try site_members table first
      (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_members') AND
       auth.uid() IN (
         SELECT user_id FROM site_members 
         WHERE site_id = analytics_metrics.site_id 
         AND role IN ('site_manager', 'admin')
         AND is_active = TRUE
       )) OR
      -- Fallback: check if user has same organization
      (NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_members') AND
       organization_id IN (
         SELECT organization_id FROM profiles 
         WHERE id = auth.uid() AND role IN ('site_manager', 'admin')
       ))
    ))
  );

-- 2. Update analytics_daily_stats RLS policies
DROP POLICY IF EXISTS "Site managers can view their site stats" ON analytics_daily_stats;

CREATE POLICY "Site managers can view their site stats" ON analytics_daily_stats
  FOR SELECT USING (
    -- System admin access
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'system_admin'
    ) OR
    -- Organization admin access
    (organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
    )) OR
    -- Site manager access (with fallback if site_members doesn't exist)
    (site_id IS NOT NULL AND (
      -- Try site_members table first
      (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_members') AND
       auth.uid() IN (
         SELECT user_id FROM site_members 
         WHERE site_id = analytics_daily_stats.site_id 
         AND role IN ('site_manager', 'admin')
         AND is_active = TRUE
       )) OR
      -- Fallback: check if user has same organization
      (NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_members') AND
       organization_id IN (
         SELECT organization_id FROM profiles 
         WHERE id = auth.uid() AND role IN ('site_manager', 'admin')
       ))
    ))
  );

-- 3. Update analytics_events RLS policies
DROP POLICY IF EXISTS "Allow viewing events" ON analytics_events;

CREATE POLICY "Allow viewing events" ON analytics_events
  FOR SELECT USING (
    -- Allow viewing RUM events (anonymous performance monitoring)
    event_type LIKE 'rum_%' OR
    event_type LIKE 'page_view%' OR
    event_type LIKE 'performance_%' OR
    event_type LIKE 'web_vitals_%' OR
    -- Allow authenticated users to view events
    (auth.uid() IS NOT NULL AND (
      -- System admin access
      auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'system_admin'
      ) OR
      -- Organization access
      (organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
      )) OR
      -- Site manager access with fallback
      (site_id IS NOT NULL AND (
        (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_members') AND
         auth.uid() IN (
           SELECT user_id FROM site_members 
           WHERE site_id = analytics_events.site_id 
           AND role IN ('site_manager', 'admin')
           AND is_active = TRUE
         )) OR
        (NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_members') AND
         organization_id IN (
           SELECT organization_id FROM profiles 
           WHERE id = auth.uid() AND role IN ('site_manager', 'admin')
         ))
      )) OR
      -- Own events
      user_id = auth.uid()
    ))
  );

-- 4. Update analytics_cache RLS policies
DROP POLICY IF EXISTS "Site managers can view cached data" ON analytics_cache;

CREATE POLICY "Site managers can view cached data" ON analytics_cache
  FOR SELECT USING (
    -- System admin access
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'system_admin'
    ) OR
    -- Organization admin access
    (organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
    )) OR
    -- Site manager access with fallback
    (site_id IS NOT NULL AND (
      (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_members') AND
       auth.uid() IN (
         SELECT user_id FROM site_members 
         WHERE site_id = analytics_cache.site_id 
         AND role IN ('site_manager', 'admin')
         AND is_active = TRUE
       )) OR
      (NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_members') AND
       organization_id IN (
         SELECT organization_id FROM profiles 
         WHERE id = auth.uid() AND role IN ('site_manager', 'admin')
       ))
    )) OR
    -- Null site_id means organization-level cache
    (site_id IS NULL AND organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('site_manager', 'admin', 'system_admin')
    ))
  );

-- 5. Create function to safely check table existence and data
CREATE OR REPLACE FUNCTION safe_table_check(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if table exists
  RETURN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = safe_table_check.table_name
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create helper function for analytics access check
CREATE OR REPLACE FUNCTION user_has_analytics_access(
  p_user_id UUID,
  p_organization_id UUID DEFAULT NULL,
  p_site_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_org_id UUID;
BEGIN
  -- Get user role and organization
  SELECT role, organization_id INTO user_role, user_org_id
  FROM profiles WHERE id = p_user_id;
  
  -- System admin has access to everything
  IF user_role = 'system_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check organization access
  IF p_organization_id IS NOT NULL AND user_org_id != p_organization_id THEN
    RETURN FALSE;
  END IF;
  
  -- Admin has access to their organization data
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Site manager access
  IF user_role = 'site_manager' THEN
    -- If no specific site requested, allow organization-level access
    IF p_site_id IS NULL THEN
      RETURN TRUE;
    END IF;
    
    -- Check site_members table if it exists
    IF safe_table_check('site_members') THEN
      RETURN EXISTS (
        SELECT 1 FROM site_members 
        WHERE user_id = p_user_id 
        AND site_id = p_site_id 
        AND role IN ('site_manager', 'admin')
        AND is_active = TRUE
      );
    ELSE
      -- Fallback: allow if same organization
      RETURN user_org_id = p_organization_id;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION safe_table_check TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_analytics_access TO authenticated;

-- 7. Refresh the materialized view to ensure it works with new policies
-- Only refresh if the view exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'analytics_dashboard_summary') THEN
    -- Try to refresh, but don't fail if data is missing
    BEGIN
      REFRESH MATERIALIZED VIEW analytics_dashboard_summary;
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the migration
      RAISE NOTICE 'Could not refresh analytics_dashboard_summary: %', SQLERRM;
    END;
  END IF;
END;
$$;

-- 8. Create a validation function to check analytics system health
CREATE OR REPLACE FUNCTION validate_analytics_system()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check required tables
  RETURN QUERY
  SELECT 
    'analytics_metrics'::TEXT as component,
    CASE WHEN safe_table_check('analytics_metrics') THEN 'OK' ELSE 'MISSING' END as status,
    CASE WHEN safe_table_check('analytics_metrics') THEN 'Table exists' ELSE 'Table does not exist' END as details;
    
  RETURN QUERY
  SELECT 
    'analytics_events'::TEXT,
    CASE WHEN safe_table_check('analytics_events') THEN 'OK' ELSE 'MISSING' END,
    CASE WHEN safe_table_check('analytics_events') THEN 'Table exists' ELSE 'Table does not exist' END;
    
  RETURN QUERY
  SELECT 
    'site_members'::TEXT,
    CASE WHEN safe_table_check('site_members') THEN 'OK' ELSE 'WARNING' END,
    CASE WHEN safe_table_check('site_members') THEN 'Table exists' ELSE 'Table missing - using fallback RLS' END;
    
  -- Check functions
  RETURN QUERY
  SELECT 
    'aggregate_daily_analytics'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'aggregate_daily_analytics') THEN 'OK' ELSE 'MISSING' END,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'aggregate_daily_analytics') THEN 'Function exists' ELSE 'Function does not exist' END;
    
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_analytics_system TO authenticated;