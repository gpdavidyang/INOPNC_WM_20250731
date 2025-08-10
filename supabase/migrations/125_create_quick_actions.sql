-- Create quick_actions table for admin dashboard
CREATE TABLE IF NOT EXISTS quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50) NOT NULL, -- Lucide icon name
  link_url VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_quick_actions_display_order ON quick_actions(display_order);
CREATE INDEX idx_quick_actions_active ON quick_actions(is_active);

-- Enable RLS
ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for quick_actions
-- Admin users can manage all quick actions
CREATE POLICY "Admins can manage quick actions" ON quick_actions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'system_admin')
  )
);

-- All authenticated users can view active quick actions
CREATE POLICY "Users can view active quick actions" ON quick_actions
FOR SELECT USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
);

-- Insert default quick actions
INSERT INTO quick_actions (title, description, icon_name, link_url, display_order) VALUES
('사용자 관리', '시스템 사용자를 관리합니다', 'Users', '/dashboard/admin/users', 1),
('현장 관리', '건설 현장을 관리합니다', 'Building2', '/dashboard/admin/sites', 2),
('급여 관리', '직원 급여를 관리합니다', 'DollarSign', '/dashboard/admin/salary', 3),
('자재 관리', '건설 자재를 관리합니다', 'Package', '/dashboard/admin/materials', 4),
('문서 관리', '공유 문서를 관리합니다', 'FileText', '/dashboard/admin/shared-documents', 5),
('도면 관리', '마킹 도면을 관리합니다', 'Layers', '/dashboard/admin/markup', 6);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quick_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quick_actions_updated_at
  BEFORE UPDATE ON quick_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_actions_updated_at();