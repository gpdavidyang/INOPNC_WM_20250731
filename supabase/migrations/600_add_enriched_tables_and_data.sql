-- =====================================================
-- 작업일지 관련 추가 테이블 생성 및 데이터 보강
-- =====================================================

-- 1. 작업 사진 테이블 생성
CREATE TABLE IF NOT EXISTS daily_report_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_type TEXT CHECK (photo_type IN ('before', 'during', 'after', 'safety', 'quality', 'issue')),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 자재 사용 내역 테이블
CREATE TABLE IF NOT EXISTS daily_report_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  material_code TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2),
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 경비 영수증 테이블
CREATE TABLE IF NOT EXISTS expense_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('material', 'equipment', 'fuel', 'meal', 'transport', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  vendor TEXT NOT NULL,
  receipt_url TEXT,
  receipt_number TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer')),
  notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 작업일지 필드 추가 (없는 경우)
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS weather TEXT,
ADD COLUMN IF NOT EXISTS temperature INTEGER,
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS materials_used TEXT,
ADD COLUMN IF NOT EXISTS equipment_used TEXT,
ADD COLUMN IF NOT EXISTS ptw_number TEXT,
ADD COLUMN IF NOT EXISTS ptw_status TEXT CHECK (ptw_status IN ('pending', 'approved', 'rejected', 'expired')),
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS quality_issues TEXT,
ADD COLUMN IF NOT EXISTS tomorrow_plan TEXT;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_report_photos_report ON daily_report_photos(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_daily_report_photos_type ON daily_report_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_daily_report_materials_report ON daily_report_materials(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_expense_receipts_report ON expense_receipts(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_expense_receipts_type ON expense_receipts(expense_type);

-- 6. RLS 정책 설정
ALTER TABLE daily_report_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_report_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_receipts ENABLE ROW LEVEL SECURITY;

-- 사진 조회 정책
CREATE POLICY "Users can view photos from their site" ON daily_report_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      JOIN profiles p ON p.id = auth.uid()
      WHERE dr.id = daily_report_photos.daily_report_id
      AND (
        p.role IN ('admin', 'system_admin')
        OR dr.site_id = p.site_id
        OR dr.site_id IN (
          SELECT site_id FROM site_assignments 
          WHERE user_id = auth.uid() AND is_active = true
        )
      )
    )
  );

-- 사진 업로드 정책
CREATE POLICY "Users can upload photos to their reports" ON daily_report_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      JOIN profiles p ON p.id = auth.uid()
      WHERE dr.id = daily_report_photos.daily_report_id
      AND (
        p.role IN ('admin', 'system_admin', 'site_manager')
        OR (dr.created_by = auth.uid())
      )
    )
  );

-- 자재 내역 정책
CREATE POLICY "Users can view materials from their site" ON daily_report_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      JOIN profiles p ON p.id = auth.uid()
      WHERE dr.id = daily_report_materials.daily_report_id
      AND (
        p.role IN ('admin', 'system_admin')
        OR dr.site_id = p.site_id
      )
    )
  );

-- 영수증 정책
CREATE POLICY "Users can view receipts from their site" ON expense_receipts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      JOIN profiles p ON p.id = auth.uid()
      WHERE dr.id = expense_receipts.daily_report_id
      AND (
        p.role IN ('admin', 'system_admin', 'site_manager')
        OR dr.site_id = p.site_id
      )
    )
  );

-- =====================================================
-- 샘플 데이터 추가
-- =====================================================

-- 작업일지 상세 내용 업데이트
UPDATE daily_reports SET
  work_content = CASE 
    WHEN work_content IS NULL OR work_content = '' THEN 
      '오늘 ' || (SELECT name FROM sites WHERE id = site_id LIMIT 1) || '에서 주요 건설 작업을 진행했습니다. 
      계획된 작업을 차질 없이 수행하였으며, 안전 수칙을 준수하여 무재해로 작업을 완료했습니다.'
    ELSE work_content
  END,
  special_notes = CASE 
    WHEN special_notes IS NULL OR special_notes = '' THEN 
      '날씨 변화에 따른 작업 일정 조정 필요. 자재 수급 현황 점검 완료.'
    ELSE special_notes
  END,
  weather = CASE 
    WHEN weather IS NULL THEN 
      (ARRAY['맑음', '흐림', '비', '구름조금'])[floor(random() * 4 + 1)]
    ELSE weather
  END,
  temperature = CASE 
    WHEN temperature IS NULL THEN 
      floor(random() * 15 + 10)::INTEGER
    ELSE temperature
  END,
  safety_notes = CASE 
    WHEN safety_notes IS NULL THEN 
      'TBM 실시 완료. 전 작업자 안전 보호구 착용 확인. 위험 구역 안전 펜스 설치.'
    ELSE safety_notes
  END,
  progress_percentage = CASE 
    WHEN progress_percentage IS NULL THEN 
      floor(random() * 30 + 60)::INTEGER
    ELSE progress_percentage
  END
WHERE work_date >= CURRENT_DATE - INTERVAL '30 days';

-- 샘플 사진 데이터 추가
INSERT INTO daily_report_photos (daily_report_id, photo_url, caption, photo_type, uploaded_by)
SELECT 
  dr.id,
  'https://example.com/photos/' || dr.id || '_' || photo_num || '.jpg',
  CASE photo_num
    WHEN 1 THEN '작업 전 현장 상태'
    WHEN 2 THEN '작업 진행 중'
    WHEN 3 THEN '작업 완료 후'
  END,
  CASE photo_num
    WHEN 1 THEN 'before'
    WHEN 2 THEN 'during'
    WHEN 3 THEN 'after'
  END,
  dr.created_by
FROM daily_reports dr
CROSS JOIN generate_series(1, 3) AS photo_num
WHERE dr.work_date >= CURRENT_DATE - INTERVAL '7 days'
ON CONFLICT DO NOTHING;

-- 샘플 자재 사용 내역 추가
INSERT INTO daily_report_materials (daily_report_id, material_name, material_code, quantity, unit, unit_price, supplier)
SELECT 
  dr.id,
  material.name,
  material.code,
  material.quantity,
  material.unit,
  material.price,
  material.supplier
FROM daily_reports dr
CROSS JOIN (
  VALUES 
    ('레미콘 25-240-12', 'RMC-25-240', 25, '㎥', 85000, '(주)한국레미콘'),
    ('철근 HD13', 'REBAR-HD13', 2.5, '톤', 850000, '동국제강'),
    ('시멘트 1종', 'CEMENT-T1', 50, '포', 5500, '성신양회'),
    ('모래', 'SAND-01', 15, '㎥', 35000, '(주)골재산업'),
    ('자갈 25mm', 'GRAVEL-25', 20, '㎥', 32000, '(주)골재산업')
) AS material(name, code, quantity, unit, price, supplier)
WHERE dr.work_date >= CURRENT_DATE - INTERVAL '7 days'
  AND random() > 0.5
ON CONFLICT DO NOTHING;

-- 샘플 영수증 데이터 추가
INSERT INTO expense_receipts (daily_report_id, expense_type, amount, vendor, receipt_number, payment_method)
SELECT 
  dr.id,
  expense.type,
  expense.amount,
  expense.vendor,
  'RCP-2025-' || to_char(dr.work_date, 'MMDD') || '-' || floor(random() * 999 + 1)::TEXT,
  expense.payment
FROM daily_reports dr
CROSS JOIN (
  VALUES 
    ('material', 1250000, '(주)건설자재마트', 'card'),
    ('equipment', 350000, '대한중장비임대', 'transfer'),
    ('fuel', 185000, 'SK에너지', 'card'),
    ('meal', 75000, '현장식당', 'cash'),
    ('transport', 120000, '화물운송', 'transfer')
) AS expense(type, amount, vendor, payment)
WHERE dr.work_date >= CURRENT_DATE - INTERVAL '7 days'
  AND random() > 0.6
ON CONFLICT DO NOTHING;

-- PTW 문서 샘플 추가
INSERT INTO documents (title, file_type, file_url, file_size, mime_type, category, site_id, is_public, description)
SELECT 
  'PTW-2025-' || to_char(CURRENT_DATE - (n || ' days')::INTERVAL, 'MMDD'),
  'document',
  'https://example.com/ptw/PTW-2025-' || to_char(CURRENT_DATE - (n || ' days')::INTERVAL, 'MMDD') || '.pdf',
  floor(random() * 500000 + 100000)::INTEGER,
  'application/pdf',
  'PTW',
  s.id,
  false,
  '작업허가서 - ' || 
  CASE (n % 4)
    WHEN 0 THEN '고소작업'
    WHEN 1 THEN '화기작업'
    WHEN 2 THEN '밀폐공간작업'
    WHEN 3 THEN '중장비작업'
  END
FROM sites s
CROSS JOIN generate_series(0, 6) AS n
WHERE s.status = 'active'
ON CONFLICT DO NOTHING;

-- 도면 문서 샘플 추가
INSERT INTO documents (title, file_type, file_url, file_size, mime_type, category, site_id, is_public, description)
SELECT 
  s.name || ' - ' || 
  CASE (n % 5)
    WHEN 0 THEN '지하층 구조도'
    WHEN 1 THEN '1층 평면도'
    WHEN 2 THEN '전기 배선도'
    WHEN 3 THEN '배관 계통도'
    WHEN 4 THEN '입면도'
  END,
  'blueprint',
  'https://example.com/blueprints/' || s.id || '_blueprint_' || n || '.pdf',
  floor(random() * 5000000 + 1000000)::INTEGER,
  'application/pdf',
  '도면',
  s.id,
  true,
  '건축 도면 - 최신 버전 (Rev.' || floor(random() * 5 + 1)::TEXT || ')'
FROM sites s
CROSS JOIN generate_series(0, 4) AS n
WHERE s.status = 'active'
ON CONFLICT DO NOTHING;

-- 통계 업데이트
UPDATE daily_reports dr SET
  total_workers = (
    SELECT COUNT(DISTINCT user_id) 
    FROM attendance_records 
    WHERE site_id = dr.site_id 
    AND work_date = dr.work_date
  ),
  total_work_hours = (
    SELECT SUM(labor_hours * 8) 
    FROM attendance_records 
    WHERE site_id = dr.site_id 
    AND work_date = dr.work_date
  )
WHERE work_date >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- 데이터 무결성 확인
-- =====================================================

-- 작업일지 통계 뷰 생성
CREATE OR REPLACE VIEW daily_report_statistics AS
SELECT 
  dr.id,
  dr.work_date,
  s.name as site_name,
  dr.progress_percentage,
  COUNT(DISTINCT drp.id) as photo_count,
  COUNT(DISTINCT drm.id) as material_count,
  COUNT(DISTINCT er.id) as receipt_count,
  SUM(er.amount) as total_expenses
FROM daily_reports dr
LEFT JOIN sites s ON s.id = dr.site_id
LEFT JOIN daily_report_photos drp ON drp.daily_report_id = dr.id
LEFT JOIN daily_report_materials drm ON drm.daily_report_id = dr.id
LEFT JOIN expense_receipts er ON er.daily_report_id = dr.id
GROUP BY dr.id, dr.work_date, s.name, dr.progress_percentage;

COMMENT ON VIEW daily_report_statistics IS '작업일지 통계 정보를 제공하는 뷰';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 데이터베이스 보강 완료!';
  RAISE NOTICE '📊 추가된 테이블: daily_report_photos, daily_report_materials, expense_receipts';
  RAISE NOTICE '📁 추가된 문서: PTW, 도면 등';
  RAISE NOTICE '📸 작업 사진 및 자재 내역 추가 완료';
END $$;