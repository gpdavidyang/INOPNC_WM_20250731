-- Create signup_requests table for approval workflow
CREATE TABLE IF NOT EXISTS signup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('construction', 'office')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES profiles(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    temporary_password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON signup_requests(email);

-- Create index on status for admin dashboard
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_requests(status);

-- Create index on requested_at for ordering
CREATE INDEX IF NOT EXISTS idx_signup_requests_requested_at ON signup_requests(requested_at);

-- RLS policies for signup_requests
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read signup requests
CREATE POLICY "Admins can view signup requests" ON signup_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

-- Policy: Anyone can create signup requests (no auth required)
CREATE POLICY "Anyone can create signup requests" ON signup_requests
    FOR INSERT WITH CHECK (true);

-- Policy: Only admins can update signup requests
CREATE POLICY "Admins can update signup requests" ON signup_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

-- Add company and job_title columns to profiles table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
        ALTER TABLE profiles ADD COLUMN company VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title') THEN
        ALTER TABLE profiles ADD COLUMN job_title VARCHAR(255);
    END IF;
END $$;