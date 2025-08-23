-- =============================================
-- Document Share Tokens Table
-- For temporary sharing links with expiration
-- =============================================

CREATE TABLE IF NOT EXISTS document_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES shared_documents(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  allow_download BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata for tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_used_ip INET,
  last_user_agent TEXT,
  
  -- Constraints
  CONSTRAINT valid_expires_at CHECK (expires_at > created_at),
  CONSTRAINT valid_used_count CHECK (used_count >= 0),
  CONSTRAINT valid_max_uses CHECK (max_uses IS NULL OR max_uses > 0)
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Primary lookup indexes
CREATE INDEX idx_document_share_tokens_token ON document_share_tokens(token);
CREATE INDEX idx_document_share_tokens_document_id ON document_share_tokens(document_id);
CREATE INDEX idx_document_share_tokens_created_by ON document_share_tokens(created_by);

-- Query optimization indexes
CREATE INDEX idx_document_share_tokens_active ON document_share_tokens(document_id, is_active, expires_at) 
  WHERE is_active = true AND expires_at > NOW();
CREATE INDEX idx_document_share_tokens_expires_at ON document_share_tokens(expires_at);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE document_share_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage tokens for documents they have share permission for
CREATE POLICY "Users can manage share tokens for their documents"
ON document_share_tokens
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shared_documents sd
    WHERE sd.id = document_share_tokens.document_id
    AND sd.uploaded_by = auth.uid()
  )
  OR
  -- Check if user has share permission
  EXISTS (
    SELECT 1 FROM document_permissions dp
    WHERE dp.document_id = document_share_tokens.document_id
    AND dp.can_share = true
    AND (
      (dp.permission_type = 'user_specific' AND dp.target_user_id = auth.uid())
      OR
      (dp.permission_type = 'role_based' AND dp.target_role IN (
        SELECT role FROM profiles WHERE id = auth.uid()
      ))
      OR
      (dp.permission_type = 'site_specific' AND dp.target_site_id IN (
        SELECT site_id FROM site_assignments sa
        WHERE sa.user_id = auth.uid() AND sa.is_active = true
      ))
    )
  )
  OR
  -- Admin access
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =============================================
-- Helper Functions
-- =============================================

-- Validate share token
CREATE OR REPLACE FUNCTION validate_share_token(
  p_token VARCHAR(64),
  p_document_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Get token info
  SELECT *
  INTO token_record
  FROM document_share_tokens
  WHERE token = p_token
    AND document_id = p_document_id
    AND is_active = true
    AND expires_at > NOW()
    AND (max_uses IS NULL OR used_count < max_uses);
  
  -- Return whether token is valid
  RETURN token_record.id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track token usage
CREATE OR REPLACE FUNCTION track_token_usage(
  p_token VARCHAR(64),
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  token_id UUID;
BEGIN
  -- Update usage tracking
  UPDATE document_share_tokens
  SET 
    used_count = used_count + 1,
    last_used_at = NOW(),
    last_used_ip = p_ip_address,
    last_user_agent = p_user_agent
  WHERE token = p_token
    AND is_active = true
    AND expires_at > NOW()
  RETURNING id INTO token_id;
  
  RETURN token_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_share_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired tokens older than 30 days
  DELETE FROM document_share_tokens
  WHERE expires_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Triggers for Auto-Cleanup
-- =============================================

-- Function to auto-deactivate expired tokens
CREATE OR REPLACE FUNCTION auto_deactivate_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Deactivate expired tokens during any read operation
  UPDATE document_share_tokens
  SET is_active = false
  WHERE expires_at <= NOW() AND is_active = true;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run cleanup on access
CREATE OR REPLACE TRIGGER trigger_auto_cleanup_tokens
  AFTER SELECT ON document_share_tokens
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_deactivate_expired_tokens();

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE document_share_tokens IS 'Temporary sharing tokens for documents with expiration and usage tracking';
COMMENT ON COLUMN document_share_tokens.token IS 'Secure random token for sharing (64 hex characters)';
COMMENT ON COLUMN document_share_tokens.max_uses IS 'Maximum number of times this token can be used (NULL = unlimited)';
COMMENT ON COLUMN document_share_tokens.used_count IS 'Number of times this token has been used';
COMMENT ON COLUMN document_share_tokens.allow_download IS 'Whether this token allows downloading the document';

COMMENT ON FUNCTION validate_share_token IS 'Check if a share token is valid and active';
COMMENT ON FUNCTION track_token_usage IS 'Track usage of a share token';
COMMENT ON FUNCTION cleanup_expired_share_tokens IS 'Clean up expired tokens (run periodically)';