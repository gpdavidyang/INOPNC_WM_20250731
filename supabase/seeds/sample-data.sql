-- 샘플 데이터 생성 스크립트
-- RLS를 일시적으로 비활성화하여 데이터 삽입

-- 기존 데이터 정리 (외래키 제약 순서 고려)
DELETE FROM attendance_records;
DELETE FROM daily_reports;
DELETE FROM site_assignments;
DELETE FROM sites;

-- 현장 데이터 삽입
INSERT INTO sites (
    name, address, description, work_process, work_section, component_name,
    manager_name, construction_manager_phone, safety_manager_name, safety_manager_phone,
    accommodation_name, accommodation_address, status, start_date, end_date
) VALUES 
    ('강남 A현장', '서울시 강남구 테헤란로 456', '오피스텔 건설 현장', 
     '슬라브 타설', '지하 1층', '기둥 C1-C5 구간',
     '김현장', '010-1234-5678', '박안전', '010-2345-6789',
     '강남 숙소', '서울시 강남구 역삼로 123', 'active', '2024-01-15', '2025-12-31'),
    
    ('서초 B현장', '서울시 서초구 서초대로 789', '아파트 건설 현장',
     '철근 배근', '지상 3층', '보 B10-B15 구간', 
     '이현장', '010-3456-7890', '최안전', '010-4567-8901',
     '서초 숙소', '서울시 서초구 반포대로 456', 'active', '2024-03-01', '2026-02-28'),
    
    ('송파 C현장', '서울시 송파구 올림픽로 321', '상업시설 건설 현장',
     '마감', 'B동 5층', '내벽 마감재',
     '정현장', '010-5678-9012', '한안전', '010-6789-0123', 
     '송파 숙소', '서울시 송파구 잠실로 789', 'active', '2024-06-01', '2025-05-31'),
    
    ('완료된 D현장', '서울시 마포구 월드컵로 654', '완료된 프로젝트',
     '준공', '전체', '최종 점검',
     '완현장', '010-7890-1234', '종안전', '010-8901-2345',
     NULL, NULL, 'completed', '2023-01-01', '2024-06-30');

-- 사용자 현장 배정 (현재 활성 사용자들)
-- 강남 A현장에 모든 사용자 배정
INSERT INTO site_assignments (user_id, site_id, assigned_date, is_active, role)
SELECT 
    p.id as user_id,
    s.id as site_id,
    CURRENT_DATE as assigned_date,
    true as is_active,
    CASE 
        WHEN p.role IN ('admin', 'system_admin', 'site_manager') THEN 'site_manager'
        WHEN p.role = 'customer_manager' THEN 'supervisor'
        ELSE 'worker'
    END as role
FROM profiles p
CROSS JOIN (SELECT id FROM sites WHERE name = '강남 A현장' LIMIT 1) s;

-- 일부 사용자들에게 다른 현장도 배정 (다양성을 위해)
INSERT INTO site_assignments (user_id, site_id, assigned_date, is_active, role)
SELECT 
    p.id as user_id,
    s.id as site_id,
    CURRENT_DATE as assigned_date,
    false as is_active, -- 비활성 (과거 이력)
    'worker' as role
FROM profiles p
CROSS JOIN (SELECT id FROM sites WHERE name = '서초 B현장' LIMIT 1) s
WHERE p.email LIKE '%worker%' OR p.email LIKE '%manager%'
LIMIT 2;

-- 작업일지 데이터 생성 (최근 30일)
DO $$
DECLARE
    site_record RECORD;
    user_record RECORD;
    work_date DATE;
    member_names TEXT[] := ARRAY['슬라브', '거더', '기둥', '보', '벽체'];
    process_types TEXT[] := ARRAY['균열', '면', '마감', '배근', '타설'];
BEGIN
    -- 활성 현장들에 대해서만
    FOR site_record IN SELECT id FROM sites WHERE status = 'active' LOOP
        -- 최근 30일 동안
        FOR i IN 0..29 LOOP
            work_date := CURRENT_DATE - i;
            
            -- 주말 제외
            IF EXTRACT(DOW FROM work_date) NOT IN (0, 6) THEN
                -- 80% 확률로 작업일지 생성
                IF random() > 0.2 THEN
                    -- 랜덤 사용자 선택
                    SELECT id INTO user_record FROM profiles ORDER BY random() LIMIT 1;
                    
                    INSERT INTO daily_reports (
                        site_id, work_date, member_name, process_type,
                        total_workers, npc1000_incoming, npc1000_used, npc1000_remaining,
                        issues, status, created_by, submitted_by
                    ) VALUES (
                        site_record.id,
                        work_date,
                        member_names[floor(random() * array_length(member_names, 1)) + 1],
                        process_types[floor(random() * array_length(process_types, 1)) + 1],
                        floor(random() * 20) + 5, -- 5-25명
                        floor(random() * 100) + 50, -- 50-150
                        floor(random() * 80) + 20, -- 20-100
                        floor(random() * 50) + 10, -- 10-60
                        CASE WHEN random() > 0.7 THEN '특이사항 없음' ELSE NULL END,
                        CASE WHEN random() > 0.3 THEN 'submitted' ELSE 'draft' END,
                        user_record,
                        user_record
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 출근 기록 생성 (최근 14일)
DO $$
DECLARE
    assignment_record RECORD;
    work_date DATE;
    check_in_hour INTEGER;
    work_hours NUMERIC;
    check_out_hour INTEGER;
BEGIN
    -- 활성 배정들에 대해
    FOR assignment_record IN SELECT user_id, site_id FROM site_assignments WHERE is_active = true LOOP
        -- 최근 14일 동안
        FOR i IN 0..13 LOOP
            work_date := CURRENT_DATE - i;
            
            -- 주말 제외
            IF EXTRACT(DOW FROM work_date) NOT IN (0, 6) THEN
                -- 90% 출근률
                IF random() > 0.1 THEN
                    check_in_hour := 7 + floor(random() * 2); -- 7-8시
                    work_hours := 8 + random() * 2; -- 8-10시간
                    check_out_hour := check_in_hour + floor(work_hours);
                    
                    INSERT INTO attendance_records (
                        user_id, site_id, work_date, 
                        check_in_time, check_out_time,
                        work_hours, overtime_hours, status
                    ) VALUES (
                        assignment_record.user_id,
                        assignment_record.site_id,
                        work_date,
                        (check_in_hour || ':' || lpad(floor(random() * 60)::text, 2, '0') || ':00')::TIME,
                        (least(check_out_hour, 23) || ':' || lpad(floor(random() * 60)::text, 2, '0') || ':00')::TIME,
                        round(work_hours * 10) / 10,
                        greatest(0, round((work_hours - 8) * 10) / 10),
                        'present'
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 데이터 생성 결과 확인
SELECT 
    'Sites' as table_name, 
    COUNT(*) as record_count 
FROM sites
UNION ALL
SELECT 
    'Site Assignments', 
    COUNT(*) 
FROM site_assignments
UNION ALL
SELECT 
    'Daily Reports', 
    COUNT(*) 
FROM daily_reports
UNION ALL
SELECT 
    'Attendance Records', 
    COUNT(*) 
FROM attendance_records;