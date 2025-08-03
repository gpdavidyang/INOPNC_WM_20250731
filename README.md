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
- **출력현황 관리** (근무 현황, 급여정보 상세 계산식, Compact 테이블 뷰)
- **현장정보 관리** (주소, 담당자 연락처, 작업공정 정보, 도면 보기, PTW 문서)
- **도면 마킹 도구** (Canvas 기반 건설 도면 마킹 및 관리 시스템)
- **개인화된 빠른 메뉴** (사용자 맞춤 대시보드 구성)
- **접근성 최적화** (ARIA 표준 준수, 키보드 네비게이션, 스크린 리더 지원)

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

## 빠른 메뉴 커스터마이징

홈 대시보드에서 사용자가 자주 사용하는 기능을 개인화할 수 있는 빠른 메뉴 기능을 제공합니다.

### 주요 특징

- **12개 메뉴 옵션**: 다양한 업무 기능 중 선택 가능
- **최대 8개 선택**: 화면 공간을 효율적으로 활용
- **직관적인 설정**: 체크박스 기반의 간편한 설정 인터페이스
- **자동 저장**: 사용자 설정이 브라우저에 자동 저장
- **반응형 디자인**: 모바일과 데스크톱 모두 최적화

### 사용 가능한 메뉴

| 메뉴 | 설명 | 아이콘 색상 |
|------|------|-------------|
| 출근현황 | 근무 현황 확인 | 파란색 |
| 내문서함 | 개인 문서 관리 | 초록색 |
| 현장정보 | 현장 세부 정보 | 보라색 |
| 도면 | 공유 도면 및 문서 | 주황색 |
| 작업일지 | 일일 작업 보고서 | 남색 |
| 작업자관리 | 작업자 정보 관리 | 에메랄드 |
| 통계현황 | 작업 통계 및 분석 | 시안 |
| 자재관리 | 자재 현황 및 관리 | 황갈색 |
| 안전관리 | 안전 점검 및 관리 | 빨간색 |
| 알림 | 알림 및 메시지 | 보라색 |
| 업무목록 | 할 일 및 업무 관리 | 청록색 |
| 메시지 | 메시지 및 소통 | 분홍색 |

### 사용 방법

1. 홈 대시보드의 빠른메뉴 섹션에서 **"설정"** 버튼 클릭
2. 원하는 메뉴 항목들을 선택 (최대 8개)
3. **"저장"** 버튼으로 설정 완료
4. 설정은 브라우저에 자동 저장되어 다음 방문 시에도 유지

## 도면 마킹 관리 시스템

건설 현장의 도면에 직접 마킹하고 관리할 수 있는 완전한 시스템을 제공합니다.

### 주요 특징

- **Canvas 기반 마킹**: HTML5 Canvas를 사용한 고성능 그리기 도구
- **완전한 문서 관리**: 업로드, 저장, 불러오기, 삭제 등 전체 라이프사이클 지원
- **다양한 마킹 도구**: 박스 마킹(3색상), 텍스트 추가, 펜 도구, 선택/이동 도구
- **실행취소/다시실행**: 무제한 undo/redo 기능
- **반응형 디자인**: 모바일과 데스크톱 모두 최적화
- **키보드 단축키**: 전문가용 빠른 조작 지원

### 마킹 도구

| 도구 | 기능 | 단축키 |
|------|------|--------|
| 회색 박스 | 일반 영역 표시 | - |
| 빨간 박스 | 문제/주의 영역 표시 | - |
| 파란 박스 | 완료/확인 영역 표시 | - |
| 텍스트 | 설명 텍스트 추가 | - |
| 펜 도구 | 자유 그리기 | - |
| 선택 도구 | 객체 선택/이동 | - |
| 실행취소 | 마지막 작업 취소 | Ctrl+Z |
| 다시실행 | 취소한 작업 복원 | Ctrl+Y |

### 문서 관리 기능

- **문서 목록**: 저장된 모든 마킹 도면을 카드 형태로 표시
- **검색 및 필터링**: 제목으로 검색, 개인/공유 문서함 분류
- **페이지네이션**: 대량 문서 효율적 관리
- **미리보기**: 각 문서의 썸네일과 메타데이터 표시
- **빠른 액션**: 열기, 편집, 삭제 등 원클릭 작업

### 사용 방법

1. **도면 업로드**
   - 사이드바 → "도면 마킹 도구" 클릭  
   - "새 마킹 도구" 버튼으로 에디터 진입
   - 도면 파일을 드래그&드롭 또는 클릭하여 업로드

2. **마킹 작업**
   - 좌측(데스크톱) 또는 하단(모바일) 도구 팔레트에서 도구 선택
   - 마우스/터치로 도면에 직접 마킹
   - Ctrl+마우스휠로 줌 인/아웃, 드래그로 팬 이동

3. **저장 및 관리**
   - 상단 "저장" 버튼으로 마킹 도면 저장
   - 파일명, 저장 위치(개인/공유), 설명 입력
   - "홈" 버튼으로 문서 목록 화면 이동

## 현장정보 관리 시스템

건설 현장의 핵심 정보를 한눈에 확인하고 관리할 수 있는 시스템입니다.

### 주요 기능 (2025-08-03 업데이트)

- **현장 및 숙소 주소**
  - 복사 기능: 클립보드로 주소 즉시 복사
  - T-Map 연동: 원클릭으로 네비게이션 실행
  
- **작업 정보 및 도면 보기**
  - 부재명, 작업공정, 작업구간 정보 표시
  - **도면 버튼**: 해당 구간의 실제 건설 도면 표시
  - 도면 다운로드 기능 포함
  
- **PTW(작업허가서) 문서**
  - 작업허가서 미리보기 기능
  - PDF 뷰어로 실제 문서 표시
  - 문서 정보 및 다운로드 기능
  
- **담당자 연락처**
  - 건축관리자 및 안전관리자 정보
  - 전화번호 복사 및 직접 통화 기능

### 모바일 최적화

- 모바일에서 하단 슬라이드업 모달 표시
- 터치 친화적인 버튼 크기
- NavBar와 겹치지 않는 z-index 처리

### 데이터베이스 스키마

```sql
-- 마킹 도면 문서 테이블
CREATE TABLE markup_documents (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  original_blueprint_url TEXT NOT NULL,
  original_blueprint_filename VARCHAR(255) NOT NULL,
  markup_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  preview_image_url TEXT,
  location VARCHAR(20) DEFAULT 'personal',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site_id UUID REFERENCES sites(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  markup_count INTEGER DEFAULT 0
);
```

### API 엔드포인트

- `GET /api/markup-documents` - 마킹 도면 목록 조회
- `POST /api/markup-documents` - 새 마킹 도면 저장
- `GET /api/markup-documents/[id]` - 특정 도면 조회
- `PUT /api/markup-documents/[id]` - 도면 업데이트
- `DELETE /api/markup-documents/[id]` - 도면 삭제

## 급여정보 시스템

출력현황의 급여정보 탭에서 개인별 급여 내역을 상세하게 확인할 수 있습니다.

### 주요 특징

#### Compact 테이블 뷰
- **월별 급여 요약**: 한 눈에 보는 여러 월 급여 비교
- **핵심 정보 표시**: 월, 현장, 근무일, 기본급, 연장수당, 실지급액
- **효율적인 공간 활용**: 만원 단위 표시로 가독성 향상
- **모바일 최적화**: 가로 스크롤 지원으로 작은 화면에서도 편리

#### 상세 계산식 표시
- **단계별 계산 과정**: 기본급 + 연장수당 + 제수당 - 공제액 = 실지급액
- **시각적 계산 흐름**: 색상 코딩과 구분선으로 명확한 표시
- **근무일 기준 분석**: 
  - 일당 평균 (실지급액 ÷ 근무일수)
  - 시급 평균 (8시간 기준)
- **투명한 급여 계산**: 사용자가 급여 산정 과정을 명확히 이해

#### 접근성 및 사용성
- **PDF 다운로드**: 각 월별 급여명세서 즉시 다운로드
- **반응형 디자인**: 데스크톱과 모바일 모두 최적화
- **다크모드 지원**: 완전한 다크모드 호환
- **접근성 표준**: ARIA 레이블과 키보드 네비게이션 지원

### 기술 구현
- **데이터 구조**: Supabase를 통한 급여 데이터 관리
- **실시간 계산**: 클라이언트 사이드에서 즉시 계산
- **성능 최적화**: 메모이제이션을 통한 불필요한 재계산 방지

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
│   ├── api/               # API Routes
│   │   └── markup-documents/  # 마킹 도면 API
│   ├── auth/              # 인증 관련 페이지
│   ├── components/        # 컴포넌트 데모 페이지
│   ├── dashboard/         # 대시보드
│   ├── tasks/             # 작업 관리
│   ├── projects/          # 프로젝트 관리
│   └── team/              # 팀원 관리
├── components/            # 재사용 가능한 컴포넌트
│   ├── markup/           # 도면 마킹 관련 컴포넌트
│   │   ├── canvas/       # Canvas 그리기 컴포넌트
│   │   ├── dialogs/      # 저장/열기/공유 다이얼로그
│   │   ├── hooks/        # 마킹 관련 커스텀 훅
│   │   ├── list/         # 문서 목록 컴포넌트
│   │   ├── toolbar/      # 도구 팔레트 및 툴바
│   │   └── upload/       # 도면 업로드 컴포넌트
│   └── ui/               # UI 컴포넌트 라이브러리
├── lib/                   # 유틸리티 함수
├── providers/             # Context Providers
├── types/                 # TypeScript 타입 정의
│   └── markup.ts         # 마킹 관련 타입 정의
├── docs/                  # 문서
└── supabase/             # 데이터베이스 마이그레이션
    └── migrations/
        └── 107_create_markup_documents.sql
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
