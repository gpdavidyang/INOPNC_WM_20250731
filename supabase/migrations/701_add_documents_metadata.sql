-- Add metadata column to documents table for storing additional information
-- This enables linking photo grid reports to shared documents

-- Add metadata column if it doesn't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for better performance when querying by metadata
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN (metadata);

-- Add index for document_type and folder_path for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_type_folder ON documents(document_type, folder_path);

-- Add comments for documentation
COMMENT ON COLUMN documents.metadata IS 'JSON metadata for storing additional document information like linked reports, categories, etc.';

-- Update existing photo grid PDFs to be linked (optional - for existing data)
-- This query will only run if there are existing photo grid reports not yet linked to documents
DO $$
BEGIN
  -- Check if we need to migrate existing data
  IF EXISTS (
    SELECT 1 FROM photo_grid_reports pgr
    WHERE NOT EXISTS (
      SELECT 1 FROM documents d
      WHERE d.file_url = pgr.file_url
    )
  ) THEN
    -- Insert existing photo grid reports into documents table
    INSERT INTO documents (
      title,
      description,
      file_url,
      file_name,
      file_size,
      mime_type,
      document_type,
      folder_path,
      owner_id,
      is_public,
      site_id,
      metadata,
      created_at,
      updated_at
    )
    SELECT 
      pgr.title,
      'Migrated photo grid PDF - ' || COALESCE(dr.member_name, 'Unknown'),
      pgr.file_url,
      pgr.file_name,
      pgr.file_size,
      pgr.mime_type,
      'report'::text,
      '/shared/photo-grid-reports',
      pgr.generated_by,
      false,
      dr.site_id,
      jsonb_build_object(
        'photo_grid_report_id', pgr.id,
        'daily_report_id', pgr.daily_report_id,
        'generated_at', pgr.created_at,
        'document_category', '사진대지PDF',
        'migrated', true
      ),
      pgr.created_at,
      pgr.updated_at
    FROM photo_grid_reports pgr
    LEFT JOIN daily_reports dr ON dr.id = pgr.daily_report_id
    WHERE pgr.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM documents d
      WHERE d.file_url = pgr.file_url
    );
    
    RAISE NOTICE 'Migrated existing photo grid reports to documents table';
  END IF;
END $$;