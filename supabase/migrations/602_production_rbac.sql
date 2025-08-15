-- 602_production_rbac.sql
-- Production Role-Based Access Control (RBAC) for INOPNC Work Management System
-- Implements comprehensive permission system with hierarchical roles

-- =====================================================
-- 1. ENHANCED USER ROLE HIERARCHY
-- =====================================================

-- Create comprehensive role hierarchy enum
DO $$ 
BEGIN
    -- Drop existing role type if it exists
    DROP TYPE IF EXISTS user_role_hierarchy CASCADE;
    
    -- Create new role hierarchy
    CREATE TYPE user_role_hierarchy AS ENUM (
        'trainee',          -- Level 0: New worker in training
        'worker',           -- Level 1: Basic construction worker
        'skilled_worker',   -- Level 2: Specialized/skilled worker
        'senior_worker',    -- Level 3: Experienced worker with mentoring duties
        'team_lead',        -- Level 4: Team leader (small crew)
        'foreman',          -- Level 5: Construction foreman
        'site_supervisor',  -- Level 6: Site supervisor
        'site_manager',     -- Level 7: Site manager
        'regional_manager', -- Level 8: Regional manager (multiple sites)
        'project_manager',  -- Level 9: Project manager
        'admin',           -- Level 10: System administrator
        'system_admin'     -- Level 11: Super administrator
    );
    
EXCEPTION 
    WHEN duplicate_object THEN 
        RAISE NOTICE 'user_role_hierarchy type already exists, recreating...';
        DROP TYPE user_role_hierarchy CASCADE;
        CREATE TYPE user_role_hierarchy AS ENUM (
            'trainee', 'worker', 'skilled_worker', 'senior_worker', 'team_lead',
            'foreman', 'site_supervisor', 'site_manager', 'regional_manager',
            'project_manager', 'admin', 'system_admin'
        );
END $$;

-- =====================================================
-- 2. PERMISSION MATRIX SYSTEM
-- =====================================================

-- Create comprehensive permission matrix table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role_hierarchy NOT NULL,
    resource TEXT NOT NULL, -- The resource being accessed (table, feature, action)
    permission_type TEXT NOT NULL, -- CRUD + custom permissions
    scope_conditions JSONB DEFAULT '{}', -- Conditions for accessing the resource
    data_filters JSONB DEFAULT '{}', -- Filters applied to data queries
    time_restrictions JSONB DEFAULT '{}', -- Time-based access restrictions
    ip_restrictions INET[] DEFAULT '{}', -- IP address restrictions
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority overrides lower priority
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    -- Constraints
    CONSTRAINT role_permissions_type_check CHECK (
        permission_type IN (
            'create', 'read', 'update', 'delete', 'export', 'import',
            'approve', 'reject', 'publish', 'archive', 'restore',
            'manage_users', 'view_analytics', 'system_config',
            'emergency_access', 'audit_access'
        )
    ),
    
    -- Unique constraint to prevent duplicate permissions
    UNIQUE(role, resource, permission_type)
);

-- Create indexes for permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON role_permissions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON role_permissions(role, resource, permission_type, is_active);

-- =====================================================
-- 3. ROLE HIERARCHY FUNCTIONS
-- =====================================================

-- Function to get role hierarchy level
CREATE OR REPLACE FUNCTION get_role_level(role_name user_role_hierarchy)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE role_name
        WHEN 'trainee' THEN 0
        WHEN 'worker' THEN 1
        WHEN 'skilled_worker' THEN 2
        WHEN 'senior_worker' THEN 3
        WHEN 'team_lead' THEN 4
        WHEN 'foreman' THEN 5
        WHEN 'site_supervisor' THEN 6
        WHEN 'site_manager' THEN 7
        WHEN 'regional_manager' THEN 8
        WHEN 'project_manager' THEN 9
        WHEN 'admin' THEN 10
        WHEN 'system_admin' THEN 11
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if one role has higher privileges than another
CREATE OR REPLACE FUNCTION role_has_higher_privileges(
    role1 user_role_hierarchy,
    role2 user_role_hierarchy
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_role_level(role1) > get_role_level(role2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get all roles with equal or lower privileges
CREATE OR REPLACE FUNCTION get_subordinate_roles(user_role user_role_hierarchy)
RETURNS user_role_hierarchy[] AS $$
DECLARE
    user_level INTEGER;
    subordinate_roles user_role_hierarchy[];
BEGIN
    user_level := get_role_level(user_role);
    
    SELECT ARRAY_AGG(enum_value::user_role_hierarchy)
    INTO subordinate_roles
    FROM (
        SELECT unnest(enum_range(NULL::user_role_hierarchy)) AS enum_value
    ) AS roles
    WHERE get_role_level(enum_value::user_role_hierarchy) <= user_level;
    
    RETURN subordinate_roles;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. POPULATE PERMISSION MATRIX
-- =====================================================

-- Insert comprehensive permission matrix
INSERT INTO role_permissions (role, resource, permission_type, scope_conditions, data_filters) VALUES

-- TRAINEE PERMISSIONS (Level 0) - Very restricted
('trainee', 'own_profile', 'read', '{"scope": "self"}', '{}'),
('trainee', 'own_profile', 'update', '{"scope": "self", "fields": ["phone", "emergency_contact"]}', '{}'),
('trainee', 'own_attendance', 'create', '{"scope": "self"}', '{}'),
('trainee', 'own_attendance', 'read', '{"scope": "self"}', '{}'),
('trainee', 'safety_documents', 'read', '{"document_type": ["safety", "training"]}', '{}'),
('trainee', 'site_info', 'read', '{"scope": "assigned_sites", "fields": ["name", "address", "safety_rules"]}', '{}'),

-- WORKER PERMISSIONS (Level 1) - Basic worker
('worker', 'own_profile', 'read', '{"scope": "self"}', '{}'),
('worker', 'own_profile', 'update', '{"scope": "self", "fields": ["phone", "emergency_contact", "preferences"]}', '{}'),
('worker', 'own_attendance', 'create', '{"scope": "self"}', '{}'),
('worker', 'own_attendance', 'read', '{"scope": "self"}', '{}'),
('worker', 'own_attendance', 'update', '{"scope": "self", "time_limit": "same_day"}', '{}'),
('worker', 'own_daily_reports', 'create', '{"scope": "self"}', '{}'),
('worker', 'own_daily_reports', 'read', '{"scope": "self"}', '{}'),
('worker', 'own_daily_reports', 'update', '{"scope": "self", "time_limit": "24_hours"}', '{}'),
('worker', 'site_documents', 'read', '{"document_type": ["safety", "work_instructions", "schedules"]}', '{}'),
('worker', 'team_attendance', 'read', '{"scope": "same_team"}', '{}'),
('worker', 'materials', 'read', '{"scope": "assigned_sites"}', '{}'),

-- SKILLED WORKER PERMISSIONS (Level 2)
('skilled_worker', 'own_profile', 'read', '{"scope": "self"}', '{}'),
('skilled_worker', 'own_profile', 'update', '{"scope": "self"}', '{}'),
('skilled_worker', 'own_attendance', 'create', '{"scope": "self"}', '{}'),
('skilled_worker', 'own_attendance', 'read', '{"scope": "self"}', '{}'),
('skilled_worker', 'own_attendance', 'update', '{"scope": "self"}', '{}'),
('skilled_worker', 'own_daily_reports', 'create', '{"scope": "self"}', '{}'),
('skilled_worker', 'own_daily_reports', 'read', '{"scope": "self"}', '{}'),
('skilled_worker', 'own_daily_reports', 'update', '{"scope": "self"}', '{}'),
('skilled_worker', 'team_daily_reports', 'read', '{"scope": "same_team"}', '{}'),
('skilled_worker', 'site_documents', 'read', '{"scope": "assigned_sites"}', '{}'),
('skilled_worker', 'materials', 'read', '{"scope": "assigned_sites"}', '{}'),
('skilled_worker', 'material_requests', 'create', '{"scope": "assigned_sites", "max_value": 100000}', '{}'),

-- TEAM LEAD PERMISSIONS (Level 4)
('team_lead', 'team_profiles', 'read', '{"scope": "team_members"}', '{}'),
('team_lead', 'team_attendance', 'read', '{"scope": "team_members"}', '{}'),
('team_lead', 'team_attendance', 'update', '{"scope": "team_members", "time_limit": "same_day"}', '{}'),
('team_lead', 'team_daily_reports', 'read', '{"scope": "team_members"}', '{}'),
('team_lead', 'team_daily_reports', 'update', '{"scope": "team_members"}', '{}'),
('team_lead', 'team_daily_reports', 'approve', '{"scope": "team_members"}', '{}'),
('team_lead', 'site_documents', 'read', '{"scope": "assigned_sites"}', '{}'),
('team_lead', 'site_documents', 'create', '{"document_type": ["work_report", "safety_report"]}', '{}'),
('team_lead', 'materials', 'read', '{"scope": "assigned_sites"}', '{}'),
('team_lead', 'material_requests', 'create', '{"scope": "assigned_sites", "max_value": 500000}', '{}'),
('team_lead', 'material_requests', 'approve', '{"scope": "team_requests", "max_value": 200000}', '{}'),

-- SITE MANAGER PERMISSIONS (Level 7)
('site_manager', 'site_profiles', 'read', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_profiles', 'update', '{"scope": "assigned_sites", "max_role": "team_lead"}', '{}'),
('site_manager', 'site_attendance', 'read', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_attendance', 'update', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_daily_reports', 'read', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_daily_reports', 'update', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_daily_reports', 'approve', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_documents', 'create', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_documents', 'read', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_documents', 'update', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_documents', 'delete', '{"scope": "assigned_sites", "created_by": "self"}', '{}'),
('site_manager', 'materials', 'read', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'materials', 'update', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'material_requests', 'create', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'material_requests', 'approve', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'site_analytics', 'read', '{"scope": "assigned_sites"}', '{}'),
('site_manager', 'export_data', 'create', '{"scope": "assigned_sites", "max_size": 104857600}', '{}'), -- 100MB

-- ADMIN PERMISSIONS (Level 10)
('admin', 'all_profiles', 'read', '{}', '{}'),
('admin', 'all_profiles', 'create', '{}', '{}'),
('admin', 'all_profiles', 'update', '{"max_role": "site_manager"}', '{}'),
('admin', 'all_profiles', 'delete', '{"max_role": "site_manager"}', '{}'),
('admin', 'all_sites', 'create', '{}', '{}'),
('admin', 'all_sites', 'read', '{}', '{}'),
('admin', 'all_sites', 'update', '{}', '{}'),
('admin', 'all_sites', 'delete', '{}', '{}'),
('admin', 'all_attendance', 'read', '{}', '{}'),
('admin', 'all_attendance', 'update', '{}', '{}'),
('admin', 'all_daily_reports', 'read', '{}', '{}'),
('admin', 'all_daily_reports', 'update', '{}', '{}'),
('admin', 'all_daily_reports', 'approve', '{}', '{}'),
('admin', 'all_documents', 'create', '{}', '{}'),
('admin', 'all_documents', 'read', '{}', '{}'),
('admin', 'all_documents', 'update', '{}', '{}'),
('admin', 'all_documents', 'delete', '{}', '{}'),
('admin', 'all_materials', 'create', '{}', '{}'),
('admin', 'all_materials', 'read', '{}', '{}'),
('admin', 'all_materials', 'update', '{}', '{}'),
('admin', 'all_materials', 'delete', '{}', '{}'),
('admin', 'system_analytics', 'read', '{}', '{}'),
('admin', 'audit_logs', 'read', '{}', '{}'),
('admin', 'export_data', 'create', '{"max_size": 1073741824}', '{}'), -- 1GB
('admin', 'system_config', 'read', '{}', '{}'),
('admin', 'system_config', 'update', '{"exclude": ["security", "database"]}', '{}'),

-- SYSTEM ADMIN PERMISSIONS (Level 11) - Full access
('system_admin', 'all_data', 'create', '{}', '{}'),
('system_admin', 'all_data', 'read', '{}', '{}'),
('system_admin', 'all_data', 'update', '{}', '{}'),
('system_admin', 'all_data', 'delete', '{}', '{}'),
('system_admin', 'all_data', 'export', '{}', '{}'),
('system_admin', 'all_data', 'import', '{}', '{}'),
('system_admin', 'user_management', 'create', '{}', '{}'),
('system_admin', 'user_management', 'update', '{}', '{}'),
('system_admin', 'user_management', 'delete', '{}', '{}'),
('system_admin', 'system_config', 'read', '{}', '{}'),
('system_admin', 'system_config', 'update', '{}', '{}'),
('system_admin', 'audit_access', 'read', '{}', '{}'),
('system_admin', 'emergency_access', 'create', '{}', '{}');

-- =====================================================
-- 5. PERMISSION CHECKING FUNCTIONS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_permission_type TEXT,
    p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role_hierarchy;
    permission_record RECORD;
    has_permission BOOLEAN := false;
BEGIN
    -- Get user role
    SELECT role INTO user_role_val
    FROM profiles 
    WHERE id = p_user_id AND is_active = true;
    
    IF user_role_val IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check for direct permission match
    FOR permission_record IN 
        SELECT * FROM role_permissions 
        WHERE role = user_role_val 
        AND resource = p_resource 
        AND permission_type = p_permission_type 
        AND is_active = true
        ORDER BY priority DESC
    LOOP
        -- Evaluate scope conditions
        IF evaluate_permission_conditions(
            permission_record.scope_conditions, 
            p_context, 
            p_user_id
        ) THEN
            has_permission := true;
            EXIT;
        END IF;
    END LOOP;
    
    -- Check for wildcard permissions (all_data, all_*)
    IF NOT has_permission THEN
        FOR permission_record IN 
            SELECT * FROM role_permissions 
            WHERE role = user_role_val 
            AND (resource = 'all_data' OR resource LIKE 'all_%')
            AND permission_type = p_permission_type 
            AND is_active = true
            ORDER BY priority DESC
        LOOP
            has_permission := true;
            EXIT;
        END LOOP;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evaluate permission conditions
CREATE OR REPLACE FUNCTION evaluate_permission_conditions(
    conditions JSONB,
    context JSONB,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    condition_key TEXT;
    condition_value JSONB;
    user_sites UUID[];
BEGIN
    -- If no conditions, permission is granted
    IF conditions = '{}'::jsonb THEN
        RETURN true;
    END IF;
    
    -- Evaluate each condition
    FOR condition_key, condition_value IN SELECT * FROM jsonb_each(conditions)
    LOOP
        CASE condition_key
            WHEN 'scope' THEN
                CASE condition_value #>> '{}'
                    WHEN 'self' THEN
                        IF context->>'user_id' != user_id::text THEN
                            RETURN false;
                        END IF;
                    WHEN 'assigned_sites' THEN
                        -- Check if user has access to the site
                        SELECT ARRAY_AGG(site_id) INTO user_sites
                        FROM site_assignments 
                        WHERE user_id = user_id AND is_active = true;
                        
                        IF NOT (context->>'site_id')::uuid = ANY(user_sites) THEN
                            RETURN false;
                        END IF;
                    WHEN 'same_team' THEN
                        -- Implement team membership check
                        IF NOT check_same_team(user_id, (context->>'target_user_id')::uuid) THEN
                            RETURN false;
                        END IF;
                END CASE;
                
            WHEN 'max_value' THEN
                IF (context->>'amount')::numeric > (condition_value #>> '{}')::numeric THEN
                    RETURN false;
                END IF;
                
            WHEN 'time_limit' THEN
                CASE condition_value #>> '{}'
                    WHEN 'same_day' THEN
                        IF (context->>'created_date')::date != CURRENT_DATE THEN
                            RETURN false;
                        END IF;
                    WHEN '24_hours' THEN
                        IF (context->>'created_at')::timestamp < NOW() - INTERVAL '24 hours' THEN
                            RETURN false;
                        END IF;
                END CASE;
                
            WHEN 'document_type' THEN
                IF NOT (context->>'document_type') = ANY(
                    SELECT jsonb_array_elements_text(condition_value)
                ) THEN
                    RETURN false;
                END IF;
                
            WHEN 'max_role' THEN
                -- Check if target user role is within allowed range
                DECLARE
                    target_role user_role_hierarchy;
                    max_allowed_role user_role_hierarchy;
                BEGIN
                    SELECT role INTO target_role 
                    FROM profiles 
                    WHERE id = (context->>'target_user_id')::uuid;
                    
                    max_allowed_role := (condition_value #>> '{}')::user_role_hierarchy;
                    
                    IF get_role_level(target_role) > get_role_level(max_allowed_role) THEN
                        RETURN false;
                    END IF;
                END;
        END CASE;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if users are on the same team
CREATE OR REPLACE FUNCTION check_same_team(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user1_sites UUID[];
    user2_sites UUID[];
    common_sites UUID[];
BEGIN
    -- Get sites for both users
    SELECT ARRAY_AGG(site_id) INTO user1_sites
    FROM site_assignments 
    WHERE user_id = user1_id AND is_active = true;
    
    SELECT ARRAY_AGG(site_id) INTO user2_sites
    FROM site_assignments 
    WHERE user_id = user2_id AND is_active = true;
    
    -- Check for common sites
    SELECT ARRAY(
        SELECT unnest(user1_sites) 
        INTERSECT 
        SELECT unnest(user2_sites)
    ) INTO common_sites;
    
    RETURN array_length(common_sites, 1) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. RLS POLICY FUNCTIONS
-- =====================================================

-- Function to check if user can access site data
CREATE OR REPLACE FUNCTION user_can_access_site(site_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role_hierarchy;
    user_sites UUID[];
BEGIN
    -- Get current user role
    SELECT role INTO user_role_val
    FROM profiles 
    WHERE id = auth.uid() AND is_active = true;
    
    -- System admin and admin have access to all sites
    IF user_role_val IN ('system_admin', 'admin') THEN
        RETURN true;
    END IF;
    
    -- Check if user is assigned to the site
    IF EXISTS (
        SELECT 1 FROM site_assignments 
        WHERE user_id = auth.uid() 
        AND site_id = site_id 
        AND is_active = true
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ENHANCED RLS POLICIES WITH RBAC
-- =====================================================

-- Drop existing policies to recreate with RBAC
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Profiles access with RBAC
CREATE POLICY "profiles_rbac_select" ON profiles
FOR SELECT USING (
    -- Own profile
    id = auth.uid()
    OR
    -- Admin access
    check_user_permission(auth.uid(), 'all_profiles', 'read', '{}')
    OR
    -- Site manager access to site members
    (
        check_user_permission(auth.uid(), 'site_profiles', 'read', '{}')
        AND EXISTS (
            SELECT 1 FROM site_assignments sa1, site_assignments sa2
            WHERE sa1.user_id = auth.uid() 
            AND sa2.user_id = profiles.id
            AND sa1.site_id = sa2.site_id
            AND sa1.is_active = true 
            AND sa2.is_active = true
        )
    )
);

CREATE POLICY "profiles_rbac_update" ON profiles
FOR UPDATE USING (
    -- Own profile with restricted fields
    (id = auth.uid() AND check_user_permission(auth.uid(), 'own_profile', 'update', '{}'))
    OR
    -- Admin access
    check_user_permission(auth.uid(), 'all_profiles', 'update', '{}')
    OR
    -- Site manager access with role restrictions
    (
        check_user_permission(auth.uid(), 'site_profiles', 'update', jsonb_build_object('target_user_id', id))
        AND user_can_access_site((SELECT site_id FROM site_assignments WHERE user_id = profiles.id AND is_active = true LIMIT 1))
    )
);

-- =====================================================
-- 8. RBAC AUDIT AND MONITORING
-- =====================================================

-- Table to log permission checks
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    resource TEXT NOT NULL,
    permission_type TEXT NOT NULL,
    context JSONB,
    result BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for permission audit log
CREATE INDEX IF NOT EXISTS idx_permission_audit_user_date ON permission_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_audit_denied ON permission_audit_log(result, created_at DESC) WHERE result = false;

-- Function to log permission checks
CREATE OR REPLACE FUNCTION log_permission_check(
    p_user_id UUID,
    p_resource TEXT,
    p_permission_type TEXT,
    p_context JSONB,
    p_result BOOLEAN
)
RETURNS void AS $$
BEGIN
    INSERT INTO permission_audit_log (
        user_id, resource, permission_type, context, result,
        ip_address, user_agent
    ) VALUES (
        p_user_id, p_resource, p_permission_type, p_context, p_result,
        get_client_ip(), get_user_agent()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. PERMISSION MANAGEMENT INTERFACE
-- =====================================================

-- View for permission summary by role
CREATE OR REPLACE VIEW role_permission_summary AS
SELECT 
    rp.role,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN rp.permission_type = 'read' THEN 1 END) as read_permissions,
    COUNT(CASE WHEN rp.permission_type = 'create' THEN 1 END) as create_permissions,
    COUNT(CASE WHEN rp.permission_type = 'update' THEN 1 END) as update_permissions,
    COUNT(CASE WHEN rp.permission_type = 'delete' THEN 1 END) as delete_permissions,
    COUNT(CASE WHEN rp.permission_type IN ('approve', 'manage_users', 'system_config') THEN 1 END) as admin_permissions,
    ARRAY_AGG(DISTINCT rp.resource ORDER BY rp.resource) as resources
FROM role_permissions rp
WHERE rp.is_active = true
GROUP BY rp.role
ORDER BY get_role_level(rp.role);

-- Function to get user's effective permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(
    resource TEXT,
    permission_type TEXT,
    scope_conditions JSONB,
    granted_by TEXT
) AS $$
DECLARE
    user_role_val user_role_hierarchy;
BEGIN
    -- Get user role
    SELECT role INTO user_role_val
    FROM profiles 
    WHERE id = p_user_id AND is_active = true;
    
    IF user_role_val IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        rp.resource,
        rp.permission_type,
        rp.scope_conditions,
        rp.role::text as granted_by
    FROM role_permissions rp
    WHERE rp.role = user_role_val 
    AND rp.is_active = true
    ORDER BY rp.resource, rp.permission_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. COMPLETION AND VERIFICATION
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for RBAC tables
CREATE POLICY "role_permissions_admin_access" ON role_permissions
FOR ALL USING (
    check_user_permission(auth.uid(), 'system_config', 'read', '{}')
);

CREATE POLICY "permission_audit_admin_access" ON permission_audit_log
FOR SELECT USING (
    check_user_permission(auth.uid(), 'audit_access', 'read', '{}')
    OR user_id = auth.uid()
);

-- Log RBAC deployment
INSERT INTO activity_logs (
    entity_type, entity_id, action, details, severity
) VALUES (
    'system', 'rbac_deployment', 'DEPLOYMENT',
    jsonb_build_object(
        'migration', '602_production_rbac.sql',
        'roles_configured', (SELECT COUNT(DISTINCT role) FROM role_permissions),
        'permissions_created', (SELECT COUNT(*) FROM role_permissions),
        'features', jsonb_build_array(
            'hierarchical_roles', 'permission_matrix', 'dynamic_conditions',
            'audit_logging', 'rbac_policies'
        )
    ),
    'INFO'
);

-- Verification query
SELECT 'Production RBAC system deployed successfully' as status,
       (SELECT COUNT(DISTINCT role) FROM role_permissions) as roles_configured,
       (SELECT COUNT(*) FROM role_permissions WHERE is_active = true) as active_permissions,
       (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('profiles', 'role_permissions', 'permission_audit_log')) as rbac_policies;