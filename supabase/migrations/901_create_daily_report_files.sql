-- Create daily_report_files table for storing work photos and receipts
CREATE TABLE IF NOT EXISTS daily_report_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('photo_before', 'photo_after', 'receipt', 'document', 'other')),
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_report_files_report_id ON daily_report_files(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_daily_report_files_type ON daily_report_files(file_type);
CREATE INDEX IF NOT EXISTS idx_daily_report_files_created_at ON daily_report_files(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE daily_report_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin users can access all files
CREATE POLICY "Admin users can view all daily report files" ON daily_report_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admin users can insert daily report files" ON daily_report_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admin users can update daily report files" ON daily_report_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admin users can delete daily report files" ON daily_report_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Site managers and workers can view files from their assigned sites
CREATE POLICY "Site users can view their site daily report files" ON daily_report_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      JOIN site_assignments sa ON dr.site_id = sa.site_id
      WHERE dr.id = daily_report_files.daily_report_id
      AND sa.user_id = auth.uid()
      AND sa.unassigned_date IS NULL
    )
  );

-- Workers can upload files to their own reports
CREATE POLICY "Users can insert files to their own reports" ON daily_report_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_reports dr
      WHERE dr.id = daily_report_files.daily_report_id
      AND dr.created_by = auth.uid()
    )
  );

-- Users can update their own uploaded files
CREATE POLICY "Users can update their own uploaded files" ON daily_report_files
  FOR UPDATE USING (created_by = auth.uid());

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete their own uploaded files" ON daily_report_files
  FOR DELETE USING (created_by = auth.uid());