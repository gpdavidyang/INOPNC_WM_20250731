-- NPC-1000 Daily Reports Schema
-- Tracks NPC-1000 materials used in daily work reports
-- Connected to daily_reports table for comprehensive tracking

-- Table: npc1000_materials
-- Defines the specific NPC-1000 materials catalog
CREATE TABLE IF NOT EXISTS public.npc1000_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'C001001', 'R002001'
  material_name VARCHAR(255) NOT NULL, -- e.g., 'Ready-Mix 콘크리트 24-21-150'
  category VARCHAR(50) NOT NULL, -- e.g., '콘크리트', '철근', '골재'
  unit VARCHAR(20) NOT NULL, -- e.g., 'm³', 'ton', 'sheet'
  standard_price DECIMAL(10,2) DEFAULT 0, -- Standard unit price
  specification TEXT, -- Technical specifications
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: npc1000_daily_records
-- Links daily reports to NPC-1000 material usage
CREATE TABLE IF NOT EXISTS public.npc1000_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  npc_material_id UUID NOT NULL REFERENCES public.npc1000_materials(id) ON DELETE RESTRICT,
  
  -- Usage quantities from daily report form
  incoming_quantity DECIMAL(10,3) DEFAULT 0, -- 입고량
  used_quantity DECIMAL(10,3) DEFAULT 0,     -- 사용량
  remaining_quantity DECIMAL(10,3) DEFAULT 0, -- 재고량
  
  -- Additional tracking info
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (used_quantity * unit_price) STORED,
  
  -- Supplier and delivery info
  supplier VARCHAR(255),
  delivery_date DATE,
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per daily report per material
  UNIQUE(daily_report_id, npc_material_id)
);

-- Insert sample NPC-1000 materials catalog
INSERT INTO public.npc1000_materials (npc_code, material_name, category, unit, standard_price, specification) VALUES
-- 콘크리트 관련
('C001001', 'Ready-Mix 콘크리트 24-21-150', '콘크리트', 'm³', 85000, '강도: 24MPa, 슬럼프: 150mm, 골재최대크기: 25mm'),
('C001002', 'Ready-Mix 콘크리트 27-18-120', '콘크리트', 'm³', 92000, '강도: 27MPa, 슬럼프: 120mm, 골재최대크기: 25mm'),
('C001003', 'Ready-Mix 콘크리트 30-15-100', '콘크리트', 'm³', 98000, '강도: 30MPa, 슬럼프: 100mm, 골재최대크기: 20mm'),
('C001004', '고강도 콘크리트 40-12-80', '콘크리트', 'm³', 125000, '강도: 40MPa, 슬럼프: 80mm, 골재최대크기: 20mm'),
('C004001', '포틀랜드 시멘트 1종', '시멘트', 'ton', 95000, '종류: 1종, 강도: 42.5MPa, 분말도: 3200cm²/g'),

-- 철근 관련
('R002001', 'SD400 이형철근 D13', '철근', 'ton', 920000, '등급: SD400, 직경: 13mm, 길이: 12m'),
('R002002', 'SD400 이형철근 D16', '철근', 'ton', 915000, '등급: SD400, 직경: 16mm, 길이: 12m'),
('R002003', 'SD400 이형철근 D19', '철근', 'ton', 910000, '등급: SD400, 직경: 19mm, 길이: 12m'),
('R002004', 'SD500 고강도철근 D22', '철근', 'ton', 950000, '등급: SD500, 직경: 22mm, 길이: 12m'),
('R002006', '와이어메쉬 D6-200x200', '철근', 'm²', 8500, '직경: 6mm, 메쉬: 200x200mm, 판크기: 2x3m'),

-- 골재 관련
('A003001', '쇄석 20-5mm (1종)', '골재', 'm³', 18000, '크기: 20-5mm, 등급: 1종, 밀도: 1.65t/m³'),
('A003002', '쇄석 25-5mm (1종)', '골재', 'm³', 17500, '크기: 25-5mm, 등급: 1종, 밀도: 1.65t/m³'),
('A003003', '강모래 (세척사)', '골재', 'm³', 22000, '타입: 세척사, 조립률: 2.6, 밀도: 1.55t/m³'),
('A003004', '바다모래 (세척사)', '골재', 'm³', 25000, '타입: 세척사, 조립률: 2.7, 밀도: 1.58t/m³'),

-- 기타 자재
('O005001', '거푸집 합판 12T', '기타', 'sheet', 35000, '두께: 12mm, 규격: 1200x2400mm, 등급: WBP'),
('O005002', '각목 50x100mm', '기타', 'm', 4500, '단면: 50x100mm, 등급: 1급, 함수율: 18%')

ON CONFLICT (npc_code) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_npc1000_materials_category ON public.npc1000_materials(category);
CREATE INDEX IF NOT EXISTS idx_npc1000_materials_npc_code ON public.npc1000_materials(npc_code);
CREATE INDEX IF NOT EXISTS idx_npc1000_materials_is_active ON public.npc1000_materials(is_active);

CREATE INDEX IF NOT EXISTS idx_npc1000_daily_records_report_id ON public.npc1000_daily_records(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_npc1000_daily_records_material_id ON public.npc1000_daily_records(npc_material_id);
CREATE INDEX IF NOT EXISTS idx_npc1000_daily_records_created_by ON public.npc1000_daily_records(created_by);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_npc1000_materials_updated_at 
    BEFORE UPDATE ON public.npc1000_materials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npc1000_daily_records_updated_at 
    BEFORE UPDATE ON public.npc1000_daily_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.npc1000_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc1000_daily_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for npc1000_materials (all authenticated users can view)
CREATE POLICY "npc1000_materials_select_policy" ON public.npc1000_materials
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for npc1000_daily_records (same as daily_reports)
CREATE POLICY "npc1000_daily_records_access_policy" ON public.npc1000_daily_records
    FOR ALL USING (
        -- Own records (creator)
        created_by = auth.uid()
        OR
        -- Same site team members (through daily report)
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            JOIN public.site_assignments sa ON dr.site_id = sa.site_id
            WHERE dr.id = daily_report_id
            AND sa.user_id = auth.uid()
            AND sa.is_active = true
            LIMIT 1
        )
    );

-- Create views for reporting and analytics
CREATE OR REPLACE VIEW public.npc1000_site_summary AS
SELECT 
    dr.site_id,
    s.name as site_name,
    nm.category,
    nm.material_name,
    nm.unit,
    SUM(ndr.incoming_quantity) as total_incoming,
    SUM(ndr.used_quantity) as total_used,
    AVG(ndr.remaining_quantity) as avg_remaining,
    SUM(ndr.total_cost) as total_cost,
    COUNT(*) as report_count,
    MAX(dr.work_date) as last_report_date
FROM public.npc1000_daily_records ndr
JOIN public.daily_reports dr ON ndr.daily_report_id = dr.id
JOIN public.npc1000_materials nm ON ndr.npc_material_id = nm.id
JOIN public.sites s ON dr.site_id = s.id
WHERE nm.is_active = true
GROUP BY dr.site_id, s.name, nm.category, nm.material_name, nm.unit;

-- Grant permissions
GRANT SELECT ON public.npc1000_materials TO authenticated;
GRANT ALL ON public.npc1000_daily_records TO authenticated;
GRANT SELECT ON public.npc1000_site_summary TO authenticated;