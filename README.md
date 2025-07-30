# INOPNC Work Management System

Next.js 기반의 작업 관리 시스템입니다.

## 주요 기능

- 사용자 인증 (로그인/회원가입)
- 작업(Task) 관리 (생성, 수정, 삭제, 상태 변경)
- 프로젝트 관리
- 팀원 관리 및 역할 설정
- 댓글 시스템
- 대시보드 통계

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **State Management**: React Hooks

## 필수 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Supabase 계정

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone [repository-url]
cd INOPNC_WM_20250731
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 데이터베이스 설정

Supabase 대시보드에서 SQL 편집기를 열고 `supabase/migrations/001_initial_schema.sql` 파일의 내용을 실행합니다.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

## 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── auth/              # 인증 관련 페이지
│   ├── dashboard/         # 대시보드
│   ├── tasks/             # 작업 관리
│   ├── projects/          # 프로젝트 관리
│   └── team/              # 팀원 관리
├── components/            # 재사용 가능한 컴포넌트
├── lib/                   # 유틸리티 함수 (Supabase 클라이언트 등)
├── types/                 # TypeScript 타입 정의
└── supabase/             # 데이터베이스 마이그레이션

```

## 사용자 역할

- **Admin**: 모든 기능 접근 가능
- **Manager**: 프로젝트 생성/수정, 작업 관리
- **User**: 작업 조회 및 본인 작업 수정

## 주요 테이블 구조

### profiles
- 사용자 프로필 정보
- auth.users 테이블과 연결

### projects
- 프로젝트 정보
- 상태: active, completed, on_hold, cancelled

### tasks
- 작업 정보
- 상태: pending, in_progress, completed, cancelled
- 우선순위: low, medium, high, urgent

### comments
- 작업에 대한 댓글

## 보안

- Row Level Security (RLS) 활성화
- 역할 기반 접근 제어
- Supabase Auth를 통한 인증

## 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm run start
```

## 문제 해결

### 로그인이 안 되는 경우
1. Supabase 대시보드에서 Authentication 설정 확인
2. 이메일 인증 설정 확인

### 데이터가 표시되지 않는 경우
1. RLS 정책 확인
2. 데이터베이스 마이그레이션 실행 여부 확인

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.