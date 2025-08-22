-- Create site_documents table for PTW and blueprint documents
CREATE TABLE IF NOT EXISTS public.site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('ptw', 'blueprint', 'safety', 'permit', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  document_number VARCHAR(100),
  valid_from DATE,
  valid_until DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'draft')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_documents_site_id ON public.site_documents(site_id);
CREATE INDEX IF NOT EXISTS idx_site_documents_type ON public.site_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_site_documents_status ON public.site_documents(status);
CREATE INDEX IF NOT EXISTS idx_site_documents_current ON public.site_documents(is_current) WHERE is_current = true;

-- Enable RLS
ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view documents for sites they have access to
CREATE POLICY "Users can view site documents for assigned sites" ON public.site_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM site_assignments sa
            WHERE sa.site_id = site_documents.site_id
            AND sa.user_id = auth.uid()
            AND sa.is_active = true
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'system_admin')
        )
    );

-- Site managers and admins can insert documents
CREATE POLICY "Site managers can insert site documents" ON public.site_documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM site_assignments sa
            WHERE sa.site_id = site_documents.site_id
            AND sa.user_id = auth.uid()
            AND sa.is_active = true
            AND sa.role IN ('site_manager', 'admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'system_admin')
        )
    );

-- Site managers and admins can update documents
CREATE POLICY "Site managers can update site documents" ON public.site_documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM site_assignments sa
            WHERE sa.site_id = site_documents.site_id
            AND sa.user_id = auth.uid()
            AND sa.is_active = true
            AND sa.role IN ('site_manager', 'admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'system_admin')
        )
    );

-- Only admins can delete documents
CREATE POLICY "Only admins can delete site documents" ON public.site_documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'system_admin')
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_site_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_documents_updated_at
    BEFORE UPDATE ON public.site_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_site_documents_updated_at();

-- Insert sample site documents for 강남 A현장
INSERT INTO public.site_documents (site_id, document_type, title, description, file_url, file_name, document_number) VALUES
(
    (SELECT id FROM public.sites WHERE name = '강남 A현장' LIMIT 1),
    'ptw',
    'PTW-2025-0822 작업허가서',
    '지하 1층 슬라브 타설 작업 허가서',
    '/documents/ptw/PTW-2025-0822.pdf',
    'PTW-2025-0822.pdf',
    'PTW-2025-0822'
),
(
    (SELECT id FROM public.sites WHERE name = '강남 A현장' LIMIT 1),
    'blueprint',
    '강남 A현장 구조도면',
    '지하 1층 구조 설계도면 (기둥 C1-C5 구간)',
    '/documents/blueprints/gangnam-a-b1-structure.pdf',
    'gangnam-a-b1-structure.pdf',
    'BP-GA-B1-001'
);

COMMENT ON TABLE public.site_documents IS 'Site-specific documents including PTW, blueprints, safety documents';
COMMENT ON COLUMN public.site_documents.document_type IS 'Type of document: ptw, blueprint, safety, permit, other';
COMMENT ON COLUMN public.site_documents.is_current IS 'Whether this is the current version of the document';