# INOPNC Work Management System

Next.js 기반의 건설 작업일지 관리 시스템입니다.

## 주요 기능

- 사용자 인증 (로그인/회원가입)
- 작업일지 관리
- 프로젝트 관리
- 팀원 관리 및 역할 설정
- 댓글 시스템
- 대시보드 통계
- **UI 컴포넌트 시스템** (Toss 디자인 시스템 기반)
- **라이트/다크 모드 지원**

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **UI Components**: class-variance-authority, lucide-react
- **State Management**: React Hooks, Zustand (준비 중)

## 필수 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Supabase 계정

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/gpdavidyang/INOPNC_WM_20250731.git
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

Supabase 대시보드에서 SQL 편집기를 열고 `supabase/migrations/` 폴더의 마이그레이션 파일들을 순서대로 실행합니다.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

## UI 컴포넌트 시스템

Toss 디자인 시스템을 기반으로 한 재사용 가능한 컴포넌트 라이브러리를 제공합니다.

### 컴포넌트 데모 페이지

[http://localhost:3000/components](http://localhost:3000/components)에서 모든 컴포넌트를 확인할 수 있습니다.

### 주요 컴포넌트

- **Button**: 다양한 변형 (primary, secondary, danger, ghost, outline)
- **Card**: 카드 레이아웃
- **Input/Textarea**: 폼 입력 필드
- **Select/Dropdown**: 선택 박스
- **NavBar/Footer**: 네비게이션 컴포넌트
- **Typography**: 일관된 텍스트 스타일

## 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── auth/              # 인증 관련 페이지
│   ├── components/        # 컴포넌트 데모 페이지
│   ├── dashboard/         # 대시보드
│   ├── tasks/             # 작업 관리
│   ├── projects/          # 프로젝트 관리
│   └── team/              # 팀원 관리
├── components/            # 재사용 가능한 컴포넌트
│   └── ui/               # UI 컴포넌트 라이브러리
├── lib/                   # 유틸리티 함수
├── providers/             # Context Providers
├── types/                 # TypeScript 타입 정의
├── docs/                  # 문서
└── supabase/             # 데이터베이스 마이그레이션
```

## 테마 시스템

라이트/다크 모드를 지원하며, 시스템 설정을 따르는 옵션도 제공합니다.

```tsx
// 테마 전환 사용 예시
import { useTheme } from "@/providers/theme-provider"

const { theme, setTheme } = useTheme()
setTheme("dark") // "light", "dark", "system"
```

## 사용자 역할

- **Admin**: 모든 기능 접근 가능
- **Manager**: 프로젝트 생성/수정, 작업 관리
- **User**: 작업 조회 및 본인 작업 수정

## 보안

- Row Level Security (RLS) 활성화
- 역할 기반 접근 제어
- Supabase Auth를 통한 인증
- 중요 파일 보호 시스템

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
3. profiles 테이블 트리거 확인

### 데이터가 표시되지 않는 경우
1. RLS 정책 확인
2. 데이터베이스 마이그레이션 실행 여부 확인

## 기여 가이드

1. Feature 브랜치 생성
2. 변경사항 커밋
3. Pull Request 생성
4. 코드 리뷰 후 병합

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
