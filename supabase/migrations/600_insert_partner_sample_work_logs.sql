-- 600_insert_partner_sample_work_logs.sql
-- Insert sample submitted daily reports for partner access testing

-- =====================================================
-- Insert realistic submitted daily reports
-- =====================================================

-- Get site IDs for reference
DO $$
DECLARE
    site_a_id UUID;
    site_b_id UUID;
    site_c_id UUID;
    worker1_id UUID := '22222222-2222-2222-2222-222222222222'; -- 김철수
    worker2_id UUID := '33333333-3333-3333-3333-333333333333'; -- 이영호
    worker3_id UUID := '44444444-4444-4444-4444-444444444444'; -- 박민수
    worker4_id UUID := '55555555-5555-5555-5555-555555555555'; -- 최성훈
    worker5_id UUID := '66666666-6666-6666-6666-666666666666'; -- 정대현
    worker6_id UUID := '77777777-7777-7777-7777-777777777777'; -- 한지민
    worker7_id UUID := '88888888-8888-8888-8888-888888888888'; -- 송준호
BEGIN
    -- Get site IDs
    SELECT id INTO site_a_id FROM sites WHERE name = '강남 A현장' LIMIT 1;
    SELECT id INTO site_b_id FROM sites WHERE name = '송파 B현장' LIMIT 1;
    SELECT id INTO site_c_id FROM sites WHERE name = '송파 C현장' LIMIT 1;
    
    -- If sites don't exist, create fallback ones
    IF site_a_id IS NULL THEN
        INSERT INTO sites (id, name, address, organization_id, status)
        VALUES (gen_random_uuid(), '강남 A현장', '서울시 강남구', 
                (SELECT id FROM organizations LIMIT 1), 'active')
        RETURNING id INTO site_a_id;
    END IF;
    
    IF site_b_id IS NULL THEN
        INSERT INTO sites (id, name, address, organization_id, status)
        VALUES (gen_random_uuid(), '송파 B현장', '서울시 송파구', 
                (SELECT id FROM organizations LIMIT 1), 'active')
        RETURNING id INTO site_b_id;
    END IF;
    
    IF site_c_id IS NULL THEN
        INSERT INTO sites (id, name, address, organization_id, status)
        VALUES (gen_random_uuid(), '송파 C현장', '서울시 송파구', 
                (SELECT id FROM organizations LIMIT 1), 'active')
        RETURNING id INTO site_c_id;
    END IF;

    -- Insert submitted daily reports for the past month
    INSERT INTO daily_reports (
        id,
        site_id,
        work_date,
        member_name,
        process_type,
        total_workers,
        npc1000_incoming,
        npc1000_used,
        npc1000_remaining,
        issues,
        status,
        created_by,
        submitted_at,
        created_at,
        updated_at
    ) VALUES
        -- 강남 A현장 reports
        (gen_random_uuid(), site_a_id, CURRENT_DATE - INTERVAL '2 days', '기초 콘크리트', '타설 작업', 12, 500, 250, 250, '콘크리트 타설 중 일부 균열 발생, 보수 완료', 'submitted', worker1_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
        
        (gen_random_uuid(), site_a_id, CURRENT_DATE - INTERVAL '5 days', '방수', '작업 진행', 5, 300, 120, 180, '우천으로 인한 작업 일부 지연', 'submitted', worker3_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
        
        (gen_random_uuid(), site_a_id, CURRENT_DATE - INTERVAL '12 days', '슬라브', '타설 작업', 18, 800, 450, 350, '타설 작업 완료, 양생 진행 중', 'submitted', worker1_id, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
        
        (gen_random_uuid(), site_a_id, CURRENT_DATE - INTERVAL '15 days', '지하층 골조', '작업', 20, 600, 380, 220, NULL, 'submitted', worker2_id, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
        
        (gen_random_uuid(), site_a_id, CURRENT_DATE - INTERVAL '20 days', '배관 설치', '작업', 8, 250, 150, 100, '배관 규격 불일치로 재작업 필요', 'submitted', worker1_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
        
        -- 송파 B현장 reports  
        (gen_random_uuid(), site_b_id, CURRENT_DATE - INTERVAL '3 days', '철골 조립', '작업', 8, 350, 180, 170, NULL, 'submitted', worker4_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
        
        (gen_random_uuid(), site_b_id, CURRENT_DATE - INTERVAL '10 days', '전기 배선', '작업', 6, 200, 95, 105, NULL, 'submitted', worker5_id, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
        
        (gen_random_uuid(), site_b_id, CURRENT_DATE - INTERVAL '18 days', '외벽 미장', '작업', 10, 400, 220, 180, NULL, 'submitted', worker4_id, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
        
        -- 송파 C현장 reports
        (gen_random_uuid(), site_c_id, CURRENT_DATE - INTERVAL '7 days', '내부 마감', '작업', 15, 500, 320, 180, NULL, 'submitted', worker6_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
        
        (gen_random_uuid(), site_c_id, CURRENT_DATE - INTERVAL '25 days', '천장 마감', '작업', 12, 450, 280, 170, NULL, 'submitted', worker7_id, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days')
    
    ON CONFLICT (site_id, work_date, created_by) DO UPDATE SET
        member_name = EXCLUDED.member_name,
        process_type = EXCLUDED.process_type,
        total_workers = EXCLUDED.total_workers,
        npc1000_incoming = EXCLUDED.npc1000_incoming,
        npc1000_used = EXCLUDED.npc1000_used,
        npc1000_remaining = EXCLUDED.npc1000_remaining,
        issues = EXCLUDED.issues,
        status = EXCLUDED.status,
        submitted_at = EXCLUDED.submitted_at,
        updated_at = NOW();

END $$;

-- Add some additional sample reports with different dates to populate the partner view
INSERT INTO daily_reports (
    site_id,
    work_date,
    member_name,
    process_type,
    total_workers,
    npc1000_incoming,
    npc1000_used,
    npc1000_remaining,
    issues,
    status,
    created_by,
    submitted_at,
    created_at,
    updated_at
)
SELECT 
    s.id as site_id,
    CURRENT_DATE - (random() * 30)::integer as work_date,
    CASE (random() * 6)::integer
        WHEN 0 THEN '기초 공사'
        WHEN 1 THEN '골조 공사'
        WHEN 2 THEN '마감 공사'
        WHEN 3 THEN '설비 공사'
        WHEN 4 THEN '방수 공사'
        ELSE '기타 공사'
    END as member_name,
    CASE (random() * 4)::integer
        WHEN 0 THEN '균열'
        WHEN 1 THEN '면'
        WHEN 2 THEN '마감'
        ELSE '기타'
    END as process_type,
    (5 + random() * 15)::integer as total_workers,
    (100 + random() * 400)::integer as npc1000_incoming,
    (50 + random() * 200)::integer as npc1000_used,
    (50 + random() * 200)::integer as npc1000_remaining,
    CASE 
        WHEN random() < 0.3 THEN '특이사항 없음'
        WHEN random() < 0.6 THEN '작업 순조롭게 진행'
        ELSE NULL
    END as issues,
    'submitted' as status,
    p.id as created_by,
    NOW() - (random() * 30)::integer * INTERVAL '1 day' as submitted_at,
    NOW() - (random() * 30)::integer * INTERVAL '1 day' as created_at,
    NOW() - (random() * 30)::integer * INTERVAL '1 day' as updated_at
FROM sites s
CROSS JOIN (
    SELECT id FROM profiles 
    WHERE role = 'worker' 
    AND id IN (
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
        '66666666-6666-6666-6666-666666666666',
        '77777777-7777-7777-7777-777777777777',
        '88888888-8888-8888-8888-888888888888'
    )
    LIMIT 3
) p
WHERE s.name IN ('강남 A현장', '송파 B현장', '송파 C현장')
LIMIT 15
ON CONFLICT (site_id, work_date, created_by) DO NOTHING;

-- Update some reports to have submitted status and submitted_at timestamp
UPDATE daily_reports 
SET 
    status = 'submitted',
    submitted_at = updated_at
WHERE status != 'submitted' AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Verify the data
DO $$
DECLARE
    report_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO report_count FROM daily_reports WHERE status = 'submitted';
    RAISE NOTICE 'Total submitted daily reports: %', report_count;
END $$;