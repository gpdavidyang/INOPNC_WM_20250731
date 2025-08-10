-- Add PTW and Blueprint document references to sites table
-- This allows each site to have associated documents

-- Add columns for PTW and Blueprint documents
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS ptw_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS blueprint_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sites_ptw_document ON sites(ptw_document_id);
CREATE INDEX IF NOT EXISTS idx_sites_blueprint_document ON sites(blueprint_document_id);

-- Add comments for documentation
COMMENT ON COLUMN sites.ptw_document_id IS 'Reference to the PTW (Permit To Work) document for this site';
COMMENT ON COLUMN sites.blueprint_document_id IS 'Reference to the blueprint document for this site';