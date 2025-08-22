-- 807_enhance_document_permission_system.sql
-- Enhanced document permission system for complete document management

-- First, fix schema inconsistencies
-- Add is_deleted column to documents table (referenced in performance indexes)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add created_by column to documents table for consistency
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted 
ON documents(is_deleted) WHERE is_deleted = TRUE;

CREATE INDEX IF NOT EXISTS idx_documents_created_by 
ON documents(created_by, created_at DESC);

-- Update document_type enum to include the new categories from requirements
-- First drop existing constraint
ALTER TABLE documents 
DROP CONSTRAINT IF EXISTS documents_document_type_check;

-- Add enhanced document type constraint
ALTER TABLE documents 
ADD CONSTRAINT documents_document_type_check 
CHECK (document_type IN (
  'personal',           -- 내문서함: Personal documents
  'shared',            -- 공유문서함: Shared site documents
  'blueprint',         -- 도면마킹: Blueprint documents
  'required',          -- 필수 제출 서류: Required submission documents  
  'progress_payment',  -- 기성청구함: Progress payment documents
  'report',            -- 기존 유지: Report documents
  'certificate',       -- 기존 유지: Certificate documents
  'other'              -- 기타
));

-- Create enhanced document categories table for better organization
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories based on requirements
INSERT INTO document_categories (name, display_name, description, icon, color, sort_order) VALUES
('personal', '내문서함', '개인용 문서 보관함 (본사 관리자 열람 가능)', 'User', 'blue', 1),
('shared', '공유문서함', '현장별 공유 문서함 (현장 배정된 사용자 간 공유)', 'Users', 'green', 2),
('blueprint', '도면마킹', '현장별 도면 마킹 문서', 'FileImage', 'purple', 3),
('required', '필수 제출 서류', '본사 제출용 필수 서류', 'FileCheck', 'red', 4),
('progress_payment', '기성청구함', '현장별 파트너사 기성청구 관련 서류', 'DollarSign', 'orange', 5),
('report', '작업 보고서', '작업일지 및 각종 보고서', 'FileText', 'gray', 6),
('certificate', '자격증/인증서', '자격증 및 인증서류', 'Award', 'yellow', 7),
('other', '기타 문서', '기타 분류되지 않은 문서', 'File', 'gray', 8)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Enhanced document access control table
CREATE TABLE IF NOT EXISTS document_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Access control by user/role
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'admin', 'site_manager', 'worker', 'partner', etc.
  
  -- Site-based access control
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Partner-based access control (for progress_payment documents)
  partner_company_id UUID REFERENCES partner_companies(id) ON DELETE CASCADE,
  
  -- Permission level
  permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'download', 'edit', 'admin')),
  
  -- Conditional access
  conditions JSONB, -- For complex access rules
  
  -- Audit trail
  granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For temporary access
  
  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(document_id, user_id, site_id, partner_company_id)
);

-- Indexes for document_access_control
CREATE INDEX idx_document_access_control_document ON document_access_control(document_id);
CREATE INDEX idx_document_access_control_user ON document_access_control(user_id);
CREATE INDEX idx_document_access_control_site ON document_access_control(site_id);
CREATE INDEX idx_document_access_control_partner ON document_access_control(partner_company_id);
CREATE INDEX idx_document_access_control_expires ON document_access_control(expires_at) WHERE expires_at IS NOT NULL;

-- Document folder structure for better organization
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  document_category VARCHAR(50) NOT NULL REFERENCES document_categories(name),
  
  -- Permissions
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  
  UNIQUE(name, parent_folder_id, site_id, document_category)
);

-- Add folder reference to documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL;

-- Create indexes for folders
CREATE INDEX idx_document_folders_parent ON document_folders(parent_folder_id);
CREATE INDEX idx_document_folders_site_category ON document_folders(site_id, document_category);
CREATE INDEX idx_document_folders_owner ON document_folders(owner_id);
CREATE INDEX idx_documents_folder ON documents(folder_id);

-- Document sharing logs for audit trail
CREATE TABLE IF NOT EXISTS document_sharing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  shared_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'granted', 'revoked', 'modified'
  permission_level VARCHAR(20),
  previous_permission VARCHAR(20),
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_sharing_logs_document ON document_sharing_logs(document_id, created_at DESC);
CREATE INDEX idx_document_sharing_logs_user ON document_sharing_logs(shared_with_user_id, created_at DESC);

-- Enhanced RLS policies for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;  
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;

-- 1. Personal documents (내문서함): Users can access their own, admins can access all
CREATE POLICY "Personal documents access" ON documents
  FOR ALL USING (
    document_type = 'personal' AND (
      created_by = auth.uid() OR 
      owner_id = auth.uid() OR
      -- Admins can access all personal documents  
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'system_admin')
      )
    )
  );

-- 2. Shared documents (공유문서함): Site-based access
CREATE POLICY "Shared documents access" ON documents
  FOR ALL USING (
    document_type = 'shared' AND (
      -- Owner access
      created_by = auth.uid() OR owner_id = auth.uid() OR
      -- Admin access  
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'system_admin')
      ) OR
      -- Site-based access (users assigned to the same site)
      EXISTS (
        SELECT 1 FROM site_memberships sm1
        JOIN site_memberships sm2 ON sm1.site_id = sm2.site_id
        WHERE sm1.user_id = auth.uid()
        AND sm2.site_id = documents.site_id
        AND sm1.status = 'active'
      )
    )
  );

-- 3. Blueprint documents (도면마킹): Site-based access
CREATE POLICY "Blueprint documents access" ON documents
  FOR ALL USING (
    document_type = 'blueprint' AND (
      -- Owner access
      created_by = auth.uid() OR owner_id = auth.uid() OR
      -- Admin access
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'system_admin')
      ) OR
      -- Site-based access
      EXISTS (
        SELECT 1 FROM site_memberships 
        WHERE user_id = auth.uid()
        AND site_id = documents.site_id
        AND status = 'active'
      )
    )
  );

-- 4. Required documents (필수 제출 서류): User and admin access
CREATE POLICY "Required documents access" ON documents
  FOR ALL USING (
    document_type = 'required' AND (
      -- User can access their own submissions
      created_by = auth.uid() OR owner_id = auth.uid() OR
      -- Admins can access all required documents
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'system_admin')
      )
    )
  );

-- 5. Progress payment documents (기성청구함): Site and partner access
CREATE POLICY "Progress payment documents access" ON documents
  FOR ALL USING (
    document_type = 'progress_payment' AND (
      -- Owner access
      created_by = auth.uid() OR owner_id = auth.uid() OR
      -- Admin access
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'system_admin')
      ) OR
      -- Partner access (partners assigned to the same site)
      EXISTS (
        SELECT 1 FROM site_partners sp
        JOIN partner_companies pc ON sp.partner_company_id = pc.id
        JOIN profiles p ON p.organization_id = pc.organization_id  
        WHERE p.id = auth.uid()
        AND sp.site_id = documents.site_id
        AND sp.status = 'active'
        AND p.role = 'customer_manager' -- partner role
      )
    )
  );

-- 6. Other document types (report, certificate, other): Existing logic
CREATE POLICY "Other documents access" ON documents
  FOR ALL USING (
    document_type IN ('report', 'certificate', 'other') AND (
      -- Owner access
      created_by = auth.uid() OR owner_id = auth.uid() OR
      -- Admin access
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'system_admin')
      ) OR
      -- Public documents
      is_public = TRUE OR
      -- Site-based access if site_id is set
      (site_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM site_memberships 
        WHERE user_id = auth.uid()
        AND site_id = documents.site_id
        AND status = 'active'
      ))
    )
  );

-- RLS for document_access_control table
ALTER TABLE document_access_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their document access" ON document_access_control
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Document owners can manage access" ON document_access_control
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE id = document_access_control.document_id 
      AND (created_by = auth.uid() OR owner_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- RLS for document_folders table
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document folders access" ON document_folders
  FOR ALL USING (
    -- Owner access
    owner_id = auth.uid() OR created_by = auth.uid() OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    ) OR
    -- Site-based access
    (site_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM site_memberships 
      WHERE user_id = auth.uid()
      AND site_id = document_folders.site_id
      AND status = 'active'
    )) OR
    -- Public folders
    is_public = TRUE
  );

-- RLS for document_categories (read-only for all authenticated users)
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view categories" ON document_categories
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "Admins can manage categories" ON document_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- RLS for document_sharing_logs (audit purposes)
ALTER TABLE document_sharing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sharing logs" ON document_sharing_logs
  FOR SELECT USING (
    shared_with_user_id = auth.uid() OR 
    shared_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Function to check document access permissions
CREATE OR REPLACE FUNCTION check_document_access(
  doc_id UUID,
  user_id UUID,
  required_permission VARCHAR(20) DEFAULT 'view'
) RETURNS BOOLEAN AS $$
DECLARE
  doc_record RECORD;
  user_record RECORD;
  has_access BOOLEAN := FALSE;
BEGIN
  -- Get document info
  SELECT * INTO doc_record FROM documents WHERE id = doc_id AND (is_deleted = FALSE OR is_deleted IS NULL);
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  -- Get user info
  SELECT * INTO user_record FROM profiles WHERE id = user_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  -- Admin always has access
  IF user_record.role IN ('admin', 'system_admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Owner always has access
  IF doc_record.created_by = user_id OR doc_record.owner_id = user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific access control rules
  SELECT COUNT(*) > 0 INTO has_access
  FROM document_access_control dac
  WHERE dac.document_id = doc_id
    AND dac.is_active = TRUE
    AND (dac.expires_at IS NULL OR dac.expires_at > NOW())
    AND (
      dac.user_id = user_id OR
      dac.role = user_record.role OR
      (dac.site_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM site_memberships 
        WHERE user_id = user_id AND site_id = dac.site_id AND status = 'active'
      ))
    );
    
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible documents
CREATE OR REPLACE FUNCTION get_user_documents(
  user_id UUID,
  doc_type VARCHAR(50) DEFAULT NULL,
  site_id UUID DEFAULT NULL
) RETURNS TABLE(
  id UUID,
  title TEXT,
  document_type TEXT,
  folder_path TEXT,
  site_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  file_size INTEGER,
  mime_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.document_type,
    d.folder_path,
    s.name as site_name,
    d.created_at,
    d.file_size,
    d.mime_type
  FROM documents d
  LEFT JOIN sites s ON d.site_id = s.id
  WHERE (d.is_deleted = FALSE OR d.is_deleted IS NULL)
    AND (doc_type IS NULL OR d.document_type = doc_type)
    AND (site_id IS NULL OR d.site_id = site_id)
    AND (
      -- Check access using the RLS policies
      check_document_access(d.id, user_id, 'view')
    )
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger for document changes
CREATE OR REPLACE FUNCTION audit_document_changes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO document_sharing_logs (
      document_id, shared_by_user_id, action, reason, created_at
    ) VALUES (
      NEW.id, 
      auth.uid()::UUID, 
      'modified', 
      'Document properties updated',
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO document_sharing_logs (
      document_id, shared_by_user_id, action, reason, created_at  
    ) VALUES (
      OLD.id,
      auth.uid()::UUID,
      'deleted',
      'Document deleted',
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger
DROP TRIGGER IF EXISTS audit_document_changes_trigger ON documents;
CREATE TRIGGER audit_document_changes_trigger
  AFTER UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_document_changes();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE document_categories TO authenticated;
GRANT ALL ON TABLE document_access_control TO authenticated; 
GRANT ALL ON TABLE document_folders TO authenticated;
GRANT ALL ON TABLE document_sharing_logs TO authenticated;
GRANT EXECUTE ON FUNCTION check_document_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_documents TO authenticated;