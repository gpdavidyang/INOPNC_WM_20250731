# 시스템 관리자 화면 재설계 분석 문서

## 목차
1. [최근 변경사항 분석](#1-최근-변경사항-분석)
2. [데이터베이스 스키마 변경사항](#2-데이터베이스-스키마-변경사항)
3. [현재 역할별 화면/기능 현황](#3-현재-역할별-화면기능-현황)
4. [시스템 관리자 요구사항 재정의](#4-시스템-관리자-요구사항-재정의)
5. [제안하는 시스템 아키텍처](#5-제안하는-시스템-아키텍처)
6. [구현 로드맵](#6-구현-로드맵)

---

## 1. 최근 변경사항 분석

### 1.1 파트너사(customer_manager) 화면 추가
- **경로**: `/app/partner/`
- **주요 기능**:
  - 파트너사 전용 대시보드
  - 작업일지 조회 (읽기 전용)
  - 현장별 문서 조회
  - 진행상황 모니터링

### 1.2 현장관리자(site_manager) 기능 강화
- **승인 권한**: 작업일지 승인/반려
- **팀 관리**: 현장 작업자 관리
- **보고서 생성**: 주간/월간 보고서
- **자재 요청**: 자재 요청 및 승인

### 1.3 새로운 기능 추가
- **사진 그리드 리포트** (photo_grid_reports)
- **작업일지 추가 사진** (additional_photos)
- **문서 메타데이터 관리** (documents_metadata)
- **가입 요청 시스템** (signup_requests)

---

## 2. 데이터베이스 스키마 변경사항

### 2.1 신규 테이블
```sql
-- photo_grid_reports: 사진 기반 보고서
CREATE TABLE photo_grid_reports (
  id UUID PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  created_by UUID REFERENCES profiles(id),
  report_date DATE,
  weather VARCHAR(50),
  photos JSONB[], -- 그리드 형태의 사진 배열
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
);

-- signup_requests: 가입 요청 관리
CREATE TABLE signup_requests (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  role VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
);

-- documents_metadata: 문서 메타데이터
CREATE TABLE documents_metadata (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  version INTEGER,
  tags TEXT[],
  shared_with UUID[],
  expiry_date DATE,
  is_template BOOLEAN DEFAULT false
);
```

### 2.2 기존 테이블 변경사항
```sql
-- site_assignments: role 컬럼 추가
ALTER TABLE site_assignments 
ADD COLUMN role VARCHAR(50) DEFAULT 'worker';

-- daily_reports: 추가 필드
ALTER TABLE daily_reports
ADD COLUMN additional_photos TEXT[],
ADD COLUMN approved_by UUID REFERENCES profiles(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- sites: 파트너사 관련 필드
ALTER TABLE sites
ADD COLUMN partner_companies UUID[],
ADD COLUMN partner_access_level VARCHAR(20);
```

### 2.3 관계 구조 변경
- profiles ↔ site_assignments: 다대다 관계 (role 포함)
- sites ↔ partner_companies: 다대다 관계
- daily_reports ↔ approvals: 승인 워크플로우 추가

---

## 3. 현재 역할별 화면/기능 현황

### 3.1 역할 계층 구조
```
system_admin (최상위)
    ├── admin (본사 관리자)
    ├── site_manager (현장 관리자)
    ├── customer_manager (파트너사)
    └── worker (작업자)
```

### 3.2 역할별 접근 권한 매트릭스

| 기능 | worker | site_manager | customer_manager | admin | system_admin |
|------|--------|--------------|------------------|-------|--------------|
| 작업일지 작성 | ✅ | ✅ | ❌ | ✅ | ✅ |
| 작업일지 승인 | ❌ | ✅ | ❌ | ✅ | ✅ |
| 작업일지 조회 | 본인 | 현장 전체 | 읽기 전용 | 전체 | 전체 |
| 사용자 관리 | ❌ | 현장 작업자 | ❌ | ✅ | ✅ |
| 현장 관리 | ❌ | 배정 현장 | ❌ | ✅ | ✅ |
| 문서 관리 | 개인 | 현장 문서 | 조회만 | 전체 | 전체 |
| 시스템 설정 | ❌ | ❌ | ❌ | 일부 | ✅ |
| 데이터베이스 관리 | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3.3 현재 구현된 화면

#### Worker (작업자)
- `/dashboard` - 메인 대시보드
- `/dashboard/attendance` - 출근 관리
- `/dashboard/daily-reports` - 작업일지
- `/dashboard/documents` - 개인 문서함

#### Site Manager (현장관리자)
- Worker 화면 전체 +
- `/dashboard/team` - 팀 관리
- `/dashboard/approvals` - 승인 대기 목록
- `/dashboard/reports` - 보고서 생성

#### Customer Manager (파트너사)
- `/partner/dashboard` - 파트너 대시보드
- `/partner/work-logs` - 작업일지 조회
- `/partner/documents` - 문서 조회
- `/partner/progress` - 진행상황

#### Admin (본사 관리자)
- `/dashboard/admin/users` - 사용자 관리
- `/dashboard/admin/sites` - 현장 관리
- `/dashboard/admin/salary` - 급여 관리
- `/dashboard/admin/materials` - 자재 관리

---

## 4. 시스템 관리자 요구사항 재정의

### 4.1 핵심 기능 요구사항

#### A. 통합 모니터링
- **실시간 대시보드**: 전체 시스템 상태 모니터링
- **성능 메트릭**: API 응답시간, DB 쿼리 성능
- **사용자 활동**: 실시간 사용자 세션, 활동 로그
- **알림 센터**: 시스템 이슈, 보안 경고

#### B. 사용자 및 권한 관리
- **계정 생명주기**: 생성, 수정, 비활성화, 삭제
- **역할 기반 접근 제어(RBAC)**: 세밀한 권한 설정
- **가입 요청 처리**: signup_requests 승인/거절
- **다중 현장 배정**: 사용자별 복수 현장 관리

#### C. 데이터 관리
- **백업/복원**: 자동 백업 및 복원 기능
- **데이터 마이그레이션**: 스키마 변경 관리
- **감사 로그**: 모든 데이터 변경 추적
- **데이터 정리**: 오래된 데이터 아카이빙

#### D. 시스템 설정
- **환경 변수 관리**: 안전한 설정 관리
- **기능 플래그**: 기능별 활성화/비활성화
- **API 제한**: Rate limiting 설정
- **유지보수 모드**: 시스템 점검 모드

### 4.2 보안 요구사항
- **2단계 인증**: 시스템 관리자 필수
- **IP 화이트리스트**: 관리자 접근 IP 제한
- **세션 관리**: 강제 로그아웃, 세션 모니터링
- **보안 감사**: 취약점 스캔, 보안 로그

---

## 5. 제안하는 시스템 아키텍처

### 5.1 컴포넌트 구조
```
/app/dashboard/admin/
├── system/                    # 시스템 관리 (system_admin 전용)
│   ├── dashboard/             # 통합 대시보드
│   ├── monitoring/            # 실시간 모니터링
│   ├── database/              # DB 관리
│   ├── logs/                  # 로그 뷰어
│   ├── settings/              # 시스템 설정
│   └── security/              # 보안 관리
├── users/                     # 사용자 관리 (개선)
├── sites/                     # 현장 관리 (개선)
├── approvals/                 # 가입 요청 처리 (신규)
├── reports/                   # 통합 보고서 (신규)
└── analytics/                 # 분석 대시보드 (신규)
```

### 5.2 데이터베이스 스키마 개선안

#### 새로운 테이블 제안
```sql
-- system_logs: 시스템 로그
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(20), -- ERROR, WARN, INFO, DEBUG
  category VARCHAR(50), -- AUTH, API, DB, SYSTEM
  message TEXT,
  metadata JSONB,
  user_id UUID REFERENCES profiles(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- system_settings: 시스템 설정
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB,
  category VARCHAR(50),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- audit_logs: 감사 로그
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100),
  record_id UUID,
  action VARCHAR(20), -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_sessions: 사용자 세션 관리
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  token_hash VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.3 API 설계

#### RESTful API 엔드포인트
```
# 시스템 관리 API
GET    /api/admin/system/status         # 시스템 상태
GET    /api/admin/system/metrics        # 성능 메트릭
GET    /api/admin/system/logs           # 시스템 로그
POST   /api/admin/system/settings       # 설정 업데이트
POST   /api/admin/system/maintenance    # 유지보수 모드

# 사용자 관리 API (개선)
GET    /api/admin/users                 # 사용자 목록
POST   /api/admin/users                 # 사용자 생성
PUT    /api/admin/users/:id             # 사용자 수정
DELETE /api/admin/users/:id             # 사용자 삭제
POST   /api/admin/users/:id/sites       # 현장 배정
POST   /api/admin/users/:id/reset       # 비밀번호 재설정
POST   /api/admin/users/bulk            # 일괄 처리

# 가입 요청 API (신규)
GET    /api/admin/signup-requests       # 요청 목록
POST   /api/admin/signup-requests/:id/approve  # 승인
POST   /api/admin/signup-requests/:id/reject   # 거절

# 감사 API (신규)
GET    /api/admin/audit/logs            # 감사 로그
GET    /api/admin/audit/sessions        # 세션 목록
POST   /api/admin/audit/sessions/:id/terminate # 세션 종료
```

---

## 6. 구현 로드맵

### Phase 1: 기초 작업 (1주)
- [ ] 데이터베이스 스키마 마이그레이션
- [ ] 기본 테이블 생성 (system_logs, audit_logs 등)
- [ ] RLS 정책 업데이트
- [ ] API 기본 구조 설정

### Phase 2: 핵심 기능 (2주)
- [ ] 시스템 대시보드 구현
- [ ] 사용자 관리 개선
- [ ] 가입 요청 처리 시스템
- [ ] 감사 로그 시스템

### Phase 3: 고급 기능 (2주)
- [ ] 실시간 모니터링
- [ ] 백업/복원 기능
- [ ] 보안 관리 도구
- [ ] 시스템 설정 관리

### Phase 4: 최적화 및 테스트 (1주)
- [ ] 성능 최적화
- [ ] 보안 테스트
- [ ] 사용자 피드백 반영
- [ ] 문서화

---

## 7. 주요 고려사항

### 7.1 보안
- 모든 시스템 관리 작업은 감사 로그에 기록
- 민감한 작업은 2단계 인증 필수
- IP 화이트리스트 적용

### 7.2 성능
- 대용량 로그 데이터 처리를 위한 인덱싱
- 캐싱 전략 수립
- 비동기 처리 활용

### 7.3 사용성
- 직관적인 UI/UX 설계
- 실시간 피드백 제공
- 키보드 단축키 지원

### 7.4 확장성
- 모듈화된 컴포넌트 구조
- 플러그인 시스템 고려
- API 버전 관리

---

## 8. 다음 단계

1. **이 문서 검토 및 피드백**
2. **우선순위 결정**
3. **상세 설계 문서 작성**
4. **프로토타입 개발**
5. **단계별 구현**

---

작성일: 2025-08-22
작성자: System Administrator