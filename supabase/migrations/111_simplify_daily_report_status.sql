-- Simplify daily_reports status to only 'draft' and 'submitted'
-- Remove 'approved' and 'rejected' states for simpler workflow

-- First, update existing records that have 'approved' or 'rejected' status
UPDATE daily_reports 
SET status = 'submitted' 
WHERE status IN ('approved', 'rejected');

-- Drop the existing check constraint
ALTER TABLE daily_reports 
DROP CONSTRAINT IF EXISTS daily_reports_status_check;

-- Add new simplified check constraint
ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_status_check 
CHECK (status IN ('draft', 'submitted'));

-- Remove approval-related columns as they're no longer needed
ALTER TABLE daily_reports 
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approved_at;

-- Update any notification templates that reference old statuses
DELETE FROM notification_templates 
WHERE type IN ('daily_report_approved', 'daily_report_rejected');

-- Update notification template for submission to be more general
UPDATE notification_templates 
SET 
  title = '일일보고서 제출',
  message = '일일보고서가 제출되었습니다',
  description = '{{user_name}}님이 {{site_name}} 현장의 일일보고서를 제출했습니다.'
WHERE type = 'daily_report_submitted';

-- Add comment to document the simplified status system
COMMENT ON COLUMN daily_reports.status IS 'Simplified status: draft (임시저장) or submitted (제출됨)';