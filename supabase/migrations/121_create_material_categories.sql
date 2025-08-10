-- Create material_categories table for NPC-1000 standard material classification

CREATE TABLE IF NOT EXISTS material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES material_categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_material_categories_code ON material_categories(code);
CREATE INDEX idx_material_categories_parent ON material_categories(parent_id);
CREATE INDEX idx_material_categories_active ON material_categories(is_active);

-- Enable RLS
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view material categories" ON material_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can manage material categories" ON material_categories
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- Insert basic categories following NPC-1000 standard
INSERT INTO material_categories (code, name, description, level, display_order) VALUES
  ('C', '콘크리트', 'Concrete materials', 1, 1),
  ('R', '철근', 'Reinforcement steel', 1, 2),
  ('F', '거푸집', 'Formwork materials', 1, 3),
  ('S', '철골', 'Steel structure', 1, 4),
  ('M', '조적', 'Masonry materials', 1, 5),
  ('W', '방수', 'Waterproofing materials', 1, 6),
  ('I', '단열', 'Insulation materials', 1, 7),
  ('P', '도장', 'Painting materials', 1, 8),
  ('T', '타일', 'Tile materials', 1, 9),
  ('G', '유리', 'Glass materials', 1, 10),
  ('E', '전기', 'Electrical materials', 1, 11),
  ('H', '기계설비', 'Mechanical equipment', 1, 12),
  ('O', '기타', 'Other materials', 1, 99);

-- Insert subcategories for Concrete
INSERT INTO material_categories (code, name, description, parent_id, level, display_order) 
SELECT 
  'C01', '레미콘', 'Ready-mixed concrete', id, 2, 1
FROM material_categories WHERE code = 'C';

INSERT INTO material_categories (code, name, description, parent_id, level, display_order) 
SELECT 
  'C02', '시멘트', 'Cement', id, 2, 2
FROM material_categories WHERE code = 'C';

-- Update materials table to reference material_categories
ALTER TABLE materials 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES material_categories(id);

-- Create index on materials.category_id
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_material_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_material_categories_updated_at
  BEFORE UPDATE ON material_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_material_categories_updated_at();