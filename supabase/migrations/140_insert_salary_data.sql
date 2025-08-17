-- =====================================================
-- Insert Sample Salary Data for Testing
-- =====================================================

-- Insert salary information for existing test users
INSERT INTO public.salary_info (user_id, base_salary, hourly_rate, overtime_rate, effective_date)
SELECT 
  p.id,
  CASE 
    WHEN p.role = 'site_manager' THEN 400000.00  -- 현장관리자: 400만원
    WHEN p.role = 'admin' THEN 500000.00         -- 관리자: 500만원
    WHEN p.role = 'customer_manager' THEN 350000.00  -- 고객관리자: 350만원
    ELSE 300000.00                               -- 일반 작업자: 300만원
  END as base_salary,
  CASE 
    WHEN p.role = 'site_manager' THEN 20000.00   -- 시급 2만원
    WHEN p.role = 'admin' THEN 25000.00          -- 시급 2.5만원
    WHEN p.role = 'customer_manager' THEN 18000.00  -- 시급 1.8만원
    ELSE 15000.00                                -- 시급 1.5만원
  END as hourly_rate,
  CASE 
    WHEN p.role = 'site_manager' THEN 30000.00   -- 연장수당 3만원
    WHEN p.role = 'admin' THEN 35000.00          -- 연장수당 3.5만원
    WHEN p.role = 'customer_manager' THEN 27000.00  -- 연장수당 2.7만원
    ELSE 22500.00                                -- 연장수당 2.25만원
  END as overtime_rate,
  '2025-01-01'::DATE as effective_date
FROM public.profiles p
WHERE p.email IN (
  'worker@inopnc.com',
  'manager@inopnc.com', 
  'customer@inopnc.com',
  'admin@inopnc.com',
  'production@inopnc.com'
)
ON CONFLICT (user_id, effective_date) DO UPDATE SET
  base_salary = EXCLUDED.base_salary,
  hourly_rate = EXCLUDED.hourly_rate,
  overtime_rate = EXCLUDED.overtime_rate,
  updated_at = NOW();

-- Add some historical salary data for testing
INSERT INTO public.salary_info (user_id, base_salary, hourly_rate, overtime_rate, effective_date, end_date)
SELECT 
  p.id,
  CASE 
    WHEN p.role = 'site_manager' THEN 380000.00  -- 이전 급여 (약간 낮음)
    WHEN p.role = 'admin' THEN 480000.00         
    WHEN p.role = 'customer_manager' THEN 330000.00  
    ELSE 280000.00                               
  END as base_salary,
  CASE 
    WHEN p.role = 'site_manager' THEN 19000.00   
    WHEN p.role = 'admin' THEN 24000.00          
    WHEN p.role = 'customer_manager' THEN 17000.00  
    ELSE 14000.00                                
  END as hourly_rate,
  CASE 
    WHEN p.role = 'site_manager' THEN 28500.00   
    WHEN p.role = 'admin' THEN 36000.00          
    WHEN p.role = 'customer_manager' THEN 25500.00  
    ELSE 21000.00                                
  END as overtime_rate,
  '2024-01-01'::DATE as effective_date,
  '2024-12-31'::DATE as end_date
FROM public.profiles p
WHERE p.email IN (
  'worker@inopnc.com',
  'manager@inopnc.com', 
  'customer@inopnc.com',
  'admin@inopnc.com',
  'production@inopnc.com'
)
ON CONFLICT (user_id, effective_date) DO UPDATE SET
  base_salary = EXCLUDED.base_salary,
  hourly_rate = EXCLUDED.hourly_rate,
  overtime_rate = EXCLUDED.overtime_rate,
  end_date = EXCLUDED.end_date,
  updated_at = NOW();

-- Update any existing records to ensure consistency
UPDATE public.salary_info 
SET updated_at = NOW()
WHERE updated_at < NOW() - INTERVAL '1 day';

COMMENT ON TABLE public.salary_info IS 'Salary information for users with effective date ranges';