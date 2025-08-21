-- 작업일지 추가 사진 업로드 기능을 위한 스키마 확장
-- 작업전/작업후 사진을 체계적으로 관리하기 위한 테이블 생성

-- 작업일지 추가 사진 테이블 생성
CREATE TABLE IF NOT EXISTS public.daily_report_additional_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  photo_type VARCHAR(10) NOT NULL CHECK (photo_type IN ('before', 'after')),
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage에서의 전체 경로
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- 10MB 제한
  description TEXT,
  upload_order INTEGER NOT NULL DEFAULT 1 CHECK (upload_order > 0),
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 리포트 내에서 타입별 업로드 순서는 유일해야 함
  UNIQUE(daily_report_id, photo_type, upload_order)
);

-- 성능 최적화를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_report_additional_photos_report_id 
  ON public.daily_report_additional_photos(daily_report_id);

CREATE INDEX IF NOT EXISTS idx_daily_report_additional_photos_type 
  ON public.daily_report_additional_photos(photo_type);

CREATE INDEX IF NOT EXISTS idx_daily_report_additional_photos_uploaded_by 
  ON public.daily_report_additional_photos(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_daily_report_additional_photos_created_at 
  ON public.daily_report_additional_photos(created_at DESC);

-- 복합 인덱스 - 리포트별 타입별 정렬을 위함
CREATE INDEX IF NOT EXISTS idx_daily_report_additional_photos_report_type_order 
  ON public.daily_report_additional_photos(daily_report_id, photo_type, upload_order);

-- updated_at 트리거 추가
CREATE OR REPLACE FUNCTION update_daily_report_additional_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_report_additional_photos_updated_at_trigger
    BEFORE UPDATE ON public.daily_report_additional_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_report_additional_photos_updated_at();

-- RLS (Row Level Security) 정책 생성
ALTER TABLE public.daily_report_additional_photos ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신이 업로드한 사진을 볼 수 있음
CREATE POLICY "Users can view their uploaded additional photos"
  ON public.daily_report_additional_photos FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- 관리자 및 현장관리자는 모든 추가 사진을 볼 수 있음
CREATE POLICY "Managers can view all additional photos"
  ON public.daily_report_additional_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'system_admin', 'site_manager')
    )
  );

-- 같은 현장의 사용자는 해당 현장의 추가 사진을 볼 수 있음
CREATE POLICY "Same site users can view additional photos"
  ON public.daily_report_additional_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_reports dr
      JOIN public.user_site_assignments usa ON usa.site_id = dr.site_id
      WHERE dr.id = daily_report_additional_photos.daily_report_id
        AND usa.user_id = auth.uid()
        AND usa.is_active = true
    )
  );

-- 인증된 사용자는 추가 사진을 업로드할 수 있음
CREATE POLICY "Authenticated users can upload additional photos"
  ON public.daily_report_additional_photos FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- 업로드한 사용자는 자신의 추가 사진을 수정할 수 있음
CREATE POLICY "Users can update their uploaded additional photos"
  ON public.daily_report_additional_photos FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- 업로드한 사용자와 관리자는 추가 사진을 삭제할 수 있음
CREATE POLICY "Users and managers can delete additional photos"
  ON public.daily_report_additional_photos FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'system_admin', 'site_manager')
    )
  );

-- 제약 조건: 작업전/작업후 각각 최대 30장 제한을 위한 함수
CREATE OR REPLACE FUNCTION check_additional_photos_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT 또는 UPDATE 시 해당 리포트의 같은 타입 사진 개수 체크
  IF (SELECT COUNT(*) 
      FROM public.daily_report_additional_photos 
      WHERE daily_report_id = NEW.daily_report_id 
        AND photo_type = NEW.photo_type
        AND (TG_OP = 'INSERT' OR id != NEW.id)) >= 30 THEN
    RAISE EXCEPTION '작업전/작업후 사진은 각각 최대 30장까지 업로드할 수 있습니다.';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 사진 개수 제한 트리거 생성
CREATE TRIGGER check_additional_photos_limit_trigger
  BEFORE INSERT OR UPDATE ON public.daily_report_additional_photos
  FOR EACH ROW
  EXECUTE FUNCTION check_additional_photos_limit();

-- 뷰 생성: 리포트별 추가 사진 개수 요약
CREATE OR REPLACE VIEW public.daily_report_additional_photos_summary AS
SELECT 
  dr.id as daily_report_id,
  dr.work_date,
  dr.member_name,
  COALESCE(before_count, 0) as before_photos_count,
  COALESCE(after_count, 0) as after_photos_count,
  COALESCE(before_count, 0) + COALESCE(after_count, 0) as total_additional_photos
FROM public.daily_reports dr
LEFT JOIN (
  SELECT 
    daily_report_id,
    COUNT(*) FILTER (WHERE photo_type = 'before') as before_count,
    COUNT(*) FILTER (WHERE photo_type = 'after') as after_count
  FROM public.daily_report_additional_photos
  GROUP BY daily_report_id
) photo_counts ON dr.id = photo_counts.daily_report_id;

-- 뷰 권한 설정
GRANT SELECT ON public.daily_report_additional_photos_summary TO authenticated;

-- 테이블에 설명 추가
COMMENT ON TABLE public.daily_report_additional_photos IS 
'작업일지 추가 사진 업로드 기능을 위한 테이블. 작업전/작업후 각각 최대 30장의 사진을 업로드할 수 있으며, 파일당 최대 10MB 제한이 있음.';

COMMENT ON COLUMN public.daily_report_additional_photos.photo_type IS 
'사진 타입: before(작업전), after(작업후)';

COMMENT ON COLUMN public.daily_report_additional_photos.file_size IS 
'파일 크기 (바이트 단위, 최대 10MB)';

COMMENT ON COLUMN public.daily_report_additional_photos.upload_order IS 
'같은 타입 내에서의 업로드 순서 (1부터 시작)';