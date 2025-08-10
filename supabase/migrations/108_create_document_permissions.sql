-- 일반 문서 공유 권한 테이블
CREATE TABLE document_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  permission_type VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (permission_type IN ('view', 'edit', 'admin')),
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(document_id, user_id)
);

-- 인덱스 생성
CREATE INDEX idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX idx_document_permissions_expires_at ON document_permissions(expires_at);

-- RLS (Row Level Security) 정책
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신이 소유한 문서의 권한을 조회할 수 있음
CREATE POLICY "Users can view permissions for their documents" ON document_permissions
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- 문서 소유자는 권한을 부여할 수 있음
CREATE POLICY "Document owners can grant permissions" ON document_permissions
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    ) AND granted_by = auth.uid()
  );

-- 문서 소유자는 권한을 수정할 수 있음
CREATE POLICY "Document owners can update permissions" ON document_permissions
  FOR UPDATE USING (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

-- 문서 소유자는 권한을 삭제할 수 있음
CREATE POLICY "Document owners can delete permissions" ON document_permissions
  FOR DELETE USING (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

-- 관리자는 모든 권한을 관리할 수 있음
CREATE POLICY "Admins can manage all document permissions" ON document_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );