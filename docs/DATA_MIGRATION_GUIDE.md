# 데이터 마이그레이션 가이드

## 개요
이 프로젝트는 이제 하드코딩된 테스트 데이터 대신 실제 데이터베이스 데이터를 사용합니다.

## 변경 사항

### 1. 제거된 하드코딩 데이터
다음 컴포넌트들에서 하드코딩된 데이터가 제거되었습니다:
- `components/dashboard/tabs/attendance-tab.tsx` - 출근현황 탭
- `components/dashboard/tabs/work-logs-tab.tsx` - 작업일지 탭  
- `components/notifications/notification-list.tsx` - 알림 목록

### 2. 실제 데이터베이스 사용
모든 컴포넌트는 이제 Supabase 데이터베이스에서 직접 데이터를 가져옵니다:
- 현장 목록: `sites` 테이블
- 출근 기록: `attendance_records` 테이블
- 급여 정보: `attendance_records`에서 계산
- 작업 일지: `daily_reports` 테이블
- 알림: `notifications` 테이블

## 테스트 데이터 설정

### 방법 1: Migration 실행 (권장)
```bash
# Supabase에 마이그레이션 적용
supabase db push --db-url "postgres://..."

# 또는 로컬 개발 환경에서
supabase db reset
```

마이그레이션 파일 `131_add_complete_test_data.sql`이 자동으로 다음 데이터를 생성합니다:
- 조직 3개 (이노피앤씨, 삼성건설, 현대건설)
- 현장 4개 (강남 A, 송파 B, 송파 C, 방배 D)
- 출근 기록 (최근 30일)
- 작업 일지 (최근 10일)
- 알림 샘플

### 방법 2: 시드 스크립트 실행
```bash
# 전체 테스트 데이터 생성
npm run seed

# 현장 데이터만 생성
npm run seed:sites
```

### 방법 3: 수동 데이터 입력
Supabase Dashboard를 통해 직접 데이터를 입력할 수 있습니다.

## 데이터 구조

### Sites (현장)
```sql
- name: 현장명 (예: '강남 A현장')
- code: 현장 코드 (예: 'GN-A-2024')
- address: 주소
- description: 설명 (예: '주상복합 건설')
- status: 상태 ('active', 'inactive', 'completed')
- organization_id: 소속 조직
- work_process: 작업 공정 (예: '슬라브 타설')
- manager_name: 현장 관리자명
```

### Attendance Records (출근 기록)
```sql
- profile_id: 작업자 ID
- site_id: 현장 ID
- work_date: 작업일
- check_in_time: 출근 시간
- check_out_time: 퇴근 시간
- labor_hours: 공수 (1.0 = 8시간)
- status: 상태 ('present', 'absent', 'half_day')
```

### Daily Reports (작업 일지)
```sql
- site_id: 현장 ID
- work_date: 작업일
- created_by: 작성자 ID
- weather: 날씨
- temperature: 온도
- worker_count: 작업 인원
- work_content: 작업 내용
- status: 상태 ('draft', 'submitted', 'approved')
```

## 주의 사항

1. **RLS 정책**: 모든 테이블에 Row Level Security가 적용되어 있어, 사용자는 권한이 있는 데이터만 볼 수 있습니다.

2. **인증 필요**: 데이터를 보려면 로그인이 필요합니다.

3. **테스트 계정**: 
   - worker@inopnc.com / password123
   - manager@inopnc.com / password123
   - admin@inopnc.com / password123

4. **데이터 정리**: 테스트 후 데이터를 정리하려면:
   ```sql
   -- 특정 현장 삭제
   DELETE FROM sites WHERE name LIKE '%테스트%';
   
   -- 모든 출근 기록 삭제
   TRUNCATE attendance_records CASCADE;
   ```

## 문제 해결

### 현장 목록이 비어있는 경우
1. RLS 정책 확인: `130_fix_sites_rls.sql` 마이그레이션이 적용되었는지 확인
2. 시드 데이터 실행: `npm run seed`
3. 로그인 상태 확인

### 출근 기록이 표시되지 않는 경우
1. 현재 사용자의 profile_id 확인
2. attendance_records 테이블에 해당 사용자의 기록이 있는지 확인
3. 날짜 범위가 올바른지 확인

### 급여 정보가 계산되지 않는 경우
1. attendance_records에 labor_hours 값이 있는지 확인
2. sites 테이블과 조인이 올바른지 확인

## 개발 팁

1. **로컬 테스트**: Supabase Local을 사용하면 프로덕션 데이터베이스를 건드리지 않고 테스트 가능
   ```bash
   supabase start
   supabase db reset
   npm run seed
   ```

2. **데이터 확인**: Supabase Dashboard의 Table Editor를 사용하여 데이터 직접 확인

3. **로그 확인**: 브라우저 콘솔과 서버 로그에서 데이터베이스 쿼리 오류 확인

## 다음 단계

1. 실제 급여 테이블 구현 (현재는 attendance_records에서 계산)
2. 사용자별 현장 할당 테이블 구현
3. 더 많은 시드 데이터 추가
4. 테스트 자동화 개선