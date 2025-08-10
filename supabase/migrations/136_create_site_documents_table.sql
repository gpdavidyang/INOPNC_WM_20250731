-- Create site_documents table for managing PTW and blueprint files per site
-- This replaces the hardcoded document references with dynamic document management

-- Create site_documents table
CREATE TABLE IF NOT EXISTS site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('ptw', 'blueprint', 'other')),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_documents_site_id ON site_documents(site_id);
CREATE INDEX IF NOT EXISTS idx_site_documents_type ON site_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_site_documents_active ON site_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_site_documents_site_type_active ON site_documents(site_id, document_type, is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_site_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_documents_updated_at
  BEFORE UPDATE ON site_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_site_documents_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE site_documents ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can manage all site documents (full CRUD access)
CREATE POLICY "Admins can manage site documents" 
ON site_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'system_admin')
));

-- Policy 2: Site managers can manage documents for their assigned sites
CREATE POLICY "Site managers can manage assigned site documents"
ON site_documents
FOR ALL
USING (EXISTS (
  SELECT 1 FROM site_assignments sa
  JOIN profiles p ON p.id = auth.uid()
  WHERE sa.site_id = site_documents.site_id
  AND sa.user_id = auth.uid()
  AND sa.is_active = true
  AND sa.role = 'site_manager'
  AND p.role IN ('site_manager', 'admin', 'system_admin')
));

-- Policy 3: All authenticated users can view active documents
CREATE POLICY "All authenticated users can view active documents" 
ON site_documents 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Policy 4: Document uploaders can update their own documents
CREATE POLICY "Uploaders can update own documents"
ON site_documents
FOR UPDATE
USING (uploaded_by = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE site_documents IS 'Stores document files (PTW, blueprints, etc.) associated with construction sites';
COMMENT ON COLUMN site_documents.document_type IS 'Type of document: ptw (작업허가서), blueprint (공사도면), other (기타문서)';
COMMENT ON COLUMN site_documents.is_active IS 'Whether this document is currently active for the site';
COMMENT ON COLUMN site_documents.version IS 'Version number for document versioning';
COMMENT ON COLUMN site_documents.notes IS 'Optional notes about the document';

-- Insert some sample data for testing (optional - can be removed in production)
-- This will be replaced by actual uploads through the admin interface

-- Note: These sample entries reference the previously inserted test documents
-- In production, these would be created through the upload interface
INSERT INTO site_documents (site_id, document_type, file_name, file_url, mime_type, is_active, notes)
SELECT 
  s.id as site_id,
  'ptw' as document_type,
  'PTW_sample.pdf' as file_name,
  '/docs/PTW.pdf' as file_url,
  'application/pdf' as mime_type,
  true as is_active,
  'Sample PTW document for development/testing' as notes
FROM sites s 
WHERE s.name = '강남 A현장'
AND NOT EXISTS (
  SELECT 1 FROM site_documents sd 
  WHERE sd.site_id = s.id AND sd.document_type = 'ptw'
);

INSERT INTO site_documents (site_id, document_type, file_name, file_url, mime_type, is_active, notes)
SELECT 
  s.id as site_id,
  'blueprint' as document_type,
  'blueprint_sample.jpeg' as file_name,
  '/docs/샘플도면3.jpeg' as file_url,
  'image/jpeg' as mime_type,
  true as is_active,
  'Sample blueprint document for development/testing' as notes
FROM sites s 
WHERE s.name = '강남 A현장'
AND NOT EXISTS (
  SELECT 1 FROM site_documents sd 
  WHERE sd.site_id = s.id AND sd.document_type = 'blueprint'
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON site_documents TO authenticated;
GRANT USAGE ON SEQUENCE site_documents_id_seq TO authenticated;