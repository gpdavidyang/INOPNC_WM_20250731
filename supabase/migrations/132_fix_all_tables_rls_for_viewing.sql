-- Fix RLS policies to allow authenticated users to view necessary data
-- This ensures that all users can see the data they need in the UI

-- 1. Daily Reports - Allow users to view all reports (they need to see team reports)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'daily_reports' 
        AND policyname = 'Users can view all reports'
    ) THEN
        CREATE POLICY "Users can view all reports" 
        ON daily_reports 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. Attendance Records - Allow users to view attendance records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'attendance_records' 
        AND policyname = 'Users can view attendance records'
    ) THEN
        CREATE POLICY "Users can view attendance records" 
        ON attendance_records 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. Material Inventory - Allow users to view inventory
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'material_inventory' 
        AND policyname = 'Users can view inventory'
    ) THEN
        CREATE POLICY "Users can view inventory" 
        ON material_inventory 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 4. Material Transactions - Allow users to view transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'material_transactions' 
        AND policyname = 'Users can view transactions'
    ) THEN
        CREATE POLICY "Users can view transactions" 
        ON material_transactions 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 5. Material Requests - Allow users to view requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'material_requests' 
        AND policyname = 'Users can view requests'
    ) THEN
        CREATE POLICY "Users can view requests" 
        ON material_requests 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 6. Material Request Items - Allow users to view request items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'material_request_items' 
        AND policyname = 'Users can view request items'
    ) THEN
        CREATE POLICY "Users can view request items" 
        ON material_request_items 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 7. Announcements - Allow users to view announcements
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'announcements' 
        AND policyname = 'Users can view announcements'
    ) THEN
        CREATE POLICY "Users can view announcements" 
        ON announcements 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 8. Worker Skills - Allow users to view worker skills
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'worker_skills' 
        AND policyname = 'Users can view worker skills'
    ) THEN
        CREATE POLICY "Users can view worker skills" 
        ON worker_skills 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 9. Worker Skill Assignments - Allow users to view skill assignments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'worker_skill_assignments' 
        AND policyname = 'Users can view skill assignments'
    ) THEN
        CREATE POLICY "Users can view skill assignments" 
        ON worker_skill_assignments 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 10. Resource Allocations - Allow users to view resource allocations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resource_allocations' 
        AND policyname = 'Users can view resource allocations'
    ) THEN
        CREATE POLICY "Users can view resource allocations" 
        ON resource_allocations 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 11. Site Assignments - Allow users to view site assignments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'site_assignments' 
        AND policyname = 'Users can view site assignments'
    ) THEN
        CREATE POLICY "Users can view site assignments" 
        ON site_assignments 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 12. User Sites - Allow users to view user-site relationships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_sites' 
        AND policyname = 'Users can view user sites'
    ) THEN
        CREATE POLICY "Users can view user sites" 
        ON user_sites 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 13. User Organizations - Allow users to view user-org relationships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_organizations' 
        AND policyname = 'Users can view user organizations'
    ) THEN
        CREATE POLICY "Users can view user organizations" 
        ON user_organizations 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 14. Salary Info - Users can only view their own salary info
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'salary_info' 
        AND policyname = 'Users can view own salary'
    ) THEN
        CREATE POLICY "Users can view own salary" 
        ON salary_info 
        FOR SELECT 
        USING (auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system_admin', 'site_manager')
        ));
    END IF;
END $$;

COMMENT ON POLICY "Users can view all reports" ON daily_reports IS 'Allows all authenticated users to view daily reports for collaboration';
COMMENT ON POLICY "Users can view attendance records" ON attendance_records IS 'Allows all authenticated users to view attendance records';
COMMENT ON POLICY "Users can view inventory" ON material_inventory IS 'Allows all authenticated users to view material inventory';