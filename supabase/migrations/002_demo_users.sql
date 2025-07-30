-- 데모 사용자 생성 스크립트
-- 주의: 이 스크립트는 개발/테스트 환경에서만 사용하세요
-- 운영 환경에서는 Supabase Auth Dashboard를 통해 사용자를 생성하세요

-- 데모 사용자 정보
-- worker@example.com / password123 - 작업자
-- manager@example.com / password123 - 현장관리자  
-- admin@example.com / password123 - 관리자
-- customer@example.com / password123 - 파트너사

-- 먼저 프로필에 데모 데이터를 추가합니다
-- 실제 사용자는 Supabase Auth Dashboard에서 생성해야 합니다

-- 데모 현장 생성
INSERT INTO public.sites (name, address, description, construction_manager_phone, safety_manager_phone, accommodation_name, accommodation_address, status, start_date)
VALUES 
  ('디에이치 방배 현장', '서울특별시 서초구 방배동 123-45', '디에이치 방배 아파트 신축공사', '010-1234-5678', '010-8765-4321', '방배 기숙사', '서울특별시 서초구 방배동 234-56', 'active', '2024-01-01'),
  ('강남 오피스텔 현장', '서울특별시 강남구 역삼동 678-90', '강남 오피스텔 신축공사', '010-2345-6789', '010-9876-5432', '역삼 숙소', '서울특별시 강남구 역삼동 789-01', 'active', '2024-02-01');

-- 데모 조직 생성 (이미 있는 경우 무시)
INSERT INTO public.organizations (name, type, description) 
VALUES 
  ('건설 1팀', 'department', '방배 현장 전담팀'),
  ('건설 2팀', 'department', '강남 현장 전담팀')
ON CONFLICT DO NOTHING;

-- 데모 공지사항 생성
INSERT INTO public.announcements (title, content, priority, is_active, target_roles)
VALUES 
  ('안전 수칙 준수 안내', '모든 작업자는 안전모와 안전화를 반드시 착용하시기 바랍니다. 안전은 우리 모두의 책임입니다.', 'high', true, ARRAY['worker', 'site_manager']::text[]),
  ('작업일지 작성 안내', '매일 작업 종료 후 반드시 작업일지를 작성해 주시기 바랍니다. 정확한 기록이 중요합니다.', 'normal', true, ARRAY['worker']::text[]);

-- 샘플 작업일지 생성 함수 (데모용)
-- 주의: created_by는 실제 사용자 ID로 대체해야 합니다
CREATE OR REPLACE FUNCTION create_sample_daily_reports()
RETURNS void AS $$
DECLARE
  site_id UUID;
  i INTEGER;
BEGIN
  -- 첫 번째 현장 ID 가져오기
  SELECT id INTO site_id FROM public.sites WHERE name = '디에이치 방배 현장' LIMIT 1;
  
  -- 최근 7일간의 샘플 작업일지 생성
  FOR i IN 0..6 LOOP
    INSERT INTO public.daily_reports (
      site_id, 
      work_date, 
      member_name, 
      process_type, 
      total_workers,
      npc1000_incoming,
      npc1000_used,
      npc1000_remaining,
      issues,
      status
    ) VALUES (
      site_id,
      CURRENT_DATE - INTERVAL '1 day' * i,
      CASE (i % 4) 
        WHEN 0 THEN '슬라브'
        WHEN 1 THEN '거더'
        WHEN 2 THEN '기둥'
        ELSE '기타'
      END,
      CASE (i % 4)
        WHEN 0 THEN '균열'
        WHEN 1 THEN '면'
        WHEN 2 THEN '마감'
        ELSE '기타'
      END,
      5 + (i % 3),
      CASE WHEN i % 3 = 0 THEN 100 ELSE 0 END,
      20 + (i * 5),
      200 - (i * 10),
      CASE WHEN i = 2 THEN '우천으로 인한 작업 지연' ELSE NULL END,
      CASE WHEN i < 2 THEN 'approved' ELSE 'submitted' END
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 함수 실행 (실제 사용자 생성 후에만 실행 가능)
-- SELECT create_sample_daily_reports();

-- 함수 삭제 (사용 후)
-- DROP FUNCTION IF EXISTS create_sample_daily_reports();