-- 현재 public 스키마의 모든 테이블 확인
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 전체 테이블 수 확인
SELECT COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public';

-- 혹시 다른 스키마에 테이블이 있는지 확인
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY schemaname;