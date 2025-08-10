-- Update material_requests schema to match server action expectations
-- This migration ensures the schema is consistent with the server action implementation

-- Add request_number column if it doesn't exist (should already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'material_requests' 
                  AND column_name = 'request_number') THEN
        ALTER TABLE material_requests ADD COLUMN request_number TEXT;
        
        -- Generate unique request numbers for existing records
        UPDATE material_requests 
        SET request_number = 'MR-' || EXTRACT(YEAR FROM created_at)::TEXT || '-' || 
                            LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 6, '0')
        WHERE request_number IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE material_requests ALTER COLUMN request_number SET NOT NULL;
        
        -- Add unique constraint
        ALTER TABLE material_requests ADD CONSTRAINT material_requests_request_number_unique UNIQUE (request_number);
    END IF;
END $$;

-- Ensure needed_by column exists (should already exist)  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'material_requests' 
                  AND column_name = 'needed_by') THEN
        ALTER TABLE material_requests ADD COLUMN needed_by DATE;
    END IF;
END $$;

-- Ensure fulfilled_at column exists (should already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'material_requests' 
                  AND column_name = 'fulfilled_at') THEN
        ALTER TABLE material_requests ADD COLUMN fulfilled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update RLS policies to ensure proper access
-- Drop existing policies if they exist and recreate with simplified logic
DROP POLICY IF EXISTS "material_requests_select" ON material_requests;
DROP POLICY IF EXISTS "material_requests_insert" ON material_requests; 
DROP POLICY IF EXISTS "material_requests_update" ON material_requests;

-- Create simplified RLS policies for authenticated users
CREATE POLICY "material_requests_select" ON material_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "material_requests_insert" ON material_requests FOR INSERT TO authenticated WITH CHECK (
    requested_by = auth.uid()
);

CREATE POLICY "material_requests_update" ON material_requests FOR UPDATE TO authenticated USING (
    requested_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'site_manager', 'system_admin')
    )
);

-- Update material_request_items policies as well
DROP POLICY IF EXISTS "material_request_items_select" ON material_request_items;
DROP POLICY IF EXISTS "material_request_items_insert" ON material_request_items;
DROP POLICY IF EXISTS "material_request_items_update" ON material_request_items;

CREATE POLICY "material_request_items_select" ON material_request_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "material_request_items_insert" ON material_request_items FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM material_requests mr 
        WHERE mr.id = request_id 
        AND mr.requested_by = auth.uid()
    )
);

CREATE POLICY "material_request_items_update" ON material_request_items FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM material_requests mr 
        WHERE mr.id = request_id 
        AND (
            mr.requested_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'site_manager', 'system_admin')
            )
        )
    )
);

-- Add index on request_number for better performance
CREATE INDEX IF NOT EXISTS idx_material_requests_request_number ON material_requests(request_number);

-- Create a function to automatically generate request numbers for new requests
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL THEN
        NEW.request_number := 'MR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || 
                             LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000000)::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate request numbers
DROP TRIGGER IF EXISTS generate_material_request_number ON material_requests;
CREATE TRIGGER generate_material_request_number 
    BEFORE INSERT ON material_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_request_number();