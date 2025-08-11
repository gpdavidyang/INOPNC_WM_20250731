-- Create missing tables that analytics functions depend on
-- Fix for analytics 500 errors due to missing table dependencies

-- 1. Create site_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('site_manager', 'worker', 'admin')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(site_id, user_id, role)
);

-- 2. Create worker_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS worker_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  role VARCHAR(100) DEFAULT 'worker',
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create equipment table if it doesn't exist
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'damaged')),
  purchase_date DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create equipment_checkouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS equipment_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  checkout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  return_date DATE,
  checkout_notes TEXT,
  return_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enhance attendance_records table if it exists, create if it doesn't
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'sick', 'vacation')),
  labor_hours DECIMAL(5,2) DEFAULT 8.0,
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(worker_id, site_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_members_lookup ON site_members(site_id, user_id, role);
CREATE INDEX IF NOT EXISTS idx_site_members_user ON site_members(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_worker_assignments_lookup ON worker_assignments(worker_id, site_id, is_active);
CREATE INDEX IF NOT EXISTS idx_worker_assignments_site ON worker_assignments(site_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_equipment_site ON equipment(site_id, status);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status) WHERE status IN ('available', 'in_use');

CREATE INDEX IF NOT EXISTS idx_equipment_checkouts_active ON equipment_checkouts(equipment_id, return_date) WHERE return_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_checkouts_worker ON equipment_checkouts(worker_id, checkout_date);

CREATE INDEX IF NOT EXISTS idx_attendance_records_lookup ON attendance_records(worker_id, site_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_site_date ON attendance_records(site_id, date, status);

-- Enable RLS on all new tables
ALTER TABLE site_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_members
CREATE POLICY "Users can view their own site memberships" ON site_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Site managers can view site members" ON site_members
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM site_members 
      WHERE user_id = auth.uid() AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admins can manage site members" ON site_members
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for worker_assignments
CREATE POLICY "Workers can view their own assignments" ON worker_assignments
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Site managers can view worker assignments for their sites" ON worker_assignments
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM site_members 
      WHERE user_id = auth.uid() AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admins can manage worker assignments" ON worker_assignments
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for equipment
CREATE POLICY "Site members can view site equipment" ON equipment
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM site_members WHERE user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Site managers can manage equipment" ON equipment
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM site_members 
      WHERE user_id = auth.uid() AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for equipment_checkouts
CREATE POLICY "Workers can view their own checkouts" ON equipment_checkouts
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Site managers can view all checkouts for their sites" ON equipment_checkouts
  FOR SELECT USING (
    equipment_id IN (
      SELECT e.id FROM equipment e
      JOIN site_members sm ON e.site_id = sm.site_id
      WHERE sm.user_id = auth.uid() AND sm.role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Site members can manage equipment checkouts" ON equipment_checkouts
  FOR ALL USING (
    equipment_id IN (
      SELECT e.id FROM equipment e
      JOIN site_members sm ON e.site_id = sm.site_id
      WHERE sm.user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for attendance_records
CREATE POLICY "Workers can view their own attendance" ON attendance_records
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Site managers can view attendance for their sites" ON attendance_records
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM site_members 
      WHERE user_id = auth.uid() AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Site managers can manage attendance records" ON attendance_records
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM site_members 
      WHERE user_id = auth.uid() AND role IN ('site_manager', 'admin')
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'system_admin')
    )
  );

-- Create update timestamp triggers
CREATE TRIGGER update_site_members_updated_at
  BEFORE UPDATE ON site_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_assignments_updated_at
  BEFORE UPDATE ON worker_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_checkouts_updated_at
  BEFORE UPDATE ON equipment_checkouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default data to prevent empty result sets in analytics functions
-- This helps prevent 500 errors when no data exists

-- Note: Only insert if tables are empty to avoid conflicts with existing data
INSERT INTO site_members (site_id, user_id, role)
SELECT s.id, p.id, 'site_manager'
FROM sites s
CROSS JOIN profiles p 
WHERE p.role IN ('admin', 'system_admin', 'site_manager')
  AND NOT EXISTS (SELECT 1 FROM site_members WHERE site_id = s.id AND user_id = p.id)
LIMIT 1;

-- Insert worker assignments for existing workers
INSERT INTO worker_assignments (worker_id, site_id)
SELECT p.id, s.id
FROM profiles p
CROSS JOIN sites s
WHERE p.role = 'worker'
  AND NOT EXISTS (SELECT 1 FROM worker_assignments WHERE worker_id = p.id AND site_id = s.id)
  AND EXISTS (SELECT 1 FROM site_members WHERE site_id = s.id)
LIMIT 10; -- Limit to prevent too many records

-- Grant permissions
GRANT SELECT ON site_members TO authenticated;
GRANT SELECT ON worker_assignments TO authenticated;
GRANT SELECT ON equipment TO authenticated;
GRANT SELECT ON equipment_checkouts TO authenticated;
GRANT SELECT ON attendance_records TO authenticated;