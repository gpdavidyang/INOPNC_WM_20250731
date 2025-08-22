-- Create signup_requests table for managing user registration approvals
CREATE TABLE IF NOT EXISTS signup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  requested_role VARCHAR(50) NOT NULL CHECK (requested_role IN ('worker', 'site_manager', 'customer_manager', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_message TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Add indexes for performance
  CONSTRAINT valid_status_transition CHECK (
    (status = 'pending' AND approved_at IS NULL AND approved_by IS NULL) OR
    (status IN ('approved', 'rejected') AND approved_at IS NOT NULL AND approved_by IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_signup_requests_status ON signup_requests(status);
CREATE INDEX idx_signup_requests_created_at ON signup_requests(created_at DESC);
CREATE INDEX idx_signup_requests_email ON signup_requests(email);

-- Enable RLS
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view signup requests
CREATE POLICY "Admins can view signup requests"
ON signup_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'system_admin')
  )
);

-- RLS Policy: Only admins can update signup requests
CREATE POLICY "Admins can update signup requests"
ON signup_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'system_admin')
  )
);

-- RLS Policy: Anyone can insert signup requests (for public registration)
CREATE POLICY "Anyone can create signup requests"
ON signup_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Function to automatically approve system admins (optional)
CREATE OR REPLACE FUNCTION auto_approve_system_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve if the email matches a pre-approved system admin list
  IF NEW.email IN ('davidswyang@gmail.com', 'admin@inopnc.com') THEN
    NEW.status := 'approved';
    NEW.approved_at := NOW();
    NEW.approved_by := (SELECT id FROM profiles WHERE email = 'davidswyang@gmail.com' LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-approval (optional)
CREATE TRIGGER auto_approve_system_admin_trigger
BEFORE INSERT ON signup_requests
FOR EACH ROW
EXECUTE FUNCTION auto_approve_system_admin();

-- Add sample data for testing (in development only)
INSERT INTO signup_requests (
  email, 
  full_name, 
  phone, 
  company_name, 
  requested_role, 
  status, 
  request_message,
  created_at
) VALUES 
  ('newworker@example.com', '김철수', '010-1234-5678', 'ABC 건설', 'worker', 'pending', '현장 작업자로 등록하고 싶습니다.', NOW()),
  ('partner@company.com', '이영희', '010-9876-5432', 'XYZ 파트너사', 'customer_manager', 'pending', '파트너사 관리자 권한을 요청합니다.', NOW() - INTERVAL '1 day'),
  ('manager@site.com', '박민수', '010-5555-5555', '대한건설', 'site_manager', 'pending', '현장 관리자로 등록 요청드립니다.', NOW() - INTERVAL '2 days')
ON CONFLICT (email) DO NOTHING;