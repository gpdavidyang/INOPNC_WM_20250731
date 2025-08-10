-- Fix sites RLS to allow all authenticated users to view sites
-- Previously only admins could view sites, causing empty dropdowns for regular users

-- Create policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sites' 
        AND policyname = 'Users can view sites'
    ) THEN
        CREATE POLICY "Users can view sites" 
        ON sites 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- This allows all authenticated users to view sites
-- while still restricting INSERT, UPDATE, DELETE to admins only