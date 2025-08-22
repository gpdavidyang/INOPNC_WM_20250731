# 시스템 관리자 구현 계획서

## 개요
이 문서는 SYSTEM_ADMIN_REDESIGN_ANALYSIS.md를 기반으로 실제 구현을 위한 상세 계획을 담고 있습니다.

---

## 1. 현재 상태 분석 결과

### 1.1 식별된 주요 문제점
1. **데이터베이스 관계 문제**
   - `profiles` ↔ `site_assignments` 간 foreign key 관계 미설정
   - PostgREST 스키마 캐시 갱신 필요
   
2. **권한 체계 혼재**
   - `system_admin`과 `admin` 역할 중복
   - RLS 정책 일관성 부족

3. **UI/UX 이슈**
   - 관리자 화면 버튼 레이아웃 문제 (세로 정렬)
   - 데이터 로딩 오류 시 빈 화면 표시

### 1.2 최근 추가된 기능
- **Photo Grid Reports**: 사진 기반 PDF 보고서
- **Partner Dashboard**: 파트너사 전용 읽기 전용 대시보드
- **Signup Requests**: 가입 요청 승인 시스템
- **Enhanced Daily Reports**: 추가 사진, 승인 워크플로우

---

## 2. 우선순위별 구현 계획

### Phase 0: 긴급 수정 (즉시)
#### 작업 항목
- [x] site_assignments 테이블 role 컬럼 추가
- [x] 관리자 화면 버튼 레이아웃 수정
- [ ] profiles ↔ site_assignments 관계 설정
- [ ] PostgREST 스키마 캐시 갱신

#### SQL 마이그레이션 필요
```sql
-- 802_fix_foreign_key_relationships.sql
ALTER TABLE site_assignments
DROP CONSTRAINT IF EXISTS site_assignments_user_id_fkey;

ALTER TABLE site_assignments
ADD CONSTRAINT site_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
```

### Phase 1: 핵심 기능 정리 (1주차)

#### 2.1.1 역할 통합
**목표**: `system_admin`과 `admin` 역할 통합

**작업 내용**:
```typescript
// 기존
type UserRole = 'worker' | 'site_manager' | 'customer_manager' | 'admin' | 'system_admin';

// 변경 후
type UserRole = 'worker' | 'site_manager' | 'customer_manager' | 'admin';
// admin이 최고 권한을 가짐
```

#### 2.1.2 시스템 대시보드 구현
**경로**: `/dashboard/admin/system`

**주요 컴포넌트**:
- `SystemOverview.tsx`: 시스템 상태 요약
- `ActiveUsers.tsx`: 실시간 사용자 현황
- `SystemAlerts.tsx`: 시스템 알림
- `QuickActions.tsx`: 빠른 작업

#### 2.1.3 가입 요청 관리
**경로**: `/dashboard/admin/approvals`

**기능**:
- 대기 중인 가입 요청 목록
- 상세 정보 조회
- 승인/거절 처리
- 이메일 알림 발송

### Phase 2: 데이터 관리 강화 (2주차)

#### 2.2.1 감사 로그 시스템
**테이블 생성**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  action VARCHAR(20) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES profiles(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user ON audit_logs(changed_by);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

#### 2.2.2 시스템 설정 관리
**테이블 생성**:
```sql
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  category VARCHAR(50),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 설정 삽입
INSERT INTO system_settings (key, value, category, description) VALUES
('maintenance_mode', 'false', 'system', '유지보수 모드'),
('max_file_size', '10485760', 'upload', '최대 파일 크기 (bytes)'),
('session_timeout', '3600', 'security', '세션 타임아웃 (초)'),
('enable_signup', 'true', 'auth', '회원가입 허용 여부');
```

### Phase 3: 모니터링 및 분석 (3주차)

#### 2.3.1 실시간 모니터링
**구현 내용**:
- WebSocket 기반 실시간 업데이트
- 성능 메트릭 수집 (API 응답시간, DB 쿼리 시간)
- 사용자 활동 트래킹

#### 2.3.2 보고서 생성
**보고서 종류**:
- 일일 활동 보고서
- 주간 성과 보고서
- 월간 통계 보고서
- 사용자 정의 보고서

---

## 3. API 설계

### 3.1 시스템 관리 API

```typescript
// /app/api/admin/system/status/route.ts
export async function GET() {
  // 시스템 상태 반환
  return {
    status: 'healthy',
    database: 'connected',
    storage: 'available',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
}

// /app/api/admin/system/settings/route.ts
export async function GET() {
  // 시스템 설정 조회
}

export async function PUT(request: Request) {
  // 시스템 설정 업데이트
}

// /app/api/admin/audit/logs/route.ts
export async function GET(request: Request) {
  // 감사 로그 조회 (페이지네이션, 필터링)
}

// /app/api/admin/approvals/route.ts
export async function GET() {
  // 가입 요청 목록
}

export async function POST(request: Request) {
  // 가입 요청 승인/거절
}
```

### 3.2 데이터 구조

```typescript
// types/admin.ts
export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    database: boolean;
    storage: boolean;
    email: boolean;
  };
  metrics: {
    activeUsers: number;
    requestsPerMinute: number;
    averageResponseTime: number;
  };
}

export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData?: any;
  newData?: any;
  changedBy: string;
  changedAt: Date;
}

export interface SignupRequest {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  companyName?: string;
  requestedRole: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}
```

---

## 4. UI/UX 설계

### 4.1 레이아웃 구조

```
시스템 관리자 대시보드
├── 헤더
│   ├── 로고
│   ├── 시스템 상태 인디케이터
│   └── 프로필 메뉴
├── 사이드바
│   ├── 대시보드
│   ├── 사용자 관리
│   ├── 현장 관리
│   ├── 시스템 관리 (NEW)
│   │   ├── 모니터링
│   │   ├── 설정
│   │   ├── 로그
│   │   └── 보안
│   ├── 승인 관리 (NEW)
│   └── 보고서
└── 메인 콘텐츠
    └── [동적 콘텐츠]
```

### 4.2 주요 화면 와이어프레임

#### 시스템 대시보드
```
┌─────────────────────────────────────────┐
│ 시스템 상태                             │
├─────────────┬───────────┬───────────────┤
│ 활성 사용자  │ CPU 사용률 │ 메모리 사용   │
│    152명    │   23%     │   4.2GB/8GB   │
├─────────────┴───────────┴───────────────┤
│ 최근 활동                               │
├─────────────────────────────────────────┤
│ • 10:23 - 사용자 로그인 (worker@...)    │
│ • 10:22 - 작업일지 생성                 │
│ • 10:20 - 파일 업로드                   │
└─────────────────────────────────────────┘
```

#### 가입 요청 관리
```
┌─────────────────────────────────────────┐
│ 가입 요청 (3건 대기중)                   │
├─────────────────────────────────────────┤
│ □ 홍길동 | hong@example.com | 작업자    │
│   2025-08-22 신청                       │
│   [상세보기] [승인] [거절]              │
├─────────────────────────────────────────┤
│ □ 김철수 | kim@partner.com | 파트너사   │
│   2025-08-21 신청                       │
│   [상세보기] [승인] [거절]              │
└─────────────────────────────────────────┘
```

---

## 5. 테스트 계획

### 5.1 단위 테스트
- API 엔드포인트 테스트
- 컴포넌트 테스트
- 유틸리티 함수 테스트

### 5.2 통합 테스트
- 사용자 플로우 테스트
- 권한 체계 테스트
- 데이터 일관성 테스트

### 5.3 성능 테스트
- 로드 테스트
- 스트레스 테스트
- 응답 시간 측정

---

## 6. 배포 계획

### 6.1 단계별 배포
1. **개발 환경**: 즉시 적용
2. **스테이징 환경**: 1주 후
3. **프로덕션 환경**: 2주 후

### 6.2 롤백 계획
- 데이터베이스 백업
- 이전 버전 태그 유지
- 빠른 롤백 스크립트 준비

---

## 7. 문서화

### 7.1 개발자 문서
- API 문서 (Swagger/OpenAPI)
- 데이터베이스 스키마 문서
- 컴포넌트 문서 (Storybook)

### 7.2 사용자 문서
- 관리자 가이드
- 트러블슈팅 가이드
- FAQ

---

## 8. 리스크 관리

### 8.1 식별된 리스크
1. **데이터 마이그레이션 실패**
   - 완화: 백업 및 롤백 계획
   
2. **성능 저하**
   - 완화: 단계적 배포, 모니터링

3. **보안 취약점**
   - 완화: 보안 감사, 펜테스팅

### 8.2 대응 계획
- 핫픽스 프로세스 정립
- 비상 연락망 구축
- 장애 대응 매뉴얼

---

작성일: 2025-08-22
작성자: System Administrator
상태: 검토 대기중