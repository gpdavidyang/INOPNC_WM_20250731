-- =============================================
-- Supabase Storage 버킷 및 정책 생성
-- =============================================

-- documents 버킷 생성
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Storage 정책 생성
-- =============================================

-- 1. 인증된 사용자는 파일 업로드 가능
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. 파일 업로더는 자신의 파일 삭제 가능
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. 파일 업로더와 Admin은 파일 업데이트 가능
CREATE POLICY "Users can update their own documents or admins can update all"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- 4. 공개 파일은 모든 인증된 사용자가 조회 가능 (권한 체크는 애플리케이션 레벨에서)
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- =============================================
-- 스토리지 도우미 함수
-- =============================================

-- 파일 크기 제한 체크 함수
CREATE OR REPLACE FUNCTION check_file_size()
RETURNS TRIGGER AS $$
BEGIN
  -- 50MB 제한
  IF NEW.metadata->>'size' IS NOT NULL AND (NEW.metadata->>'size')::bigint > 52428800 THEN
    RAISE EXCEPTION 'File size exceeds 50MB limit';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 파일 크기 체크 트리거
DROP TRIGGER IF EXISTS check_file_size_trigger ON storage.objects;
CREATE TRIGGER check_file_size_trigger
  BEFORE INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION check_file_size();

-- 허용된 파일 타입 체크 함수
CREATE OR REPLACE FUNCTION check_file_type()
RETURNS TRIGGER AS $$
DECLARE
  allowed_types TEXT[] := ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    'image/vnd.dwg',
    'image/vnd.dxf',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];
BEGIN
  IF NEW.bucket_id = 'documents' THEN
    IF NEW.metadata->>'mimetype' IS NOT NULL AND 
       NOT (NEW.metadata->>'mimetype' = ANY(allowed_types)) THEN
      RAISE EXCEPTION 'File type not allowed: %', NEW.metadata->>'mimetype';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 파일 타입 체크 트리거
DROP TRIGGER IF EXISTS check_file_type_trigger ON storage.objects;
CREATE TRIGGER check_file_type_trigger
  BEFORE INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION check_file_type();

-- =============================================
-- 스토리지 정리 함수
-- =============================================

-- 삭제된 문서의 파일 정리 (주기적으로 실행)
CREATE OR REPLACE FUNCTION cleanup_deleted_document_files()
RETURNS void AS $$
DECLARE
  deleted_files RECORD;
BEGIN
  -- 30일 이상 된 삭제된 문서의 파일들을 찾아서 스토리지에서도 삭제
  FOR deleted_files IN 
    SELECT file_url, file_name 
    FROM shared_documents 
    WHERE is_deleted = true 
    AND deleted_at < NOW() - INTERVAL '30 days'
  LOOP
    -- 실제 스토리지 파일 삭제는 애플리케이션 레벨에서 처리
    -- 여기서는 로그만 남김
    INSERT INTO document_access_logs (
      document_id, 
      action, 
      details
    ) VALUES (
      NULL, 
      'cleanup', 
      jsonb_build_object(
        'file_url', deleted_files.file_url,
        'file_name', deleted_files.file_name,
        'cleanup_date', NOW()
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 파일 경로 생성 헬퍼 함수
-- =============================================

-- 사용자별 폴더 구조로 파일 경로 생성
CREATE OR REPLACE FUNCTION generate_file_path(
  p_user_id UUID,
  p_file_name TEXT,
  p_category TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  file_extension TEXT;
  clean_filename TEXT;
  timestamp_str TEXT;
  category_path TEXT;
BEGIN
  -- 파일 확장자 추출
  file_extension := LOWER(SUBSTRING(p_file_name FROM '\.([^\.]+)$'));
  
  -- 파일명에서 특수문자 제거 및 공백을 언더스코어로 변경
  clean_filename := REGEXP_REPLACE(
    REGEXP_REPLACE(p_file_name, '[^a-zA-Z0-9가-힣\.\-_\s]', '', 'g'),
    '\s+', '_', 'g'
  );
  
  -- 타임스탬프 생성
  timestamp_str := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
  
  -- 카테고리별 경로
  category_path := CASE 
    WHEN p_category IS NOT NULL THEN p_category || '/'
    ELSE 'general/'
  END;
  
  -- 최종 경로 생성: shared-documents/{user_id}/{category}/{timestamp}_{filename}
  RETURN 'shared-documents/' || p_user_id::TEXT || '/' || category_path || timestamp_str || '_' || clean_filename;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 코멘트 추가
-- =============================================

COMMENT ON POLICY "Authenticated users can upload documents" ON storage.objects IS '인증된 사용자는 자신의 폴더에 문서 업로드 가능';
COMMENT ON POLICY "Users can delete their own documents" ON storage.objects IS '사용자는 자신이 업로드한 문서만 삭제 가능';
COMMENT ON POLICY "Users can update their own documents or admins can update all" ON storage.objects IS '파일 업로더와 관리자만 파일 수정 가능';
COMMENT ON POLICY "Authenticated users can view documents" ON storage.objects IS '인증된 사용자는 문서 조회 가능 (권한은 앱에서 체크)';

COMMENT ON FUNCTION check_file_size IS '파일 크기 제한 체크 (50MB)';
COMMENT ON FUNCTION check_file_type IS '허용된 파일 타입 체크';
COMMENT ON FUNCTION cleanup_deleted_document_files IS '삭제된 문서 파일 정리';
COMMENT ON FUNCTION generate_file_path IS '사용자별 구조화된 파일 경로 생성';