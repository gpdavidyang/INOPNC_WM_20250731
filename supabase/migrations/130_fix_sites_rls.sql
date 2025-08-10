-- Fix sites RLS policies for proper access control
-- 사이트 테이블의 RLS 정책을 올바르게 설정

-- 1. 기존 정책들 삭제
DROP POLICY IF EXISTS "Users can view their site" ON sites;
DROP POLICY IF EXISTS "sites_select_assigned" ON sites;
DROP POLICY IF EXISTS "Sites are viewable by authenticated users" ON sites;
DROP POLICY IF EXISTS "Only admins can manage sites" ON sites;
DROP POLICY IF EXISTS "Users can view assigned sites" ON sites;
DROP POLICY IF EXISTS "Admins can manage sites" ON sites;
DROP POLICY IF EXISTS "sites_view_all_authenticated" ON sites;
DROP POLICY IF EXISTS "sites_manage_managers" ON sites;

-- 2. 간단하고 명확한 SELECT 정책 생성
-- 인증된 사용자는 모든 활성 사이트를 볼 수 있음 (작업일지 작성을 위해)
CREATE POLICY "authenticated_users_can_view_active_sites" ON sites
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND status = 'active'
    );

-- 3. 사이트 관리자와 시스템 관리자는 모든 사이트 관리 가능
CREATE POLICY "managers_can_manage_sites" ON sites
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('site_manager', 'admin', 'system_admin')
        )
    );

-- 4. 일반 작업자는 자신이 속한 사이트에 대해서만 INSERT/UPDATE 가능
CREATE POLICY "workers_can_update_assigned_sites" ON sites
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND (site_id = sites.id OR role IN ('site_manager', 'admin', 'system_admin'))
        )
    );

-- 5. 인덱스 확인 및 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_sites_active ON sites(status) WHERE status = 'active';