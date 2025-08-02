-- Equipment maintenance table
CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('routine', 'urgent', 'inspection')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety alerts table
CREATE TABLE IF NOT EXISTS safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  incident_type VARCHAR(100),
  location VARCHAR(255),
  affected_workers UUID[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety alert acknowledgments
CREATE TABLE IF NOT EXISTS safety_alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES safety_alerts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alert_id, user_id)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  site_ids UUID[] DEFAULT '{}',
  target_roles VARCHAR(50)[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcement read tracking
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Announcement dismissals
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Announcement logs
CREATE TABLE IF NOT EXISTS announcement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX idx_equipment_maintenance_scheduled_date ON equipment_maintenance(scheduled_date);
CREATE INDEX idx_equipment_maintenance_assigned_to ON equipment_maintenance(assigned_to);
CREATE INDEX idx_equipment_maintenance_status ON equipment_maintenance(status);

CREATE INDEX idx_safety_alerts_site_id ON safety_alerts(site_id);
CREATE INDEX idx_safety_alerts_status ON safety_alerts(status);
CREATE INDEX idx_safety_alerts_severity ON safety_alerts(severity);

CREATE INDEX idx_announcements_site_ids ON announcements USING GIN (site_ids);
CREATE INDEX idx_announcements_target_roles ON announcements USING GIN (target_roles);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_expires_at ON announcements(expires_at);

-- Add RLS policies
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alert_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_logs ENABLE ROW LEVEL SECURITY;

-- Equipment maintenance policies
CREATE POLICY "Users can view maintenance for their equipment" ON equipment_maintenance
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin', 'site_manager', 'equipment_manager'))
  );

CREATE POLICY "Managers can create maintenance records" ON equipment_maintenance
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin', 'site_manager', 'equipment_manager'))
  );

CREATE POLICY "Managers can update maintenance records" ON equipment_maintenance
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin', 'site_manager', 'equipment_manager'))
  );

-- Safety alerts policies
CREATE POLICY "Users at site can view safety alerts" ON safety_alerts
  FOR SELECT USING (
    site_id IN (SELECT site_id FROM profiles WHERE id = auth.uid()) OR
    auth.uid() = ANY(affected_workers) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin'))
  );

CREATE POLICY "Managers can create safety alerts" ON safety_alerts
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin', 'site_manager', 'safety_manager'))
  );

CREATE POLICY "Users can acknowledge their safety alerts" ON safety_alert_acknowledgments
  FOR ALL USING (user_id = auth.uid());

-- Announcements policies
CREATE POLICY "Users can view relevant announcements" ON announcements
  FOR SELECT USING (
    (site_ids && ARRAY[(SELECT site_id FROM profiles WHERE id = auth.uid())]::uuid[] OR site_ids = '{}') AND
    (target_roles && ARRAY[(SELECT role FROM profiles WHERE id = auth.uid())]::varchar[] OR target_roles = '{}') AND
    status = 'active' AND
    (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "Managers can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin', 'site_manager'))
  );

CREATE POLICY "Users can track their announcement reads" ON announcement_reads
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can dismiss announcements" ON announcement_dismissals
  FOR ALL USING (user_id = auth.uid());

-- Add update triggers
CREATE TRIGGER update_equipment_maintenance_updated_at
  BEFORE UPDATE ON equipment_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_alerts_updated_at
  BEFORE UPDATE ON safety_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();