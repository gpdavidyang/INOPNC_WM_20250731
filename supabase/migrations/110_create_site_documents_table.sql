-- Create site_documents table for PTW and Blueprint file management
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
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_site_documents_site_id ON site_documents(site_id);
CREATE INDEX idx_site_documents_type ON site_documents(document_type);
CREATE INDEX idx_site_documents_active ON site_documents(is_active);

-- Enable Row Level Security
ALTER TABLE site_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all site documents
CREATE POLICY "Admins can manage site documents" ON site_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

-- Policy: All authenticated users can view active documents
CREATE POLICY "Users can view active site documents" ON site_documents
    FOR SELECT USING (
        is_active = true 
        AND auth.uid() IS NOT NULL
    );

-- Policy: Site managers can manage documents for their sites
CREATE POLICY "Site managers can manage their site documents" ON site_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'site_manager'
            AND profiles.site_id = site_documents.site_id
        )
    );

-- Add trigger to update updated_at timestamp
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

-- Add comment
COMMENT ON TABLE site_documents IS 'Stores PTW and blueprint documents for construction sites';