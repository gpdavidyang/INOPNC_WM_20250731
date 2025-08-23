-- =============================================
-- 공유문서함 테이블 생성
-- =============================================

-- 1. shared_documents 테이블 생성
CREATE TABLE IF NOT EXISTS shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- pdf, doc, docx, xls, xlsx, ppt, pptx, jpg, png, etc
  file_size BIGINT NOT NULL, -- in bytes
  mime_type VARCHAR(255),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  category VARCHAR(100), -- 문서 카테고리 (도면, 계약서, 보고서, 기타 등)
  tags TEXT[], -- 태그 배열
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. document_permissions 테이블 생성 (문서별 권한 설정)
CREATE TABLE IF NOT EXISTS document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES shared_documents(id) ON DELETE CASCADE NOT NULL,
  permission_type VARCHAR(50) NOT NULL, -- 'role_based', 'user_specific', 'site_specific', 'organization_specific'
  target_role VARCHAR(50), -- 'worker', 'site_manager', 'partner', 'admin', 'customer_manager'
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  target_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT TRUE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_share BOOLEAN DEFAULT FALSE,
  can_download BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE, -- 권한 만료일 (선택사항)
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 중복 권한 방지를 위한 유니크 제약
  UNIQUE(document_id, permission_type, target_role, target_user_id, target_site_id, target_organization_id)
);

-- 3. document_access_logs 테이블 생성 (문서 접근 로그)
CREATE TABLE IF NOT EXISTS document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES shared_documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name VARCHAR(255), -- 사용자가 삭제되어도 이름 보존
  user_email VARCHAR(255), -- 사용자가 삭제되어도 이메일 보존
  action VARCHAR(50) NOT NULL, -- 'view', 'download', 'edit', 'delete', 'share', 'upload'
  details JSONB, -- 추가 상세 정보 (예: 변경 내용, 공유 대상 등)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. document_versions 테이블 생성 (문서 버전 관리)
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES shared_documents(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  change_description TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- shared_documents 인덱스
CREATE INDEX idx_shared_documents_site_id ON shared_documents(site_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_shared_documents_uploaded_by ON shared_documents(uploaded_by) WHERE is_deleted = FALSE;
CREATE INDEX idx_shared_documents_organization_id ON shared_documents(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_shared_documents_created_at ON shared_documents(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_shared_documents_file_type ON shared_documents(file_type) WHERE is_deleted = FALSE;
CREATE INDEX idx_shared_documents_category ON shared_documents(category) WHERE is_deleted = FALSE;
CREATE INDEX idx_shared_documents_tags ON shared_documents USING GIN(tags) WHERE is_deleted = FALSE;

-- document_permissions 인덱스
CREATE INDEX idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_target_user_id ON document_permissions(target_user_id);
CREATE INDEX idx_document_permissions_target_site_id ON document_permissions(target_site_id);
CREATE INDEX idx_document_permissions_target_role ON document_permissions(target_role);
CREATE INDEX idx_document_permissions_expires_at ON document_permissions(expires_at) WHERE expires_at IS NOT NULL;

-- document_access_logs 인덱스
CREATE INDEX idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX idx_document_access_logs_action ON document_access_logs(action);
CREATE INDEX idx_document_access_logs_created_at ON document_access_logs(created_at DESC);

-- document_versions 인덱스
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);

-- =============================================
-- 트리거 함수
-- =============================================

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_shared_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shared_documents_updated_at
  BEFORE UPDATE ON shared_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_documents_updated_at();

CREATE TRIGGER trigger_update_document_permissions_updated_at
  BEFORE UPDATE ON document_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_documents_updated_at();

-- 문서 삭제시 접근 로그 기록
CREATE OR REPLACE FUNCTION log_document_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    INSERT INTO document_access_logs (
      document_id, 
      user_id, 
      user_name,
      user_email,
      action, 
      details
    )
    SELECT 
      NEW.id,
      NEW.deleted_by,
      p.name,
      p.email,
      'delete',
      jsonb_build_object(
        'document_title', NEW.title,
        'deleted_at', NEW.deleted_at
      )
    FROM profiles p
    WHERE p.id = NEW.deleted_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_document_deletion
  AFTER UPDATE ON shared_documents
  FOR EACH ROW
  WHEN (NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE)
  EXECUTE FUNCTION log_document_deletion();

-- =============================================
-- 기본 권한 데이터 삽입 함수
-- =============================================

-- 문서 업로드시 기본 권한 자동 생성
CREATE OR REPLACE FUNCTION create_default_document_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Admin 역할에 대한 전체 권한
  INSERT INTO document_permissions (
    document_id,
    permission_type,
    target_role,
    can_view,
    can_edit,
    can_delete,
    can_share,
    can_download,
    created_by
  ) VALUES (
    NEW.id,
    'role_based',
    'admin',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    NEW.uploaded_by
  );

  -- 2. 업로드한 사용자에 대한 권한
  INSERT INTO document_permissions (
    document_id,
    permission_type,
    target_user_id,
    can_view,
    can_edit,
    can_delete,
    can_share,
    can_download,
    created_by
  ) VALUES (
    NEW.id,
    'user_specific',
    NEW.uploaded_by,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    NEW.uploaded_by
  );

  -- 3. 해당 현장의 site_manager 역할에 대한 권한
  IF NEW.site_id IS NOT NULL THEN
    INSERT INTO document_permissions (
      document_id,
      permission_type,
      target_role,
      target_site_id,
      can_view,
      can_edit,
      can_delete,
      can_share,
      can_download,
      created_by
    ) VALUES (
      NEW.id,
      'site_specific',
      'site_manager',
      NEW.site_id,
      TRUE,
      TRUE,
      FALSE,
      TRUE,
      TRUE,
      NEW.uploaded_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_document_permissions
  AFTER INSERT ON shared_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_default_document_permissions();

-- =============================================
-- 뷰 생성 (편의를 위한 조회 뷰)
-- =============================================

-- 문서와 권한을 조인한 뷰
CREATE OR REPLACE VIEW v_shared_documents_with_permissions AS
SELECT 
  sd.*,
  s.name as site_name,
  s.address as site_address,
  p.name as uploaded_by_name,
  p.email as uploaded_by_email,
  o.name as organization_name,
  COUNT(DISTINCT dp.id) as permission_count,
  COUNT(DISTINCT dal.id) FILTER (WHERE dal.action = 'view') as view_count,
  COUNT(DISTINCT dal.id) FILTER (WHERE dal.action = 'download') as download_count
FROM shared_documents sd
LEFT JOIN sites s ON sd.site_id = s.id
LEFT JOIN profiles p ON sd.uploaded_by = p.id
LEFT JOIN organizations o ON sd.organization_id = o.id
LEFT JOIN document_permissions dp ON sd.id = dp.document_id
LEFT JOIN document_access_logs dal ON sd.id = dal.document_id
WHERE sd.is_deleted = FALSE
GROUP BY sd.id, s.name, s.address, p.name, p.email, o.name;

-- =============================================
-- 코멘트 추가
-- =============================================

COMMENT ON TABLE shared_documents IS '공유문서함 - 현장별로 공유되는 문서들을 관리';
COMMENT ON TABLE document_permissions IS '문서 권한 - 문서별 세부 접근 권한 설정';
COMMENT ON TABLE document_access_logs IS '문서 접근 로그 - 문서 조회, 다운로드, 수정 등의 이력';
COMMENT ON TABLE document_versions IS '문서 버전 관리 - 문서의 버전 히스토리 관리';

COMMENT ON COLUMN shared_documents.file_type IS '파일 확장자 (pdf, doc, xls, jpg 등)';
COMMENT ON COLUMN shared_documents.category IS '문서 카테고리 (도면, 계약서, 보고서, 기타 등)';
COMMENT ON COLUMN document_permissions.permission_type IS '권한 유형: role_based(역할기반), user_specific(특정사용자), site_specific(특정현장), organization_specific(특정조직)';
COMMENT ON COLUMN document_access_logs.action IS '작업 유형: view(조회), download(다운로드), edit(수정), delete(삭제), share(공유), upload(업로드)';