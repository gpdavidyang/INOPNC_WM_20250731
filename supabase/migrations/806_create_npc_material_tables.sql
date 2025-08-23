-- Migration: Create NPC Material Management Tables
-- Description: Create tables for NPC-1000 material production, shipment, and request management
-- Created: 2025-01-23

-- 1. Create npc_production table (생산관리)
CREATE TABLE IF NOT EXISTS npc_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_date DATE NOT NULL,
    production_amount INTEGER NOT NULL DEFAULT 0,
    shipment_amount INTEGER NOT NULL DEFAULT 0,
    balance_amount INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT npc_production_amounts_positive CHECK (
        production_amount >= 0 AND 
        shipment_amount >= 0 AND 
        balance_amount >= 0
    ),
    -- Unique constraint for one record per date
    CONSTRAINT npc_production_unique_date UNIQUE (production_date)
);

-- 2. Create npc_shipments table (출고관리)
CREATE TABLE IF NOT EXISTS npc_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_date DATE NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (delivery_status IN ('pending', 'shipped', 'delivered')),
    delivery_method VARCHAR(20) CHECK (delivery_method IN ('parcel', 'freight')),
    invoice_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    tax_invoice_issued BOOLEAN NOT NULL DEFAULT FALSE,
    payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    shipping_cost INTEGER DEFAULT 0,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT npc_shipments_amount_positive CHECK (amount > 0),
    CONSTRAINT npc_shipments_shipping_cost_positive CHECK (shipping_cost >= 0)
);

-- 3. Create npc_shipment_requests table (출고요청 관리)
CREATE TABLE IF NOT EXISTS npc_shipment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL NOT NULL,
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    requested_amount INTEGER NOT NULL DEFAULT 0,
    urgency VARCHAR(20) NOT NULL DEFAULT 'normal' 
        CHECK (urgency IN ('normal', 'urgent', 'critical')),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
    approved_amount INTEGER,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    fulfillment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT npc_shipment_requests_amount_positive CHECK (requested_amount > 0),
    CONSTRAINT npc_shipment_requests_approved_amount_positive CHECK (
        approved_amount IS NULL OR approved_amount > 0
    ),
    -- Ensure approved requests have approval data
    CONSTRAINT npc_shipment_requests_approval_data CHECK (
        (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
        (status != 'approved')
    ),
    -- Ensure rejected requests have rejection reason
    CONSTRAINT npc_shipment_requests_rejection_reason CHECK (
        (status = 'rejected' AND rejection_reason IS NOT NULL) OR
        (status != 'rejected')
    )
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_npc_production_date ON npc_production(production_date DESC);
CREATE INDEX IF NOT EXISTS idx_npc_production_created_by ON npc_production(created_by);

CREATE INDEX IF NOT EXISTS idx_npc_shipments_date ON npc_shipments(shipment_date DESC);
CREATE INDEX IF NOT EXISTS idx_npc_shipments_site ON npc_shipments(site_id);
CREATE INDEX IF NOT EXISTS idx_npc_shipments_status ON npc_shipments(delivery_status);
CREATE INDEX IF NOT EXISTS idx_npc_shipments_created_by ON npc_shipments(created_by);

CREATE INDEX IF NOT EXISTS idx_npc_shipment_requests_date ON npc_shipment_requests(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_npc_shipment_requests_site ON npc_shipment_requests(site_id);
CREATE INDEX IF NOT EXISTS idx_npc_shipment_requests_status ON npc_shipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_npc_shipment_requests_urgency ON npc_shipment_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_npc_shipment_requests_requester ON npc_shipment_requests(requester_id);

-- 5. Enable Row Level Security
ALTER TABLE npc_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_shipment_requests ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- npc_production policies (생산관리 - 관리자만 접근)
CREATE POLICY "Admin can manage production data" ON npc_production
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

-- npc_shipments policies (출고관리)
CREATE POLICY "Admin can manage all shipments" ON npc_shipments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

CREATE POLICY "Site managers can view their site shipments" ON npc_shipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN site_assignments sa ON sa.user_id = p.id
            WHERE p.id = auth.uid() 
            AND p.role = 'site_manager'
            AND sa.site_id = npc_shipments.site_id
            AND sa.is_active = true
        )
    );

-- npc_shipment_requests policies (출고요청 관리)
CREATE POLICY "Users can create requests for their sites" ON npc_shipment_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN site_assignments sa ON sa.user_id = p.id
            WHERE p.id = auth.uid() 
            AND sa.site_id = npc_shipment_requests.site_id
            AND sa.is_active = true
        )
    );

CREATE POLICY "Users can view their own requests" ON npc_shipment_requests
    FOR SELECT USING (
        requester_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

CREATE POLICY "Users can update their own pending requests" ON npc_shipment_requests
    FOR UPDATE USING (
        requester_id = auth.uid() AND status = 'pending'
    );

CREATE POLICY "Admin can manage all requests" ON npc_shipment_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

CREATE POLICY "Site managers can view requests for their sites" ON npc_shipment_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN site_assignments sa ON sa.user_id = p.id
            WHERE p.id = auth.uid() 
            AND p.role = 'site_manager'
            AND sa.site_id = npc_shipment_requests.site_id
            AND sa.is_active = true
        )
    );

-- 7. Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
CREATE TRIGGER update_npc_production_updated_at
    BEFORE UPDATE ON npc_production
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npc_shipments_updated_at
    BEFORE UPDATE ON npc_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npc_shipment_requests_updated_at
    BEFORE UPDATE ON npc_shipment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert sample data for testing
-- Sample production data
INSERT INTO npc_production (production_date, production_amount, shipment_amount, balance_amount, notes, created_by)
SELECT 
    CURRENT_DATE - INTERVAL '10 days', 
    1000, 
    800, 
    200, 
    '첫 번째 생산 배치',
    id
FROM profiles 
WHERE role IN ('admin', 'system_admin') 
LIMIT 1
ON CONFLICT (production_date) DO NOTHING;

INSERT INTO npc_production (production_date, production_amount, shipment_amount, balance_amount, notes, created_by)
SELECT 
    CURRENT_DATE - INTERVAL '5 days', 
    1200, 
    950, 
    450, 
    '두 번째 생산 배치',
    id
FROM profiles 
WHERE role IN ('admin', 'system_admin') 
LIMIT 1
ON CONFLICT (production_date) DO NOTHING;

-- Sample shipment data
INSERT INTO npc_shipments (
    shipment_date, site_id, amount, delivery_status, delivery_method, 
    invoice_confirmed, shipping_cost, created_by
)
SELECT 
    CURRENT_DATE - INTERVAL '3 days',
    s.id,
    500,
    'delivered',
    'freight',
    true,
    50000,
    p.id
FROM sites s, profiles p
WHERE s.status = 'active' 
AND p.role IN ('admin', 'system_admin')
LIMIT 1;

-- Sample shipment request data
INSERT INTO npc_shipment_requests (
    request_date, site_id, requester_id, requested_amount, urgency, reason, status
)
SELECT 
    CURRENT_DATE,
    s.id,
    p.id,
    300,
    'urgent',
    '현장 작업량 증가로 인한 추가 자재 필요',
    'pending'
FROM sites s, profiles p
WHERE s.status = 'active' 
AND p.role = 'site_manager'
LIMIT 1;

-- Create comments for documentation
COMMENT ON TABLE npc_production IS 'NPC-1000 자재 생산 관리 테이블';
COMMENT ON TABLE npc_shipments IS 'NPC-1000 자재 출고 관리 테이블';
COMMENT ON TABLE npc_shipment_requests IS 'NPC-1000 자재 출고 요청 관리 테이블';

COMMENT ON COLUMN npc_production.production_date IS '생산일자';
COMMENT ON COLUMN npc_production.production_amount IS '생산량';
COMMENT ON COLUMN npc_production.shipment_amount IS '출고량';
COMMENT ON COLUMN npc_production.balance_amount IS '잔고량';

COMMENT ON COLUMN npc_shipments.delivery_status IS '배송 상태: pending(대기), shipped(배송중), delivered(완료)';
COMMENT ON COLUMN npc_shipments.delivery_method IS '배송 방식: parcel(택배), freight(화물)';
COMMENT ON COLUMN npc_shipments.invoice_confirmed IS '거래명세서 확인 여부';
COMMENT ON COLUMN npc_shipments.tax_invoice_issued IS '세금계산서 발행 여부';
COMMENT ON COLUMN npc_shipments.payment_confirmed IS '입금 확인 여부';

COMMENT ON COLUMN npc_shipment_requests.urgency IS '긴급도: normal(일반), urgent(긴급), critical(매우긴급)';
COMMENT ON COLUMN npc_shipment_requests.status IS '요청 상태: pending(대기), approved(승인), rejected(거절), fulfilled(완료)';