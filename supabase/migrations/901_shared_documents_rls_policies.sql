-- =============================================
-- RLS (Row Level Security) 정책 설정
-- =============================================

-- RLS 활성화
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- shared_documents 테이블 RLS 정책
-- =============================================

-- 1. SELECT 정책: 권한이 있는 문서만 조회 가능
CREATE POLICY "Users can view shared documents they have permission to" ON shared_documents
FOR SELECT USING (
  -- 삭제되지 않은 문서만
  is_deleted = FALSE AND (
    -- Admin은 모든 문서 조회 가능
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
    OR
    -- 업로드한 사용자는 자신의 문서 조회 가능
    uploaded_by = auth.uid()
    OR
    -- document_permissions에 명시된 권한이 있는 경우
    EXISTS (
      SELECT 1 FROM document_permissions dp
      WHERE dp.document_id = shared_documents.id
      AND dp.can_view = TRUE
      AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
      AND (
        -- 역할 기반 권한
        (dp.permission_type = 'role_based' AND dp.target_role = (
          SELECT role FROM profiles WHERE id = auth.uid()
        ))
        OR
        -- 특정 사용자 권한
        (dp.permission_type = 'user_specific' AND dp.target_user_id = auth.uid())
        OR
        -- 특정 현장 권한 (사용자가 해당 현장에 속한 경우)
        (dp.permission_type = 'site_specific' AND EXISTS (
          SELECT 1 FROM site_assignments sa
          WHERE sa.user_id = auth.uid() 
          AND sa.site_id = dp.target_site_id
          AND sa.is_active = TRUE
        ))
        OR
        -- 특정 조직 권한 (사용자가 해당 조직에 속한 경우)
        (dp.permission_type = 'organization_specific' AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.organization_id = dp.target_organization_id
        ))
      )
    )
  )
);

-- 2. INSERT 정책: 인증된 사용자는 문서 업로드 가능
CREATE POLICY "Authenticated users can upload documents" ON shared_documents
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND uploaded_by = auth.uid()
);

-- 3. UPDATE 정책: 권한이 있는 사용자만 수정 가능
CREATE POLICY "Users can update documents they have edit permission to" ON shared_documents
FOR UPDATE USING (
  -- Admin은 모든 문서 수정 가능
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- 업로드한 사용자는 자신의 문서 수정 가능
  uploaded_by = auth.uid()
  OR
  -- document_permissions에 수정 권한이 있는 경우
  EXISTS (
    SELECT 1 FROM document_permissions dp
    WHERE dp.document_id = shared_documents.id
    AND dp.can_edit = TRUE
    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
    AND (
      (dp.permission_type = 'user_specific' AND dp.target_user_id = auth.uid())
      OR
      (dp.permission_type = 'role_based' AND dp.target_role = (
        SELECT role FROM profiles WHERE id = auth.uid()
      ))
    )
  )
) WITH CHECK (
  -- 업데이트시에도 동일한 조건 체크
  uploaded_by = OLD.uploaded_by -- uploaded_by는 변경 불가
);

-- 4. DELETE 정책: Soft delete만 허용 (is_deleted = TRUE로 업데이트)
CREATE POLICY "Users can soft delete documents they have delete permission to" ON shared_documents
FOR DELETE USING (
  FALSE -- 실제 DELETE는 금지, UPDATE로 soft delete 처리
);

-- =============================================
-- document_permissions 테이블 RLS 정책
-- =============================================

-- 1. SELECT 정책: Admin과 문서 소유자만 권한 조회 가능
CREATE POLICY "Users can view permissions for documents they manage" ON document_permissions
FOR SELECT USING (
  -- Admin은 모든 권한 조회 가능
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- 문서 업로더는 권한 조회 가능
  EXISTS (
    SELECT 1 FROM shared_documents sd
    WHERE sd.id = document_permissions.document_id
    AND sd.uploaded_by = auth.uid()
  )
  OR
  -- 공유 권한이 있는 사용자는 권한 조회 가능
  EXISTS (
    SELECT 1 FROM document_permissions dp2
    WHERE dp2.document_id = document_permissions.document_id
    AND dp2.target_user_id = auth.uid()
    AND dp2.can_share = TRUE
  )
);

-- 2. INSERT 정책: 공유 권한이 있는 사용자만 권한 추가 가능
CREATE POLICY "Users can add permissions if they have share permission" ON document_permissions
FOR INSERT WITH CHECK (
  -- Admin은 모든 권한 추가 가능
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- 문서 업로더는 권한 추가 가능
  EXISTS (
    SELECT 1 FROM shared_documents sd
    WHERE sd.id = document_id
    AND sd.uploaded_by = auth.uid()
  )
  OR
  -- 공유 권한이 있는 사용자는 권한 추가 가능
  EXISTS (
    SELECT 1 FROM document_permissions dp
    WHERE dp.document_id = document_id
    AND dp.target_user_id = auth.uid()
    AND dp.can_share = TRUE
  )
);

-- 3. UPDATE 정책: Admin과 권한 생성자만 수정 가능
CREATE POLICY "Users can update permissions they created or admin" ON document_permissions
FOR UPDATE USING (
  -- Admin은 모든 권한 수정 가능
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- 권한 생성자는 수정 가능
  created_by = auth.uid()
);

-- 4. DELETE 정책: Admin과 권한 생성자만 삭제 가능
CREATE POLICY "Users can delete permissions they created or admin" ON document_permissions
FOR DELETE USING (
  -- Admin은 모든 권한 삭제 가능
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- 권한 생성자는 삭제 가능
  created_by = auth.uid()
);

-- =============================================
-- document_access_logs 테이블 RLS 정책
-- =============================================

-- 1. SELECT 정책: Admin과 문서 소유자만 로그 조회 가능
CREATE POLICY "Users can view logs for documents they manage" ON document_access_logs
FOR SELECT USING (
  -- Admin은 모든 로그 조회 가능
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- 문서 업로더는 로그 조회 가능
  EXISTS (
    SELECT 1 FROM shared_documents sd
    WHERE sd.id = document_access_logs.document_id
    AND sd.uploaded_by = auth.uid()
  )
  OR
  -- 본인의 접근 로그는 조회 가능
  user_id = auth.uid()
);

-- 2. INSERT 정책: 시스템만 로그 추가 가능 (서비스 역할 키 사용)
CREATE POLICY "System can insert access logs" ON document_access_logs
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL -- 인증된 사용자의 활동만 로깅
);

-- 3. UPDATE/DELETE 정책: 로그는 수정/삭제 불가
CREATE POLICY "Logs cannot be updated" ON document_access_logs
FOR UPDATE USING (FALSE);

CREATE POLICY "Logs cannot be deleted" ON document_access_logs
FOR DELETE USING (FALSE);

-- =============================================
-- document_versions 테이블 RLS 정책
-- =============================================

-- 1. SELECT 정책: 문서 조회 권한이 있는 사용자는 버전 히스토리 조회 가능
CREATE POLICY "Users can view versions of documents they can access" ON document_versions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM shared_documents sd
    WHERE sd.id = document_versions.document_id
    AND (
      -- Admin은 모든 버전 조회 가능
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
      )
      OR
      -- 문서 조회 권한이 있는 경우
      sd.uploaded_by = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM document_permissions dp
        WHERE dp.document_id = sd.id
        AND dp.can_view = TRUE
        AND dp.target_user_id = auth.uid()
      )
    )
  )
);

-- 2. INSERT 정책: 문서 수정 권한이 있는 사용자만 새 버전 추가 가능
CREATE POLICY "Users can add versions if they can edit document" ON document_versions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM shared_documents sd
    WHERE sd.id = document_id
    AND (
      -- Admin은 새 버전 추가 가능
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
      )
      OR
      -- 문서 수정 권한이 있는 경우
      sd.uploaded_by = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM document_permissions dp
        WHERE dp.document_id = sd.id
        AND dp.can_edit = TRUE
        AND dp.target_user_id = auth.uid()
      )
    )
  )
);

-- 3. UPDATE/DELETE 정책: 버전 히스토리는 수정/삭제 불가
CREATE POLICY "Versions cannot be updated" ON document_versions
FOR UPDATE USING (FALSE);

CREATE POLICY "Versions cannot be deleted" ON document_versions
FOR DELETE USING (FALSE);

-- =============================================
-- 도우미 함수 생성
-- =============================================

-- 사용자가 특정 문서에 대한 권한을 가지고 있는지 확인하는 함수
CREATE OR REPLACE FUNCTION check_document_permission(
  p_document_id UUID,
  p_user_id UUID,
  p_permission_type TEXT -- 'view', 'edit', 'delete', 'share', 'download'
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
  v_user_role TEXT;
BEGIN
  -- 사용자 역할 조회
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = p_user_id;

  -- Admin은 모든 권한 보유
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 문서 업로더는 모든 권한 보유
  IF EXISTS (
    SELECT 1 FROM shared_documents
    WHERE id = p_document_id AND uploaded_by = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- document_permissions 테이블에서 권한 확인
  SELECT TRUE INTO v_has_permission
  FROM document_permissions dp
  WHERE dp.document_id = p_document_id
  AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
  AND (
    (dp.permission_type = 'user_specific' AND dp.target_user_id = p_user_id)
    OR
    (dp.permission_type = 'role_based' AND dp.target_role = v_user_role)
  )
  AND (
    (p_permission_type = 'view' AND dp.can_view = TRUE)
    OR (p_permission_type = 'edit' AND dp.can_edit = TRUE)
    OR (p_permission_type = 'delete' AND dp.can_delete = TRUE)
    OR (p_permission_type = 'share' AND dp.can_share = TRUE)
    OR (p_permission_type = 'download' AND dp.can_download = TRUE)
  )
  LIMIT 1;

  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 코멘트 추가
-- =============================================

COMMENT ON POLICY "Users can view shared documents they have permission to" ON shared_documents IS '권한이 있는 사용자만 문서 조회 가능';
COMMENT ON POLICY "Authenticated users can upload documents" ON shared_documents IS '인증된 사용자는 문서 업로드 가능';
COMMENT ON POLICY "Users can update documents they have edit permission to" ON shared_documents IS '수정 권한이 있는 사용자만 문서 수정 가능';
COMMENT ON FUNCTION check_document_permission IS '사용자의 문서 권한 확인 함수';