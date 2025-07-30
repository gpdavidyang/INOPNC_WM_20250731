-- First, create profiles for existing users who don't have profiles
INSERT INTO public.profiles (id, email, full_name, phone, role, status, organization_id, site_id)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'worker'),
  'active',
  CASE 
    WHEN au.email LIKE '%@inopnc.com%' THEN 'org-1'
    WHEN au.email LIKE '%@partner.com%' THEN 'org-2'
    ELSE NULL
  END,
  CASE 
    WHEN au.email LIKE '%@inopnc.com%' AND COALESCE(au.raw_user_meta_data->>'role', 'worker') IN ('worker', 'site_manager') THEN 'site-1'
    ELSE NULL
  END
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Make sure the handle_new_user function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    status,
    organization_id,
    site_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'worker'),
    'active',
    CASE 
      WHEN new.email LIKE '%@inopnc.com%' THEN 'org-1'
      WHEN new.email LIKE '%@partner.com%' THEN 'org-2'
      ELSE NULL
    END,
    CASE 
      WHEN new.email LIKE '%@inopnc.com%' AND COALESCE(new.raw_user_meta_data->>'role', 'worker') IN ('worker', 'site_manager') THEN 'site-1'
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Ensure authenticated users can read profiles
GRANT SELECT ON public.profiles TO anon, authenticated;