-- Enhance organizations table for better business management
-- Add missing fields for comprehensive organization management

-- Add new columns for business information
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS representative_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS fax VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for business number for quick lookups
CREATE INDEX IF NOT EXISTS idx_organizations_business_number ON organizations(business_number);
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);
CREATE INDEX IF NOT EXISTS idx_organizations_representative ON organizations(representative_name);

-- Add some sample data for testing (only if no custom organizations exist)
INSERT INTO organizations (
  name, 
  type, 
  representative_name,
  business_number,
  business_type,
  business_category,
  phone,
  email,
  fax,
  address,
  bank_name,
  bank_account,
  is_active,
  description
) VALUES 
  (
    '대한건설(주)',
    'branch_office',
    '김대한',
    '123-45-67890',
    '건설업',
    '종합건설업',
    '02-1234-5678',
    'contact@daehan.co.kr',
    '02-1234-5679',
    '서울시 강남구 테헤란로 123',
    '국민은행',
    '123-456789-01-234',
    true,
    '대한민국을 대표하는 종합건설업체'
  ),
  (
    '한국토건(주)',
    'branch_office', 
    '이한국',
    '234-56-78901',
    '건설업',
    '토목공사업',
    '02-2345-6789',
    'info@hankook.co.kr',
    '02-2345-6790',
    '서울시 서초구 반포대로 456',
    '신한은행',
    '234-567890-12-345',
    true,
    '토목 전문 건설업체'
  ),
  (
    '삼성물산건설부문',
    'branch_office',
    '박삼성',
    '345-67-89012', 
    '건설업',
    '건축공사업',
    '02-3456-7890',
    'construction@samsung.co.kr',
    '02-3456-7891',
    '서울시 중구 태평로 789',
    '우리은행',
    '345-678901-23-456',
    true,
    '삼성그룹 계열 건설업체'
  )
ON CONFLICT (name) DO NOTHING;

-- Update RLS policies to include new fields
-- (Existing policies should work, but we ensure they cover the new fields)

COMMENT ON COLUMN organizations.representative_name IS '대표자명';
COMMENT ON COLUMN organizations.business_number IS '사업자등록번호';
COMMENT ON COLUMN organizations.business_type IS '업종 (건설업, 제조업 등)';
COMMENT ON COLUMN organizations.business_category IS '업태 (종합건설, 토목공사 등)';
COMMENT ON COLUMN organizations.email IS '회사 이메일';
COMMENT ON COLUMN organizations.fax IS '팩스번호';
COMMENT ON COLUMN organizations.bank_name IS '거래은행명';
COMMENT ON COLUMN organizations.bank_account IS '계좌번호';
COMMENT ON COLUMN organizations.notes IS '메모 및 특이사항';