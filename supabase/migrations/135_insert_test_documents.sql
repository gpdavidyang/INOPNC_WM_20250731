-- Insert test documents for PTW and blueprints
-- This is for development/testing purposes

-- First, insert sample documents if they don't exist
INSERT INTO documents (id, title, description, file_url, file_name, file_size, mime_type, document_type, created_at, updated_at)
VALUES
  -- PTW document
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
   'PTW 작업허가서 - 강남 A현장', 
   '강남 A현장 작업허가서 문서입니다', 
   '/docs/PTW.pdf',  -- This should be replaced with actual file URL from storage
   'PTW_gangnam_a.pdf', 
   1024000, 
   'application/pdf', 
   'other', 
   NOW(), 
   NOW()),
  
  -- Blueprint document  
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012',
   '공사도면 - 강남 A현장',
   '강남 A현장 공사 도면입니다',
   '/docs/샘플도면3.jpeg',  -- This should be replaced with actual file URL from storage
   'blueprint_gangnam_a.jpeg',
   2048000,
   'image/jpeg',
   'blueprint', 
   NOW(),
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Update the 강남 A현장 site to reference these documents
UPDATE sites 
SET 
  ptw_document_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  blueprint_document_id = 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  updated_at = NOW()
WHERE name = '강남 A현장';

-- Note: In production, you would:
-- 1. Upload actual files to Supabase Storage
-- 2. Get the proper file URLs from storage
-- 3. Create document records with those URLs
-- 4. Update site records to reference the documents