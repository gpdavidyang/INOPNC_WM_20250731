-- Fix Construction RLS Policies
-- 건설 현장 특성에 맞는 계층적 데이터 접근 정책 구현

-- ==========================================
-- 1. 기존 정책 정리
-- ==========================================

-- 기존 RLS 정책들 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can create own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can view attendance based on role" ON attendance_records;
DROP POLICY IF EXISTS "attendance_view_own" ON attendance_records;
DROP POLICY IF EXISTS "attendance_manage_managers" ON attendance_records;
DROP POLICY IF EXISTS "Users can view attendance records" ON attendance_records;

DROP POLICY IF EXISTS "Daily reports viewable by site members" ON daily_reports;
DROP POLICY IF EXISTS "Workers can create own daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Workers can update own draft reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can view reports based on role" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_select_site" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_insert_workers" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_update_own_or_manager" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_approve_managers" ON daily_reports;
DROP POLICY IF EXISTS "Users can view their site data" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_select_all" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_insert_auth" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_update_own" ON daily_reports;
DROP POLICY IF EXISTS "daily_reports_delete_own" ON daily_reports;
DROP POLICY IF EXISTS "Users can view all reports" ON daily_reports;

-- ==========================================
-- 2. 핵심 함수 재정의 (충돌 방지)
-- ==========================================

-- 사용자 역할 확인 함수
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 사용자가 시스템 관리자인지 확인
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'system_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 사용자가 관리자 이상인지 확인
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'system_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 사용자가 현장관리자 이상인지 확인
CREATE OR REPLACE FUNCTION is_site_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('site_manager', 'admin', 'system_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 사용자 소속 조직 ID 반환
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 사용자가 접근 가능한 사이트 ID 목록 (계층적 권한)
CREATE OR REPLACE FUNCTION get_accessible_site_ids()
RETURNS UUID[] AS $$
DECLARE
    user_role_val TEXT;
    user_org_id UUID;
BEGIN
    user_role_val := get_user_role();
    user_org_id := get_user_organization_id();
    
    -- 시스템 관리자: 모든 사이트 접근 가능
    IF user_role_val = 'system_admin' THEN
        RETURN ARRAY(SELECT id FROM sites);
    END IF;
    
    -- 관리자: 소속 조직의 모든 사이트
    IF user_role_val = 'admin' THEN
        RETURN ARRAY(SELECT id FROM sites WHERE organization_id = user_org_id);
    END IF;
    
    -- 현장관리자: 배정된 사이트들 + 소속 조직 사이트들
    IF user_role_val = 'site_manager' THEN
        RETURN ARRAY(
            SELECT DISTINCT site_id FROM (
                -- 직접 배정된 사이트
                SELECT site_id FROM user_sites WHERE user_id = auth.uid() AND is_active = true
                UNION
                -- profiles 테이블의 site_id (레거시)
                SELECT site_id FROM profiles WHERE id = auth.uid() AND site_id IS NOT NULL
                UNION
                -- 소속 조직의 모든 사이트
                SELECT id as site_id FROM sites WHERE organization_id = user_org_id
            ) accessible_sites
            WHERE site_id IS NOT NULL
        );
    END IF;
    
    -- 일반 작업자/파트너사: 배정된 사이트만
    RETURN ARRAY(
        SELECT DISTINCT site_id FROM (
            SELECT site_id FROM user_sites WHERE user_id = auth.uid() AND is_active = true
            UNION
            SELECT site_id FROM profiles WHERE id = auth.uid() AND site_id IS NOT NULL
        ) user_sites_combined
        WHERE site_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 특정 사이트에 접근 가능한지 확인
CREATE OR REPLACE FUNCTION can_access_site(site_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN site_id = ANY(get_accessible_site_ids());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- 3. ATTENDANCE_RECORDS 새로운 RLS 정책
-- ==========================================

-- 출근 기록 조회: 계층적 권한
CREATE POLICY "attendance_records_select_hierarchical" 
ON attendance_records FOR SELECT 
USING (
    -- 시스템 관리자: 모든 출근 기록 조회
    is_system_admin() 
    OR
    -- 관리자/현장관리자: 접근 가능한 사이트의 출근 기록
    (is_site_manager_or_above() AND can_access_site(site_id))
    OR  
    -- 본인 출근 기록
    (user_id = auth.uid())
);

-- 출근 기록 생성: 본인 또는 관리자
CREATE POLICY "attendance_records_insert_authorized" 
ON attendance_records FOR INSERT 
WITH CHECK (
    user_id = auth.uid() 
    OR 
    (is_site_manager_or_above() AND can_access_site(site_id))
);

-- 출근 기록 수정: 본인 또는 관리자
CREATE POLICY "attendance_records_update_authorized" 
ON attendance_records FOR UPDATE 
USING (
    user_id = auth.uid() 
    OR 
    (is_site_manager_or_above() AND can_access_site(site_id))
);

-- ==========================================
-- 4. DAILY_REPORTS 새로운 RLS 정책  
-- ==========================================

-- 작업일지 조회: 계층적 권한
CREATE POLICY "daily_reports_select_hierarchical" 
ON daily_reports FOR SELECT 
USING (
    -- 시스템 관리자: 모든 작업일지 조회
    is_system_admin()
    OR
    -- 관리자/현장관리자: 접근 가능한 사이트의 작업일지
    (is_site_manager_or_above() AND can_access_site(site_id))
    OR
    -- 본인이 작성한 작업일지 
    (created_by = auth.uid())
);

-- 작업일지 생성: 배정된 사이트만
CREATE POLICY "daily_reports_insert_assigned_sites" 
ON daily_reports FOR INSERT 
WITH CHECK (can_access_site(site_id));

-- 작업일지 수정: 작성자 또는 관리자
CREATE POLICY "daily_reports_update_authorized" 
ON daily_reports FOR UPDATE 
USING (
    created_by = auth.uid() 
    OR 
    (is_site_manager_or_above() AND can_access_site(site_id))
);

-- ==========================================
-- 5. PROFILES 테이블 정책 개선
-- ==========================================

-- 기존 정책 정리
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own_org" ON profiles;

-- 프로필 조회: 계층적 권한
CREATE POLICY "profiles_select_hierarchical" 
ON profiles FOR SELECT 
USING (
    -- 본인 프로필
    id = auth.uid()
    OR
    -- 시스템 관리자: 모든 프로필
    is_system_admin()
    OR  
    -- 관리자: 같은 조직 프로필
    (is_admin_or_above() AND organization_id = get_user_organization_id())
    OR
    -- 현장관리자: 같은 사이트 프로필
    (is_site_manager_or_above() AND (
        site_id = ANY(get_accessible_site_ids()) 
        OR organization_id = get_user_organization_id()
    ))
);

-- 프로필 수정: 본인 또는 관리자
CREATE POLICY "profiles_update_authorized" 
ON profiles FOR UPDATE 
USING (
    id = auth.uid() 
    OR 
    is_admin_or_above()
);

-- ==========================================
-- 6. SITES 테이블 정책 개선
-- ==========================================

-- 기존 정책 정리
DROP POLICY IF EXISTS "Users can view sites" ON sites;
DROP POLICY IF EXISTS "sites_select_org" ON sites;

-- 사이트 조회: 계층적 권한
CREATE POLICY "sites_select_hierarchical" 
ON sites FOR SELECT 
USING (
    id = ANY(get_accessible_site_ids())
);

-- ==========================================
-- 7. 테스트 및 검증용 함수
-- ==========================================

-- RLS 정책 테스트용 함수 (디버깅)
CREATE OR REPLACE FUNCTION debug_user_access()
RETURNS TABLE(
    user_email TEXT,
    user_role TEXT,
    accessible_sites UUID[],
    organization_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.email,
        p.role,
        get_accessible_site_ids() as accessible_sites,
        p.organization_id
    FROM profiles p 
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. 인덱스 최적화 (성능 향상)
-- ==========================================

-- RLS 함수 성능 향상을 위한 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_org 
ON profiles(role, organization_id) WHERE role IN ('admin', 'system_admin', 'site_manager');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sites_active 
ON user_sites(user_id, site_id) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_user_site 
ON attendance_records(user_id, site_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_reports_site_creator 
ON daily_reports(site_id, created_by);

-- ==========================================
-- 9. 권한 부여
-- ==========================================

-- 익명 사용자도 함수 실행 가능 (필요한 경우만)
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_system_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_admin_or_above() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_site_manager_or_above() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_accessible_site_ids() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_access_site(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION debug_user_access() TO authenticated;

COMMENT ON MIGRATION IS 'Construction-specific hierarchical RLS policies with proper role-based access control';