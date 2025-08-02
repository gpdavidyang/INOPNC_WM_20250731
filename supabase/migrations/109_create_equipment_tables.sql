-- Equipment & Resource Management System Tables
-- This migration creates the complete equipment and resource management system

-- ==========================================
-- 1. EQUIPMENT CATEGORIES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS equipment_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES equipment_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. EQUIPMENT TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES equipment_categories(id) ON DELETE SET NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  current_value DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'damaged', 'retired')),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  location TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. EQUIPMENT CHECK IN/OUT TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS equipment_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  checked_out_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date DATE,
  actual_return_date DATE,
  checked_in_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  checked_in_at TIMESTAMPTZ,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  purpose TEXT,
  condition_out TEXT DEFAULT 'good' CHECK (condition_out IN ('excellent', 'good', 'fair', 'poor')),
  condition_in TEXT CHECK (condition_in IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  damage_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. EQUIPMENT MAINTENANCE TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'inspection', 'calibration')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cost DECIMAL(10,2),
  description TEXT,
  next_maintenance_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. WORKER SKILLS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS worker_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. WORKER SKILL ASSIGNMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS worker_skill_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES worker_skills(id) ON DELETE CASCADE,
  proficiency_level TEXT DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  certified BOOLEAN DEFAULT false,
  certification_date DATE,
  certification_expiry DATE,
  hourly_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, skill_id)
);

-- ==========================================
-- 7. RESOURCE ALLOCATIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS resource_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  allocation_type TEXT NOT NULL CHECK (allocation_type IN ('worker', 'equipment')),
  resource_id UUID NOT NULL, -- Either worker_id or equipment_id
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  allocated_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hours_worked DECIMAL(4,2),
  regular_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2),
  hourly_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  task_description TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. EQUIPMENT LOCATIONS HISTORY TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS equipment_location_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  location TEXT,
  moved_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. CREATE INDEXES
-- ==========================================

-- Equipment indexes
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_site ON equipment(site_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_code ON equipment(code);

-- Equipment checkouts indexes
CREATE INDEX idx_equipment_checkouts_equipment ON equipment_checkouts(equipment_id);
CREATE INDEX idx_equipment_checkouts_user ON equipment_checkouts(checked_out_by);
CREATE INDEX idx_equipment_checkouts_site ON equipment_checkouts(site_id);
CREATE INDEX idx_equipment_checkouts_date ON equipment_checkouts(checked_out_at);
CREATE INDEX idx_equipment_checkouts_return ON equipment_checkouts(actual_return_date);

-- Equipment maintenance indexes
CREATE INDEX idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX idx_equipment_maintenance_scheduled ON equipment_maintenance(scheduled_date);
CREATE INDEX idx_equipment_maintenance_status ON equipment_maintenance(status);

-- Worker skill assignments indexes
CREATE INDEX idx_worker_skill_assignments_worker ON worker_skill_assignments(worker_id);
CREATE INDEX idx_worker_skill_assignments_skill ON worker_skill_assignments(skill_id);

-- Resource allocations indexes
CREATE INDEX idx_resource_allocations_type ON resource_allocations(allocation_type);
CREATE INDEX idx_resource_allocations_resource ON resource_allocations(resource_id);
CREATE INDEX idx_resource_allocations_site ON resource_allocations(site_id);
CREATE INDEX idx_resource_allocations_date ON resource_allocations(allocated_date);
CREATE INDEX idx_resource_allocations_daily_report ON resource_allocations(daily_report_id);

-- Equipment location history indexes
CREATE INDEX idx_equipment_location_history_equipment ON equipment_location_history(equipment_id);
CREATE INDEX idx_equipment_location_history_site ON equipment_location_history(site_id);
CREATE INDEX idx_equipment_location_history_date ON equipment_location_history(moved_at);

-- ==========================================
-- 10. ENABLE RLS
-- ==========================================

ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skill_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_location_history ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 11. RLS POLICIES
-- ==========================================

-- Equipment categories policies (everyone can read)
CREATE POLICY "Everyone can view equipment categories" ON equipment_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage equipment categories" ON equipment_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Equipment policies
CREATE POLICY "Users can view equipment for their organization" ON equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN sites s ON s.id = equipment.site_id
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        (s.organization_id = p.organization_id)
      )
    )
  );

CREATE POLICY "Managers can manage equipment" ON equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'system_admin', 'site_manager')
    )
  );

-- Equipment checkouts policies
CREATE POLICY "Users can view checkouts for their organization" ON equipment_checkouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN sites s ON s.id = equipment_checkouts.site_id
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        (s.organization_id = p.organization_id) OR
        equipment_checkouts.checked_out_by = p.id
      )
    )
  );

CREATE POLICY "Users can create checkouts" ON equipment_checkouts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.id = equipment_checkouts.checked_out_by
    )
  );

CREATE POLICY "Users can update their checkouts" ON equipment_checkouts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin', 'site_manager') OR
        equipment_checkouts.checked_out_by = p.id
      )
    )
  );

-- Equipment maintenance policies
CREATE POLICY "Users can view maintenance for their organization" ON equipment_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN equipment e ON e.id = equipment_maintenance.equipment_id
      LEFT JOIN sites s ON s.id = e.site_id
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        (s.organization_id = p.organization_id)
      )
    )
  );

CREATE POLICY "Managers can manage maintenance" ON equipment_maintenance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'system_admin', 'site_manager')
    )
  );

-- Worker skills policies (everyone can read)
CREATE POLICY "Everyone can view worker skills" ON worker_skills
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage worker skills" ON worker_skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Worker skill assignments policies
CREATE POLICY "Users can view skill assignments" ON worker_skill_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin', 'site_manager') OR
        worker_skill_assignments.worker_id = p.id
      )
    )
  );

CREATE POLICY "Managers can manage skill assignments" ON worker_skill_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'system_admin', 'site_manager')
    )
  );

-- Resource allocations policies
CREATE POLICY "Users can view allocations for their organization" ON resource_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN sites s ON s.id = resource_allocations.site_id
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        (s.organization_id = p.organization_id)
      )
    )
  );

CREATE POLICY "Managers can manage allocations" ON resource_allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'system_admin', 'site_manager')
    )
  );

-- Equipment location history policies
CREATE POLICY "Users can view location history" ON equipment_location_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN sites s ON s.id = equipment_location_history.site_id
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        (s.organization_id = p.organization_id)
      )
    )
  );

CREATE POLICY "Users can create location history" ON equipment_location_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.id = equipment_location_history.moved_by
    )
  );

-- ==========================================
-- 12. TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE TRIGGER update_equipment_categories_updated_at BEFORE UPDATE ON equipment_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_checkouts_updated_at BEFORE UPDATE ON equipment_checkouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_maintenance_updated_at BEFORE UPDATE ON equipment_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_skills_updated_at BEFORE UPDATE ON worker_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_skill_assignments_updated_at BEFORE UPDATE ON worker_skill_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_allocations_updated_at BEFORE UPDATE ON resource_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 13. FUNCTION TO UPDATE EQUIPMENT STATUS
-- ==========================================

CREATE OR REPLACE FUNCTION update_equipment_status_on_checkout()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When equipment is checked out, update status to 'in_use'
    UPDATE equipment 
    SET status = 'in_use' 
    WHERE id = NEW.equipment_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.actual_return_date IS NOT NULL AND OLD.actual_return_date IS NULL THEN
    -- When equipment is returned, update status to 'available'
    UPDATE equipment 
    SET status = 'available' 
    WHERE id = NEW.equipment_id;
    
    -- Also record location history if site changed
    IF EXISTS (
      SELECT 1 FROM equipment e 
      WHERE e.id = NEW.equipment_id 
      AND e.site_id != NEW.site_id
    ) THEN
      INSERT INTO equipment_location_history (equipment_id, site_id, moved_by, reason)
      VALUES (NEW.equipment_id, NEW.site_id, NEW.checked_in_by, 'Returned from checkout');
      
      UPDATE equipment 
      SET site_id = NEW.site_id 
      WHERE id = NEW.equipment_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_status_trigger
AFTER INSERT OR UPDATE ON equipment_checkouts
FOR EACH ROW
EXECUTE FUNCTION update_equipment_status_on_checkout();

-- ==========================================
-- 14. INSERT SAMPLE DATA
-- ==========================================

-- Insert equipment categories
INSERT INTO equipment_categories (id, name, description) VALUES
  ('e1111111-1111-1111-1111-111111111111', '중장비', '건설 중장비'),
  ('e2222222-2222-2222-2222-222222222222', '전동공구', '전기 동력 공구'),
  ('e3333333-3333-3333-3333-333333333333', '수공구', '수동 공구'),
  ('e4444444-4444-4444-4444-444444444444', '안전장비', '안전 보호 장비'),
  ('e5555555-5555-5555-5555-555555555555', '측정장비', '측정 및 검사 장비')
ON CONFLICT DO NOTHING;

-- Insert worker skills
INSERT INTO worker_skills (name, description, category) VALUES
  ('굴삭기 운전', '굴삭기 운전 및 조작', '중장비'),
  ('크레인 운전', '크레인 운전 및 신호수', '중장비'),
  ('용접', '아크용접 및 가스용접', '기술'),
  ('철근공', '철근 가공 및 조립', '기술'),
  ('형틀공', '거푸집 제작 및 설치', '기술'),
  ('콘크리트공', '콘크리트 타설 및 마감', '기술'),
  ('전기공', '전기 배선 및 설비', '기술'),
  ('배관공', '배관 설치 및 수리', '기술')
ON CONFLICT DO NOTHING;

-- Insert sample equipment
INSERT INTO equipment (code, name, category_id, manufacturer, model, status) VALUES
  ('EXC-001', '굴삭기 320D', 'e1111111-1111-1111-1111-111111111111', 'CAT', '320D', 'available'),
  ('CRN-001', '타워크레인 25t', 'e1111111-1111-1111-1111-111111111111', 'POTAIN', 'MC-310', 'available'),
  ('DRL-001', '전기드릴', 'e2222222-2222-2222-2222-222222222222', 'BOSCH', 'GSB-20', 'available'),
  ('DRL-002', '해머드릴', 'e2222222-2222-2222-2222-222222222222', 'HILTI', 'TE-30', 'available'),
  ('SAF-001', '안전모 세트', 'e4444444-4444-4444-4444-444444444444', '3M', 'H-700', 'available'),
  ('MSR-001', '레벨기', 'e5555555-5555-5555-5555-555555555555', 'TOPCON', 'AT-B4', 'available')
ON CONFLICT DO NOTHING;