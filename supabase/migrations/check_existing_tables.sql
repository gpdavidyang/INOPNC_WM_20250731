-- 현재 public 스키마에 있는 모든 테이블 확인
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 현재 존재하는 모든 트리거 확인
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 현재 존재하는 모든 함수 확인
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- 현재 존재하는 모든 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public';