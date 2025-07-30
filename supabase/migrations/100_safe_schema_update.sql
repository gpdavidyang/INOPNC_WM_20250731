-- Safe Schema Update Migration
-- This migration safely updates the existing schema without data loss

-- 1. First, check current state and add missing columns to profiles
DO $$
BEGIN
    -- Add organization_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN organization_id UUID;
    END IF;

    -- Add site_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'site_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN site_id UUID;
    END IF;

    -- Add phone if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;

    -- Add status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active';
        ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
            CHECK (status IN ('active', 'inactive', 'pending'));
    END IF;

    -- Add last_login_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add login_count if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'login_count'
    ) THEN
        ALTER TABLE profiles ADD COLUMN login_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- 3. Create sites table if it doesn't exist
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    UNIQUE(organization_id, code)
);

-- 4. Insert default organization and site if they don't exist
INSERT INTO organizations (id, name, code, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'DEFAULT', 'Default organization for existing users')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sites (id, organization_id, name, code, address)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Default Site', 'DEFAULT', 'Default site for existing users')
ON CONFLICT (organization_id, code) DO NOTHING;

-- 5. Update existing profiles with default organization and site
UPDATE profiles 
SET 
    organization_id = '00000000-0000-0000-0000-000000000001',
    site_id = '00000000-0000-0000-0000-000000000002',
    status = COALESCE(status, 'active'),
    login_count = COALESCE(login_count, 0)
WHERE organization_id IS NULL OR site_id IS NULL;

-- 6. Add foreign key constraints after data is populated
DO $$
BEGIN
    -- Add foreign key for organization_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_organization_id_fkey'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id);
    END IF;

    -- Add foreign key for site_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_site_id_fkey'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_site_id_fkey 
        FOREIGN KEY (site_id) REFERENCES sites(id);
    END IF;
END $$;

-- 7. Create or replace the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use default values if organization_id or site_id are not provided
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name,
        organization_id,
        site_id,
        role,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(
            (NEW.raw_user_meta_data->>'organization_id')::UUID,
            '00000000-0000-0000-0000-000000000001'::UUID
        ),
        COALESCE(
            (NEW.raw_user_meta_data->>'site_id')::UUID,
            '00000000-0000-0000-0000-000000000002'::UUID
        ),
        COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
        'active',
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 9. Create RLS policies for new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for organizations
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Basic RLS policies for sites
CREATE POLICY "Users can view their site" ON sites
    FOR SELECT USING (
        id IN (SELECT site_id FROM profiles WHERE id = auth.uid())
        OR
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- 10. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_site_id ON profiles(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_organization_id ON sites(organization_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Schema update completed successfully. All existing data preserved.';
END $$;