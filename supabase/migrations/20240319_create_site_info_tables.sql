-- Site Information Tables Migration
-- This migration creates tables for the Site Information (현장정보) feature

-- 1. Create site_addresses table
CREATE TABLE IF NOT EXISTS site_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  full_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  postal_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(site_id)
);

-- 2. Create accommodation_addresses table
CREATE TABLE IF NOT EXISTS accommodation_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  accommodation_name VARCHAR(255) NOT NULL,
  full_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(site_id)
);

-- 3. Create user_site_assignments table
CREATE TABLE IF NOT EXISTS user_site_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, site_id, assigned_date)
);

-- 4. Create site_preferences table
CREATE TABLE IF NOT EXISTS site_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expanded_sections JSONB DEFAULT '{"address": true, "accommodation": true, "process": true, "managers": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- 5. Add manager contact columns to sites table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'construction_manager_name') THEN
    ALTER TABLE sites ADD COLUMN construction_manager_name VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'construction_manager_phone') THEN
    ALTER TABLE sites ADD COLUMN construction_manager_phone VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'assistant_manager_name') THEN
    ALTER TABLE sites ADD COLUMN assistant_manager_name VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'assistant_manager_phone') THEN
    ALTER TABLE sites ADD COLUMN assistant_manager_phone VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'safety_manager_name') THEN
    ALTER TABLE sites ADD COLUMN safety_manager_name VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'safety_manager_phone') THEN
    ALTER TABLE sites ADD COLUMN safety_manager_phone VARCHAR(20);
  END IF;
END $$;

-- 6. Add member_name, work_process, work_section columns to daily_reports if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_reports' AND column_name = 'member_name') THEN
    ALTER TABLE daily_reports ADD COLUMN member_name VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_reports' AND column_name = 'work_process') THEN
    ALTER TABLE daily_reports ADD COLUMN work_process VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_reports' AND column_name = 'work_section') THEN
    ALTER TABLE daily_reports ADD COLUMN work_section VARCHAR(100);
  END IF;
END $$;

-- 7. Create indexes for performance
CREATE INDEX idx_site_addresses_site_id ON site_addresses(site_id);
CREATE INDEX idx_accommodation_addresses_site_id ON accommodation_addresses(site_id);
CREATE INDEX idx_user_site_assignments_user_id ON user_site_assignments(user_id);
CREATE INDEX idx_user_site_assignments_site_id ON user_site_assignments(site_id);
CREATE INDEX idx_user_site_assignments_active ON user_site_assignments(is_active);
CREATE INDEX idx_site_preferences_user_id ON site_preferences(user_id);

-- 8. Enable RLS on new tables
ALTER TABLE site_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_preferences ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for site_addresses
CREATE POLICY "Users can view site addresses for their assigned sites" ON site_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_site_assignments usa
      WHERE usa.site_id = site_addresses.site_id
      AND usa.user_id = auth.uid()
      AND usa.is_active = true
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('site_manager', 'admin', 'system_admin')
    )
  );

CREATE POLICY "Admins can manage site addresses" ON site_addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- 10. Create RLS policies for accommodation_addresses
CREATE POLICY "Users can view accommodation for their assigned sites" ON accommodation_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_site_assignments usa
      WHERE usa.site_id = accommodation_addresses.site_id
      AND usa.user_id = auth.uid()
      AND usa.is_active = true
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('site_manager', 'admin', 'system_admin')
    )
  );

CREATE POLICY "Admins can manage accommodation addresses" ON accommodation_addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- 11. Create RLS policies for user_site_assignments
CREATE POLICY "Users can view their own assignments" ON user_site_assignments
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('site_manager', 'admin', 'system_admin')
    )
  );

CREATE POLICY "Managers can manage site assignments" ON user_site_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('site_manager', 'admin', 'system_admin')
    )
  );

-- 12. Create RLS policies for site_preferences
CREATE POLICY "Users can manage their own preferences" ON site_preferences
  FOR ALL USING (user_id = auth.uid());

-- 13. Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_addresses_updated_at BEFORE UPDATE ON site_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accommodation_addresses_updated_at BEFORE UPDATE ON accommodation_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_site_assignments_updated_at BEFORE UPDATE ON user_site_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_preferences_updated_at BEFORE UPDATE ON site_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Insert sample data for testing (optional)
-- Uncomment the following section to add sample data

/*
-- Get the first active site
DO $$
DECLARE
  v_site_id UUID;
  v_user_id UUID;
BEGIN
  -- Get first site
  SELECT id INTO v_site_id FROM sites WHERE is_active = true LIMIT 1;
  
  -- Get worker user
  SELECT id INTO v_user_id FROM profiles WHERE email = 'worker@inopnc.com' LIMIT 1;
  
  IF v_site_id IS NOT NULL THEN
    -- Add site address
    INSERT INTO site_addresses (site_id, full_address, latitude, longitude, postal_code)
    VALUES (
      v_site_id,
      '서울특별시 강남구 테헤란로 123 건설빌딩',
      37.5665,
      126.9780,
      '06234'
    ) ON CONFLICT (site_id) DO NOTHING;
    
    -- Add accommodation
    INSERT INTO accommodation_addresses (site_id, accommodation_name, full_address, latitude, longitude)
    VALUES (
      v_site_id,
      '강남 게스트하우스',
      '서울특별시 강남구 역삼동 456-78',
      37.5010,
      127.0363
    ) ON CONFLICT (site_id) DO NOTHING;
    
    -- Update site with manager info
    UPDATE sites 
    SET 
      construction_manager_name = '김철수',
      construction_manager_phone = '010-1234-5678',
      assistant_manager_name = '이부장',
      assistant_manager_phone = '010-2345-6789',
      safety_manager_name = '박안전',
      safety_manager_phone = '010-9876-5432'
    WHERE id = v_site_id;
    
    -- Assign user to site
    IF v_user_id IS NOT NULL THEN
      INSERT INTO user_site_assignments (user_id, site_id, assigned_date, is_active)
      VALUES (v_user_id, v_site_id, CURRENT_DATE, true)
      ON CONFLICT (user_id, site_id, assigned_date) DO NOTHING;
    END IF;
  END IF;
END $$;
*/

-- Migration complete!
COMMENT ON TABLE site_addresses IS 'Stores site location addresses for construction sites';
COMMENT ON TABLE accommodation_addresses IS 'Stores accommodation addresses for construction sites';
COMMENT ON TABLE user_site_assignments IS 'Tracks which users are assigned to which sites';
COMMENT ON TABLE site_preferences IS 'Stores user preferences for site information display';