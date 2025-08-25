-- ================================================
-- Partner Companies Migration Cleanup and Fix
-- Generated: 2025-08-25
-- Purpose: Clean up partial migration and reapply completely
-- ================================================

-- Step 1: Remove all existing artifacts with CASCADE
-- This ensures complete cleanup even with dependencies
DROP TABLE IF EXISTS site_partners CASCADE;
DROP TABLE IF EXISTS partner_companies CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 2: Create partner_companies table
CREATE TABLE IF NOT EXISTS partner_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    business_number VARCHAR(50),
    company_type VARCHAR(50) NOT NULL DEFAULT 'subcontractor',
    trade_type TEXT[],
    representative_name VARCHAR(100),
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    bank_name VARCHAR(100),
    bank_account VARCHAR(100),
    credit_rating VARCHAR(20),
    contract_start_date DATE,
    contract_end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add constraints
ALTER TABLE partner_companies ADD CONSTRAINT chk_company_type 
    CHECK (company_type IN ('general_contractor', 'subcontractor', 'supplier', 'consultant'));

ALTER TABLE partner_companies ADD CONSTRAINT chk_status 
    CHECK (status IN ('active', 'suspended', 'terminated'));

-- Step 4: Add unique constraint for company_name (required for ON CONFLICT)
ALTER TABLE partner_companies ADD CONSTRAINT uq_partner_companies_company_name UNIQUE (company_name);

-- Step 5: Create indexes for performance
CREATE INDEX idx_partner_companies_status ON partner_companies(status);
CREATE INDEX idx_partner_companies_company_type ON partner_companies(company_type);
CREATE INDEX idx_partner_companies_created_at ON partner_companies(created_at DESC);

-- Step 6: Enable Row Level Security
ALTER TABLE partner_companies ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for partner_companies table
CREATE POLICY "Admins can manage all partner companies" ON partner_companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view partner companies" ON partner_companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'site_manager', 'worker', 'customer_manager')
        )
    );

-- Step 8: Create site_partners junction table
CREATE TABLE IF NOT EXISTS site_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    partner_company_id UUID REFERENCES partner_companies(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    contract_value DECIMAL(15,2),
    contract_status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, partner_company_id)
);

-- Step 9: Add constraint for contract_status
ALTER TABLE site_partners ADD CONSTRAINT chk_contract_status 
    CHECK (contract_status IN ('active', 'completed', 'terminated', 'suspended'));

-- Step 10: Create indexes for site_partners
CREATE INDEX idx_site_partners_site_id ON site_partners(site_id);
CREATE INDEX idx_site_partners_partner_company_id ON site_partners(partner_company_id);

-- Step 11: Enable RLS for site_partners
ALTER TABLE site_partners ENABLE ROW LEVEL SECURITY;

-- Step 12: RLS Policies for site_partners table
CREATE POLICY "Admins can manage all site partners" ON site_partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view site partners" ON site_partners
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'site_manager', 'worker', 'customer_manager')
        )
    );

-- Step 13: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Apply triggers
CREATE TRIGGER update_partner_companies_updated_at
    BEFORE UPDATE ON partner_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_partners_updated_at
    BEFORE UPDATE ON site_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 15: Insert sample partner companies
INSERT INTO partner_companies (company_name, company_type, representative_name, phone, email, status) VALUES
('대한건설(주)', 'general_contractor', '김대표', '02-1234-5678', 'info@daehan.co.kr', 'active'),
('서울전기공사', 'subcontractor', '이전기', '02-2345-6789', 'seoul@electric.co.kr', 'active'),
('한국배관시스템', 'subcontractor', '박배관', '02-3456-7890', 'korea@piping.co.kr', 'active'),
('그린인테리어', 'subcontractor', '최인테리어', '02-4567-8901', 'green@interior.co.kr', 'active'),
('안전건설산업', 'supplier', '정안전', '02-5678-9012', 'safety@construction.co.kr', 'active')
ON CONFLICT (company_name) DO NOTHING;

-- ================================================
-- Verification Query
-- Run this after migration to verify success:
-- ================================================
-- SELECT 
--     'partner_companies' as table_name, 
--     COUNT(*) as record_count 
-- FROM partner_companies
-- UNION ALL
-- SELECT 
--     'site_partners' as table_name, 
--     COUNT(*) as record_count 
-- FROM site_partners;