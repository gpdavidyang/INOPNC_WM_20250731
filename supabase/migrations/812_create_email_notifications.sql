-- Create email notifications system
-- Migration: 812_create_email_notifications.sql

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('welcome', 'password_reset', 'account_update', 'document_reminder', 'system_notification')),
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'scheduled')),
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient_email ON email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_notification_type ON email_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_priority ON email_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_email_notifications_scheduled_at ON email_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_by ON email_notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_notifications
CREATE POLICY "Admin can view all email notifications"
  ON email_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admin can insert email notifications"
  ON email_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admin can update email notifications"
  ON email_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Admin can delete email notifications"
  ON email_notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'system_admin')
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE email_notifications IS 'Email notification system for automated communications';
COMMENT ON COLUMN email_notifications.notification_type IS 'Type of notification: welcome, password_reset, account_update, document_reminder, system_notification';
COMMENT ON COLUMN email_notifications.priority IS 'Email priority level: low, normal, high, urgent';
COMMENT ON COLUMN email_notifications.status IS 'Email status: pending, sent, failed, scheduled';
COMMENT ON COLUMN email_notifications.metadata IS 'Additional email metadata like bulk_id, template variables, etc.';