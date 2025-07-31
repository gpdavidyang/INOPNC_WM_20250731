-- Create storage buckets for file uploads
-- This migration creates the necessary storage buckets for documents, daily reports, and other file attachments

-- Enable storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create main documents bucket for general file storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,  -- Private bucket - requires authentication
  52428800,  -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create daily reports bucket for work log attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daily-reports',
  'daily-reports',
  false,  -- Private bucket
  52428800,  -- 50MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create profile photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  false,  -- Private bucket
  5242880,  -- 5MB limit for profile photos
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create safety documents bucket for certificates and safety-related files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'safety-documents',
  'safety-documents',
  false,  -- Private bucket
  52428800,  -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create quality documents bucket for inspection reports and quality certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quality-documents',
  'quality-documents',
  false,  -- Private bucket
  52428800,  -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for daily-reports bucket
CREATE POLICY "Authenticated users can view daily report attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'daily-reports');

CREATE POLICY "Authenticated users can upload daily report attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'daily-reports');

CREATE POLICY "Users can update their own daily report attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'daily-reports' AND
    EXISTS (
      SELECT 1 FROM daily_reports dr
      WHERE dr.id = SPLIT_PART((storage.foldername(name))[2], '/', 1)::uuid
        AND dr.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own daily report attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'daily-reports' AND
    EXISTS (
      SELECT 1 FROM daily_reports dr
      WHERE dr.id = SPLIT_PART((storage.foldername(name))[2], '/', 1)::uuid
        AND dr.created_by = auth.uid()
    )
  );

-- Storage policies for profile-photos bucket
CREATE POLICY "Users can view profile photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own profile photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own profile photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for safety-documents bucket
CREATE POLICY "Organization members can view safety documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'safety-documents' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = SPLIT_PART((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

CREATE POLICY "Safety managers can upload safety documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'safety-documents' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('site_manager', 'admin', 'system_admin')
        AND p.organization_id = SPLIT_PART((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

CREATE POLICY "Safety managers can update safety documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'safety-documents' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('site_manager', 'admin', 'system_admin')
        AND p.organization_id = SPLIT_PART((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

CREATE POLICY "Safety managers can delete safety documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'safety-documents' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('site_manager', 'admin', 'system_admin')
        AND p.organization_id = SPLIT_PART((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

-- Storage policies for quality-documents bucket
CREATE POLICY "Organization members can view quality documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'quality-documents' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = SPLIT_PART((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

CREATE POLICY "Quality managers can upload quality documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'quality-documents' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('site_manager', 'admin', 'system_admin')
        AND p.organization_id = SPLIT_PART((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

CREATE POLICY "Quality managers can update quality documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'quality-documents' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('site_manager', 'admin', 'system_admin')
        AND p.organization_id = SPLIT_PART((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

CREATE POLICY "Quality managers can delete quality documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'quality-documents' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('site_manager', 'admin', 'system_admin')
        AND p.organization_id = SPLIT_PART((storage.foldername(name))[1], '/', 1)::uuid
    )
  );

-- Add comment explaining storage structure
COMMENT ON SCHEMA storage IS '
Storage bucket structure:
- documents/{user_id}/{filename} - Personal documents
- daily-reports/{report_id}/{filename} - Daily report attachments  
- profile-photos/{user_id}/{filename} - User profile photos
- safety-documents/{org_id}/{filename} - Organization safety documents
- quality-documents/{org_id}/{filename} - Organization quality documents
';
