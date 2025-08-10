-- Fix database functions with correct column names

-- Drop and recreate the get_current_user_site_from_assignments function
DROP FUNCTION IF EXISTS public.get_current_user_site_from_assignments(uuid);

CREATE OR REPLACE FUNCTION public.get_current_user_site_from_assignments(user_uuid uuid)
RETURNS TABLE(
  site_id uuid,
  site_name text,
  site_address text,
  site_status text,
  assigned_date date,
  role text,
  accommodation_name text,
  accommodation_address text,
  construction_manager_phone text,
  safety_manager_phone text,
  manager_name text,
  safety_manager_name text,
  component_name text,
  work_process text,
  work_section text,
  start_date date,
  end_date date,
  ptw_document_id uuid,
  ptw_document_title text,
  ptw_document_url text,
  ptw_document_filename text,
  ptw_document_mime_type text,
  blueprint_document_id uuid,
  blueprint_document_title text,
  blueprint_document_url text,
  blueprint_document_filename text,
  blueprint_document_mime_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS site_id,
    s.name AS site_name,
    s.address AS site_address,
    s.status AS site_status,
    sa.assigned_date,
    'worker'::text AS role, -- Default role from site_assignments table doesn't have role column
    s.accommodation_name,
    s.accommodation_address,
    s.construction_manager_phone,
    s.safety_manager_phone,
    s.manager_name,
    s.safety_manager_name,
    s.component_name,
    s.work_process,
    s.work_section,
    s.start_date, -- Fixed: use start_date instead of construction_start
    s.end_date,   -- Fixed: use end_date instead of construction_end
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
$function$;

-- Also check and fix the user site history function if needed
DROP FUNCTION IF EXISTS public.get_user_site_history_from_assignments(uuid);

CREATE OR REPLACE FUNCTION public.get_user_site_history_from_assignments(user_uuid uuid)
RETURNS TABLE(
  site_id uuid,
  site_name text,
  site_address text,
  assigned_date date,
  unassigned_date date,
  is_active boolean,
  days_worked integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS site_id,
    s.name AS site_name,
    s.address AS site_address,
    sa.assigned_date,
    sa.unassigned_date,
    sa.is_active,
    CASE 
      WHEN sa.unassigned_date IS NOT NULL THEN 
        (sa.unassigned_date - sa.assigned_date)
      ELSE 
        (CURRENT_DATE - sa.assigned_date)
    END AS days_worked
  FROM site_assignments sa
  JOIN sites s ON sa.site_id = s.id
  WHERE sa.user_id = user_uuid
  ORDER BY sa.assigned_date DESC;
END;
$function$;