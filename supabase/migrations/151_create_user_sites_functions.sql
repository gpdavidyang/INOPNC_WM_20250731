-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_current_user_site_from_assignments(uuid);

-- Create new function to get current user site from user_sites table
CREATE OR REPLACE FUNCTION get_current_user_site_from_assignments(user_uuid UUID)
RETURNS TABLE (
  site_id UUID,
  site_name TEXT,
  site_address TEXT,
  site_status TEXT,
  accommodation_name TEXT,
  accommodation_address TEXT,
  work_process TEXT,
  work_section TEXT,
  component_name TEXT,
  manager_name TEXT,
  construction_manager_phone TEXT,
  safety_manager_name TEXT,
  safety_manager_phone TEXT,
  start_date DATE,
  end_date DATE,
  assigned_date DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (s.id)
    s.id AS site_id,
    s.name AS site_name,
    s.address AS site_address,
    'active'::TEXT AS site_status,
    s.accommodation_name,
    s.accommodation_address,
    '건축 공사'::TEXT AS work_process,
    '기초 공사'::TEXT AS work_section,
    COALESCE(p.full_name, 'Worker')::TEXT AS component_name,
    COALESCE((SELECT mgr.full_name FROM profiles mgr 
              JOIN site_assignments sa ON sa.user_id = mgr.id 
              WHERE sa.site_id = s.id AND sa.role = 'site_manager' 
              LIMIT 1), '현장소장')::TEXT AS manager_name,
    COALESCE((SELECT mgr.phone FROM profiles mgr 
              JOIN site_assignments sa ON sa.user_id = mgr.id 
              WHERE sa.site_id = s.id AND sa.role = 'site_manager' 
              LIMIT 1), '010-1234-5678')::TEXT AS construction_manager_phone,
    '안전관리자'::TEXT AS safety_manager_name,
    '010-8765-4321'::TEXT AS safety_manager_phone,
    us.assigned_date AS start_date,
    us.assigned_date AS end_date,
    us.assigned_date
  FROM user_sites us
  JOIN sites s ON s.id = us.site_id
  JOIN profiles p ON p.id = us.user_id
  WHERE us.user_id = user_uuid
    AND us.assigned_date = CURRENT_DATE
  ORDER BY s.id, us.assigned_date DESC
  LIMIT 1;
END;
$$;

-- Create view for user site history
CREATE OR REPLACE VIEW user_site_history_view AS
SELECT 
  us.user_id,
  us.site_id,
  s.name AS site_name,
  s.address AS site_address,
  us.assigned_date,
  COUNT(*) OVER (PARTITION BY us.user_id, us.site_id) AS total_days_worked
FROM user_sites us
JOIN sites s ON s.id = us.site_id
ORDER BY us.assigned_date DESC;

-- Create function to get user site history
CREATE OR REPLACE FUNCTION get_user_site_history_from_assignments(user_uuid UUID)
RETURNS TABLE (
  site_id UUID,
  site_name TEXT,
  site_address TEXT,
  first_date DATE,
  last_date DATE,
  total_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.site_id,
    s.name AS site_name,
    s.address AS site_address,
    MIN(us.assigned_date) AS first_date,
    MAX(us.assigned_date) AS last_date,
    COUNT(*)::INTEGER AS total_days
  FROM user_sites us
  JOIN sites s ON s.id = us.site_id
  WHERE us.user_id = user_uuid
  GROUP BY us.site_id, s.name, s.address
  ORDER BY MAX(us.assigned_date) DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_current_user_site_from_assignments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_site_history_from_assignments(UUID) TO authenticated;
GRANT SELECT ON user_site_history_view TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_current_user_site_from_assignments IS 'Gets the current site assignment for a user from user_sites table for today';
COMMENT ON FUNCTION get_user_site_history_from_assignments IS 'Gets the site assignment history for a user from user_sites table';
COMMENT ON VIEW user_site_history_view IS 'View showing user site assignment history with aggregated data';