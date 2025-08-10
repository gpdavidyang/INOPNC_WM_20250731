-- Create user_sites table for tracking user-site assignments by date
CREATE TABLE IF NOT EXISTS user_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
    assigned_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, site_id, assigned_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sites_user_id ON user_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sites_site_id ON user_sites(site_id);
CREATE INDEX IF NOT EXISTS idx_user_sites_assigned_date ON user_sites(assigned_date);
CREATE INDEX IF NOT EXISTS idx_user_sites_user_date ON user_sites(user_id, assigned_date);

-- Enable Row Level Security
ALTER TABLE user_sites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own site assignments
CREATE POLICY "Users can view their own site assignments" ON user_sites
    FOR SELECT USING (auth.uid() = user_id);

-- Site managers can view all assignments for sites in their organization
CREATE POLICY "Site managers can view organization site assignments" ON user_sites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN sites s ON s.organization_id = p.organization_id
            WHERE p.id = auth.uid()
            AND p.role IN ('site_manager', 'admin', 'system_admin')
            AND s.id = user_sites.site_id
        )
    );

-- Admins can manage all assignments in their organization
CREATE POLICY "Admins can manage organization assignments" ON user_sites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN sites s ON s.organization_id = p.organization_id
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'system_admin')
            AND s.id = user_sites.site_id
        )
    );

-- System admins have full access
CREATE POLICY "System admins have full access to assignments" ON user_sites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'system_admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sites_updated_at
    BEFORE UPDATE ON user_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_user_sites_updated_at();

-- Add comment to table
COMMENT ON TABLE user_sites IS 'Tracks which users are assigned to which sites on specific dates';
COMMENT ON COLUMN user_sites.user_id IS 'Reference to the user profile';
COMMENT ON COLUMN user_sites.site_id IS 'Reference to the construction site';
COMMENT ON COLUMN user_sites.assigned_date IS 'The date for which the user is assigned to the site';