-- =====================================================
-- Migration: Remove approval/rejection from daily reports
-- Description: 작업일지 관리에서 승인/반려 기능 제거
-- Date: 2025-08-23
-- =====================================================

-- 1. Update existing approved/rejected/completed records to submitted
UPDATE daily_reports 
SET status = 'submitted',
    updated_at = NOW()
WHERE status IN ('approved', 'rejected', 'completed');

-- 2. Drop the old constraint
ALTER TABLE daily_reports 
DROP CONSTRAINT IF EXISTS daily_reports_status_check;

-- 3. Add new constraint with only draft and submitted
ALTER TABLE daily_reports 
ADD CONSTRAINT daily_reports_status_check 
CHECK (status IN ('draft', 'submitted'));

-- 4. Update column comment
COMMENT ON COLUMN daily_reports.status IS 'Status of the daily report: draft (임시저장), submitted (제출됨)';

-- 5. Update the RLS policy to remove approval-related logic
DROP POLICY IF EXISTS "daily_reports_update_policy" ON daily_reports;

CREATE POLICY "daily_reports_update_policy" ON daily_reports
    FOR UPDATE
    USING (
        auth.uid() = created_by
        OR is_admin()
        OR (
            is_manager_or_above()
            AND site_id = ANY(user_site_ids())
        )
    )
    WITH CHECK (true); -- No special checks for status changes

-- 6. Drop unused columns related to approval
ALTER TABLE daily_reports 
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS rejection_reason;

-- 7. Update approval_requests table if it has daily_report related records
UPDATE approval_requests 
SET status = 'cancelled',
    comments = 'Approval process removed from daily reports',
    processed_at = NOW()
WHERE request_type = 'daily_report' 
AND status IN ('pending', 'approved', 'rejected');

-- 8. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_status_work_date 
ON daily_reports(status, work_date DESC);

-- 9. Add comment to table
COMMENT ON TABLE daily_reports IS 'Daily work reports with only draft and submitted status';