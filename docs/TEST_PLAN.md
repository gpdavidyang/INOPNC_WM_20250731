# INOPNC Work Management System - 테스트 계획안

## 1. 개요

### 1.1 목적
INOPNC 작업 관리 시스템의 품질 보증 및 안정성을 위한 포괄적인 테스트 전략 수립

### 1.2 범위
- Frontend (Next.js 14, React, TypeScript)
- Backend (Supabase, PostgreSQL)
- Authentication & Authorization
- UI/UX Components
- API Endpoints
- Database Operations

### 1.3 테스트 환경
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + Supabase Test Client
- **E2E Tests**: Playwright
- **Coverage Goal**: 70% minimum (현재 설정)

## 2. 테스트 전략

### 2.1 테스트 피라미드
```
         /\
        /E2E\      (10%)
       /------\
      /Integr. \   (30%)
     /----------\
    /   Unit     \ (60%)
   /--------------\
```

### 2.2 테스트 유형별 분류

#### Unit Tests (단위 테스트)
- 개별 컴포넌트 및 함수의 독립적 검증
- Mocking을 통한 의존성 격리
- 빠른 실행 속도 및 즉각적인 피드백

#### Integration Tests (통합 테스트)
- 컴포넌트 간 상호작용 검증
- API와 데이터베이스 연동 테스트
- 실제 환경과 유사한 조건에서 테스트

#### E2E Tests (종단간 테스트)
- 실제 사용자 시나리오 기반 테스트
- 전체 애플리케이션 플로우 검증
- 크로스 브라우저 호환성 테스트

## 3. 테스트 케이스 카테고리

### 3.1 인증 및 권한 (Authentication & Authorization)

#### Unit Tests
```typescript
// __tests__/auth/auth-utils.test.ts
- validateEmail()
- validatePassword()
- hashPassword()
- comparePassword()
- generateToken()
- verifyToken()
```

#### Integration Tests
```typescript
// __tests__/auth/auth-flow.test.ts
- 회원가입 플로우
- 로그인/로그아웃 플로우
- 비밀번호 재설정 플로우
- 세션 관리
- 역할 기반 접근 제어 (RBAC)
```

#### E2E Tests
```typescript
// e2e/auth/authentication.spec.ts
- 전체 회원가입 시나리오
- 다양한 역할별 로그인 시나리오
- 비밀번호 재설정 이메일 플로우
- 세션 만료 처리
```

### 3.2 대시보드 (Dashboard)

#### Unit Tests
```typescript
// __tests__/components/dashboard/*.test.tsx
- DashboardStats 컴포넌트
- QuickActions 컴포넌트
- RecentActivities 컴포넌트
- NotificationBell 컴포넌트
```

#### Integration Tests
```typescript
// __tests__/dashboard/dashboard-integration.test.ts
- 대시보드 데이터 로딩
- 실시간 업데이트
- 사용자 역할별 대시보드 표시
```

### 3.3 작업일지 (Daily Reports)

#### Unit Tests
```typescript
// __tests__/components/daily-reports/*.test.tsx
- DailyReportForm 유효성 검증
- DailyReportList 필터링 및 정렬
- DailyReportDetail 렌더링
- FileUpload 컴포넌트
```

#### Integration Tests
```typescript
// __tests__/daily-reports/daily-reports-crud.test.ts
- 작업일지 CRUD 작업
- 파일 업로드/다운로드
- 승인 워크플로우
- 검색 및 필터링
```

### 3.4 출력현황 (Attendance)

#### Unit Tests
```typescript
// __tests__/components/attendance/*.test.tsx
- AttendanceCalendar 컴포넌트
- AttendanceCheck 컴포넌트
- SalaryInfo 계산 로직
```

#### Integration Tests
```typescript
// __tests__/attendance/attendance-management.test.ts
- 출퇴근 기록 생성/수정
- 급여 계산 정확성
- 월별/일별 집계
```

### 3.5 자재 관리 (Materials Management)

#### Unit Tests
```typescript
// __tests__/components/materials/*.test.tsx
- MaterialCatalog 컴포넌트
- MaterialInventory 컴포넌트
- MaterialRequests 폼 유효성
- NPC1000Dashboard 통계
```

#### Integration Tests
```typescript
// __tests__/materials/materials-workflow.test.ts
- 자재 요청 워크플로우
- 재고 업데이트 트랜잭션
- 공급업체 관리
- NPC-1000 특화 기능
```

### 3.6 도면 마킹 (Blueprint Markup)

#### Unit Tests
```typescript
// __tests__/components/markup/*.test.tsx
- MarkupCanvas 렌더링
- DrawingTools 기능
- MarkupObjectManager
- FileManager
```

#### Integration Tests
```typescript
// __tests__/markup/markup-system.test.ts
- 도면 업로드 및 저장
- 마킹 데이터 persistence
- 공유 및 권한 관리
```

### 3.7 관리자 기능 (Admin Features)

#### Unit Tests
```typescript
// __tests__/components/admin/*.test.tsx
- UserManagement 컴포넌트
- SiteManagement 컴포넌트
- SalaryManagement 계산
- SystemSettings 폼
```

#### Integration Tests
```typescript
// __tests__/admin/admin-operations.test.ts
- 사용자 CRUD 및 권한 변경
- 현장 관리 작업
- 시스템 설정 변경
- 감사 로그 기록
```

### 3.8 API 엔드포인트

#### Integration Tests
```typescript
// __tests__/api/*.test.ts
- /api/sites/* 엔드포인트
- /api/markup-documents/* 엔드포인트
- /api/backup/* 엔드포인트
- 인증 미들웨어
- 에러 핸들링
```

## 4. 테스트 데이터 관리

### 4.1 Test Fixtures
```typescript
// __tests__/fixtures/
├── users.ts          // 테스트 사용자 데이터
├── sites.ts          // 테스트 현장 데이터
├── daily-reports.ts  // 테스트 작업일지 데이터
├── materials.ts      // 테스트 자재 데이터
└── markup.ts         // 테스트 마킹 데이터
```

### 4.2 Mock Services
```typescript
// __tests__/mocks/
├── supabase.ts       // Supabase 클라이언트 모킹
├── auth.ts           // 인증 서비스 모킹
├── storage.ts        // 파일 스토리지 모킹
└── email.ts          // 이메일 서비스 모킹
```

## 5. 테스트 실행 계획

### 5.1 개발 단계
```bash
# 개발 중 지속적 테스트
npm run test:watch

# 타입 체크
npm run type-check

# 특정 컴포넌트 테스트
npm test -- --testPathPattern=dashboard
```

### 5.2 CI/CD 파이프라인
```yaml
# .github/workflows/test.yml
- Unit Tests → Integration Tests → E2E Tests
- 코드 커버리지 리포트
- 테스트 실패 시 배포 차단
```

### 5.3 릴리스 전 검증
```bash
# 전체 테스트 스위트 실행
npm test -- --coverage
npm run test:e2e

# Critical 기능 테스트
npm run test:critical
```

## 6. 성능 테스트

### 6.1 Frontend 성능
- Lighthouse CI 통합
- Core Web Vitals 모니터링
- Bundle 크기 분석

### 6.2 API 성능
- 응답 시간 측정
- 동시 사용자 부하 테스트
- 데이터베이스 쿼리 최적화

## 7. 보안 테스트

### 7.1 인증/인가
- SQL Injection 방지
- XSS 공격 방지
- CSRF 토큰 검증
- Rate Limiting

### 7.2 데이터 보호
- 민감 정보 암호화
- 파일 업로드 보안
- API 엔드포인트 접근 제어

## 8. 테스트 자동화 도구

### 8.1 Pre-commit Hooks
```json
// .husky/pre-commit
- ESLint 실행
- TypeScript 컴파일
- Unit Tests 실행
```

### 8.2 GitHub Actions
```yaml
- PR 생성 시 자동 테스트
- 메인 브랜치 머지 전 검증
- 일일 E2E 테스트 실행
```

## 9. 테스트 리포팅

### 9.1 Coverage Reports
- Jest Coverage Report
- SonarQube 통합
- 브랜치별 커버리지 추적

### 9.2 Test Results
- GitHub Actions 테스트 결과
- Playwright HTML Report
- 실패 테스트 알림

## 10. 지속적 개선

### 10.1 테스트 리뷰
- 월간 테스트 커버리지 리뷰
- 실패 빈도가 높은 테스트 개선
- 새로운 기능 추가 시 테스트 우선 개발

### 10.2 팀 교육
- 테스트 작성 가이드라인
- 베스트 프랙티스 공유
- 페어 프로그래밍을 통한 테스트 작성

## 11. 우선순위 테스트 목록

### Phase 1 (즉시 구현 필요)
1. **Critical Authentication Tests**
   - 로그인/로그아웃 플로우
   - 세션 관리
   - 권한 검증

2. **Core Business Logic**
   - 작업일지 CRUD
   - 출퇴근 기록
   - 급여 계산

### Phase 2 (1주 내)
1. **Integration Tests**
   - API 엔드포인트 검증
   - 데이터베이스 트랜잭션
   - 파일 업로드/다운로드

2. **UI Component Tests**
   - 주요 컴포넌트 렌더링
   - 사용자 인터랙션
   - 반응형 디자인

### Phase 3 (2주 내)
1. **E2E Scenarios**
   - 전체 사용자 워크플로우
   - 크로스 브라우저 테스트
   - 모바일 호환성

2. **Performance & Security**
   - 부하 테스트
   - 보안 취약점 스캔
   - 성능 최적화 검증

## 12. 테스트 메트릭스

### 12.1 목표 지표
- Code Coverage: ≥70%
- Test Success Rate: ≥95%
- E2E Test Execution Time: <10분
- Critical Path Coverage: 100%

### 12.2 모니터링 지표
- 테스트 실행 시간
- 실패 빈도
- 커버리지 트렌드
- 버그 발견율

---

이 테스트 계획안은 INOPNC Work Management System의 품질을 보장하고 안정적인 서비스 제공을 위한 가이드라인입니다. 프로젝트 진행에 따라 지속적으로 업데이트되어야 합니다.