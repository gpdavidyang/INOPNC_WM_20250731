-- Material Management System Migration
-- This migration creates the complete material management system tables

-- ==========================================
-- 1. MATERIAL INVENTORY TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS material_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,2),
    maximum_stock DECIMAL(10,2),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    UNIQUE(site_id, material_id)
);

-- ==========================================
-- 2. MATERIAL REQUESTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS material_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    requested_by UUID NOT NULL REFERENCES profiles(id),
    required_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ordered', 'delivered')),
    notes TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    requested_quantity DECIMAL(10,2) NOT NULL,
    approved_quantity DECIMAL(10,2),
    delivered_quantity DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. MATERIAL TRANSACTIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS material_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    material_id UUID NOT NULL REFERENCES materials(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('in', 'out', 'return', 'waste', 'adjustment')),
    quantity DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50), -- e.g., 'daily_report', 'material_request', 'manual'
    reference_id UUID, -- ID of the related record
    performed_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. MATERIAL SUPPLIERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS material_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    business_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add supplier_id to materials table
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES material_suppliers(id);

-- ==========================================
-- 5. CREATE INDEXES
-- ==========================================

-- Material inventory indexes
CREATE INDEX IF NOT EXISTS idx_material_inventory_site_id ON material_inventory(site_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_material_id ON material_inventory(material_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_low_stock ON material_inventory(site_id, material_id) 
WHERE current_stock <= minimum_stock;

-- Material requests indexes
CREATE INDEX IF NOT EXISTS idx_material_requests_site_id ON material_requests(site_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_requested_by ON material_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_required_date ON material_requests(required_date);

-- Material request items indexes
CREATE INDEX IF NOT EXISTS idx_material_request_items_request_id ON material_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_material_request_items_material_id ON material_request_items(material_id);

-- Material transactions indexes
CREATE INDEX IF NOT EXISTS idx_material_transactions_site_id ON material_transactions(site_id);
CREATE INDEX IF NOT EXISTS idx_material_transactions_material_id ON material_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_material_transactions_type ON material_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_material_transactions_created_at ON material_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_material_transactions_reference ON material_transactions(reference_type, reference_id);

-- ==========================================
-- 6. ENABLE RLS
-- ==========================================

ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_suppliers ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 7. RLS POLICIES
-- ==========================================

-- Material inventory policies
CREATE POLICY "material_inventory_select" ON material_inventory FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM sites s
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE s.id = material_inventory.site_id
        AND p.id = auth.uid()
    )
);

CREATE POLICY "material_inventory_insert" ON material_inventory FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM sites s
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE s.id = material_inventory.site_id
        AND p.id = auth.uid()
        AND p.role IN ('admin', 'site_manager', 'system_admin')
    )
);

CREATE POLICY "material_inventory_update" ON material_inventory FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM sites s
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE s.id = material_inventory.site_id
        AND p.id = auth.uid()
        AND p.role IN ('admin', 'site_manager', 'system_admin')
    )
);

-- Material requests policies
CREATE POLICY "material_requests_select" ON material_requests FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM sites s
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE s.id = material_requests.site_id
        AND p.id = auth.uid()
    )
);

CREATE POLICY "material_requests_insert" ON material_requests FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM sites s
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE s.id = material_requests.site_id
        AND p.id = auth.uid()
    )
);

CREATE POLICY "material_requests_update" ON material_requests FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM sites s
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE s.id = material_requests.site_id
        AND p.id = auth.uid()
        AND (
            p.role IN ('admin', 'site_manager', 'system_admin')
            OR material_requests.requested_by = auth.uid()
        )
    )
);

-- Material request items policies
CREATE POLICY "material_request_items_select" ON material_request_items FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM material_requests mr
        JOIN sites s ON mr.site_id = s.id
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE mr.id = material_request_items.request_id
        AND p.id = auth.uid()
    )
);

CREATE POLICY "material_request_items_insert" ON material_request_items FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM material_requests mr
        JOIN sites s ON mr.site_id = s.id
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE mr.id = material_request_items.request_id
        AND p.id = auth.uid()
    )
);

-- Material transactions policies
CREATE POLICY "material_transactions_select" ON material_transactions FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM sites s
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE s.id = material_transactions.site_id
        AND p.id = auth.uid()
    )
);

CREATE POLICY "material_transactions_insert" ON material_transactions FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM sites s
        JOIN profiles p ON p.organization_id = s.organization_id
        WHERE s.id = material_transactions.site_id
        AND p.id = auth.uid()
        AND p.role IN ('admin', 'site_manager', 'system_admin', 'worker')
    )
);

-- Material suppliers policies
CREATE POLICY "material_suppliers_select" ON material_suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "material_suppliers_insert" ON material_suppliers FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'system_admin')
    )
);

CREATE POLICY "material_suppliers_update" ON material_suppliers FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'system_admin')
    )
);

-- ==========================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_material_inventory_updated_at BEFORE UPDATE ON material_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_requests_updated_at BEFORE UPDATE ON material_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_request_items_updated_at BEFORE UPDATE ON material_request_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_transactions_updated_at BEFORE UPDATE ON material_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_suppliers_updated_at BEFORE UPDATE ON material_suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 9. INSERT SAMPLE DATA
-- ==========================================

-- Insert sample suppliers
INSERT INTO material_suppliers (name, contact_person, phone, email, business_number) VALUES
('한국건설자재(주)', '김철수', '02-1234-5678', 'info@kcm.co.kr', '123-45-67890'),
('대한시멘트', '이영희', '031-987-6543', 'contact@dhcement.com', '234-56-78901'),
('서울철강', '박민수', '02-3456-7890', 'sales@seoulsteel.kr', '345-67-89012')
ON CONFLICT DO NOTHING;

-- Add NPC-1000 material if not exists
INSERT INTO materials (category_id, name, unit, unit_price, material_code, supplier_id) VALUES
(
    (SELECT id FROM material_categories WHERE name = '시멘트' LIMIT 1),
    'NPC-1000 무수축 그라우트',
    'kg',
    1200.00,
    'NPC-1000',
    (SELECT id FROM material_suppliers WHERE name = '한국건설자재(주)' LIMIT 1)
)
ON CONFLICT (material_code) DO NOTHING;