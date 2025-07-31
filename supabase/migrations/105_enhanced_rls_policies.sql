-- Enhanced RLS Policies for Construction Schema
-- This migration creates comprehensive Row Level Security policies

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to check if user belongs to organization
CREATE OR REPLACE FUNCTION user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is assigned to site
CREATE OR REPLACE FUNCTION user_site_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT site_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT id FROM sites WHERE organization_id = user_organization_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user role
CREATE OR REPLACE FUNCTION user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or system_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_role() IN ('admin', 'system_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is site_manager or above
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_role() IN ('site_manager', 'admin', 'system_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. PROFILES TABLE POLICIES
-- ==========================================

-- Users can view profiles in their organization
CREATE POLICY "profiles_select_own_org" ON profiles
    FOR SELECT USING (
        organization_id = user_organization_id()
        OR is_admin()
    );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Admins can insert/update profiles
CREATE POLICY "profiles_admin_all" ON profiles
    FOR ALL USING (is_admin());

-- ==========================================
-- 2. ORGANIZATIONS TABLE POLICIES
-- ==========================================

-- Users can view their own organization
CREATE POLICY "organizations_select_own" ON organizations
    FOR SELECT USING (
        id = user_organization_id()
        OR is_admin()
    );

-- Only admins can modify organizations
CREATE POLICY "organizations_admin_all" ON organizations
    FOR ALL USING (is_admin());

-- ==========================================
-- 3. SITES TABLE POLICIES
-- ==========================================

-- Users can view sites they're assigned to or in their organization
CREATE POLICY "sites_select_assigned" ON sites
    FOR SELECT USING (
        id = ANY(user_site_ids())
        OR organization_id = user_organization_id()
        OR is_admin()
    );

-- Managers and above can create/update sites
CREATE POLICY "sites_insert_managers" ON sites
    FOR INSERT WITH CHECK (
        is_manager_or_above()
        AND organization_id = user_organization_id()
    );

CREATE POLICY "sites_update_managers" ON sites
    FOR UPDATE USING (
        is_manager_or_above()
        AND (organization_id = user_organization_id() OR is_admin())
    );

-- ==========================================
-- 4. DAILY REPORTS POLICIES
-- ==========================================

-- Users can view reports from their sites
CREATE POLICY "daily_reports_select_site" ON daily_reports
    FOR SELECT USING (
        site_id = ANY(user_site_ids())
        OR is_admin()
    );

-- Workers can create reports for their site
CREATE POLICY "daily_reports_insert_workers" ON daily_reports
    FOR INSERT WITH CHECK (
        site_id = ANY(user_site_ids())
    );

-- Report creator or managers can update
CREATE POLICY "daily_reports_update_own_or_manager" ON daily_reports
    FOR UPDATE USING (
        (created_by = auth.uid() AND status = 'draft')
        OR is_manager_or_above()
    );

-- Only managers can approve reports
CREATE POLICY "daily_reports_approve_managers" ON daily_reports
    FOR UPDATE USING (
        is_manager_or_above()
        AND site_id = ANY(user_site_ids())
    )
    WITH CHECK (
        CASE 
            WHEN status IN ('approved', 'rejected') THEN is_manager_or_above()
            ELSE true
        END
    );

-- ==========================================
-- 5. WORK LOGS POLICIES
-- ==========================================

-- View work logs through daily reports access
CREATE POLICY "work_logs_select_via_report" ON work_logs
    FOR SELECT USING (
        daily_report_id IN (
            SELECT id FROM daily_reports 
            WHERE site_id = ANY(user_site_ids())
        )
        OR is_admin()
    );

-- Insert/update through daily report access
CREATE POLICY "work_logs_insert_via_report" ON work_logs
    FOR INSERT WITH CHECK (
        daily_report_id IN (
            SELECT id FROM daily_reports 
            WHERE site_id = ANY(user_site_ids())
            AND (created_by = auth.uid() OR is_manager_or_above())
        )
    );

CREATE POLICY "work_logs_update_via_report" ON work_logs
    FOR UPDATE USING (
        daily_report_id IN (
            SELECT id FROM daily_reports 
            WHERE site_id = ANY(user_site_ids())
            AND (created_by = auth.uid() OR is_manager_or_above())
        )
    );

-- ==========================================
-- 6. ATTENDANCE RECORDS POLICIES
-- ==========================================

-- Workers can view their own attendance
CREATE POLICY "attendance_view_own" ON attendance_records
    FOR SELECT USING (
        worker_id = auth.uid()
        OR daily_report_id IN (
            SELECT id FROM daily_reports WHERE site_id = ANY(user_site_ids())
        )
        OR is_manager_or_above()
    );

-- Managers can manage attendance
CREATE POLICY "attendance_manage_managers" ON attendance_records
    FOR ALL USING (
        is_manager_or_above()
        AND daily_report_id IN (
            SELECT id FROM daily_reports WHERE site_id = ANY(user_site_ids())
        )
    );

-- ==========================================
-- 7. MATERIAL MANAGEMENT POLICIES
-- ==========================================

-- Material categories - viewable by all authenticated users
CREATE POLICY "material_categories_select_all" ON material_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Materials - viewable by all authenticated users
CREATE POLICY "materials_select_all" ON materials
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Material inventory - site based access
CREATE POLICY "material_inventory_site_access" ON material_inventory
    FOR ALL USING (
        site_id = ANY(user_site_ids())
        OR is_admin()
    );

-- Material requests - site based with role checks
CREATE POLICY "material_requests_select_site" ON material_requests
    FOR SELECT USING (
        site_id = ANY(user_site_ids())
        OR is_admin()
    );

CREATE POLICY "material_requests_insert_workers" ON material_requests
    FOR INSERT WITH CHECK (
        site_id = ANY(user_site_ids())
        AND requested_by = auth.uid()
    );

CREATE POLICY "material_requests_update_own_or_manager" ON material_requests
    FOR UPDATE USING (
        (requested_by = auth.uid() AND status = 'pending')
        OR is_manager_or_above()
    );

-- ==========================================
-- 8. PARTNER COMPANIES POLICIES
-- ==========================================

-- View partner companies in same organization
CREATE POLICY "partner_companies_view_org" ON partner_companies
    FOR SELECT USING (
        organization_id = user_organization_id()
        OR is_admin()
    );

-- Only admins can manage partner companies
CREATE POLICY "partner_companies_manage_admin" ON partner_companies
    FOR ALL USING (is_admin());

-- ==========================================
-- 9. SAFETY MANAGEMENT POLICIES
-- ==========================================

-- Safety training - site based access
CREATE POLICY "safety_training_site_access" ON safety_training_records
    FOR SELECT USING (
        site_id = ANY(user_site_ids())
        OR is_admin()
    );

CREATE POLICY "safety_training_manage_managers" ON safety_training_records
    FOR ALL USING (
        is_manager_or_above()
        AND site_id = ANY(user_site_ids())
    );

-- Safety training attendees - view own or manage if manager
CREATE POLICY "safety_attendees_view" ON safety_training_attendees
    FOR SELECT USING (
        worker_id = auth.uid()
        OR training_record_id IN (
            SELECT id FROM safety_training_records 
            WHERE site_id = ANY(user_site_ids())
        )
        OR is_manager_or_above()
    );

-- Safety inspections - site based
CREATE POLICY "safety_inspections_site_access" ON safety_inspections
    FOR ALL USING (
        site_id = ANY(user_site_ids())
        OR is_admin()
    );

-- ==========================================
-- 10. DOCUMENTS POLICIES
-- ==========================================

-- Documents - complex access rules
CREATE POLICY "documents_select_complex" ON documents
    FOR SELECT USING (
        -- Own documents
        owner_id = auth.uid()
        -- Public documents
        OR is_public = true
        -- Site documents for assigned sites
        OR (site_id IS NOT NULL AND site_id = ANY(user_site_ids()))
        -- Shared documents (would need a sharing table)
        OR is_admin()
    );

CREATE POLICY "documents_insert_authenticated" ON documents
    FOR INSERT WITH CHECK (
        owner_id = auth.uid()
        AND (site_id IS NULL OR site_id = ANY(user_site_ids()))
    );

CREATE POLICY "documents_update_own" ON documents
    FOR UPDATE USING (
        owner_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY "documents_delete_own" ON documents
    FOR DELETE USING (
        owner_id = auth.uid()
        OR is_admin()
    );

-- ==========================================
-- 11. NOTIFICATIONS POLICIES
-- ==========================================

-- Users can only see their own notifications
CREATE POLICY "notifications_own" ON notifications
    FOR ALL USING (user_id = auth.uid());

-- ==========================================
-- 12. ANNOUNCEMENTS POLICIES
-- ==========================================

-- View announcements based on role and site
CREATE POLICY "announcements_view_targeted" ON announcements
    FOR SELECT USING (
        is_active = true
        AND (
            target_roles IS NULL 
            OR user_role() = ANY(target_roles)
        )
        AND (
            target_sites IS NULL
            OR EXISTS (
                SELECT 1 FROM unnest(target_sites) AS ts
                WHERE ts = ANY(user_site_ids())
            )
        )
    );

-- Only admins can manage announcements
CREATE POLICY "announcements_manage_admin" ON announcements
    FOR ALL USING (is_admin());

-- ==========================================
-- 13. FILE ATTACHMENTS POLICIES
-- ==========================================

-- File attachments inherit permissions from parent entity
CREATE POLICY "file_attachments_inherited" ON file_attachments
    FOR SELECT USING (
        CASE entity_type
            WHEN 'daily_report' THEN 
                entity_id IN (
                    SELECT id FROM daily_reports 
                    WHERE site_id = ANY(user_site_ids())
                )
            WHEN 'document' THEN 
                entity_id IN (
                    SELECT id FROM documents 
                    WHERE owner_id = auth.uid() 
                    OR is_public = true
                    OR site_id = ANY(user_site_ids())
                )
            ELSE is_admin()
        END
    );

CREATE POLICY "file_attachments_upload" ON file_attachments
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid()
    );

-- ==========================================
-- 14. EQUIPMENT POLICIES
-- ==========================================

-- Equipment - site based access
CREATE POLICY "equipment_site_access" ON equipment
    FOR ALL USING (
        site_id = ANY(user_site_ids())
        OR is_admin()
    );

-- Equipment usage - through daily reports
CREATE POLICY "equipment_usage_via_report" ON equipment_usage
    FOR ALL USING (
        daily_report_id IN (
            SELECT id FROM daily_reports 
            WHERE site_id = ANY(user_site_ids())
        )
        OR is_admin()
    );

-- ==========================================
-- 15. WEATHER CONDITIONS POLICIES
-- ==========================================

-- Weather conditions - site based view
CREATE POLICY "weather_conditions_site_view" ON weather_conditions
    FOR SELECT USING (
        site_id = ANY(user_site_ids())
        OR is_admin()
    );

-- Only managers can record weather
CREATE POLICY "weather_conditions_managers_write" ON weather_conditions
    FOR INSERT WITH CHECK (
        is_manager_or_above()
        AND site_id = ANY(user_site_ids())
    );

-- ==========================================
-- 16. QUALITY INSPECTIONS POLICIES
-- ==========================================

-- Quality standards - viewable by all
CREATE POLICY "quality_standards_view_all" ON quality_standards
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Quality inspections - through daily reports
CREATE POLICY "quality_inspections_via_report" ON quality_inspections
    FOR ALL USING (
        daily_report_id IN (
            SELECT id FROM daily_reports 
            WHERE site_id = ANY(user_site_ids())
        )
        OR is_admin()
    );

-- ==========================================
-- 17. WORK SCHEDULES POLICIES
-- ==========================================

-- Work schedules - site based
CREATE POLICY "work_schedules_site_access" ON work_schedules
    FOR SELECT USING (
        site_id = ANY(user_site_ids())
        OR is_admin()
    );

CREATE POLICY "work_schedules_manage_managers" ON work_schedules
    FOR ALL USING (
        is_manager_or_above()
        AND site_id = ANY(user_site_ids())
    );

-- ==========================================
-- 18. FINANCIAL POLICIES
-- ==========================================

-- Project budgets - managers and above only
CREATE POLICY "project_budgets_managers_only" ON project_budgets
    FOR ALL USING (
        is_manager_or_above()
        AND site_id = ANY(user_site_ids())
    );

-- Daily labor costs - managers and above only
CREATE POLICY "daily_labor_costs_managers_only" ON daily_labor_costs
    FOR ALL USING (
        is_manager_or_above()
        AND daily_report_id IN (
            SELECT id FROM daily_reports 
            WHERE site_id = ANY(user_site_ids())
        )
    );

-- ==========================================
-- 19. WORKER MANAGEMENT POLICIES
-- ==========================================

-- Worker certifications - own or managers
CREATE POLICY "worker_certifications_own_or_manager" ON worker_certifications
    FOR SELECT USING (
        worker_id = auth.uid()
        OR is_manager_or_above()
    );

CREATE POLICY "worker_certifications_manage" ON worker_certifications
    FOR ALL USING (
        worker_id = auth.uid()
        OR is_admin()
    );

-- Worker wage rates - sensitive, managers only
CREATE POLICY "worker_wage_rates_managers_only" ON worker_wage_rates
    FOR ALL USING (
        is_manager_or_above()
        AND (
            worker_id IN (
                SELECT id FROM profiles 
                WHERE organization_id = user_organization_id()
            )
            OR is_admin()
        )
    );

-- ==========================================
-- 20. WORK INSTRUCTIONS POLICIES
-- ==========================================

-- Work instructions - site based
CREATE POLICY "work_instructions_site_access" ON work_instructions
    FOR SELECT USING (
        site_id = ANY(user_site_ids())
        OR id IN (
            SELECT instruction_id FROM work_instruction_recipients 
            WHERE recipient_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY "work_instructions_create_managers" ON work_instructions
    FOR INSERT WITH CHECK (
        is_manager_or_above()
        AND site_id = ANY(user_site_ids())
    );

-- Work instruction recipients
CREATE POLICY "work_instruction_recipients_view" ON work_instruction_recipients
    FOR SELECT USING (
        recipient_id = auth.uid()
        OR instruction_id IN (
            SELECT id FROM work_instructions 
            WHERE issued_by = auth.uid()
        )
        OR is_manager_or_above()
    );

-- ==========================================
-- GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION user_site_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager_or_above() TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced RLS policies created successfully.';
END $$;