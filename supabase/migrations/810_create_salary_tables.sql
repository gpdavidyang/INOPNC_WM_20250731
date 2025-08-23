-- =====================================================
-- Salary Management Tables
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.salary_records CASCADE;
DROP TABLE IF EXISTS public.salary_calculation_rules CASCADE;

-- Create salary calculation rules table
CREATE TABLE public.salary_calculation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('hourly_rate', 'daily_rate', 'overtime_multiplier', 'bonus_calculation')),
  base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  multiplier DECIMAL(5, 2) DEFAULT 1.0,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  role VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create salary records table
CREATE TABLE public.salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  work_date DATE NOT NULL,
  regular_hours DECIMAL(5, 2) NOT NULL DEFAULT 8,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  base_pay DECIMAL(10, 2) NOT NULL DEFAULT 0,
  overtime_pay DECIMAL(10, 2) DEFAULT 0,
  bonuses DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_pay DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'calculated' CHECK (status IN ('calculated', 'approved', 'paid')),
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_date TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_salary_rules_site ON public.salary_calculation_rules(site_id);
CREATE INDEX idx_salary_rules_role ON public.salary_calculation_rules(role);
CREATE INDEX idx_salary_rules_active ON public.salary_calculation_rules(is_active);
CREATE INDEX idx_salary_records_worker ON public.salary_records(worker_id);
CREATE INDEX idx_salary_records_site ON public.salary_records(site_id);
CREATE INDEX idx_salary_records_work_date ON public.salary_records(work_date);
CREATE INDEX idx_salary_records_status ON public.salary_records(status);

-- Add RLS policies for salary_calculation_rules
ALTER TABLE public.salary_calculation_rules ENABLE ROW LEVEL SECURITY;

-- Admin can manage all rules
CREATE POLICY "Admin can manage all salary rules" ON public.salary_calculation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Site managers can view rules for their sites
CREATE POLICY "Site managers can view their site rules" ON public.salary_calculation_rules
  FOR SELECT USING (
    site_id IS NULL OR
    site_id IN (
      SELECT site_id FROM public.site_assignments
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Add RLS policies for salary_records
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

-- Admin can manage all records
CREATE POLICY "Admin can manage all salary records" ON public.salary_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Workers can view their own records
CREATE POLICY "Workers can view own salary records" ON public.salary_records
  FOR SELECT USING (
    worker_id = auth.uid()
  );

-- Site managers can view records for their sites
CREATE POLICY "Site managers can view site salary records" ON public.salary_records
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM public.site_assignments
      WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('site_manager', 'admin')
    )
  );

-- Create function to calculate salaries
CREATE OR REPLACE FUNCTION public.calculate_worker_salary(
  p_worker_id UUID,
  p_site_id UUID,
  p_work_date DATE,
  p_regular_hours DECIMAL,
  p_overtime_hours DECIMAL
) RETURNS TABLE (
  base_pay DECIMAL,
  overtime_pay DECIMAL,
  total_pay DECIMAL
) AS $$
DECLARE
  v_hourly_rate DECIMAL;
  v_overtime_multiplier DECIMAL;
  v_base_pay DECIMAL;
  v_overtime_pay DECIMAL;
BEGIN
  -- Get hourly rate from rules or default
  SELECT COALESCE(base_amount, 150000.0 / 8) INTO v_hourly_rate
  FROM public.salary_calculation_rules
  WHERE is_active = true
    AND rule_type = 'hourly_rate'
    AND (site_id = p_site_id OR site_id IS NULL)
    AND (role IS NULL OR role = (SELECT role FROM public.profiles WHERE id = p_worker_id))
  ORDER BY site_id DESC NULLS LAST, role DESC NULLS LAST
  LIMIT 1;
  
  -- Get overtime multiplier
  SELECT COALESCE(multiplier, 1.5) INTO v_overtime_multiplier
  FROM public.salary_calculation_rules
  WHERE is_active = true
    AND rule_type = 'overtime_multiplier'
    AND (site_id = p_site_id OR site_id IS NULL)
  ORDER BY site_id DESC NULLS LAST
  LIMIT 1;
  
  -- Calculate pay
  v_base_pay := p_regular_hours * COALESCE(v_hourly_rate, 18750); -- Default 150000/8
  v_overtime_pay := p_overtime_hours * COALESCE(v_hourly_rate, 18750) * COALESCE(v_overtime_multiplier, 1.5);
  
  RETURN QUERY SELECT 
    v_base_pay,
    v_overtime_pay,
    v_base_pay + v_overtime_pay;
END;
$$ LANGUAGE plpgsql;

-- Create function to batch calculate salaries
CREATE OR REPLACE FUNCTION public.batch_calculate_salaries(
  p_site_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_calc RECORD;
BEGIN
  -- Insert salary records based on attendance
  FOR v_calc IN
    SELECT 
      ar.user_id as worker_id,
      ar.site_id,
      ar.check_in_date as work_date,
      LEAST(8, ar.labor_hours * 8) as regular_hours,
      GREATEST(0, (ar.labor_hours * 8) - 8) as overtime_hours
    FROM public.attendance_records ar
    WHERE ar.status = 'present'
      AND (p_site_id IS NULL OR ar.site_id = p_site_id)
      AND (p_start_date IS NULL OR ar.check_in_date >= p_start_date)
      AND (p_end_date IS NULL OR ar.check_in_date <= p_end_date)
      AND NOT EXISTS (
        SELECT 1 FROM public.salary_records sr
        WHERE sr.worker_id = ar.user_id
          AND sr.work_date = ar.check_in_date
      )
  LOOP
    -- Calculate salary for this record
    WITH calc AS (
      SELECT * FROM public.calculate_worker_salary(
        v_calc.worker_id,
        v_calc.site_id,
        v_calc.work_date,
        v_calc.regular_hours,
        v_calc.overtime_hours
      )
    )
    INSERT INTO public.salary_records (
      worker_id,
      site_id,
      work_date,
      regular_hours,
      overtime_hours,
      base_pay,
      overtime_pay,
      total_pay,
      status
    )
    SELECT
      v_calc.worker_id,
      v_calc.site_id,
      v_calc.work_date,
      v_calc.regular_hours,
      v_calc.overtime_hours,
      calc.base_pay,
      calc.overtime_pay,
      calc.total_pay,
      'calculated'
    FROM calc;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for salary statistics
CREATE OR REPLACE VIEW public.salary_statistics AS
SELECT
  COUNT(DISTINCT sr.worker_id) as total_workers,
  COUNT(*) FILTER (WHERE sr.status = 'calculated') as pending_calculations,
  COUNT(*) FILTER (WHERE sr.status = 'approved') as approved_payments,
  SUM(sr.total_pay) as total_payroll,
  AVG(sr.total_pay) as average_daily_pay,
  ROUND(
    (SUM(sr.overtime_hours) * 100.0 / NULLIF(SUM(sr.regular_hours + sr.overtime_hours), 0))::NUMERIC, 
    2
  ) as overtime_percentage
FROM public.salary_records sr
WHERE sr.work_date >= CURRENT_DATE - INTERVAL '30 days';

-- Add comments
COMMENT ON TABLE public.salary_calculation_rules IS 'Salary calculation rules for different sites and roles';
COMMENT ON TABLE public.salary_records IS 'Individual salary records for workers';
COMMENT ON FUNCTION public.calculate_worker_salary IS 'Calculate salary for a worker based on hours and rules';
COMMENT ON FUNCTION public.batch_calculate_salaries IS 'Batch calculate salaries from attendance records';
COMMENT ON VIEW public.salary_statistics IS 'Aggregated salary statistics view';