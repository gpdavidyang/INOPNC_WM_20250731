-- NPC Material Management System Tables
-- 생산관리, 출고관리, 출고요청 관리를 위한 테이블

-- 1. NPC 생산 관리 테이블
CREATE TABLE IF NOT EXISTS npc_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_date DATE NOT NULL,
  production_amount INTEGER NOT NULL DEFAULT 0,
  shipment_amount INTEGER NOT NULL DEFAULT 0,
  balance_amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. NPC 출고 관리 테이블
CREATE TABLE IF NOT EXISTS npc_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_date DATE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'shipped', 'delivered')),
  delivery_method VARCHAR(20) CHECK (delivery_method IN ('parcel', 'freight')),
  invoice_confirmed BOOLEAN DEFAULT FALSE,
  tax_invoice_issued BOOLEAN DEFAULT FALSE,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  shipping_cost INTEGER,
  tracking_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NPC 출고 요청 관리 테이블
CREATE TABLE IF NOT EXISTS npc_shipment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_amount INTEGER NOT NULL,
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  approved_amount INTEGER,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  fulfillment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_npc_production_date ON npc_production(production_date DESC);
CREATE INDEX IF NOT EXISTS idx_npc_shipments_date ON npc_shipments(shipment_date DESC);
CREATE INDEX IF NOT EXISTS idx_npc_shipments_site ON npc_shipments(site_id);
CREATE INDEX IF NOT EXISTS idx_npc_shipments_status ON npc_shipments(delivery_status);
CREATE INDEX IF NOT EXISTS idx_npc_requests_site ON npc_shipment_requests(site_id);
CREATE INDEX IF NOT EXISTS idx_npc_requests_requester ON npc_shipment_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_npc_requests_status ON npc_shipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_npc_requests_urgency ON npc_shipment_requests(urgency);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE npc_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_shipment_requests ENABLE ROW LEVEL SECURITY;

-- NPC Production Policies
CREATE POLICY "Admins can manage production data" ON npc_production
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Production managers can manage production" ON npc_production
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'production_manager'
    )
  );

-- NPC Shipments Policies
CREATE POLICY "Admins can manage shipments" ON npc_shipments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Site managers can view their site shipments" ON npc_shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM site_memberships 
      WHERE site_id = npc_shipments.site_id 
      AND user_id = auth.uid()
      AND role = 'site_manager'
      AND status = 'active'
    )
  );

-- NPC Shipment Requests Policies
CREATE POLICY "Anyone can create shipment requests" ON npc_shipment_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id
  );

CREATE POLICY "Users can view their own requests" ON npc_shipment_requests
  FOR SELECT USING (
    requester_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Users can update their pending requests" ON npc_shipment_requests
  FOR UPDATE USING (
    requester_id = auth.uid() AND status = 'pending'
  );

CREATE POLICY "Admins can manage all requests" ON npc_shipment_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Site managers can view their site requests" ON npc_shipment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM site_memberships 
      WHERE site_id = npc_shipment_requests.site_id 
      AND user_id = auth.uid()
      AND role = 'site_manager'
      AND status = 'active'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_npc_production_updated_at BEFORE UPDATE ON npc_production
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npc_shipments_updated_at BEFORE UPDATE ON npc_shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npc_requests_updated_at BEFORE UPDATE ON npc_shipment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO npc_production (production_date, production_amount, shipment_amount, balance_amount, notes)
VALUES 
  (CURRENT_DATE - INTERVAL '7 days', 5000, 1000, 4000, '초기 생산'),
  (CURRENT_DATE - INTERVAL '5 days', 3000, 1500, 5500, '추가 생산'),
  (CURRENT_DATE - INTERVAL '3 days', 4000, 2000, 7500, '정기 생산'),
  (CURRENT_DATE - INTERVAL '1 day', 2000, 1000, 8500, '소량 생산'),
  (CURRENT_DATE, 3500, 500, 11500, '금일 생산')
ON CONFLICT DO NOTHING;