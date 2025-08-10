-- Add missing metadata column to analytics_events table

ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata 
ON analytics_events USING gin(metadata);