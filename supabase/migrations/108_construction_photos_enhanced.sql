-- 건설 사진 관리 시스템 고도화
-- 부재명/공정별 체계적 사진 관리 및 PDF 보고서 생성 지원

-- 건설 공정 enum 타입
CREATE TYPE construction_process_type AS ENUM (
  'formwork',    -- 거푸집
  'rebar',       -- 철근  
  'concrete',    -- 콘크리트
  'curing',      -- 양생
  'finishing',   -- 마감
  'inspection',  -- 검사
  'other'        -- 기타
);

-- 부재 타입 enum
CREATE TYPE component_type AS ENUM (
  'column',      -- 기둥
  'beam',        -- 보
  'slab',        -- 슬라브
  'wall',        -- 벽체
  'foundation',  -- 기초
  'stair',       -- 계단
  'other'        -- 기타
);

-- 건설 사진 테이블 (기존 daily_report_photos 확장)
CREATE TABLE IF NOT EXISTS construction_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name VARCHAR(255) NOT NULL,           -- 부재명 (예: "기둥-1", "보-A동")
  component_type component_type NOT NULL,
  process_type construction_process_type NOT NULL,
  stage VARCHAR(10) NOT NULL CHECK (stage IN ('before', 'after')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  coordinates JSONB,                              -- {x: number, y: number}
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  file_size BIGINT,
  file_name VARCHAR(255),
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사진 그룹 테이블 (동일 부재/공정의 전후 사진 묶음)
CREATE TABLE IF NOT EXISTS photo_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name VARCHAR(255) NOT NULL,
  component_type component_type NOT NULL,
  process_type construction_process_type NOT NULL,
  progress_status VARCHAR(20) NOT NULL DEFAULT 'not_started' 
    CHECK (progress_status IN ('not_started', 'in_progress', 'completed')),
  notes TEXT,
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 동일 작업일지 내에서 부재명+공정 조합은 유일해야 함
  UNIQUE(daily_report_id, component_name, process_type)
);

-- 부재명 마스터 테이블 (자동완성 및 표준화 지원)
CREATE TABLE IF NOT EXISTS component_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  component_name VARCHAR(255) NOT NULL,
  component_type component_type NOT NULL,
  location_info JSONB,                            -- 층별, 구역별 정보
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,                  -- 사용 빈도 (자동완성 순서용)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(site_id, component_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_construction_photos_daily_report 
  ON construction_photos(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_construction_photos_component 
  ON construction_photos(component_name, process_type);
CREATE INDEX IF NOT EXISTS idx_construction_photos_stage 
  ON construction_photos(stage);
CREATE INDEX IF NOT EXISTS idx_construction_photos_timestamp 
  ON construction_photos(timestamp);

CREATE INDEX IF NOT EXISTS idx_photo_groups_daily_report 
  ON photo_groups(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_photo_groups_component 
  ON photo_groups(component_name, process_type);

CREATE INDEX IF NOT EXISTS idx_component_masters_site 
  ON component_masters(site_id);
CREATE INDEX IF NOT EXISTS idx_component_masters_usage 
  ON component_masters(usage_count DESC);

-- Updated 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_construction_photos_updated_at 
  BEFORE UPDATE ON construction_photos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_groups_updated_at 
  BEFORE UPDATE ON photo_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_masters_updated_at 
  BEFORE UPDATE ON component_masters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security 정책
ALTER TABLE construction_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_masters ENABLE ROW LEVEL SECURITY;

-- construction_photos RLS 정책
CREATE POLICY "Users can view construction photos for their site" ON construction_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      JOIN profiles p ON p.id = auth.uid()
      WHERE dr.id = construction_photos.daily_report_id
      AND (p.role IN ('admin', 'system_admin') OR dr.site_id = p.site_id)
    )
  );

CREATE POLICY "Users can insert construction photos for their reports" ON construction_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      JOIN profiles p ON p.id = auth.uid()
      WHERE dr.id = construction_photos.daily_report_id
      AND dr.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own construction photos" ON construction_photos
  FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own construction photos" ON construction_photos
  FOR DELETE USING (uploaded_by = auth.uid());

-- photo_groups RLS 정책  
CREATE POLICY "Users can view photo groups for their site" ON photo_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      JOIN profiles p ON p.id = auth.uid()
      WHERE dr.id = photo_groups.daily_report_id
      AND (p.role IN ('admin', 'system_admin') OR dr.site_id = p.site_id)
    )
  );

CREATE POLICY "Users can manage photo groups for their reports" ON photo_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      WHERE dr.id = photo_groups.daily_report_id
      AND dr.created_by = auth.uid()
    )
  );

-- component_masters RLS 정책
CREATE POLICY "Users can view component masters for their site" ON component_masters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'system_admin') OR p.site_id = component_masters.site_id)
    )
  );

CREATE POLICY "Site managers can manage component masters" ON component_masters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'system_admin', 'site_manager'))
      AND (p.role IN ('admin', 'system_admin') OR p.site_id = component_masters.site_id)
    )
  );

-- 기본 부재명 마스터 데이터 삽입 (강남 A현장 기준)
INSERT INTO component_masters (site_id, component_name, component_type, location_info) 
VALUES 
  ('33333333-3333-3333-3333-333333333333', '기둥-1', 'column', '{"floor": "1층", "section": "A구역"}'),
  ('33333333-3333-3333-3333-333333333333', '기둥-2', 'column', '{"floor": "1층", "section": "B구역"}'),
  ('33333333-3333-3333-3333-333333333333', '보-A동', 'beam', '{"floor": "1층", "section": "A동"}'),
  ('33333333-3333-3333-3333-333333333333', '보-B동', 'beam', '{"floor": "1층", "section": "B동"}'),
  ('33333333-3333-3333-3333-333333333333', '슬라브-3층', 'slab', '{"floor": "3층"}'),
  ('33333333-3333-3333-3333-333333333333', '벽체-외벽', 'wall', '{"floor": "1층", "section": "외부"}')
ON CONFLICT (site_id, component_name) DO NOTHING;

-- 함수: 부재명 사용량 증가
CREATE OR REPLACE FUNCTION increment_component_usage(
  p_site_id UUID,
  p_component_name VARCHAR(255),
  p_component_type component_type
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO component_masters (site_id, component_name, component_type, usage_count)
  VALUES (p_site_id, p_component_name, p_component_type, 1)
  ON CONFLICT (site_id, component_name) 
  DO UPDATE SET 
    usage_count = component_masters.usage_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 사진 그룹 진행률 계산
CREATE OR REPLACE FUNCTION calculate_photo_progress(p_daily_report_id UUID)
RETURNS TABLE (
  component_name VARCHAR(255),
  component_type component_type,
  process_type construction_process_type,
  has_before BOOLEAN,
  has_after BOOLEAN,
  completed BOOLEAN,
  overall_progress NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH photo_summary AS (
    SELECT 
      cp.component_name,
      cp.component_type,
      cp.process_type,
      SUM(CASE WHEN cp.stage = 'before' THEN 1 ELSE 0 END) > 0 AS has_before,
      SUM(CASE WHEN cp.stage = 'after' THEN 1 ELSE 0 END) > 0 AS has_after
    FROM construction_photos cp
    WHERE cp.daily_report_id = p_daily_report_id
    GROUP BY cp.component_name, cp.component_type, cp.process_type
  ),
  progress_calc AS (
    SELECT 
      ps.*,
      (ps.has_before AND ps.has_after) AS completed
    FROM photo_summary ps
  )
  SELECT 
    pc.component_name,
    pc.component_type,
    pc.process_type,
    pc.has_before,
    pc.has_after,
    pc.completed,
    CASE 
      WHEN COUNT(*) OVER (PARTITION BY pc.component_name) = 0 THEN 0
      ELSE ROUND(
        (SUM(CASE WHEN pc.completed THEN 1 ELSE 0 END) OVER (PARTITION BY pc.component_name) * 100.0) / 
        COUNT(*) OVER (PARTITION BY pc.component_name), 1
      )
    END AS overall_progress
  FROM progress_calc pc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;