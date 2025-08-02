-- Create worker skills table
CREATE TABLE IF NOT EXISTS worker_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Create worker skill assignments table
CREATE TABLE IF NOT EXISTS worker_skill_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES worker_skills(id) ON DELETE CASCADE,
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  certified BOOLEAN DEFAULT FALSE,
  certification_date DATE,
  certification_expiry DATE,
  hourly_rate DECIMAL(10, 2),
  overtime_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(worker_id, skill_id)
);

-- Create resource allocations table
CREATE TABLE IF NOT EXISTS resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_type VARCHAR(20) NOT NULL CHECK (allocation_type IN ('worker', 'equipment')),
  resource_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  allocation_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hours_worked DECIMAL(4, 2),
  overtime_hours DECIMAL(4, 2),
  hourly_rate DECIMAL(10, 2),
  overtime_rate DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  task_description TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_worker_skill_assignments_worker_id ON worker_skill_assignments(worker_id);
CREATE INDEX idx_worker_skill_assignments_skill_id ON worker_skill_assignments(skill_id);
CREATE INDEX idx_resource_allocations_type_resource ON resource_allocations(allocation_type, resource_id);
CREATE INDEX idx_resource_allocations_site_date ON resource_allocations(site_id, allocation_date);
CREATE INDEX idx_resource_allocations_date ON resource_allocations(allocation_date);

-- Insert some default skills
INSERT INTO worker_skills (name, category, description) VALUES
  ('일반 건설', 'general', '일반적인 건설 작업 수행 능력'),
  ('철근 작업', 'specialized', '철근 배근 및 조립 작업'),
  ('콘크리트 작업', 'specialized', '콘크리트 타설 및 마감 작업'),
  ('목공', 'specialized', '목재 가공 및 설치 작업'),
  ('전기 설비', 'technical', '전기 배선 및 설비 작업'),
  ('배관 설비', 'technical', '급배수 및 가스 배관 작업'),
  ('타일 작업', 'finishing', '타일 시공 및 마감 작업'),
  ('도장 작업', 'finishing', '페인트 및 도장 작업'),
  ('방수 작업', 'specialized', '방수 시공 작업'),
  ('용접', 'technical', '각종 용접 작업'),
  ('중장비 운전', 'equipment', '굴삭기, 크레인 등 중장비 운전'),
  ('비계 작업', 'specialized', '비계 설치 및 해체 작업')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skill_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for worker_skills
CREATE POLICY "Anyone can view worker skills" ON worker_skills
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage worker skills" ON worker_skills
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'site_manager')
    )
  );

-- RLS Policies for worker_skill_assignments
CREATE POLICY "Workers can view their own skill assignments" ON worker_skill_assignments
  FOR SELECT TO authenticated
  USING (
    worker_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'site_manager')
    )
  );

CREATE POLICY "Managers can manage skill assignments" ON worker_skill_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'site_manager')
    )
  );

-- RLS Policies for resource_allocations
CREATE POLICY "Workers can view their own allocations" ON resource_allocations
  FOR SELECT TO authenticated
  USING (
    (allocation_type = 'worker' AND resource_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'site_manager')
    )
  );

CREATE POLICY "Managers can manage resource allocations" ON resource_allocations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'site_manager')
    )
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_worker_skills_updated_at BEFORE UPDATE ON worker_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_skill_assignments_updated_at BEFORE UPDATE ON worker_skill_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_allocations_updated_at BEFORE UPDATE ON resource_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();