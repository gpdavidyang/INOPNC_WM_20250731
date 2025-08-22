-- Generate realistic construction site data for site managers
-- This includes daily reports, attendance records, and additional site data for testing

-- First, let's ensure we have the manager user and site assignment
-- Manager user ID: 950db250-82e4-4c9d-bf4d-75df7244764c (from logs)
-- 강남 A현장 site ID: 55386936-56b0-465e-bcc2-8313db735ca9 (from logs)

-- Insert today's daily report for the site manager
INSERT INTO daily_reports (
  id,
  user_id,
  site_id,
  report_date,
  work_description,
  progress_percentage,
  weather_condition,
  temperature,
  worker_count,
  equipment_used,
  materials_used,
  safety_issues,
  quality_notes,
  next_day_plan,
  attachments,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '950db250-82e4-4c9d-bf4d-75df7244764c',
  '55386936-56b0-465e-bcc2-8313db735ca9',
  CURRENT_DATE,
  '지하 1층 슬라브 타설 작업 진행중. 기둥 C1-C5 구간 철근 배근 완료, 콘크리트 타설 준비 완료. 품질 검사 통과 후 오후 2시부터 타설 시작 예정.',
  75,
  'sunny',
  23,
  12,
  ARRAY['타워크레인', '콘크리트펌프카', '진동기', '레이저레벨기'],
  ARRAY['콘크리트 120㎥', '철근 D19 50본', '거푸집 판넬 80매'],
  '특이사항 없음. 안전교육 실시 완료.',
  '철근 배근 상태 양호. 콘크리트 강도 확인 완료.',
  '내일 슬라브 양생 상태 점검 후 다음 구간 작업 준비. 기둥 C6-C10 구간 철근 반입 예정.',
  ARRAY['/uploads/reports/daily_20250822_gangnam_a.jpg'],
  'submitted',
  NOW(),
  NOW()
) ON CONFLICT (user_id, site_id, report_date) DO UPDATE SET
  work_description = EXCLUDED.work_description,
  progress_percentage = EXCLUDED.progress_percentage,
  weather_condition = EXCLUDED.weather_condition,
  temperature = EXCLUDED.temperature,
  worker_count = EXCLUDED.worker_count,
  equipment_used = EXCLUDED.equipment_used,
  materials_used = EXCLUDED.materials_used,
  safety_issues = EXCLUDED.safety_issues,
  quality_notes = EXCLUDED.quality_notes,
  next_day_plan = EXCLUDED.next_day_plan,
  updated_at = NOW();

-- Insert today's attendance records for workers
INSERT INTO attendance_records (
  id,
  user_id,
  site_id,
  attendance_date,
  check_in_time,
  check_out_time,
  work_hours,
  labor_hours,
  overtime_hours,
  work_type,
  weather_condition,
  notes,
  created_at,
  updated_at
) VALUES
-- Worker 1: Full day attendance
(
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111', -- Placeholder worker ID
  '55386936-56b0-465e-bcc2-8313db735ca9',
  CURRENT_DATE,
  '08:00:00',
  '17:00:00',
  8.0,
  1.0,
  0.0,
  'construction',
  'sunny',
  '기둥 C1-C5 구간 철근 배근 작업',
  NOW(),
  NOW()
),
-- Worker 2: Half day attendance
(
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222', -- Placeholder worker ID
  '55386936-56b0-465e-bcc2-8313db735ca9',
  CURRENT_DATE,
  '08:00:00',
  '12:00:00',
  4.0,
  0.5,
  0.0,
  'construction',
  'sunny',
  '오전 철근 검사 및 품질 확인',
  NOW(),
  NOW()
),
-- Worker 3: Overtime work
(
  gen_random_uuid(),
  '33333333-3333-3333-3333-333333333333', -- Placeholder worker ID
  '55386936-56b0-465e-bcc2-8313db735ca9',
  CURRENT_DATE,
  '08:00:00',
  '19:00:00',
  10.0,
  1.25,
  2.0,
  'construction',
  'sunny',
  '콘크리트 타설 준비 및 장비 점검 (연장근무)',
  NOW(),
  NOW()
)
ON CONFLICT (user_id, site_id, attendance_date) DO UPDATE SET
  check_out_time = EXCLUDED.check_out_time,
  work_hours = EXCLUDED.work_hours,
  labor_hours = EXCLUDED.labor_hours,
  overtime_hours = EXCLUDED.overtime_hours,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Insert recent daily reports for the past week to show history
INSERT INTO daily_reports (
  id,
  user_id,
  site_id,
  report_date,
  work_description,
  progress_percentage,
  weather_condition,
  temperature,
  worker_count,
  equipment_used,
  materials_used,
  safety_issues,
  quality_notes,
  status,
  created_at,
  updated_at
) VALUES
-- Yesterday
(
  gen_random_uuid(),
  '950db250-82e4-4c9d-bf4d-75df7244764c',
  '55386936-56b0-465e-bcc2-8313db735ca9',
  CURRENT_DATE - INTERVAL '1 day',
  '지하 1층 기둥 C1-C5 구간 거푸집 설치 완료. 철근 반입 및 배근 작업 80% 진행.',
  65,
  'cloudy',
  21,
  15,
  ARRAY['타워크레인', '철근절단기', '전기용접기'],
  ARRAY['철근 D19 80본', 'H빔 20본', '거푸집 판넬 120매'],
  '안전교육 실시. 용접 작업 시 화재 예방 조치 완료.',
  '거푸집 설치 상태 양호. 철근 간격 정확.',
  'approved',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
-- 2 days ago
(
  gen_random_uuid(),
  '950db250-82e4-4c9d-bf4d-75df7244764c',
  '55386936-56b0-465e-bcc2-8313db735ca9',
  CURRENT_DATE - INTERVAL '2 days',
  '지하 1층 기둥 구간 굴착 완료. 바닥 정리 및 레벨 측량 실시.',
  45,
  'rainy',
  18,
  10,
  ARRAY['굴삭기', '레이저레벨기', '측량장비'],
  ARRAY['골재 10톤', '모래 5톤'],
  '우천으로 인한 작업 지연. 배수 작업 실시.',
  '굴착 깊이 정확. 지반 상태 양호.',
  'approved',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (user_id, site_id, report_date) DO NOTHING;

-- Update site information with current work status
UPDATE sites SET
  work_process = '슬라브 타설',
  work_section = '지하 1층',
  component_name = '기둥 C1-C5 구간',
  description = '강남구 테헤란로 신축 오피스텔 건설 현장. 현재 지하 1층 구조체 작업 진행중.',
  updated_at = NOW()
WHERE id = '55386936-56b0-465e-bcc2-8313db735ca9';

-- Create notifications for site manager
INSERT INTO notifications (
  id,
  user_id,
  title,
  message,
  type,
  priority,
  related_id,
  is_read,
  created_at
) VALUES
(
  gen_random_uuid(),
  '950db250-82e4-4c9d-bf4d-75df7244764c',
  '오늘의 작업 계획 확인',
  '지하 1층 슬라브 타설 작업이 예정되어 있습니다. 오후 2시 시작 예정입니다.',
  'work_schedule',
  'medium',
  '55386936-56b0-465e-bcc2-8313db735ca9',
  false,
  NOW()
),
(
  gen_random_uuid(),
  '950db250-82e4-4c9d-bf4d-75df7244764c',
  '안전 점검 완료',
  '현장 안전 점검이 완료되었습니다. 특이사항 없음.',
  'safety',
  'low',
  '55386936-56b0-465e-bcc2-8313db735ca9',
  false,
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;