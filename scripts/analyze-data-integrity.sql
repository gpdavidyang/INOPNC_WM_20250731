-- =============================================================================
-- 데이터베이스 무결성 진단 스크립트
-- INOPNC 작업 관리 시스템
-- 생성일: 2025-08-24
-- =============================================================================

\echo '🔍 데이터베이스 무결성 분석 시작...'
\echo '============================================='

-- 1. 기본 테이블 정보 확인
\echo '\n1️⃣ 기본 테이블 현황'
\echo '=================='

SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity as has_rls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. 각 테이블 레코드 수 확인
\echo '\n2️⃣ 테이블별 레코드 수'
\echo '=================='

SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations  
UNION ALL
SELECT 'sites', COUNT(*) FROM sites
UNION ALL
SELECT 'site_assignments', COUNT(*) FROM site_assignments
UNION ALL
SELECT 'daily_reports', COUNT(*) FROM daily_reports
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'markup_documents', COUNT(*) FROM markup_documents
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY record_count DESC;

-- 3. Orphaned Records 분석
\echo '\n3️⃣ Orphaned Records 분석'
\echo '======================='

-- 3.1 Profiles without auth users
\echo '\n📋 Profiles without auth users:'
SELECT 
    COUNT(*) as orphaned_profiles_count,
    'profiles referencing non-existent auth.users' as description
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- Show first 5 orphaned profiles
\echo '\n처음 5개 orphaned profiles:'
SELECT id, email, full_name, role, created_at 
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
)
LIMIT 5;

-- 3.2 Site assignments without valid users
\echo '\n📋 Site assignments without valid users:'
SELECT 
    COUNT(*) as orphaned_site_assignments,
    'site_assignments with invalid user_id' as description
FROM site_assignments sa
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = sa.user_id
);

-- 3.3 Site assignments without valid sites  
\echo '\n📋 Site assignments without valid sites:'
SELECT 
    COUNT(*) as orphaned_site_assignments,
    'site_assignments with invalid site_id' as description
FROM site_assignments sa
WHERE site_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM sites s WHERE s.id = sa.site_id
);

-- 3.4 Daily reports without valid sites
\echo '\n📋 Daily reports without valid sites:'
SELECT 
    COUNT(*) as orphaned_daily_reports,
    'daily_reports with invalid site_id' as description
FROM daily_reports dr
WHERE site_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM sites s WHERE s.id = dr.site_id
);

-- 3.5 Daily reports without valid creators
\echo '\n📋 Daily reports without valid creators:'
SELECT 
    COUNT(*) as orphaned_daily_reports,
    'daily_reports with invalid created_by' as description
FROM daily_reports dr
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = dr.created_by
);

-- 3.6 Attendance records without valid users
\echo '\n📋 Attendance records without valid users:'
SELECT 
    COUNT(*) as orphaned_attendance,
    'attendance_records with invalid user_id' as description
FROM attendance_records ar
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = ar.user_id
);

-- 3.7 Documents without valid owners
\echo '\n📋 Documents without valid owners:'
SELECT 
    COUNT(*) as orphaned_documents,
    'documents with invalid owner_id' as description
FROM documents d
WHERE owner_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = d.owner_id
);

-- 3.8 Markup documents without valid creators
\echo '\n📋 Markup documents without valid creators:'
SELECT 
    COUNT(*) as orphaned_markup_docs,
    'markup_documents with invalid created_by' as description
FROM markup_documents md
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = md.created_by
);

-- 4. Foreign Key 제약조건 현황 
\echo '\n4️⃣ Foreign Key 제약조건 현황'
\echo '========================='

SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 5. 데이터 무결성 요약 리포트
\echo '\n5️⃣ 데이터 무결성 요약 리포트'
\echo '========================='

WITH integrity_summary AS (
    SELECT 
        'profiles_without_auth' as issue_type,
        COUNT(*) as problem_count
    FROM profiles p
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
    
    UNION ALL
    
    SELECT 
        'site_assignments_invalid_user',
        COUNT(*)
    FROM site_assignments sa
    WHERE user_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = sa.user_id)
    
    UNION ALL
    
    SELECT 
        'site_assignments_invalid_site',
        COUNT(*)
    FROM site_assignments sa
    WHERE site_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM sites s WHERE s.id = sa.site_id)
    
    UNION ALL
    
    SELECT 
        'daily_reports_invalid_site',
        COUNT(*)
    FROM daily_reports dr
    WHERE site_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM sites s WHERE s.id = dr.site_id)
    
    UNION ALL
    
    SELECT 
        'daily_reports_invalid_creator',
        COUNT(*)
    FROM daily_reports dr
    WHERE created_by IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = dr.created_by)
    
    UNION ALL
    
    SELECT 
        'documents_invalid_owner',
        COUNT(*)
    FROM documents d
    WHERE owner_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = d.owner_id)
)
SELECT 
    issue_type,
    problem_count,
    CASE 
        WHEN problem_count = 0 THEN '✅ OK'
        WHEN problem_count < 10 THEN '⚠️ Minor Issue'
        WHEN problem_count < 50 THEN '🔴 Major Issue'
        ELSE '💥 Critical Issue'
    END as severity
FROM integrity_summary
ORDER BY problem_count DESC;

-- 6. 권장 정리 순서
\echo '\n6️⃣ 권장 정리 순서'
\echo '================'

\echo '다음 순서로 정리를 진행하는 것을 권장합니다:'
\echo '1. profiles 테이블: auth.users와 연결되지 않은 레코드 삭제'  
\echo '2. site_assignments: 무효한 user_id 또는 site_id 참조 삭제'
\echo '3. daily_reports: 무효한 site_id 또는 created_by 참조 삭제'
\echo '4. attendance_records: 무효한 user_id 참조 삭제'
\echo '5. documents: 무효한 owner_id 참조 삭제'
\echo '6. markup_documents: 무효한 created_by 참조 삭제'
\echo ''
\echo '❗ 주의: 정리 전 반드시 전체 백업을 생성하세요!'

\echo '\n🔍 데이터베이스 무결성 분석 완료!'
\echo '============================================='