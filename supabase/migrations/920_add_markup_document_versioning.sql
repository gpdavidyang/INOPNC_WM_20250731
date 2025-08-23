-- 도면마킹 문서 버전 관리 및 이력 추적 시스템

-- 1. markup_documents 테이블에 버전 관리 필드 추가
ALTER TABLE markup_documents 
ADD COLUMN version_number INTEGER DEFAULT 1,
ADD COLUMN parent_document_id UUID REFERENCES markup_documents(id) ON DELETE SET NULL,
ADD COLUMN is_latest_version BOOLEAN DEFAULT TRUE,
ADD COLUMN change_summary TEXT;

-- 2. 도면마킹 문서 히스토리 테이블 생성
CREATE TABLE markup_document_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES markup_documents(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  markup_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  markup_count INTEGER DEFAULT 0,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('created', 'updated', 'restored', 'deleted')),
  change_summary TEXT,
  changed_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  previous_version_id UUID REFERENCES markup_document_history(id) ON DELETE SET NULL
);

-- 3. 인덱스 생성
CREATE INDEX idx_markup_documents_version ON markup_documents(version_number);
CREATE INDEX idx_markup_documents_parent ON markup_documents(parent_document_id);
CREATE INDEX idx_markup_documents_latest ON markup_documents(is_latest_version);

CREATE INDEX idx_markup_document_history_document_id ON markup_document_history(document_id);
CREATE INDEX idx_markup_document_history_version ON markup_document_history(version_number);
CREATE INDEX idx_markup_document_history_changed_at ON markup_document_history(changed_at DESC);
CREATE INDEX idx_markup_document_history_changed_by ON markup_document_history(changed_by);

-- 4. 버전 히스토리 자동 기록 함수
CREATE OR REPLACE FUNCTION create_markup_document_history()
RETURNS TRIGGER AS $$
DECLARE
  change_type_val TEXT;
  prev_version_id UUID;
BEGIN
  -- 변경 유형 결정
  IF TG_OP = 'INSERT' THEN
    change_type_val := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    change_type_val := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    change_type_val := 'deleted';
  END IF;

  -- 이전 버전 히스토리 ID 찾기 (UPDATE의 경우)
  IF TG_OP = 'UPDATE' THEN
    SELECT id INTO prev_version_id 
    FROM markup_document_history 
    WHERE document_id = COALESCE(NEW.id, OLD.id) 
    ORDER BY version_number DESC 
    LIMIT 1;
  END IF;

  -- 히스토리 레코드 생성
  INSERT INTO markup_document_history (
    document_id,
    version_number,
    title,
    description,
    markup_data,
    markup_count,
    change_type,
    change_summary,
    changed_by,
    previous_version_id
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.version_number, OLD.version_number, 1),
    COALESCE(NEW.title, OLD.title),
    COALESCE(NEW.description, OLD.description),
    COALESCE(NEW.markup_data, OLD.markup_data),
    COALESCE(NEW.markup_count, OLD.markup_count),
    change_type_val,
    COALESCE(NEW.change_summary, OLD.change_summary),
    COALESCE(NEW.created_by, OLD.created_by),
    prev_version_id
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. 히스토리 트리거 생성
CREATE TRIGGER markup_document_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON markup_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_markup_document_history();

-- 6. 새 버전 생성 함수
CREATE OR REPLACE FUNCTION create_new_markup_document_version(
  original_doc_id UUID,
  new_title VARCHAR(255),
  new_description TEXT DEFAULT NULL,
  new_markup_data JSONB DEFAULT NULL,
  new_change_summary TEXT DEFAULT NULL,
  user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  original_doc markup_documents%ROWTYPE;
  new_version_number INTEGER;
  new_doc_id UUID;
BEGIN
  -- 원본 문서 정보 조회
  SELECT * INTO original_doc FROM markup_documents WHERE id = original_doc_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Original document not found';
  END IF;

  -- 새 버전 번호 계산
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO new_version_number
  FROM markup_documents 
  WHERE parent_document_id = original_doc_id OR id = original_doc_id;

  -- 기존 최신 버전 플래그 해제
  UPDATE markup_documents 
  SET is_latest_version = FALSE 
  WHERE (parent_document_id = original_doc_id OR id = original_doc_id);

  -- 새 버전 문서 생성
  INSERT INTO markup_documents (
    title,
    description,
    original_blueprint_url,
    original_blueprint_filename,
    markup_data,
    preview_image_url,
    location,
    created_by,
    site_id,
    file_size,
    markup_count,
    version_number,
    parent_document_id,
    is_latest_version,
    change_summary
  ) VALUES (
    new_title,
    COALESCE(new_description, original_doc.description),
    original_doc.original_blueprint_url,
    original_doc.original_blueprint_filename,
    COALESCE(new_markup_data, original_doc.markup_data),
    original_doc.preview_image_url,
    original_doc.location,
    COALESCE(user_id, original_doc.created_by),
    original_doc.site_id,
    original_doc.file_size,
    COALESCE(jsonb_array_length(new_markup_data), original_doc.markup_count),
    new_version_number,
    CASE WHEN original_doc.parent_document_id IS NULL THEN original_doc_id ELSE original_doc.parent_document_id END,
    TRUE,
    new_change_summary
  ) RETURNING id INTO new_doc_id;

  RETURN new_doc_id;
END;
$$ LANGUAGE plpgsql;

-- 7. 버전 복원 함수
CREATE OR REPLACE FUNCTION restore_markup_document_version(
  history_id UUID,
  user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  history_record markup_document_history%ROWTYPE;
  new_doc_id UUID;
BEGIN
  -- 히스토리 레코드 조회
  SELECT * INTO history_record FROM markup_document_history WHERE id = history_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'History record not found';
  END IF;

  -- 히스토리에서 새 버전 생성
  SELECT create_new_markup_document_version(
    history_record.document_id,
    history_record.title,
    history_record.description,
    history_record.markup_data,
    'Restored from version ' || history_record.version_number,
    user_id
  ) INTO new_doc_id;

  RETURN new_doc_id;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS 정책 추가
ALTER TABLE markup_document_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 문서 히스토리만 조회 가능
CREATE POLICY "Users can view their own document history" ON markup_document_history
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM markup_documents WHERE created_by = auth.uid()
    )
  );

-- 관리자는 모든 문서 히스토리 조회 가능
CREATE POLICY "Admins can view all document history" ON markup_document_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- 9. 뷰 생성 - 최신 버전만 조회
CREATE VIEW markup_documents_latest AS
SELECT * FROM markup_documents 
WHERE is_latest_version = TRUE AND is_deleted = FALSE;

-- 10. 뷰 생성 - 전체 버전 트리 조회
CREATE VIEW markup_document_versions AS
SELECT 
  d.*,
  CASE 
    WHEN d.parent_document_id IS NULL THEN d.id 
    ELSE d.parent_document_id 
  END as root_document_id,
  p.full_name as creator_name,
  s.name as site_name
FROM markup_documents d
LEFT JOIN profiles p ON d.created_by = p.id
LEFT JOIN sites s ON d.site_id = s.id
WHERE d.is_deleted = FALSE
ORDER BY 
  CASE WHEN d.parent_document_id IS NULL THEN d.id ELSE d.parent_document_id END,
  d.version_number DESC;

COMMENT ON TABLE markup_document_history IS '도면마킹 문서 변경 이력을 추적하는 테이블';
COMMENT ON FUNCTION create_new_markup_document_version IS '기존 문서의 새 버전을 생성하는 함수';
COMMENT ON FUNCTION restore_markup_document_version IS '히스토리에서 특정 버전을 복원하는 함수';
COMMENT ON VIEW markup_documents_latest IS '최신 버전의 도면마킹 문서만 조회하는 뷰';
COMMENT ON VIEW markup_document_versions IS '모든 버전의 도면마킹 문서를 트리 형태로 조회하는 뷰';