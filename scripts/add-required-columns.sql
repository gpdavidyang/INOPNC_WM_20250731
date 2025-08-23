-- documents 테이블에 필수제출서류함을 위한 컬럼 추가
-- 이 스크립트는 Supabase Dashboard SQL Editor에서 실행하세요

-- 1. document_category 컬럼 추가 (문서 카테고리)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_category VARCHAR(50) DEFAULT 'general';

-- 2. status 컬럼 추가 (승인 상태)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 3. requirement_id 컬럼 추가 (서류 요구사항 ID)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS requirement_id UUID;

-- 4. submitted_by 컬럼 추가 (제출자)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id);

-- 5. reviewed_by 컬럼 추가 (검토자)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);

-- 6. review_date 컬럼 추가 (검토일)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS review_date TIMESTAMP WITH TIME ZONE;

-- 7. review_notes 컬럼 추가 (검토 노트)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 8. expiry_date 컬럼 추가 (만료일)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 9. submission_date 컬럼 추가 (제출일)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(document_category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_submitted_by ON documents(submitted_by);
CREATE INDEX IF NOT EXISTS idx_documents_requirement ON documents(requirement_id);

-- 성공 메시지
SELECT '✅ 필수제출서류함 컬럼 추가 완료' as message;