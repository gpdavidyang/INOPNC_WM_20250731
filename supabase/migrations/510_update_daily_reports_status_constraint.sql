-- Update daily_reports status constraint to only allow 'draft' and 'submitted' for partner companies
-- First update any existing 'approved' or 'rejected' statuses to 'submitted'

-- Update approved to submitted
UPDATE daily_reports 
SET status = 'submitted',
    updated_at = NOW()
WHERE status = 'approved';

-- Update rejected to draft (since it needs revision)
UPDATE daily_reports 
SET status = 'draft',
    updated_at = NOW()
WHERE status = 'rejected';

-- Drop the old constraint if it exists
ALTER TABLE daily_reports 
DROP CONSTRAINT IF EXISTS daily_reports_status_check;

-- Add new constraint that only allows 'draft' and 'submitted' for partner companies
-- Note: We're keeping the full status options for now but partner UI will only show/use draft and submitted
ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_status_check 
CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));

-- Add a comment to document the partner-specific restriction
COMMENT ON COLUMN daily_reports.status IS 'Status of the daily report. For partner companies, only ''draft'' and ''submitted'' are used. ''approved'' and ''rejected'' are reserved for future use or admin functions.';

-- Create an index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_daily_reports_status ON daily_reports(status);

-- Update the updated_at timestamp for affected records
UPDATE daily_reports 
SET updated_at = NOW()
WHERE status IN ('draft', 'submitted')
  AND updated_at < NOW() - INTERVAL '1 second';