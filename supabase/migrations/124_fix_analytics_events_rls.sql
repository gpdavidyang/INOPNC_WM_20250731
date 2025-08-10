-- Fix RLS policies for analytics_events to allow RUM events

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow all event creation" ON analytics_events;
DROP POLICY IF EXISTS "Users can create events" ON analytics_events;

-- Create more permissive policy for event creation
CREATE POLICY "Allow all event creation including RUM" ON analytics_events
  FOR INSERT WITH CHECK (
    -- Allow RUM events from anyone (no auth required)
    event_type LIKE 'rum_%' OR
    event_type LIKE 'page_view%' OR
    event_type LIKE 'performance_%' OR
    -- Allow authenticated users to create any event
    auth.uid() IS NOT NULL OR
    -- Allow events without user_id (anonymous events)
    user_id IS NULL
  );

-- Update SELECT policy to allow viewing RUM events
DROP POLICY IF EXISTS "Site managers can view their site events" ON analytics_events;

CREATE POLICY "Allow viewing events" ON analytics_events
  FOR SELECT USING (
    -- Allow viewing RUM events (anonymous)
    event_type LIKE 'rum_%' OR
    event_type LIKE 'page_view%' OR
    event_type LIKE 'performance_%' OR
    -- Allow authenticated users to view events
    auth.uid() IS NOT NULL
  );

-- Grant necessary permissions to anon role
GRANT INSERT, SELECT ON analytics_events TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;