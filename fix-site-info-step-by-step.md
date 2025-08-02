# 현장정보 문제 해결 가이드

## 1단계: 데이터베이스 마이그레이션 실행

Supabase 대시보드 → SQL Editor에서 다음 파일을 순서대로 실행:

1. `supabase/migrations/108_extend_sites_table.sql` 전체 내용 복사하여 실행

## 2단계: 현재 사용자 ID 확인

```sql
-- 현재 로그인한 사용자 ID 확인
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

## 3단계: 테스트 현장 생성 및 배정

```sql
-- 1. 테스트 현장이 있는지 확인
SELECT * FROM public.sites WHERE name = '강남 A현장';

-- 2. 없다면 테스트 현장 생성
INSERT INTO public.sites (
  name, address, description, status, start_date, end_date,
  construction_manager_phone, safety_manager_phone,
  accommodation_name, accommodation_address,
  work_process, work_section, component_name,
  manager_name, safety_manager_name
) VALUES (
  '강남 A현장', 
  '서울시 강남구 테헤란로 123', 
  '강남 지역 주상복합 건설 현장', 
  'active', 
  '2024-01-15', 
  '2024-12-30',
  '010-1234-5678',
  '010-8765-4321',
  '강남 A현장 숙소',
  '서울시 강남구 역삼동 456',
  '슬라브 타설',
  '지하 1층',
  '기둥 C1-C5 구간',
  '김건축',
  '이안전'
) ON CONFLICT (name) DO NOTHING;

-- 3. 현재 사용자에게 현장 배정 (your-user-id를 실제 ID로 교체)
INSERT INTO public.site_assignments (
  site_id, 
  user_id, 
  assigned_date, 
  is_active,
  role
) VALUES (
  (SELECT id FROM public.sites WHERE name = '강남 A현장' LIMIT 1),
  'your-user-id-here', -- 여기에 실제 사용자 ID 입력
  '2024-08-01',
  true,
  'worker'
) ON CONFLICT (site_id, user_id, assigned_date) DO UPDATE SET is_active = true;
```

## 4단계: 데이터 확인

```sql
-- 현재 사용자의 현장 배정 확인
SELECT 
  s.name as site_name,
  s.address,
  s.work_process,
  s.work_section,
  s.component_name,
  s.manager_name,
  s.safety_manager_name,
  sa.role,
  sa.assigned_date,
  sa.is_active
FROM public.sites s
JOIN public.site_assignments sa ON s.id = sa.site_id
WHERE sa.user_id = auth.uid() AND sa.is_active = true;
```

## 5단계: 함수 테스트

```sql
-- DB 함수가 정상 작동하는지 테스트
SELECT * FROM public.get_current_user_site(auth.uid());
SELECT * FROM public.get_user_site_history(auth.uid());
```

## 6단계: 웹 애플리케이션에서 테스트

1. `/dashboard/test-site` 페이지 방문하여 데이터 확인
2. `/dashboard/site-info` 페이지에서 현장 정보 확인
3. 홈 페이지에서 "오늘의 현장 정보" 섹션 확인

## 문제별 대응

### 에러: "relation does not exist"
→ 1단계 마이그레이션을 다시 실행

### 에러: "function does not exist" 
→ 108_extend_sites_table.sql의 함수 부분만 다시 실행

### "배정된 현장이 없습니다"
→ 3단계에서 사용자 ID를 정확히 입력했는지 확인

### RLS 정책 오류
→ Supabase 대시보드에서 sites, site_assignments 테이블의 RLS 정책 확인

## 추가 디버깅

문제가 지속되면 다음 정보를 확인:

1. **브라우저 개발자 도구 → Network 탭**에서 API 요청 상태 확인
2. **Console 탭**에서 상세 에러 메시지 확인
3. **Supabase 대시보드 → Logs**에서 데이터베이스 에러 로그 확인