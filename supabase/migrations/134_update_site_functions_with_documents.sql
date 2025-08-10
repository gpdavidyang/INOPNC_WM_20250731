-- Update the site query functions to include PTW and blueprint documents

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_current_user_site_from_assignments(uuid);

-- Create updated function that includes document information
CREATE OR REPLACE FUNCTION get_current_user_site_from_assignments(user_uuid UUID)
RETURNS TABLE (
  site_id UUID,
  site_name TEXT,
  site_address TEXT,
  site_status TEXT,
  assigned_date DATE,
  role TEXT,
  accommodation_name TEXT,
  accommodation_address TEXT,
  construction_manager_phone TEXT,
  safety_manager_phone TEXT,
  manager_name TEXT,
  safety_manager_name TEXT,
  component_name TEXT,
  work_process TEXT,
  work_section TEXT,
  start_date DATE,
  end_date DATE,
  -- Add document fields
  ptw_document_id UUID,
  ptw_document_title TEXT,
  ptw_document_url TEXT,
  ptw_document_filename TEXT,
  ptw_document_mime_type TEXT,
  blueprint_document_id UUID,
  blueprint_document_title TEXT,
  blueprint_document_url TEXT,
  blueprint_document_filename TEXT,
  blueprint_document_mime_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS site_id,
    s.name AS site_name,
    s.address AS site_address,
    s.status AS site_status,
    sa.assigned_date,
    sa.role,
    s.accommodation_name,
    s.accommodation_address,
    s.construction_manager_phone,
    s.safety_manager_phone,
    s.manager_name,
    s.safety_manager_name,
    'Main Structure'::TEXT AS component_name,
    'Foundation Work'::TEXT AS work_process,
    'Section A'::TEXT AS work_section,
    s.construction_start AS start_date,
    s.construction_end AS end_date,
    -- PTW Document fields
    s.ptw_document_id,
    ptw.title AS ptw_document_title,
    ptw.file_url AS ptw_document_url,
    ptw.file_name AS ptw_document_filename,
    ptw.mime_type AS ptw_document_mime_type,
    -- Blueprint Document fields
    s.blueprint_document_id,
    bp.title AS blueprint_document_title,
    bp.file_url AS blueprint_document_url,
    bp.file_name AS blueprint_document_filename,
    bp.mime_type AS blueprint_document_mime_type
  FROM site_assignments sa
  JOIN sites s ON sa.site_id = s.id
  LEFT JOIN documents ptw ON s.ptw_document_id = ptw.id
  LEFT JOIN documents bp ON s.blueprint_document_id = bp.id
  WHERE sa.user_id = user_uuid
    AND sa.is_active = true
  ORDER BY sa.assigned_date DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_site_from_assignments(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_current_user_site_from_assignments IS 'Returns the current active site assignment for a user, including associated PTW and blueprint documents';