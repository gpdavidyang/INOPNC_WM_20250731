-- Update analytics_metrics table to support Web Vitals and performance metrics

-- 1. Remove the strict CHECK constraint on metric_type
ALTER TABLE analytics_metrics 
DROP CONSTRAINT IF EXISTS analytics_metrics_metric_type_check;

-- 2. Update RLS policies to allow anonymous users to insert Web Vitals metrics
DROP POLICY IF EXISTS "System can insert metrics" ON analytics_metrics;

CREATE POLICY "Allow Web Vitals metrics from anonymous users" ON analytics_metrics
  FOR INSERT WITH CHECK (
    -- Allow Web Vitals metrics from anyone
    metric_type LIKE 'web_vitals_%' OR
    metric_type LIKE 'rum_%' OR
    metric_type = 'api_performance' OR
    -- Allow other metrics only from authenticated users
    (auth.uid() IS NOT NULL AND metric_type NOT LIKE 'web_vitals_%' AND metric_type NOT LIKE 'rum_%')
  );

-- 3. Create analytics_events table if it doesn't exist (for real-time analytics)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update RLS policies for analytics_events to allow anonymous events
DROP POLICY IF EXISTS "Users can create events" ON analytics_events;

CREATE POLICY "Allow all event creation" ON analytics_events
  FOR INSERT WITH CHECK (
    -- Allow RUM events from anonymous users
    event_type LIKE 'rum_%' OR
    -- Allow other events from authenticated users
    auth.uid() IS NOT NULL
  );

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_web_vitals 
  ON analytics_metrics(metric_type, metric_date DESC) 
  WHERE metric_type LIKE 'web_vitals_%';

CREATE INDEX IF NOT EXISTS idx_analytics_events_rum 
  ON analytics_events(event_type, event_timestamp DESC) 
  WHERE event_type LIKE 'rum_%';

-- 6. Grant necessary permissions
GRANT INSERT ON analytics_metrics TO anon;
GRANT INSERT ON analytics_events TO anon;
GRANT SELECT ON analytics_metrics TO anon;
GRANT SELECT ON analytics_events TO anon;