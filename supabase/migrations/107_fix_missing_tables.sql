-- Fix Missing Tables Migration
-- This migration creates missing tables that the application expects

-- ==========================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- Add missing columns to daily_reports table
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==========================================
-- 2. CREATE MISSING MATERIALS SYSTEM
-- ==========================================

-- Create material_categories table
CREATE TABLE IF NOT EXISTS material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES material_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'ea',
    unit_price DECIMAL(10,2),
    supplier TEXT,
    material_code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. CREATE MISSING WORK_LOGS TABLE  
-- ==========================================

-- Create work_logs table (if not exists from previous migrations)
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    work_type TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    worker_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create work_log_materials table
CREATE TABLE IF NOT EXISTS work_log_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_log_id UUID NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. INSERT SAMPLE DATA
-- ==========================================

-- Insert sample material categories
INSERT INTO material_categories (name, description) VALUES
('콘크리트', '콘크리트 관련 자재'),
('철근', '철근 및 철골 자재'),
('시멘트', '시멘트 관련 자재'),
('골재', '모래, 자갈 등 골재류'),
('기타', '기타 건설 자재')
ON CONFLICT (name) DO NOTHING;

-- Insert sample materials
INSERT INTO materials (category_id, name, unit, unit_price, material_code) VALUES
(
    (SELECT id FROM material_categories WHERE name = '콘크리트'),
    '레미콘 24-21-150',
    'm³',
    120000.00,
    'CONC-001'
),
(
    (SELECT id FROM material_categories WHERE name = '철근'),
    'D13 철근',
    'ton',
    850000.00,
    'REBAR-D13'
),
(
    (SELECT id FROM material_categories WHERE name = '시멘트'),
    '포틀랜드 시멘트',
    'ton',
    180000.00,
    'CEMENT-001'
),
(
    (SELECT id FROM material_categories WHERE name = '골재'),
    '굵은 골재 25mm',
    'm³',
    45000.00,
    'AGG-25'
),
(
    (SELECT id FROM material_categories WHERE name = '골재'),
    '잔골재 (모래)',
    'm³',
    35000.00,
    'SAND-001'
)
ON CONFLICT (material_code) DO NOTHING;

-- ==========================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Indexes for work_logs
CREATE INDEX IF NOT EXISTS idx_work_logs_daily_report_id ON work_logs(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_work_type ON work_logs(work_type);

-- Indexes for materials
CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);

-- Indexes for work_log_materials
CREATE INDEX IF NOT EXISTS idx_work_log_materials_work_log_id ON work_log_materials(work_log_id);
CREATE INDEX IF NOT EXISTS idx_work_log_materials_material_id ON work_log_materials(material_id);

-- ==========================================
-- 6. ENABLE RLS (Row Level Security)
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_log_materials ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (all authenticated users can read)
CREATE POLICY "material_categories_select" ON material_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials_select" ON materials FOR SELECT TO authenticated USING (true);

-- Work logs policies (users can access logs for their organization's sites)
CREATE POLICY "work_logs_select" ON work_logs FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM daily_reports dr
        JOIN sites s ON dr.site_id = s.id
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE dr.id = work_logs.daily_report_id
        AND p.id = auth.uid()
    )
);

CREATE POLICY "work_logs_insert" ON work_logs FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM daily_reports dr
        JOIN sites s ON dr.site_id = s.id
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE dr.id = work_logs.daily_report_id
        AND p.id = auth.uid()
    )
);

-- Work log materials policies
CREATE POLICY "work_log_materials_select" ON work_log_materials FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM work_logs wl
        JOIN daily_reports dr ON wl.daily_report_id = dr.id
        JOIN sites s ON dr.site_id = s.id
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE wl.id = work_log_materials.work_log_id
        AND p.id = auth.uid()
    )
);

CREATE POLICY "work_log_materials_insert" ON work_log_materials FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM work_logs wl
        JOIN daily_reports dr ON wl.daily_report_id = dr.id
        JOIN sites s ON dr.site_id = s.id
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE wl.id = work_log_materials.work_log_id
        AND p.id = auth.uid()
    )
);