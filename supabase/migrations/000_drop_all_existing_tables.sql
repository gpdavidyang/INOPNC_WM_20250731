-- WARNING: This script will drop all existing tables and their data
-- Make sure to backup any important data before running this script

-- Drop any existing triggers first
DO $$ 
DECLARE
    trig record;
BEGIN
    FOR trig IN 
        SELECT trigger_name, event_object_schema, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
            trig.trigger_name, trig.event_object_schema, trig.event_object_table);
    END LOOP;
END $$;

-- Drop any existing functions
DO $$ 
DECLARE
    func record;
BEGIN
    FOR func IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I CASCADE', func.routine_name);
    END LOOP;
END $$;

-- Drop all policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Drop existing tables based on screenshot
DROP TABLE IF EXISTS public.ui_preferences CASCADE;
DROP TABLE IF EXISTS public.quick_menu_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Drop any other tables that might exist
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.attachments CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Drop any custom types
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Verify all tables are dropped
SELECT 'Remaining tables in public schema:' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';