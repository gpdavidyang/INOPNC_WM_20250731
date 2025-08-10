-- 500_insert_realistic_construction_data.sql
-- 현실적인 건설 현장 작업자 및 작업일지 데이터 추가

-- =====================================================
-- 1. 현실적인 작업자 프로필 추가
-- =====================================================

-- 기존 테스트 사용자의 이메일을 실제 사용자로 업데이트
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'kim.worker@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'lee.worker@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'park.worker@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'choi.worker@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'jung.worker@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', 'han.worker@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('88888888-8888-8888-8888-888888888888', 'song.worker@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('99999999-9999-9999-9999-999999999999', 'yoo.manager@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'lim.manager@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'jang.manager@inopnc.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 현실적인 작업자 프로필 생성
INSERT INTO profiles (id, email, full_name, phone, role, status, created_at, updated_at)
VALUES 
  -- 일반 작업자들
  ('22222222-2222-2222-2222-222222222222', 'kim.worker@inopnc.com', '김철수', '010-1111-2222', 'worker', 'active', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'lee.worker@inopnc.com', '이영호', '010-2222-3333', 'worker', 'active', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'park.worker@inopnc.com', '박민수', '010-3333-4444', 'worker', 'active', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'choi.worker@inopnc.com', '최성훈', '010-4444-5555', 'worker', 'active', NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'jung.worker@inopnc.com', '정대현', '010-5555-6666', 'worker', 'active', NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', 'han.worker@inopnc.com', '한지민', '010-6666-7777', 'worker', 'active', NOW(), NOW()),
  ('88888888-8888-8888-8888-888888888888', 'song.worker@inopnc.com', '송준호', '010-7777-8888', 'worker', 'active', NOW(), NOW()),
  
  -- 현장 관리자들
  ('99999999-9999-9999-9999-999999999999', 'yoo.manager@inopnc.com', '유현석', '010-8888-9999', 'site_manager', 'active', NOW(), NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'lim.manager@inopnc.com', '임재현', '010-9999-0000', 'site_manager', 'active', NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'jang.manager@inopnc.com', '장혜진', '010-0000-1111', 'site_manager', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- =====================================================
-- 2. 현장별 작업자 배정
-- =====================================================

-- 강남 A현장 배정 (김철수, 이영호, 박민수 + 유현석 관리자)
INSERT INTO site_assignments (site_id, user_id, assigned_date, role, is_active)
SELECT 
  s.id,
  p.id,
  CURRENT_DATE - INTERVAL '30 days',
  CASE 
    WHEN p.role = 'site_manager' THEN 'site_manager'::site_assignment_role
    ELSE 'worker'::site_assignment_role
  END,
  true
FROM sites s
CROSS JOIN profiles p
WHERE s.name = '강남 A현장'
  AND p.id IN (
    '22222222-2222-2222-2222-222222222222', -- 김철수
    '33333333-3333-3333-3333-333333333333', -- 이영호
    '44444444-4444-4444-4444-444444444444', -- 박민수
    '99999999-9999-9999-9999-999999999999'  -- 유현석 (관리자)
  )
ON CONFLICT (site_id, user_id) DO UPDATE SET
  assigned_date = EXCLUDED.assigned_date,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- 송파 B현장 배정 (최성훈, 정대현 + 임재현 관리자)
INSERT INTO site_assignments (site_id, user_id, assigned_date, role, is_active)
SELECT 
  s.id,
  p.id,
  CURRENT_DATE - INTERVAL '25 days',
  CASE 
    WHEN p.role = 'site_manager' THEN 'site_manager'::site_assignment_role
    ELSE 'worker'::site_assignment_role
  END,
  true
FROM sites s
CROSS JOIN profiles p
WHERE s.name = '송파 B현장'
  AND p.id IN (
    '55555555-5555-5555-5555-555555555555', -- 최성훈
    '66666666-6666-6666-6666-666666666666', -- 정대현
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'  -- 임재현 (관리자)
  )
ON CONFLICT (site_id, user_id) DO UPDATE SET
  assigned_date = EXCLUDED.assigned_date,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- 송파 C현장 배정 (한지민, 송준호 + 장혜진 관리자)
INSERT INTO site_assignments (site_id, user_id, assigned_date, role, is_active)
SELECT 
  s.id,
  p.id,
  CURRENT_DATE - INTERVAL '20 days',
  CASE 
    WHEN p.role = 'site_manager' THEN 'site_manager'::site_assignment_role
    ELSE 'worker'::site_assignment_role
  END,
  true
FROM sites s
CROSS JOIN profiles p
WHERE s.name = '송파 C현장'
  AND p.id IN (
    '77777777-7777-7777-7777-777777777777', -- 한지민
    '88888888-8888-8888-8888-888888888888', -- 송준호
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'  -- 장혜진 (관리자)
  )
ON CONFLICT (site_id, user_id) DO UPDATE SET
  assigned_date = EXCLUDED.assigned_date,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- 3. 현실적인 출근 기록 생성 (최근 30일)
-- =====================================================

-- 강남 A현장 출근 기록 (김철수, 이영호, 박민수)
DO $$
DECLARE
  v_site_id UUID;
  v_profile_ids UUID[] := ARRAY[
    '22222222-2222-2222-2222-222222222222'::UUID, -- 김철수
    '33333333-3333-3333-3333-333333333333'::UUID, -- 이영호
    '44444444-4444-4444-4444-444444444444'::UUID  -- 박민수
  ];
  v_profile_id UUID;
  v_date DATE;
  v_labor_hours DECIMAL;
  v_check_in TIME;
  v_check_out TIME;
BEGIN
  -- 강남 A현장 ID 조회
  SELECT id INTO v_site_id FROM sites WHERE name = '강남 A현장' LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    FOREACH v_profile_id IN ARRAY v_profile_ids
    LOOP
      -- 최근 30일 출근 기록 생성
      FOR i IN 0..29 LOOP
        v_date := CURRENT_DATE - i;
        
        -- 주말 제외
        IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
          -- 현실적인 근무 패턴 (대부분 정상 근무, 가끔 반일 또는 연장)
          CASE (RANDOM() * 10)::INT
            WHEN 0, 1 THEN  -- 20% 확률로 반일 근무
              v_labor_hours := 0.5;
              v_check_in := '08:00:00'::TIME;
              v_check_out := '12:00:00'::TIME;
            WHEN 2 THEN     -- 10% 확률로 연장 근무
              v_labor_hours := 1.25;
              v_check_in := '08:00:00'::TIME;
              v_check_out := '18:00:00'::TIME;
            ELSE            -- 70% 확률로 정상 근무
              v_labor_hours := 1.0;
              v_check_in := '08:00:00'::TIME;
              v_check_out := '17:00:00'::TIME;
          END CASE;
          
          INSERT INTO attendance_records (
            user_id,
            site_id,
            work_date,
            check_in_time,
            check_out_time,
            status,
            labor_hours,
            work_hours,
            notes,
            created_at,
            updated_at
          )
          VALUES (
            v_profile_id,
            v_site_id,
            v_date,
            v_check_in,
            v_check_out,
            CASE 
              WHEN v_labor_hours >= 1.0 THEN 'present'
              ELSE 'half_day'
            END,
            v_labor_hours,
            v_labor_hours * 8,
            CASE 
              WHEN v_labor_hours = 1.25 THEN '연장 근무'
              WHEN v_labor_hours = 0.5 THEN '반일 근무'
              ELSE '정상 근무'
            END,
            NOW(),
            NOW()
          )
          ON CONFLICT (user_id, work_date) DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- 송파 B현장 출근 기록 (최성훈, 정대현)
DO $$
DECLARE
  v_site_id UUID;
  v_profile_ids UUID[] := ARRAY[
    '55555555-5555-5555-5555-555555555555'::UUID, -- 최성훈
    '66666666-6666-6666-6666-666666666666'::UUID  -- 정대현
  ];
  v_profile_id UUID;
  v_date DATE;
  v_labor_hours DECIMAL;
  v_check_in TIME;
  v_check_out TIME;
BEGIN
  SELECT id INTO v_site_id FROM sites WHERE name = '송파 B현장' LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    FOREACH v_profile_id IN ARRAY v_profile_ids
    LOOP
      FOR i IN 0..29 LOOP
        v_date := CURRENT_DATE - i;
        
        IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
          CASE (RANDOM() * 10)::INT
            WHEN 0 THEN     -- 10% 확률로 반일
              v_labor_hours := 0.5;
              v_check_in := '08:00:00'::TIME;
              v_check_out := '12:00:00'::TIME;
            WHEN 1, 2 THEN  -- 20% 확률로 연장
              v_labor_hours := 1.25;
              v_check_in := '08:00:00'::TIME;
              v_check_out := '18:00:00'::TIME;
            ELSE            -- 70% 정상
              v_labor_hours := 1.0;
              v_check_in := '08:00:00'::TIME;
              v_check_out := '17:00:00'::TIME;
          END CASE;
          
          INSERT INTO attendance_records (
            user_id, site_id, work_date, check_in_time, check_out_time, 
            status, labor_hours, work_hours, notes, created_at, updated_at
          )
          VALUES (
            v_profile_id, v_site_id, v_date, v_check_in, v_check_out,
            CASE WHEN v_labor_hours >= 1.0 THEN 'present' ELSE 'half_day' END,
            v_labor_hours, v_labor_hours * 8,
            CASE 
              WHEN v_labor_hours = 1.25 THEN '연장 근무'
              WHEN v_labor_hours = 0.5 THEN '반일 근무'
              ELSE '정상 근무'
            END,
            NOW(), NOW()
          )
          ON CONFLICT (user_id, work_date) DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- 송파 C현장 출근 기록 (한지민, 송준호)
DO $$
DECLARE
  v_site_id UUID;
  v_profile_ids UUID[] := ARRAY[
    '77777777-7777-7777-7777-777777777777'::UUID, -- 한지민
    '88888888-8888-8888-8888-888888888888'::UUID  -- 송준호
  ];
  v_profile_id UUID;
  v_date DATE;
  v_labor_hours DECIMAL;
BEGIN
  SELECT id INTO v_site_id FROM sites WHERE name = '송파 C현장' LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    FOREACH v_profile_id IN ARRAY v_profile_ids
    LOOP
      FOR i IN 0..29 LOOP
        v_date := CURRENT_DATE - i;
        
        IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
          v_labor_hours := (ARRAY[0.5, 1.0, 1.0, 1.0, 1.25])[(RANDOM() * 5)::INT + 1];
          
          INSERT INTO attendance_records (
            user_id, site_id, work_date, 
            check_in_time, check_out_time, status, labor_hours, work_hours,
            notes, created_at, updated_at
          )
          VALUES (
            v_profile_id, v_site_id, v_date,
            '08:00:00'::TIME, 
            ('08:00:00'::TIME + (v_labor_hours * 8 || ' hours')::INTERVAL)::TIME,
            CASE WHEN v_labor_hours >= 1.0 THEN 'present' ELSE 'half_day' END,
            v_labor_hours, v_labor_hours * 8,
            '현장 작업', NOW(), NOW()
          )
          ON CONFLICT (user_id, work_date) DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 4. 현실적인 작업일지 데이터 생성
-- =====================================================

-- 강남 A현장 작업일지 (슬라브 타설 공정)
DO $$
DECLARE
  v_site_id UUID;
  v_manager_id UUID := '99999999-9999-9999-9999-999999999999'::UUID; -- 유현석
  v_date DATE;
  v_member_names TEXT[] := ARRAY['슬라브', '기둥', '벽체', '보'];
  v_process_types TEXT[] := ARRAY['균열', '면', '타설', '양생'];
  v_member_name TEXT;
  v_process_type TEXT;
BEGIN
  SELECT id INTO v_site_id FROM sites WHERE name = '강남 A현장' LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    -- 최근 15일간 작업일지 생성
    FOR i IN 0..14 LOOP
      v_date := CURRENT_DATE - i;
      
      -- 주말 제외
      IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
        -- 랜덤한 부재명과 공정 선택
        v_member_name := v_member_names[(RANDOM() * array_length(v_member_names, 1))::INT + 1];
        v_process_type := v_process_types[(RANDOM() * array_length(v_process_types, 1))::INT + 1];
        
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
          created_at,
          updated_at
        )
        VALUES (
          v_site_id,
          v_date,
          v_member_name,
          v_process_type,
          3, -- 김철수, 이영호, 박민수
          CASE WHEN v_process_type = '타설' THEN (RANDOM() * 50 + 10)::DECIMAL(10,3) ELSE 0 END,
          CASE WHEN v_process_type IN ('타설', '양생') THEN (RANDOM() * 30 + 5)::DECIMAL(10,3) ELSE 0 END,
          CASE WHEN v_process_type = '타설' THEN (RANDOM() * 20 + 5)::DECIMAL(10,3) ELSE 0 END,
          CASE 
            WHEN RANDOM() < 0.2 THEN '날씨로 인한 작업 지연'
            WHEN RANDOM() < 0.3 THEN '자재 배송 지연'
            ELSE NULL
          END,
          'submitted',
          v_manager_id,
          NOW(),
          NOW()
        )
        ON CONFLICT (site_id, work_date, member_name, process_type) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- 송파 B현장 작업일지 (철근 배근 공정)
DO $$
DECLARE
  v_site_id UUID;
  v_manager_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID; -- 임재현
  v_date DATE;
BEGIN
  SELECT id INTO v_site_id FROM sites WHERE name = '송파 B현장' LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    FOR i IN 0..14 LOOP
      v_date := CURRENT_DATE - i;
      
      IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
        INSERT INTO daily_reports (
          site_id, work_date, member_name, process_type, total_workers,
          npc1000_incoming, npc1000_used, npc1000_remaining,
          issues, status, created_by, created_at, updated_at
        )
        VALUES (
          v_site_id, v_date, 
          (ARRAY['보', '기둥', '슬라브'])[(RANDOM() * 3)::INT + 1],
          (ARRAY['배근', '결속', '검수'])[(RANDOM() * 3)::INT + 1],
          2, -- 최성훈, 정대현
          (RANDOM() * 20 + 5)::DECIMAL(10,3),
          (RANDOM() * 15 + 3)::DECIMAL(10,3),
          (RANDOM() * 10 + 2)::DECIMAL(10,3),
          CASE WHEN RANDOM() < 0.15 THEN '철근 품질 확인 필요' ELSE NULL END,
          'submitted', v_manager_id, NOW(), NOW()
        )
        ON CONFLICT (site_id, work_date, member_name, process_type) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- 송파 C현장 작업일지 (거푸집 설치 공정)
DO $$
DECLARE
  v_site_id UUID;
  v_manager_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID; -- 장혜진
  v_date DATE;
BEGIN
  SELECT id INTO v_site_id FROM sites WHERE name = '송파 C현장' LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    FOR i IN 0..14 LOOP
      v_date := CURRENT_DATE - i;
      
      IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
        INSERT INTO daily_reports (
          site_id, work_date, member_name, process_type, total_workers,
          npc1000_incoming, npc1000_used, npc1000_remaining,
          issues, status, created_by, created_at, updated_at
        )
        VALUES (
          v_site_id, v_date,
          (ARRAY['슬라브', '벽체', '기둥'])[(RANDOM() * 3)::INT + 1],
          (ARRAY['거푸집설치', '해체', '정리'])[(RANDOM() * 3)::INT + 1],
          2, -- 한지민, 송준호
          (RANDOM() * 30 + 10)::DECIMAL(10,3),
          (RANDOM() * 25 + 8)::DECIMAL(10,3),
          (RANDOM() * 15 + 5)::DECIMAL(10,3),
          CASE WHEN RANDOM() < 0.1 THEN '거푸집 정렬 재조정 필요' ELSE NULL END,
          'submitted', v_manager_id, NOW(), NOW()
        )
        ON CONFLICT (site_id, work_date, member_name, process_type) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- =====================================================
-- 5. 알림 데이터 생성
-- =====================================================

INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT 
  p.id,
  '새로운 작업 지시',
  '오늘 작업 일지를 작성해주세요.',
  'info',
  RANDOM() < 0.7, -- 70% 확률로 읽음 처리
  NOW() - (RANDOM() * 7 || ' days')::INTERVAL
FROM profiles p
WHERE p.role = 'worker'
UNION ALL
SELECT 
  p.id,
  '작업 일지 검토',
  '새로운 작업 일지가 제출되었습니다.',
  'warning',
  RANDOM() < 0.5,
  NOW() - (RANDOM() * 3 || ' days')::INTERVAL
FROM profiles p
WHERE p.role = 'site_manager'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. 데이터 확인
-- =====================================================

-- 생성된 데이터 요약
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN role = 'worker' THEN 1 END) as workers,
  COUNT(CASE WHEN role = 'site_manager' THEN 1 END) as managers
FROM profiles
WHERE id IN (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)

UNION ALL

SELECT 
  'site_assignments' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT site_id) as sites_count,
  COUNT(DISTINCT user_id) as users_count
FROM site_assignments
WHERE is_active = true

UNION ALL

SELECT 
  'attendance_records' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as users_count,
  COUNT(DISTINCT work_date) as unique_dates
FROM attendance_records
WHERE work_date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
  'daily_reports' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT site_id) as sites_count,
  COUNT(DISTINCT work_date) as unique_dates
FROM daily_reports
WHERE work_date >= CURRENT_DATE - INTERVAL '15 days';

SELECT '현실적인 건설 작업자 데이터 생성 완료' as status;