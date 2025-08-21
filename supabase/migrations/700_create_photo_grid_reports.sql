-- Create photo_grid_reports table for managing PDF reports generated from daily reports
-- This enables comprehensive photo grid report management with database storage

-- Create photo_grid_reports table
CREATE TABLE IF NOT EXISTS photo_grid_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    
    -- File information
    title VARCHAR(255) NOT NULL DEFAULT '사진대지양식',
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(50) DEFAULT 'application/pdf',
    
    -- Photo metadata
    total_photo_groups INTEGER DEFAULT 0,
    total_before_photos INTEGER DEFAULT 0,
    total_after_photos INTEGER DEFAULT 0,
    component_types JSONB, -- Array of component types used
    process_types JSONB,  -- Array of process types used
    
    -- PDF generation information
    generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    generation_method VARCHAR(50) DEFAULT 'canvas' CHECK (generation_method IN ('canvas', 'html')),
    pdf_options JSONB, -- PDF generation options and metadata
    
    -- Status management
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    version INTEGER DEFAULT 1,
    notes TEXT,
    
    -- Download tracking
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    last_downloaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_grid_reports_daily_report_id ON photo_grid_reports(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_photo_grid_reports_generated_by ON photo_grid_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_photo_grid_reports_status ON photo_grid_reports(status);
CREATE INDEX IF NOT EXISTS idx_photo_grid_reports_created_at ON photo_grid_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_grid_reports_active ON photo_grid_reports(status) WHERE status = 'active';

-- Create unique constraint to prevent duplicate active reports for same daily report
CREATE UNIQUE INDEX IF NOT EXISTS idx_photo_grid_reports_unique_active 
ON photo_grid_reports(daily_report_id) 
WHERE status = 'active';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_photo_grid_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_photo_grid_reports_updated_at
    BEFORE UPDATE ON photo_grid_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_grid_reports_updated_at();

-- Extend daily_reports table with photo grid PDF information
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS has_photo_grid_pdf BOOLEAN DEFAULT FALSE;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS photo_grid_pdf_count INTEGER DEFAULT 0;

-- Create function to update daily_reports photo grid PDF status
CREATE OR REPLACE FUNCTION update_daily_report_pdf_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- New active PDF created
        UPDATE daily_reports 
        SET 
            has_photo_grid_pdf = TRUE,
            photo_grid_pdf_count = (
                SELECT COUNT(*) 
                FROM photo_grid_reports 
                WHERE daily_report_id = NEW.daily_report_id 
                AND status = 'active'
            )
        WHERE id = NEW.daily_report_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- PDF status changed
        UPDATE daily_reports 
        SET 
            has_photo_grid_pdf = EXISTS (
                SELECT 1 
                FROM photo_grid_reports 
                WHERE daily_report_id = COALESCE(NEW.daily_report_id, OLD.daily_report_id) 
                AND status = 'active'
            ),
            photo_grid_pdf_count = (
                SELECT COUNT(*) 
                FROM photo_grid_reports 
                WHERE daily_report_id = COALESCE(NEW.daily_report_id, OLD.daily_report_id) 
                AND status = 'active'
            )
        WHERE id = COALESCE(NEW.daily_report_id, OLD.daily_report_id);
    ELSIF TG_OP = 'DELETE' THEN
        -- PDF deleted
        UPDATE daily_reports 
        SET 
            has_photo_grid_pdf = EXISTS (
                SELECT 1 
                FROM photo_grid_reports 
                WHERE daily_report_id = OLD.daily_report_id 
                AND status = 'active'
            ),
            photo_grid_pdf_count = (
                SELECT COUNT(*) 
                FROM photo_grid_reports 
                WHERE daily_report_id = OLD.daily_report_id 
                AND status = 'active'
            )
        WHERE id = OLD.daily_report_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger to auto-update daily_reports when photo grid reports change
CREATE TRIGGER update_daily_report_pdf_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON photo_grid_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_report_pdf_status();

-- Row Level Security (RLS) Policies
ALTER TABLE photo_grid_reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: System admins can manage all photo grid reports
CREATE POLICY "System admins can manage all photo grid reports" 
ON photo_grid_reports 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'system_admin'
));

-- Policy 2: Admins can manage photo grid reports in their organization
CREATE POLICY "Admins can manage organizational photo grid reports"
ON photo_grid_reports
FOR ALL
USING (EXISTS (
    SELECT 1 FROM profiles p
    JOIN daily_reports dr ON dr.id = photo_grid_reports.daily_report_id
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'site_manager')
    -- Add organization/site filtering logic if needed
));

-- Policy 3: Users can view photo grid reports for daily reports they can access
CREATE POLICY "Users can view accessible photo grid reports" 
ON photo_grid_reports 
FOR SELECT 
USING (
    status = 'active' 
    AND EXISTS (
        SELECT 1 FROM daily_reports dr
        WHERE dr.id = photo_grid_reports.daily_report_id
        AND (
            dr.created_by = auth.uid() -- Creator can view
            OR EXISTS ( -- Site members can view
                SELECT 1 FROM site_assignments sa
                WHERE sa.site_id = dr.site_id
                AND sa.user_id = auth.uid()
                AND sa.is_active = true
            )
            OR EXISTS ( -- Admins can view all
                SELECT 1 FROM profiles p
                WHERE p.id = auth.uid()
                AND p.role IN ('admin', 'system_admin', 'site_manager')
            )
        )
    )
);

-- Policy 4: Users can create photo grid reports for their own daily reports
CREATE POLICY "Users can create photo grid reports for own daily reports"
ON photo_grid_reports
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM daily_reports dr
    WHERE dr.id = daily_report_id
    AND (
        dr.created_by = auth.uid() -- Creator can create PDF
        OR EXISTS ( -- Site managers can create
            SELECT 1 FROM site_assignments sa
            JOIN profiles p ON p.id = auth.uid()
            WHERE sa.site_id = dr.site_id
            AND sa.user_id = auth.uid()
            AND sa.is_active = true
            AND sa.role = 'site_manager'
            AND p.role IN ('site_manager', 'admin', 'system_admin')
        )
    )
));

-- Policy 5: Users can update their own photo grid reports
CREATE POLICY "Users can update own photo grid reports"
ON photo_grid_reports
FOR UPDATE
USING (
    generated_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'system_admin')
    )
);

-- Add comments for documentation
COMMENT ON TABLE photo_grid_reports IS 'Stores PDF reports generated from daily report photo grids with comprehensive metadata';
COMMENT ON COLUMN photo_grid_reports.daily_report_id IS 'Reference to the daily report this PDF was generated from';
COMMENT ON COLUMN photo_grid_reports.title IS 'Display title for the PDF report';
COMMENT ON COLUMN photo_grid_reports.generation_method IS 'Method used to generate PDF: canvas (jsPDF) or html (print)';
COMMENT ON COLUMN photo_grid_reports.pdf_options IS 'JSON metadata about PDF generation options and settings';
COMMENT ON COLUMN photo_grid_reports.component_types IS 'Array of construction component types included in this PDF';
COMMENT ON COLUMN photo_grid_reports.process_types IS 'Array of construction process types included in this PDF';
COMMENT ON COLUMN photo_grid_reports.status IS 'Report status: active (current), archived (old version), deleted (soft delete)';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON photo_grid_reports TO authenticated;
GRANT USAGE ON SEQUENCE photo_grid_reports_id_seq TO authenticated;

-- Update existing daily_reports to set initial photo grid PDF status
UPDATE daily_reports 
SET 
    has_photo_grid_pdf = FALSE,
    photo_grid_pdf_count = 0
WHERE has_photo_grid_pdf IS NULL;