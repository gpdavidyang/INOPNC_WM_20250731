-- Enhance organizations table with required fields for 소속(거래처) management
-- Add missing fields for comprehensive organization management

-- First, add missing columns to organizations table if they don't exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS representative_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS fax VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_business_number ON organizations(business_number);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- Enable RLS if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- RLS Policy: Admins can do everything
CREATE POLICY "Admins can manage organizations"
ON organizations
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'system_admin')
  )
);

-- RLS Policy: Users can view their organization
CREATE POLICY "Users can view their organization"
ON organizations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = organizations.id
    AND user_organizations.user_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at_trigger ON organizations;
CREATE TRIGGER update_organizations_updated_at_trigger
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_organizations_updated_at();

-- Insert sample organizations for testing
INSERT INTO organizations (
  id,
  name,
  representative_name,
  business_number,
  bank_name,
  bank_account,
  phone,
  email,
  address,
  business_type,
  business_category,
  is_active,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    '대한건설',
    '김대한',
    '123-45-67890',
    '국민은행',
    '123-456789-01-234',
    '02-1234-5678',
    'contact@daehan.co.kr',
    '서울시 강남구 테헤란로 123',
    '건설업',
    '종합건설',
    true,
    NOW()
  ),
  (
    gen_random_uuid(),
    '한국토건',
    '이한국',
    '234-56-78901',
    '신한은행',
    '234-567890-12-345',
    '02-2345-6789',
    'info@hankook.co.kr',
    '서울시 서초구 반포대로 456',
    '건설업',
    '토목공사',
    true,
    NOW()
  ),
  (
    gen_random_uuid(),
    '서울건설',
    '박서울',
    '345-67-89012',
    '우리은행',
    '345-678901-23-456',
    '02-3456-7890',
    'admin@seoul-const.co.kr',
    '서울시 송파구 올림픽로 789',
    '건설업',
    '전문건설',
    true,
    NOW()
  )
ON CONFLICT (name) DO UPDATE
SET 
  representative_name = EXCLUDED.representative_name,
  business_number = EXCLUDED.business_number,
  bank_name = EXCLUDED.bank_name,
  bank_account = EXCLUDED.bank_account,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  updated_at = NOW();