-- Create analytics_metrics table for storing application performance and usage metrics
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type VARCHAR(100) NOT NULL,
    metric_date DATE NOT NULL,
    metric_value NUMERIC(20, 4) NOT NULL,
    metric_count INTEGER DEFAULT 1,
    
    -- Foreign keys
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Additional data
    dimensions JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_date ON analytics_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_org ON analytics_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_site ON analytics_metrics(site_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type_date ON analytics_metrics(metric_type, metric_date);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_created_at ON analytics_metrics(created_at);

-- Enable Row Level Security
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all metrics
CREATE POLICY "Admins can view all metrics" ON analytics_metrics
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

-- Site managers can see metrics for their sites
CREATE POLICY "Site managers can view their site metrics" ON analytics_metrics
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'site_manager'
        )
        AND (
            site_id IS NULL 
            OR site_id IN (
                SELECT site_id FROM site_members
                WHERE user_id = auth.uid()
                AND role = 'site_manager'
            )
        )
    );

-- Users can insert their own metrics
CREATE POLICY "Users can insert metrics" ON analytics_metrics
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IS NULL OR user_id = auth.uid()
    );

-- Function to aggregate daily analytics (optional)
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(
    p_organization_id UUID DEFAULT NULL,
    p_site_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
BEGIN
    -- This is a placeholder for analytics aggregation logic
    -- Can be implemented to aggregate various metrics from other tables
    -- For now, just update the updated_at timestamp for existing records
    UPDATE analytics_metrics
    SET updated_at = NOW()
    WHERE metric_date = p_date
    AND (p_organization_id IS NULL OR organization_id = p_organization_id)
    AND (p_site_id IS NULL OR site_id = p_site_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION aggregate_daily_analytics TO authenticated;

-- Add comment to table
COMMENT ON TABLE analytics_metrics IS 'Stores application performance and usage metrics for analytics dashboard';