-- =====================================================
-- Migration: Add labor_hours to attendance_records
-- Description: Add labor_hours column to track worker hours (공수)
-- Author: Claude
-- Date: 2025-08-02
-- =====================================================

-- Add labor_hours column to attendance_records table
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS labor_hours DECIMAL(4,2);

-- Update existing records to calculate labor_hours from work_hours
UPDATE public.attendance_records
SET labor_hours = CASE 
    WHEN work_hours IS NOT NULL THEN work_hours / 8.0  -- Convert hours to 공수 (1.0 = 8 hours)
    WHEN status = 'present' AND check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN 1.0
    WHEN status = 'absent' THEN 0
    ELSE NULL
END
WHERE labor_hours IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.attendance_records.labor_hours IS 'Labor hours in units of 공수 (1.0 = 8 hours of work)';

-- Create an index for performance when querying by labor_hours
CREATE INDEX IF NOT EXISTS idx_attendance_records_labor_hours 
ON public.attendance_records(labor_hours) 
WHERE labor_hours IS NOT NULL;

-- Create a function to automatically calculate labor_hours from work_hours
CREATE OR REPLACE FUNCTION calculate_labor_hours()
RETURNS TRIGGER AS $$
BEGIN
    -- If work_hours is provided, calculate labor_hours
    IF NEW.work_hours IS NOT NULL THEN
        NEW.labor_hours := NEW.work_hours / 8.0;
    -- If only check in/out times are provided, calculate based on time difference
    ELSIF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
        NEW.work_hours := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600.0;
        NEW.labor_hours := NEW.work_hours / 8.0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate labor_hours
CREATE TRIGGER calculate_labor_hours_trigger
BEFORE INSERT OR UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION calculate_labor_hours();

-- Update the view or any dependent objects if needed
-- Note: Check if there are any views that need to be updated