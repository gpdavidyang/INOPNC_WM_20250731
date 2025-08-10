-- Migration: Add complete test data for replacing hardcoded values
-- This migration adds proper test data to the database

-- Step 1: Ensure organizations exist
INSERT INTO organizations (id, name, type, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '이노피앤씨', 'partner', true),
  ('22222222-2222-2222-2222-222222222222', '삼성건설', 'customer', true),
  ('33333333-3333-3333-3333-333333333333', '현대건설', 'customer', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  is_active = EXCLUDED.is_active;

-- Step 2: Add the sites that were hardcoded in components
INSERT INTO sites (
  name, 
  code, 
  address, 
  description, 
  status, 
  start_date, 
  end_date,
  organization_id,
  construction_manager_phone,
  safety_manager_phone,
  accommodation_name,
  accommodation_address,
  work_process,
  work_section,
  component_name,
  manager_name,
  safety_manager_name
)
VALUES 
  (
    '강남 A현장',
    'GN-A-2024',
    '서울시 강남구 테헤란로 123',
    '주상복합 건설',
    'active',
    '2024-01-15',
    '2025-12-31',
    '22222222-2222-2222-2222-222222222222',
    '010-1234-5678',
    '010-8765-4321',
    '강남 기숙사',
    '서울시 강남구 역삼동 456',
    '슬라브 타설',
    '지하 1층',
    '기둥 C1-C5 구간',
    '김건축',
    '이안전'
  ),
  (
    '송파 B현장',
    'SP-B-2024',
    '서울시 송파구 올림픽로 789',
    '아파트 리모델링',
    'active',
    '2024-03-01',
    '2025-08-31',
    '22222222-2222-2222-2222-222222222222',
    '010-2345-6789',
    '010-9876-5432',
    '송파 숙소',
    '서울시 송파구 방이동 321',
    '철근 배근',
    '지상 3층',
    '보 B1-B10 구간',
    '박현장',
    '김안전'
  ),
  (
    '송파 C현장',
    'SP-C-2024',
    '서울시 송파구 문정동 543',
    '오피스텔 신축',
    'active',
    '2024-02-15',
    '2025-10-31',
    '33333333-3333-3333-3333-333333333333',
    '010-3456-7890',
    '010-0987-6543',
    '문정 게스트하우스',
    '서울시 송파구 문정동 654',
    '거푸집 설치',
    '지상 1층',
    '슬라브 S1 구역',
    '이관리',
    '박안전'
  ),
  (
    '방배 D현장',
    'BB-D-2024',
    '서울시 서초구 방배동 876',
    '단독주택 신축',
    'active',
    '2024-04-01',
    '2025-06-30',
    '33333333-3333-3333-3333-333333333333',
    '010-4567-8901',
    '010-1098-7654',
    '방배 원룸',
    '서울시 서초구 방배동 987',
    '콘크리트 양생',
    '지하 2층',
    '벽체 W1-W5 구간',
    '최담당',
    '정안전'
  )
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  address = EXCLUDED.address,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  organization_id = EXCLUDED.organization_id,
  construction_manager_phone = EXCLUDED.construction_manager_phone,
  safety_manager_phone = EXCLUDED.safety_manager_phone,
  accommodation_name = EXCLUDED.accommodation_name,
  accommodation_address = EXCLUDED.accommodation_address,
  work_process = EXCLUDED.work_process,
  work_section = EXCLUDED.work_section,
  component_name = EXCLUDED.component_name,
  manager_name = EXCLUDED.manager_name,
  safety_manager_name = EXCLUDED.safety_manager_name;

-- Step 3: Create sample attendance records for testing
-- This creates attendance records for the last 30 days
DO $$
DECLARE
  v_profile_id UUID;
  v_site_id UUID;
  v_date DATE;
  v_labor_hours DECIMAL;
BEGIN
  -- Get a sample worker profile
  SELECT id INTO v_profile_id 
  FROM profiles 
  WHERE role = 'worker' 
  LIMIT 1;
  
  -- If we have a worker, create attendance records
  IF v_profile_id IS NOT NULL THEN
    -- Loop through sites
    FOR v_site_id IN 
      SELECT id FROM sites WHERE status = 'active' LIMIT 4
    LOOP
      -- Create records for last 30 days
      FOR i IN 0..29 LOOP
        v_date := CURRENT_DATE - i;
        
        -- Skip weekends
        IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
          -- Random labor hours (0.25, 0.5, 0.75, 1.0, 1.25)
          v_labor_hours := (FLOOR(RANDOM() * 5) + 1) * 0.25;
          
          -- Insert attendance record
          INSERT INTO attendance_records (
            profile_id,
            site_id,
            work_date,
            check_in_time,
            check_out_time,
            status,
            labor_hours,
            notes
          )
          VALUES (
            v_profile_id,
            v_site_id,
            v_date,
            '08:00:00'::TIME,
            ('08:00:00'::TIME + (v_labor_hours * 8 || ' hours')::INTERVAL)::TIME,
            CASE WHEN v_labor_hours >= 1 THEN 'present' ELSE 'half_day' END,
            v_labor_hours,
            '정상 근무'
          )
          ON CONFLICT (profile_id, work_date) DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- Step 4: Create sample daily reports
DO $$
DECLARE
  v_manager_id UUID;
  v_site_id UUID;
  v_date DATE;
BEGIN
  -- Get a sample manager profile
  SELECT id INTO v_manager_id 
  FROM profiles 
  WHERE role IN ('site_manager', 'admin', 'system_admin')
  LIMIT 1;
  
  -- If we have a manager, create daily reports
  IF v_manager_id IS NOT NULL THEN
    -- Loop through sites
    FOR v_site_id IN 
      SELECT id FROM sites WHERE status = 'active' LIMIT 4
    LOOP
      -- Create reports for last 10 days
      FOR i IN 0..9 LOOP
        v_date := CURRENT_DATE - i;
        
        -- Insert daily report
        INSERT INTO daily_reports (
          site_id,
          work_date,
          created_by,
          weather,
          temperature,
          worker_count,
          work_content,
          safety_matters,
          equipment_used,
          materials_used,
          issues,
          tomorrow_plan,
          status
        )
        VALUES (
          v_site_id,
          v_date,
          v_manager_id,
          CASE (RANDOM() * 3)::INT 
            WHEN 0 THEN '맑음'
            WHEN 1 THEN '흐림'
            WHEN 2 THEN '비'
            ELSE '눈'
          END,
          15 + (RANDOM() * 15)::INT,
          10 + (RANDOM() * 20)::INT,
          '정상 작업 진행',
          '안전 수칙 준수',
          '크레인, 굴착기',
          '철근, 콘크리트',
          NULL,
          '작업 계속 진행',
          'approved'
        )
        ON CONFLICT (site_id, work_date) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- Step 5: Add some notifications
INSERT INTO notifications (profile_id, title, message, type, is_read)
SELECT 
  p.id,
  '작업 일지 검토 요청',
  '새로운 작업 일지가 제출되었습니다.',
  'info',
  false
FROM profiles p
WHERE p.role IN ('site_manager', 'admin')
LIMIT 5
ON CONFLICT DO NOTHING;