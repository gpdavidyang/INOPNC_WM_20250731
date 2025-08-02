-- 마킹 도면 문서 테이블
CREATE TABLE markup_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  original_blueprint_url TEXT NOT NULL,
  original_blueprint_filename VARCHAR(255) NOT NULL,
  markup_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  preview_image_url TEXT,
  location VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (location IN ('personal', 'shared')),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  file_size INTEGER DEFAULT 0,
  markup_count INTEGER DEFAULT 0
);

-- 인덱스 생성
CREATE INDEX idx_markup_documents_created_by ON markup_documents(created_by);
CREATE INDEX idx_markup_documents_site_id ON markup_documents(site_id);
CREATE INDEX idx_markup_documents_location ON markup_documents(location);
CREATE INDEX idx_markup_documents_created_at ON markup_documents(created_at DESC);
CREATE INDEX idx_markup_documents_is_deleted ON markup_documents(is_deleted);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_markup_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_markup_documents_updated_at
  BEFORE UPDATE ON markup_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_markup_documents_updated_at();

-- RLS (Row Level Security) 정책
ALTER TABLE markup_documents ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신이 생성한 개인 문서만 접근 가능
CREATE POLICY "Users can view their own personal markup documents" ON markup_documents
  FOR SELECT USING (
    created_by = auth.uid() AND location = 'personal'
  );

CREATE POLICY "Users can create their own markup documents" ON markup_documents
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their own markup documents" ON markup_documents
  FOR UPDATE USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own markup documents" ON markup_documents
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- 공유 문서는 같은 사이트의 사용자들이 접근 가능
CREATE POLICY "Site users can view shared markup documents" ON markup_documents
  FOR SELECT USING (
    location = 'shared' AND 
    site_id IN (
      SELECT sa.site_id 
      FROM site_assignments sa 
      WHERE sa.user_id = auth.uid() AND sa.is_active = true
    )
  );

-- 관리자는 모든 문서 접근 가능
CREATE POLICY "Admins can manage all markup documents" ON markup_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- 마킹 도면 공유 권한 테이블 (추후 확장용)
CREATE TABLE markup_document_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES markup_documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  permission_type VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (permission_type IN ('view', 'edit', 'admin')),
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(document_id, user_id)
);

CREATE INDEX idx_markup_document_permissions_document_id ON markup_document_permissions(document_id);
CREATE INDEX idx_markup_document_permissions_user_id ON markup_document_permissions(user_id);

-- 권한 테이블 RLS
ALTER TABLE markup_document_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions for their documents" ON markup_document_permissions
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM markup_documents WHERE created_by = auth.uid()
    ) OR user_id = auth.uid()
  );