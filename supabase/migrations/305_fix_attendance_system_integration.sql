-- 305_fix_attendance_system_integration.sql
-- Fix attendance system database integration issues
-- Author: DatabaseMaster
-- Date: 2025-08-09

-- =====================================================
-- 1. Ensure sites table has proper RLS policies
-- =====================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "sites_select_policy" ON sites;
DROP POLICY IF EXISTS "sites_modify_policy" ON sites;

-- Create comprehensive sites access policy
CREATE POLICY "sites_read_access" ON sites
FOR SELECT USING (
  -- All authenticated users can read sites
  auth.uid() IS NOT NULL
);

-- Sites modifications should be application-level controlled
CREATE POLICY "sites_admin_write" ON sites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
  )
);

-- =====================================================
-- 2. Ensure attendance_records has proper structure and policies
-- =====================================================

-- Verify attendance_records has all required columns
DO $$
BEGIN
    -- Add labor_hours column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='attendance_records' AND column_name='labor_hours') THEN
        ALTER TABLE attendance_records ADD COLUMN labor_hours DECIMAL(4,2);
        COMMENT ON COLUMN attendance_records.labor_hours IS '공수: Labor hours in units (1.0 = 8 hours of work)';
    END IF;
    
    -- Add index for performance if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='attendance_records' AND indexname='idx_attendance_labor_hours') THEN
        CREATE INDEX idx_attendance_labor_hours ON attendance_records(labor_hours) WHERE labor_hours IS NOT NULL;
    END IF;
END
$$;

-- Drop existing attendance policies to recreate them properly
DROP POLICY IF EXISTS "attendance_select_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_insert_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_update_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_access_policy" ON attendance_records;

-- Create comprehensive attendance access policies
CREATE POLICY "attendance_read_access" ON attendance_records
FOR SELECT USING (
  -- Users can read their own attendance records
  user_id = auth.uid()
  OR
  -- Admins can read all attendance records
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin', 'site_manager')
  )
  OR
  -- Users can read attendance from sites they're assigned to
  EXISTS (
    SELECT 1 FROM site_assignments sa
    WHERE sa.user_id = auth.uid()
    AND sa.site_id = attendance_records.site_id
    AND sa.is_active = true
  )
);

CREATE POLICY "attendance_write_access" ON attendance_records
FOR INSERT WITH CHECK (
  -- Users can only create their own attendance records
  user_id = auth.uid()
  OR
  -- Admins can create attendance records for anyone
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin', 'site_manager')
  )
);

CREATE POLICY "attendance_update_access" ON attendance_records
FOR UPDATE USING (
  -- Users can update their own records
  user_id = auth.uid()
  OR
  -- Admins can update any records  
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin', 'site_manager')
  )
);

-- =====================================================
-- 3. Ensure site_assignments table exists and has proper policies
-- =====================================================

-- Create site_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  unassigned_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  role TEXT DEFAULT 'worker' CHECK (role IN ('worker', 'site_manager', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, user_id, assigned_date)
);

-- Enable RLS on site_assignments
ALTER TABLE site_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing site_assignments policies
DROP POLICY IF EXISTS "site_assignments_select_policy" ON site_assignments;

-- Create site_assignments access policy
CREATE POLICY "site_assignments_read_access" ON site_assignments
FOR SELECT USING (
  -- All authenticated users can read site assignments
  auth.uid() IS NOT NULL
);

-- =====================================================
-- 4. Create function to get user's accessible sites
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_accessible_sites(user_uuid UUID)
RETURNS TABLE (
  site_id UUID,
  site_name TEXT,
  assignment_role TEXT,
  is_assigned BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.name as site_name,
    COALESCE(sa.role, 'none') as assignment_role,
    (sa.id IS NOT NULL AND sa.is_active) as is_assigned
  FROM sites s
  LEFT JOIN site_assignments sa ON s.id = sa.site_id 
    AND sa.user_id = user_uuid 
    AND sa.is_active = true
  ORDER BY s.name;
END;
$$;

-- =====================================================
-- 5. Insert sample data for testing if tables are empty
-- =====================================================

DO $$
DECLARE
  site_count INTEGER;
  test_user_id UUID;
BEGIN
  -- Check if we have any sites
  SELECT COUNT(*) INTO site_count FROM sites;
  
  IF site_count = 0 THEN
    -- Insert sample sites for testing
    INSERT INTO sites (id, name, address, start_date, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', '강남 A현장', '서울특별시 강남구 테헤란로 123', '2025-01-01', NOW()),
    ('22222222-2222-2222-2222-222222222222', '송파 B현장', '서울특별시 송파구 올림픽로 456', '2025-01-01', NOW()),
    ('33333333-3333-3333-3333-333333333333', '서초 C현장', '서울특별시 서초구 강남대로 789', '2025-01-01', NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Get a test user ID (first admin user)
    SELECT id INTO test_user_id FROM profiles WHERE role IN ('admin', 'system_admin') LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
      -- Insert sample site assignments
      INSERT INTO site_assignments (site_id, user_id, is_active, role) VALUES
      ('11111111-1111-1111-1111-111111111111', test_user_id, true, 'admin'),
      ('22222222-2222-2222-2222-222222222222', test_user_id, true, 'admin'),
      ('33333333-3333-3333-3333-333333333333', test_user_id, true, 'admin')
      ON CONFLICT DO NOTHING;
      
      -- Insert sample attendance records
      INSERT INTO attendance_records (
        user_id, site_id, work_date, check_in_time, check_out_time, 
        work_hours, labor_hours, status, created_at
      ) VALUES
      (test_user_id, '11111111-1111-1111-1111-111111111111', '2025-08-01', '08:00:00', '17:00:00', 8.0, 1.0, 'present', NOW()),
      (test_user_id, '11111111-1111-1111-1111-111111111111', '2025-08-02', '08:00:00', '16:00:00', 7.0, 0.875, 'present', NOW()),
      (test_user_id, '22222222-2222-2222-2222-222222222222', '2025-08-05', '09:00:00', '18:00:00', 8.0, 1.0, 'present', NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END
$$;

-- =====================================================
-- 6. Create helpful functions for debugging
-- =====================================================

CREATE OR REPLACE FUNCTION debug_attendance_access(check_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  accessible_sites_count INTEGER,
  attendance_records_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email as user_email,
    p.role as user_role,
    (SELECT COUNT(*) FROM get_user_accessible_sites(p.id)) as accessible_sites_count,
    (SELECT COUNT(*) FROM attendance_records ar WHERE ar.user_id = p.id) as attendance_records_count
  FROM profiles p
  WHERE (check_user_id IS NULL OR p.id = check_user_id)
  ORDER BY p.email;
END;
$$;

-- =====================================================
-- 7. Verify the migration
-- =====================================================

-- Log completion
SELECT 'Attendance system integration migration completed successfully' as status,
       (SELECT COUNT(*) FROM sites) as sites_count,
       (SELECT COUNT(*) FROM attendance_records) as attendance_count,
       (SELECT COUNT(*) FROM site_assignments) as assignments_count;