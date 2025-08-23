-- 필수제출서류함 시스템 구축
-- Required Documents Management System

-- 1. 필수 제출 서류 요구사항 템플릿 테이블
CREATE TABLE IF NOT EXISTS document_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT TRUE,
  applicable_roles TEXT[] DEFAULT ARRAY['worker'], -- worker, site_manager, partner, etc.
  file_format_allowed TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'], -- allowed file formats
  max_file_size_mb INTEGER DEFAULT 10,
  expiry_days INTEGER, -- 서류 유효기간 (일 단위)
  instructions TEXT, -- 제출 안내사항
  sample_file_url TEXT, -- 샘플 파일 URL
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. 사용자별 필수 서류 제출 현황 테이블
CREATE TABLE IF NOT EXISTS user_document_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requirement_id UUID REFERENCES document_requirements(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  submission_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (
    submission_status IN ('not_submitted', 'submitted', 'approved', 'rejected', 'expired')
  ),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  expiry_date DATE,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, requirement_id) -- 사용자당 요구사항별 하나의 제출만 허용
);

-- 3. 필수 서류 제출 알림 테이블
CREATE TABLE IF NOT EXISTS document_submission_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requirement_id UUID REFERENCES document_requirements(id) ON DELETE CASCADE NOT NULL,
  reminder_type VARCHAR(50) CHECK (reminder_type IN ('due_soon', 'overdue', 'rejected')),
  reminder_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. documents 테이블에 필수서류 관련 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'requirement_id') THEN
    ALTER TABLE documents 
    ADD COLUMN requirement_id UUID REFERENCES document_requirements(id) ON DELETE SET NULL,
    ADD COLUMN submission_id UUID REFERENCES user_document_submissions(id) ON DELETE SET NULL,
    ADD COLUMN submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN review_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN review_notes TEXT,
    ADD COLUMN expiry_date DATE;
  END IF;
END $$;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_document_requirements_type ON document_requirements(document_type);
CREATE INDEX IF NOT EXISTS idx_document_requirements_roles ON document_requirements USING GIN(applicable_roles);
CREATE INDEX IF NOT EXISTS idx_document_requirements_active ON document_requirements(is_active);

CREATE INDEX IF NOT EXISTS idx_user_document_submissions_user ON user_document_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_document_submissions_requirement ON user_document_submissions(requirement_id);
CREATE INDEX IF NOT EXISTS idx_user_document_submissions_status ON user_document_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_user_document_submissions_expiry ON user_document_submissions(expiry_date);

CREATE INDEX IF NOT EXISTS idx_document_submission_reminders_user ON document_submission_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_document_submission_reminders_date ON document_submission_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_document_submission_reminders_sent ON document_submission_reminders(is_sent);

CREATE INDEX IF NOT EXISTS idx_documents_requirement ON documents(requirement_id);
CREATE INDEX IF NOT EXISTS idx_documents_submission ON documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_documents_submitted_by ON documents(submitted_by);

-- 6. RLS 정책 설정
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_document_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_submission_reminders ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 요구사항 관리 가능
CREATE POLICY "Admins can manage document requirements" ON document_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- 사용자는 자신에게 적용되는 요구사항 조회 가능
CREATE POLICY "Users can view applicable requirements" ON document_requirements
  FOR SELECT USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = ANY(applicable_roles)
    )
  );

-- 사용자는 자신의 제출 현황만 조회/수정 가능
CREATE POLICY "Users can manage their submissions" ON user_document_submissions
  FOR ALL USING (user_id = auth.uid());

-- 관리자는 모든 제출 현황 조회 가능
CREATE POLICY "Admins can view all submissions" ON user_document_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- 관리자는 제출 상태 업데이트 가능
CREATE POLICY "Admins can update submission status" ON user_document_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- 사용자는 자신의 알림만 조회 가능
CREATE POLICY "Users can view their reminders" ON document_submission_reminders
  FOR SELECT USING (user_id = auth.uid());

-- 관리자는 모든 알림 관리 가능
CREATE POLICY "Admins can manage all reminders" ON document_submission_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- 7. 기본 필수 서류 요구사항 데이터 삽입
INSERT INTO document_requirements (requirement_name, document_type, description, applicable_roles, expiry_days, instructions) VALUES
('안전교육이수증', 'safety_certificate', '건설현장 안전교육 이수증명서', ARRAY['worker'], 365, '최근 1년 내 이수한 안전교육증만 유효합니다.'),
('건강진단서', 'health_certificate', '건설업 종사자 건강진단서', ARRAY['worker'], 365, '최근 1년 내 발급받은 건강진단서를 제출하세요.'),
('보험증서', 'insurance_certificate', '산재보험 및 고용보험 가입증명서', ARRAY['worker'], 180, '현재 유효한 보험가입증명서를 제출하세요.'),
('신분증 사본', 'id_copy', '주민등록증 또는 운전면허증 사본', ARRAY['worker'], NULL, '신분증 앞뒤면을 모두 스캔하여 제출하세요.'),
('자격증', 'license', '해당 업무 관련 자격증', ARRAY['worker'], NULL, '담당 업무에 필요한 자격증을 제출하세요.'),
('근로계약서', 'employment_contract', '정식 근로계약서', ARRAY['worker'], NULL, '회사와 체결한 정식 근로계약서를 제출하세요.'),
('통장사본', 'bank_account', '급여 입금용 통장 사본', ARRAY['worker'], NULL, '급여 입금을 위한 본인 명의 통장 사본을 제출하세요.'),
('사업자등록증', 'business_license', '사업자등록증 사본', ARRAY['partner'], 365, '유효한 사업자등록증을 제출하세요.'),
('법인등기부등본', 'corporate_register', '법인등기부등본', ARRAY['partner'], 90, '최근 3개월 이내 발급받은 등기부등본을 제출하세요.');

-- 8. 트리거 함수: 사용자 생성 시 필수 서류 제출 현황 자동 생성
CREATE OR REPLACE FUNCTION create_user_document_submissions()
RETURNS TRIGGER AS $$
BEGIN
  -- 새 사용자의 역할에 해당하는 필수 서류 요구사항들을 찾아 제출 현황 생성
  INSERT INTO user_document_submissions (user_id, requirement_id, submission_status)
  SELECT 
    NEW.id,
    dr.id,
    'not_submitted'
  FROM document_requirements dr
  WHERE dr.is_active = TRUE
    AND NEW.role = ANY(dr.applicable_roles);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_create_user_document_submissions
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_document_submissions();

-- 9. 트리거 함수: 서류 제출 상태 업데이트
CREATE OR REPLACE FUNCTION update_submission_status()
RETURNS TRIGGER AS $$
BEGIN
  -- documents 테이블에 필수서류가 등록될 때 제출 현황 업데이트
  IF NEW.requirement_id IS NOT NULL AND NEW.submitted_by IS NOT NULL THEN
    UPDATE user_document_submissions 
    SET 
      document_id = NEW.id,
      submission_status = 'submitted',
      submitted_at = NEW.created_at
    WHERE user_id = NEW.submitted_by 
      AND requirement_id = NEW.requirement_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_submission_status
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_status();

-- 10. 유용한 뷰 생성
-- 사용자별 필수 서류 제출 현황 종합 뷰
CREATE VIEW user_document_compliance AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.role,
  COUNT(uds.id) as total_requirements,
  COUNT(CASE WHEN uds.submission_status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN uds.submission_status = 'submitted' THEN 1 END) as submitted_count,
  COUNT(CASE WHEN uds.submission_status = 'not_submitted' THEN 1 END) as not_submitted_count,
  COUNT(CASE WHEN uds.submission_status = 'rejected' THEN 1 END) as rejected_count,
  COUNT(CASE WHEN uds.submission_status = 'expired' THEN 1 END) as expired_count,
  ROUND(
    (COUNT(CASE WHEN uds.submission_status = 'approved' THEN 1 END) * 100.0 / NULLIF(COUNT(uds.id), 0)), 
    2
  ) as compliance_rate
FROM profiles p
LEFT JOIN user_document_submissions uds ON p.id = uds.user_id
WHERE p.role IN ('worker', 'site_manager', 'partner')
GROUP BY p.id, p.full_name, p.email, p.role;

-- 11. 유용한 함수들
-- 만료 예정 서류 알림 생성 함수
CREATE OR REPLACE FUNCTION generate_document_reminders()
RETURNS INTEGER AS $$
DECLARE
  reminder_count INTEGER := 0;
BEGIN
  -- 만료 7일 전 알림
  INSERT INTO document_submission_reminders (user_id, requirement_id, reminder_type, reminder_date)
  SELECT DISTINCT
    uds.user_id,
    uds.requirement_id,
    'due_soon',
    CURRENT_DATE
  FROM user_document_submissions uds
  JOIN document_requirements dr ON uds.requirement_id = dr.id
  WHERE uds.submission_status = 'approved'
    AND uds.expiry_date = CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM document_submission_reminders dsr
      WHERE dsr.user_id = uds.user_id 
        AND dsr.requirement_id = uds.requirement_id
        AND dsr.reminder_type = 'due_soon'
        AND dsr.reminder_date = CURRENT_DATE
    );
  
  GET DIAGNOSTICS reminder_count = ROW_COUNT;
  
  -- 만료된 서류 알림
  INSERT INTO document_submission_reminders (user_id, requirement_id, reminder_type, reminder_date)
  SELECT DISTINCT
    uds.user_id,
    uds.requirement_id,
    'overdue',
    CURRENT_DATE
  FROM user_document_submissions uds
  JOIN document_requirements dr ON uds.requirement_id = dr.id
  WHERE uds.submission_status = 'approved'
    AND uds.expiry_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM document_submission_reminders dsr
      WHERE dsr.user_id = uds.user_id 
        AND dsr.requirement_id = uds.requirement_id
        AND dsr.reminder_type = 'overdue'
        AND dsr.reminder_date = CURRENT_DATE
    );
  
  -- 만료된 서류 상태 업데이트
  UPDATE user_document_submissions
  SET submission_status = 'expired'
  WHERE submission_status = 'approved'
    AND expiry_date < CURRENT_DATE;
  
  RETURN reminder_count;
END;
$$ LANGUAGE plpgsql;

-- 12. 댓글
COMMENT ON TABLE document_requirements IS '필수 제출 서류 요구사항 템플릿';
COMMENT ON TABLE user_document_submissions IS '사용자별 필수 서류 제출 현황';
COMMENT ON TABLE document_submission_reminders IS '서류 제출 알림 관리';
COMMENT ON VIEW user_document_compliance IS '사용자별 필수 서류 준수율 현황';
COMMENT ON FUNCTION generate_document_reminders IS '만료 예정 및 만료된 서류 알림 생성';

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '필수제출서류함 시스템이 성공적으로 생성되었습니다.';
  RAISE NOTICE '- document_requirements: 서류 요구사항 템플릿 (9개 기본 항목 추가)';
  RAISE NOTICE '- user_document_submissions: 사용자별 제출 현황 추적';
  RAISE NOTICE '- document_submission_reminders: 알림 시스템';
  RAISE NOTICE '- 자동화된 트리거 및 뷰 생성 완료';
END $$;