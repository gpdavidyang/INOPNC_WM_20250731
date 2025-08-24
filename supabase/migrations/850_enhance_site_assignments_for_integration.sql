-- 850_enhance_site_assignments_for_integration.sql
-- 현장-사용자 통합 관리 시스템을 위한 site_assignments 테이블 확장

-- 1. site_assignments 테이블에 추가 컬럼 추가
ALTER TABLE site_assignments 
ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(50) DEFAULT 'permanent' CHECK (assignment_type IN ('permanent', 'temporary', 'substitute')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 2. 성능 최적화를 위한 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_site_assignments_site_user_active ON site_assignments(site_id, user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_site_assignments_assignment_type ON site_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_site_assignments_date_range ON site_assignments(assigned_date, unassigned_date);

-- 3. 현장별 인력 현황 뷰 생성
CREATE OR REPLACE VIEW site_worker_summary AS
SELECT 
    s.id as site_id,
    s.name as site_name,
    s.address as site_address,
    s.status as site_status,
    COUNT(DISTINCT sa.user_id) FILTER (WHERE sa.is_active = true) as total_active_workers,
    COUNT(DISTINCT sa.user_id) FILTER (WHERE sa.is_active = true AND sa.role = 'site_manager') as managers_count,
    COUNT(DISTINCT sa.user_id) FILTER (WHERE sa.is_active = true AND sa.role = 'worker') as workers_count,
    COUNT(DISTINCT sa.user_id) FILTER (WHERE sa.is_active = true AND sa.role = 'customer_manager') as partners_count,
    COUNT(DISTINCT sa.user_id) FILTER (WHERE sa.created_at >= CURRENT_DATE - INTERVAL '7 days') as new_assignments_this_week,
    COUNT(DISTINCT sa.user_id) FILTER (WHERE sa.assignment_type = 'temporary') as temporary_workers,
    s.created_at,
    s.updated_at
FROM sites s
LEFT JOIN site_assignments sa ON s.id = sa.site_id
WHERE s.is_deleted = false OR s.is_deleted IS NULL
GROUP BY s.id, s.name, s.address, s.status, s.created_at, s.updated_at;

-- 4. 사용자별 현장 배정 상세 뷰 생성
CREATE OR REPLACE VIEW user_site_assignment_details AS
SELECT 
    p.id as user_id,
    p.full_name as user_name,
    p.email as user_email,
    p.role as user_global_role,
    p.phone as user_phone,
    p.status as user_status,
    sa.id as assignment_id,
    s.id as site_id,
    s.name as site_name,
    s.address as site_address,
    s.status as site_status,
    sa.role as site_role,
    sa.assignment_type,
    sa.assigned_date as start_date,
    sa.unassigned_date as end_date,
    sa.is_active,
    sa.notes as assignment_notes,
    approver.full_name as approved_by_name,
    sa.approved_at,
    sa.created_at as assignment_created_at,
    sa.updated_at as assignment_updated_at,
    -- 계산된 컬럼들
    CASE 
        WHEN sa.unassigned_date IS NULL THEN 'active'
        WHEN sa.unassigned_date > CURRENT_DATE THEN 'scheduled'
        ELSE 'completed'
    END as assignment_status,
    CASE 
        WHEN sa.unassigned_date IS NOT NULL THEN sa.unassigned_date - sa.assigned_date
        ELSE CURRENT_DATE - sa.assigned_date
    END as assignment_duration_days
FROM profiles p
LEFT JOIN site_assignments sa ON p.id = sa.user_id
LEFT JOIN sites s ON sa.site_id = s.id
LEFT JOIN profiles approver ON sa.approved_by = approver.id
WHERE (s.is_deleted = false OR s.is_deleted IS NULL) AND (p.status = 'active' OR p.status IS NULL)
ORDER BY p.full_name, sa.is_active DESC, sa.assigned_date DESC;

-- 5. 현장별 작업자 목록 함수 (페이지네이션 지원)
CREATE OR REPLACE FUNCTION get_site_workers(
    p_site_id UUID,
    p_active_only BOOLEAN DEFAULT true,
    p_search TEXT DEFAULT NULL,
    p_role_filter TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    site_role TEXT,
    assignment_type TEXT,
    assigned_date DATE,
    unassigned_date DATE,
    is_active BOOLEAN,
    assignment_notes TEXT,
    assignment_duration_days INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.email,
        p.phone,
        p.role,
        sa.role as site_role,
        sa.assignment_type,
        sa.assigned_date,
        sa.unassigned_date,
        sa.is_active,
        sa.notes as assignment_notes,
        CASE 
            WHEN sa.unassigned_date IS NOT NULL THEN (sa.unassigned_date - sa.assigned_date)
            ELSE (CURRENT_DATE - sa.assigned_date)
        END as assignment_duration_days
    FROM profiles p
    JOIN site_assignments sa ON p.id = sa.user_id
    WHERE sa.site_id = p_site_id
        AND (NOT p_active_only OR sa.is_active = true)
        AND (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%' OR p.email ILIKE '%' || p_search || '%')
        AND (p_role_filter IS NULL OR sa.role = p_role_filter)
        AND p.status = 'active'
    ORDER BY sa.is_active DESC, p.full_name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 6. 사용자별 현장 목록 함수 (페이지네이션 지원)
CREATE OR REPLACE FUNCTION get_user_sites(
    p_user_id UUID,
    p_active_only BOOLEAN DEFAULT true,
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    site_id UUID,
    site_name TEXT,
    site_address TEXT,
    site_status TEXT,
    site_role TEXT,
    assignment_type TEXT,
    assigned_date DATE,
    unassigned_date DATE,
    is_active BOOLEAN,
    assignment_notes TEXT,
    assignment_duration_days INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as site_id,
        s.name as site_name,
        s.address as site_address,
        s.status as site_status,
        sa.role as site_role,
        sa.assignment_type,
        sa.assigned_date,
        sa.unassigned_date,
        sa.is_active,
        sa.notes as assignment_notes,
        CASE 
            WHEN sa.unassigned_date IS NOT NULL THEN (sa.unassigned_date - sa.assigned_date)
            ELSE (CURRENT_DATE - sa.assigned_date)
        END as assignment_duration_days
    FROM sites s
    JOIN site_assignments sa ON s.id = sa.site_id
    WHERE sa.user_id = p_user_id
        AND (NOT p_active_only OR sa.is_active = true)
        AND (p_search IS NULL OR s.name ILIKE '%' || p_search || '%' OR s.address ILIKE '%' || p_search || '%')
        AND (s.is_deleted = false OR s.is_deleted IS NULL)
    ORDER BY sa.is_active DESC, sa.assigned_date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 7. 배정 가능한 작업자 검색 함수
CREATE OR REPLACE FUNCTION get_available_workers_for_site(
    p_site_id UUID,
    p_search TEXT DEFAULT NULL,
    p_role_filter TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    organization_name TEXT,
    current_sites_count INT,
    last_assignment_date DATE,
    is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.email,
        p.phone,
        p.role,
        o.name as organization_name,
        (SELECT COUNT(*) FROM site_assignments sa2 WHERE sa2.user_id = p.id AND sa2.is_active = true) as current_sites_count,
        (SELECT MAX(sa3.assigned_date) FROM site_assignments sa3 WHERE sa3.user_id = p.id) as last_assignment_date,
        NOT EXISTS (
            SELECT 1 FROM site_assignments sa4 
            WHERE sa4.user_id = p.id 
            AND sa4.site_id = p_site_id 
            AND sa4.is_active = true
        ) as is_available
    FROM profiles p
    LEFT JOIN organizations o ON p.organization_id = o.id
    WHERE p.status = 'active'
        AND p.role IN ('worker', 'site_manager', 'customer_manager')
        AND (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%' OR p.email ILIKE '%' || p_search || '%')
        AND (p_role_filter IS NULL OR p.role = p_role_filter)
        AND NOT EXISTS (
            SELECT 1 FROM site_assignments sa 
            WHERE sa.user_id = p.id 
            AND sa.site_id = p_site_id 
            AND sa.is_active = true
        )
    ORDER BY p.full_name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 8. 일괄 배정/해제 기능을 위한 함수
CREATE OR REPLACE FUNCTION bulk_assign_users_to_site(
    p_site_id UUID,
    p_user_ids UUID[],
    p_role TEXT DEFAULT 'worker',
    p_assignment_type TEXT DEFAULT 'permanent',
    p_notes TEXT DEFAULT NULL,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS TABLE (
    success_count INT,
    error_count INT,
    error_messages TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    success_cnt INT := 0;
    error_cnt INT := 0;
    error_msgs TEXT[] := ARRAY[]::TEXT[];
    error_msg TEXT;
BEGIN
    FOREACH user_id IN ARRAY p_user_ids
    LOOP
        BEGIN
            -- 이미 활성 배정이 있는지 확인
            IF EXISTS (
                SELECT 1 FROM site_assignments 
                WHERE site_id = p_site_id 
                AND user_id = user_id 
                AND is_active = true
            ) THEN
                error_cnt := error_cnt + 1;
                error_msgs := array_append(error_msgs, 'User ' || user_id || ' is already assigned to this site');
                CONTINUE;
            END IF;

            -- 새 배정 생성
            INSERT INTO site_assignments (
                site_id, 
                user_id, 
                role, 
                assignment_type, 
                notes, 
                approved_by,
                approved_at,
                is_active
            ) VALUES (
                p_site_id, 
                user_id, 
                p_role, 
                p_assignment_type, 
                p_notes, 
                p_assigned_by,
                NOW(),
                true
            );
            
            success_cnt := success_cnt + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_cnt := error_cnt + 1;
            GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
            error_msgs := array_append(error_msgs, 'User ' || user_id || ': ' || error_msg);
        END;
    END LOOP;
    
    RETURN QUERY SELECT success_cnt, error_cnt, error_msgs;
END;
$$;

-- 9. 뷰와 함수에 대한 권한 부여
GRANT SELECT ON site_worker_summary TO authenticated;
GRANT SELECT ON user_site_assignment_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_site_workers TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sites TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_workers_for_site TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_assign_users_to_site TO authenticated;

-- 10. 관리자 전용 RLS 정책 (뷰와 함수는 보안 정의자로 실행)
-- site_assignments 테이블에 대한 기존 정책은 유지하되, 관리자가 모든 작업 가능하도록 확인
DO $$
BEGIN
    -- 관리자 전체 접근 정책이 없다면 생성
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'site_assignments' 
        AND policyname = 'Admins can manage all site assignments'
    ) THEN
        CREATE POLICY "Admins can manage all site assignments"
        ON site_assignments FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'system_admin')
            )
        );
    END IF;
END $$;

-- 11. 테이블과 컬럼에 대한 설명 추가
COMMENT ON COLUMN site_assignments.assignment_type IS '배정 유형: permanent(정규), temporary(임시), substitute(대체)';
COMMENT ON COLUMN site_assignments.notes IS '배정 관련 특이사항이나 메모';
COMMENT ON COLUMN site_assignments.approved_by IS '배정을 승인한 관리자';
COMMENT ON COLUMN site_assignments.approved_at IS '배정 승인 일시';

COMMENT ON VIEW site_worker_summary IS '현장별 인력 현황 요약 뷰 - 대시보드 및 현장 관리에서 사용';
COMMENT ON VIEW user_site_assignment_details IS '사용자별 현장 배정 상세 정보 뷰 - 사용자 관리에서 사용';

COMMENT ON FUNCTION get_site_workers IS '특정 현장의 배정된 작업자 목록 조회 (검색, 필터링, 페이지네이션 지원)';
COMMENT ON FUNCTION get_user_sites IS '특정 사용자의 배정된 현장 목록 조회 (검색, 페이지네이션 지원)';
COMMENT ON FUNCTION get_available_workers_for_site IS '특정 현장에 배정 가능한 작업자 검색';
COMMENT ON FUNCTION bulk_assign_users_to_site IS '여러 사용자를 한 현장에 일괄 배정';