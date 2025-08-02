-- Create material categories table
CREATE TABLE IF NOT EXISTS material_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES material_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL, -- kg, m, ea, box, etc.
  specification TEXT,
  manufacturer TEXT,
  min_stock_level DECIMAL(10,2) DEFAULT 0,
  max_stock_level DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create material inventory table (current stock by site)
CREATE TABLE IF NOT EXISTS material_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  reserved_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  available_stock DECIMAL(10,2) GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, material_id)
);

-- Create material transactions table (all stock movements)
CREATE TABLE IF NOT EXISTS material_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'transfer', 'adjustment', 'return')),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  reference_type TEXT, -- 'daily_report', 'purchase_order', 'transfer', etc.
  reference_id UUID, -- ID of related entity
  from_site_id UUID REFERENCES sites(id) ON DELETE SET NULL, -- for transfers
  to_site_id UUID REFERENCES sites(id) ON DELETE SET NULL, -- for transfers
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create material requests table
CREATE TABLE IF NOT EXISTS material_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  needed_by DATE,
  notes TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create material request items table
CREATE TABLE IF NOT EXISTS material_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  requested_quantity DECIMAL(10,2) NOT NULL,
  approved_quantity DECIMAL(10,2),
  fulfilled_quantity DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_materials_code ON materials(code);
CREATE INDEX idx_material_inventory_site ON material_inventory(site_id);
CREATE INDEX idx_material_inventory_material ON material_inventory(material_id);
CREATE INDEX idx_material_transactions_site ON material_transactions(site_id);
CREATE INDEX idx_material_transactions_material ON material_transactions(material_id);
CREATE INDEX idx_material_transactions_date ON material_transactions(transaction_date);
CREATE INDEX idx_material_requests_site ON material_requests(site_id);
CREATE INDEX idx_material_requests_status ON material_requests(status);

-- Create updated_at triggers
CREATE TRIGGER update_material_categories_updated_at BEFORE UPDATE ON material_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_inventory_updated_at BEFORE UPDATE ON material_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_transactions_updated_at BEFORE UPDATE ON material_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_requests_updated_at BEFORE UPDATE ON material_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update inventory after transaction
CREATE OR REPLACE FUNCTION update_material_inventory_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'in' THEN
    INSERT INTO material_inventory (site_id, material_id, current_stock)
    VALUES (NEW.site_id, NEW.material_id, NEW.quantity)
    ON CONFLICT (site_id, material_id)
    DO UPDATE SET 
      current_stock = material_inventory.current_stock + NEW.quantity,
      last_updated = NOW();
  ELSIF NEW.transaction_type = 'out' THEN
    UPDATE material_inventory
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW()
    WHERE site_id = NEW.site_id AND material_id = NEW.material_id;
  ELSIF NEW.transaction_type = 'transfer' AND NEW.from_site_id IS NOT NULL AND NEW.to_site_id IS NOT NULL THEN
    -- Decrease from source site
    UPDATE material_inventory
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW()
    WHERE site_id = NEW.from_site_id AND material_id = NEW.material_id;
    
    -- Increase at destination site
    INSERT INTO material_inventory (site_id, material_id, current_stock)
    VALUES (NEW.to_site_id, NEW.material_id, NEW.quantity)
    ON CONFLICT (site_id, material_id)
    DO UPDATE SET 
      current_stock = material_inventory.current_stock + NEW.quantity,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
CREATE TRIGGER update_inventory_after_transaction
AFTER INSERT ON material_transactions
FOR EACH ROW
EXECUTE FUNCTION update_material_inventory_after_transaction();

-- Row Level Security
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_request_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for material_categories (everyone can read)
CREATE POLICY "Everyone can view material categories" ON material_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage material categories" ON material_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for materials (everyone can read)
CREATE POLICY "Everyone can view materials" ON materials
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage materials" ON materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for material_inventory
CREATE POLICY "Users can view inventory for their sites" ON material_inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_sites us ON us.user_id = p.id
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        material_inventory.site_id = p.site_id OR
        material_inventory.site_id = us.site_id
      )
    )
  );

CREATE POLICY "Site managers and admins can manage inventory" ON material_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        (p.role = 'site_manager' AND p.site_id = material_inventory.site_id)
      )
    )
  );

-- RLS Policies for material_transactions
CREATE POLICY "Users can view transactions for their sites" ON material_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_sites us ON us.user_id = p.id
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        material_transactions.site_id = p.site_id OR
        material_transactions.site_id = us.site_id OR
        material_transactions.from_site_id = p.site_id OR
        material_transactions.from_site_id = us.site_id OR
        material_transactions.to_site_id = p.site_id OR
        material_transactions.to_site_id = us.site_id
      )
    )
  );

CREATE POLICY "Users can create transactions for their sites" ON material_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.id = material_transactions.created_by
      AND (
        p.role IN ('admin', 'system_admin', 'site_manager') OR
        (p.role = 'worker' AND p.site_id = material_transactions.site_id)
      )
    )
  );

-- RLS Policies for material_requests
CREATE POLICY "Users can view requests for their sites" ON material_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN user_sites us ON us.user_id = p.id
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        material_requests.site_id = p.site_id OR
        material_requests.site_id = us.site_id OR
        material_requests.requested_by = p.id
      )
    )
  );

CREATE POLICY "Users can create requests" ON material_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.id = material_requests.requested_by
    )
  );

CREATE POLICY "Site managers and admins can update requests" ON material_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'system_admin') OR
        (p.role = 'site_manager' AND p.site_id = material_requests.site_id)
      )
    )
  );

-- RLS Policies for material_request_items
CREATE POLICY "Users can view request items" ON material_request_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM material_requests mr
      JOIN profiles p ON p.id = auth.uid()
      LEFT JOIN user_sites us ON us.user_id = p.id
      WHERE mr.id = material_request_items.request_id
      AND (
        p.role IN ('admin', 'system_admin') OR
        mr.site_id = p.site_id OR
        mr.site_id = us.site_id OR
        mr.requested_by = p.id
      )
    )
  );

CREATE POLICY "Users can manage their request items" ON material_request_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM material_requests mr
      JOIN profiles p ON p.id = auth.uid()
      WHERE mr.id = material_request_items.request_id
      AND (
        p.role IN ('admin', 'system_admin') OR
        (p.role = 'site_manager' AND p.site_id = mr.site_id) OR
        (mr.requested_by = p.id AND mr.status = 'pending')
      )
    )
  );

-- Insert initial data
INSERT INTO material_categories (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'NPC 자재', 'NPC 관련 자재'),
  ('22222222-2222-2222-2222-222222222222', '철근', '철근 및 관련 자재'),
  ('33333333-3333-3333-3333-333333333333', '콘크리트', '콘크리트 및 관련 자재'),
  ('44444444-4444-4444-4444-444444444444', '기타 자재', '기타 건설 자재')
ON CONFLICT DO NOTHING;

INSERT INTO materials (code, name, category_id, unit, specification, min_stock_level) VALUES
  ('NPC-1000', 'NPC-1000', '11111111-1111-1111-1111-111111111111', 'kg', '고강도 보수 모르타르', 1000),
  ('NPC-2000', 'NPC-2000', '11111111-1111-1111-1111-111111111111', 'kg', '속경성 보수 모르타르', 500),
  ('REBAR-D10', '철근 D10', '22222222-2222-2222-2222-222222222222', 'ton', 'SD400 D10', 10),
  ('REBAR-D13', '철근 D13', '22222222-2222-2222-2222-222222222222', 'ton', 'SD400 D13', 10),
  ('REBAR-D16', '철근 D16', '22222222-2222-2222-2222-222222222222', 'ton', 'SD400 D16', 10),
  ('CON-25-210', '레미콘 25-210', '33333333-3333-3333-3333-333333333333', 'm3', '25MPa 슬럼프 210mm', 0),
  ('CON-30-210', '레미콘 30-210', '33333333-3333-3333-3333-333333333333', 'm3', '30MPa 슬럼프 210mm', 0)
ON CONFLICT DO NOTHING;