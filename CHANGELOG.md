# CHANGELOG

## [2025-08-08] - UI 개선 및 기능 구현

### ✅ 완료된 기능
- 전체 섹션 한번에 접기/펼치기 토글 (헤더 우상단)
- '진행률' → '작성 진행률' 용어 변경
- 컴팩트 UI 디자인 (모든 섹션)
- 작업자 입력 섹션 3열 그리드 레이아웃 (작업자 2/3 + 공수 1/3)
- 작업자 헤더에 번호 표시 (작업자 1, 작업자 2...)
- 모바일 최적화 터치 타겟 (최소 44px)
- React controlled/uncontrolled input 오류 완전 해결
- NotificationDropdown import 오류 수정
- useEffect 무한 루프 오류 해결
- Next.js 서버 충돌 및 404 오류 해결
- 컴팩트 카드 레이아웃
- 2x2 통계 그리드
- 검색 인터페이스 통합
- 모바일 최적화 간격

## [2025-08-07] - Daily Reports Enhancements

### ✨ Daily Reports Page Improvements

#### Enhanced Filter System
- ✅ **Site Filter**: Added dropdown to filter reports by construction site
- ✅ **Active Filter Display**: Shows applied filters when filter panel is collapsed
- ✅ **Filter Badges**: Interactive badges with quick removal buttons
- ✅ **Collapsible Filters**: Filter panel can be collapsed to save screen space

#### Improved User Experience
- ✅ **Daily Report Detail Page**: Complete detail view with approval workflow
- ✅ **View Toggle**: Switch between card view and list view with state persistence
- ✅ **Better Navigation**: Consistent back navigation and breadcrumb support
- ✅ **Mobile Optimization**: Responsive design for construction site usage

#### Features Added
- **Site-specific filtering** for multi-site operations
- **Visual filter indicators** when panel is collapsed
- **Comprehensive detail view** with work logs, attendance, and materials
- **Approval workflow** for managers with comment system
- **Responsive card/list views** with sortable columns

## [2025-08-07] - Navigation System Fixes

### 🔧 Critical Navigation Issues Fixed

#### Sidebar Navigation Performance
- ✅ **Fixed slow page loading**: Resolved race conditions where both `router.push()` and `onTabChange()` were being called simultaneously
- ✅ **Fixed incorrect page rendering**: Pages now load the correct content instead of showing home page or old versions
- ✅ **Fixed pathname detection**: Updated to use Next.js 13+ `usePathname` hook instead of deprecated `router.pathname`
- ✅ **Unified routing approach**: All menu items now use consistent href-based navigation

#### Page Layout Consistency
- ✅ **Standardized layouts**: All dashboard pages now consistently use DashboardLayout wrapper
  - Added DashboardLayout to `/dashboard/attendance`
  - Added DashboardLayout to `/dashboard/documents` 
  - Added DashboardLayout to `/dashboard/daily-reports`
- ✅ **Fixed duplicate layout issue**: Resolved nested layout problem in site-info page
- ✅ **Consistent navigation behavior**: All pages now handle navigation state uniformly

#### Active Tab Detection
- ✅ **Accurate tab highlighting**: Sidebar now correctly highlights active page based on URL pathname
- ✅ **Admin page support**: Proper active state detection for admin sub-pages
- ✅ **State synchronization**: Fixed tab state sync between sidebar and main content

### 💡 Root Cause Analysis
The navigation issues were caused by:
1. Mixed navigation approaches (tab-based vs href-based) creating conflicts
2. Inconsistent page layouts (some with DashboardLayout, some without)
3. Using deprecated router.pathname in client components
4. Double navigation calls causing race conditions

## [2025-08-07] - 통합 페이지 헤더 시스템 구현

### 🎯 주요 변경사항

#### 새로운 PageHeader 컴포넌트 시스템
- ✅ **통합 페이지 헤더 컴포넌트** (`/components/ui/page-header.tsx`)
  - Breadcrumb 네비게이션으로 현재 위치 명확히 표시
  - 페이지별 컨텍스트 액션 버튼 지원
  - 반응형 디자인 (모바일에서 텍스트→아이콘 자동 변환)
  - 다크모드 완벽 지원

#### 사전 구성된 헤더 변형
- ✅ **DashboardPageHeader**: 일반 대시보드 페이지용
- ✅ **AdminPageHeader**: 관리자 섹션 페이지용
- ✅ **ReportsPageHeader**: 보고서 페이지용 (뒤로가기 버튼 포함)
- ✅ **DocumentsPageHeader**: 문서 관리 페이지용 (검색 기능 포함)

#### 접근성 및 사용성 개선
- ✅ **WCAG 표준 준수**: 완벽한 ARIA 지원
- ✅ **건설 현장 최적화**: 3가지 터치 모드 지원 (일반/장갑/정밀)
- ✅ **키보드 네비게이션**: Tab 키를 통한 순차 이동
- ✅ **폰트 크기 컨텍스트**: 사용자 설정 폰트 크기 반영

### 🔧 기술적 구현
- **신규 컴포넌트**:
  - `components/ui/page-header.tsx` - 메인 헤더 컴포넌트
  - `components/ui/page-header-examples.tsx` - 사용 예제 모음
  - `components/ui/page-header-readme.md` - 상세 문서
  - `app/components/page-header-demo/page.tsx` - 데모 페이지

- **기존 페이지 업데이트**:
  - `app/dashboard/daily-reports/new/page.tsx` - ReportsPageHeader 적용
  - `components/documents/documents-page-client.tsx` - DocumentsPageHeader 적용

### 📱 사용자 경험 개선
- **일관된 네비게이션**: 모든 페이지에서 통일된 헤더 경험
- **명확한 위치 파악**: Breadcrumb으로 현재 페이지 계층 구조 표시
- **효율적인 액션**: 페이지별 맞춤 액션 버튼 제공
- **모바일 최적화**: 작은 화면에서도 편리한 사용

### 📚 문서 업데이트
- ✅ `CLAUDE.md`: 2025-08-07 PageHeader 시스템 섹션 추가
- ✅ `README.md`: 통합 페이지 헤더 시스템 섹션 추가
- ✅ `CHANGELOG.md`: 변경사항 기록

## [2025-08-07] - 다크/라이트 모드 개선 계획

### 🎨 테마 시스템 고도화

#### 즉시 적용 가능한 개선사항 (1일)
- 📋 **CSS 변수 통일화**: 하드코딩된 Tailwind 클래스를 CSS 변수로 교체
- 📋 **엘리베이션 시스템**: 카드와 패널에 깊이감 부여 (elevation-sm/md/lg)
- 📋 **전환 애니메이션**: 테마 전환 시 부드러운 200ms 트랜지션
- 📋 **프리미엄 그라데이션**: 고급스러운 배경 그라데이션 추가

#### 단기 개선 계획 (1주일)
- 📋 **컴포넌트 리팩토링**: 모든 컴포넌트를 CSS 변수 기반으로 전환
- 📋 **테마 토글 UI**: 메인 네비게이션에 테마 전환 버튼 통합
- 📋 **시스템 설정 연동**: 사용자 OS 다크모드 설정 자동 감지
- 📋 **타이포그래피 개선**: 가독성 향상을 위한 font-weight, letter-spacing 최적화

#### 장기 개선 계획 (1개월)
- 📋 **시간대별 자동 테마**: 새벽/야간 작업 시 자동 다크모드 전환
- 📋 **날씨 연동 모드**: 흐린 날 자동 고대비 모드 활성화
- 📋 **역할별 테마 프로필**: 작업자/관리자별 맞춤 테마 설정
- 📋 **주변광 센서 연동**: 자동 밝기 조절 기능

### 🚀 기대 효과
- **가독성**: 대비율 개선으로 30% 가독성 향상
- **사용자 만족도**: 프리미엄 느낌의 부드러운 전환 효과
- **접근성**: WCAG AAA 수준 달성 (중요 요소)
- **성능**: CSS-only 전환으로 JavaScript 오버헤드 감소

### 📚 문서 업데이트
- ✅ `UI_Guidelines.json`: 테마 개선 사양 추가
- ✅ `UI_Guidelines.md`: v3.1.0 테마 시스템 섹션 추가
- ✅ `CHANGELOG.md`: 개선 계획 문서화

## [2025-08-04] - 도면 마킹 도구 UI/UX 대폭 개선

### 🎨 도면 마킹 도구 개선사항

#### 다크모드 완벽 지원
- ✅ **도면 업로드 화면 다크모드**: 업로드 영역, 버튼, 텍스트 모두 다크모드 스타일 적용
- ✅ **마킹 에디터 다크모드**: 도구 팔레트, 캔버스 영역 다크모드 최적화
- ✅ **문서 목록 다크모드**: 카드, 버튼, 배경색 일관된 다크모드 테마

#### 도구 팔레트 레이아웃 개선
- ✅ **Undo/Redo/Delete 기능 복원**: 화면 밖으로 벗어났던 액션 버튼들을 화면 내로 재배치
- ✅ **2행 레이아웃 구조**: 모바일에서 모든 도구를 효율적으로 표시
  - 1행: 선택, 자재구간, 작업진행 + Undo/Redo
  - 2행: 작업완료, 텍스트, 펜 + Delete
- ✅ **펜 도구 표시 문제 해결**: 누락되었던 펜 도구 아이콘 복원

#### 가독성 및 디자인 개선
- ✅ **아이콘 크기 증가**: 6x6 크기로 확대하여 터치 정확도 향상
- ✅ **버튼 크기 최적화**: 48x48px 터치 타겟으로 모바일 사용성 개선
- ✅ **색상 구분 강화**:
  - 박스 도구: 채워진 색상 사각형으로 변경 (회색/빨강/파랑)
  - 선택 도구: 파란색 아이콘
  - 텍스트 도구: 인디고색 아이콘
  - 펜 도구: 핑크색 아이콘
- ✅ **그라디언트 효과**: 활성화된 버튼에 그라디언트 배경 적용
- ✅ **그림자 효과**: 깊이감을 위한 shadow 효과 추가
- ✅ **둥근 모서리**: rounded-xl로 현대적인 디자인 적용

#### 액션 버튼 특별 디자인
- ✅ **Undo/Redo 버튼**: 회색 그라디언트 배경으로 일반 도구와 구분
- ✅ **Delete 버튼**: 빨간색 테마로 위험 액션 시각화
- ✅ **비활성화 상태**: 더 명확한 시각적 피드백 제공

### 🔧 기술적 구현
- **컴포넌트 수정**:
  - `components/markup/upload/blueprint-upload.tsx` - 다크모드 스타일 추가
  - `components/markup/markup-editor.tsx` - 컨테이너 다크모드 배경색 적용
  - `components/markup/toolbar/tool-palette.tsx` - 전면적인 UI 재설계

### 📱 사용자 경험 개선
- **향상된 터치 경험**: 더 큰 버튼과 명확한 시각적 피드백
- **일관된 다크모드**: 전체 마킹 도구에서 통일된 다크 테마
- **직관적인 도구 구분**: 색상과 스타일로 도구 기능 즉시 인지
- **반응형 레이아웃**: 모바일과 데스크톱 모두 최적화

## [2025-08-04] - 하단 네비게이션 바 구조 개선

### 🎯 주요 변경사항
- **하단 네비게이션 메뉴 간소화**: 더 나은 사용자 경험을 위한 네비게이션 구조 개선

### 📱 모바일 하단 네비게이션 업데이트
#### 메뉴 구성 변경
- ❌ **제거**: '공도면' 메뉴 아이템 제거 (문서함으로 통합)
- ✅ **추가**: '내정보' 메뉴 아이템 추가 (사용자 프로필 빠른 접근)
- ✅ **새로운 순서**: 홈(빠른메뉴) → 출력현황 → 작업일지 → 문서함 → 내정보

#### 내정보 화면 구현
- ✅ **프로필 정보 표시**: 사용자 이름, 이메일, 역할 정보
- ✅ **역할별 표시**: worker, site_manager, customer_manager, admin, system_admin 역할 한글 표시
- ✅ **모바일 최적화**: 간결하고 읽기 쉬운 레이아웃

### 🔧 기술적 구현
- **아이콘 충돌 해결**: User 아이콘을 UserIcon으로 별칭 지정하여 타입 충돌 방지
- **라우팅 로직 업데이트**: 'profile' 탭 추가에 따른 네비게이션 핸들러 수정
- **TypeScript 타입 안전성**: 모든 변경사항에 대한 타입 체크 완료

## [2025-08-03] - '공도면' 빠른메뉴 네비게이션 구현 및 문서함 UI 일관성 개선

### 🎯 핵심 목표 완성
- **'공도면' 빠른메뉴 자동 네비게이션**: 홈 화면에서 공도면 아이콘 클릭 시 공유문서함으로 이동하고 자동 검색어 설정
- **문서함 3개 탭 UI 완전 일관성 달성**: 내문서함, 공유문서함, 도면마킹 탭의 동일한 UX 패턴 적용
- **현장정보 페이지 컴팩트화**: 홈 화면과 같은 효율적이고 간결한 레이아웃 구현

### 🚀 '공도면' 빠른메뉴 네비게이션 (신규 기능)
#### 자동 라우팅 및 검색 시스템
- ✅ **스마트 라우팅**: 홈 → 빠른메뉴 → '공도면' 클릭 시 `/dashboard/documents?tab=shared&search=공도면` 자동 이동
- ✅ **탭 자동 선택**: URL 파라미터 기반으로 '공유문서함' 탭 자동 활성화
- ✅ **카테고리 지능형 선택**: '공도면' 검색어 감지 시 '현장 공통 문서' 카테고리 자동 선택
- ✅ **검색어 사전 설정**: 검색 필드에 '공도면' 자동 입력 및 필터링된 결과 즉시 표시
- ✅ **브라우저 지원**: 뒤로가기/앞으로가기 완벽 지원하는 URL 기반 상태 관리

#### 기술적 구현 세부사항
- **라우팅 최적화**: `tab=shared` → `shared-documents` 내부 탭 매핑 처리
- **초기 상태 설정**: 렌더링 타이밍 문제 해결로 즉시 카테고리 선택
- **타입 안전성**: TypeScript 인터페이스를 통한 완전한 타입 체크
- **성능 최적화**: 불필요한 리렌더링 방지 및 효율적인 상태 관리

## [2025-08-03] - 문서함 UI 일관성 개선 및 현장정보 컴팩트 최적화

### 🎯 핵심 목표
- **문서함 3개 탭 UI 완전 일관성 달성**: 내문서함, 공유문서함, 도면마킹 탭의 동일한 UX 패턴 적용
- **현장정보 페이지 컴팩트화**: 홈 화면과 같은 효율적이고 간결한 레이아웃 구현

### ✨ 문서함 UI 일관성 개선
#### 내문서함 탭 개선
- ✅ **크기순 정렬 옵션 제거**: 사용자 요청에 따라 '크기순' 선택지 완전 제거
- ✅ **드롭다운 → 토글 버튼 전환**: 날짜순/이름순 선택을 직관적인 토글 버튼으로 변경
- ✅ **잔여 드롭다운 문제 해결**: "날짜순" 클릭 시 여전히 3개 옵션이 나오던 문제 수정
- ✅ **TypeScript 타입 정리**: sortBy 타입에서 'size' 옵션 완전 제거

#### 공유문서함 탭 개선
- ✅ **파일 업로드 기능 추가**: 모든 사용자에게 파일 업로드 권한 부여
- ✅ **드래그앤드롭 구현**: 내문서함과 동일한 드래그앤드롭 업로드 기능 구현
- ✅ **정렬 시스템 통일**: 날짜순/이름순 토글 버튼 패턴 적용
- ✅ **파일 검증 로직**: 파일 타입, 크기 제한 검증 및 에러 처리
- ✅ **시각적 피드백**: 드래그 상태 및 업로드 진행률 표시

#### 도면마킹 탭 개선
- ✅ **UI 패턴 완전 통일**: 다른 탭과 동일한 디자인 패턴으로 전면 개편
- ✅ **위치 선택 토글화**: 드롭다운에서 토글 버튼으로 변경 (내문서함/공유문서함)
- ✅ **보기 모드 토글**: 카드뷰/리스트뷰 전환 토글 버튼 추가
- ✅ **리스트 디자인 통일**: 모든 화면 크기에서 일관된 카드 목록 형태로 변경
- ✅ **테이블 뷰 제거**: 데스크톱 테이블 형태를 카드 형태로 통일

### 🎨 현장정보 페이지 최적화
- ✅ **헤더 여백 최적화**: `p-4` → `px-3 py-3`로 컴팩트하게 조정
- ✅ **제목 크기 최적화**: `3xl/2xl` → `2xl/xl`로 크기 줄임
- ✅ **콘텐츠 간격 최적화**: `space-y-6 p-4` → `space-y-4 p-3`로 간격 줄임
- ✅ **카드 간격 개선**: 전체 컴포넌트의 카드 간격 최적화
- ✅ **드롭다운 크기 조정**: 200px → 180px로 더 컴팩트하게

### 🛠️ 기술적 구현 사항
- **TypeScript 에러 해결**: 모든 컴파일 및 타입 에러 수정
- **컴포넌트 일관성**: 3개 탭 모두 동일한 토글 버튼 컴포넌트 패턴 적용
- **드래그앤드롭 핸들러**: 적절한 에러 처리를 포함한 파일 업로드 로직
- **파일 업로드 최적화**: 진행률 표시 및 사용자 피드백 개선
- **브라우저 호환성**: `document.createElement` 이슈 해결

### 📱 사용자 경험 개선
- **완전한 일관성**: 3개 문서 탭에서 동일한 UI 패턴 경험
- **효율성 향상**: 개선된 토글 인터페이스로 더 빠른 문서 관리
- **모바일 최적화**: 최적화된 간격과 컨트롤로 더 나은 모바일 경험
- **접근성 개선**: 향상된 터치 타겟과 시각적 피드백

### 📂 수정된 파일 ('공도면' 네비게이션)
- `components/dashboard/tabs/home-tab.tsx` - 공도면 아이콘 클릭 시 스마트 라우팅 구현
- `app/dashboard/documents/page.tsx` - URL 파라미터 처리를 위한 서버 컴포넌트 개선
- `components/documents/documents-page-client.tsx` - 탭 자동 선택 및 검색어 전달 로직
- `components/documents/shared-documents.tsx` - 지능형 카테고리 선택 및 검색어 자동 설정

### 📂 수정된 파일 (UI 일관성)
- `components/dashboard/tabs/documents-tab.tsx` - 내문서함 정렬 시스템 개선
- `components/dashboard/tabs/shared-documents-tab.tsx` - 업로드 기능 및 드래그앤드롭 구현
- `components/markup/list/markup-document-list.tsx` - UI 패턴 완전 통일
- `components/site-info/SiteInfoTabs.tsx` - 컴팩트 레이아웃 최적화

## [2025-08-03] - 모바일 UX 최적화를 위한 용어 간소화

### 🎨 UI/UX 개선
- **용어 간소화**: 모바일 기기에서의 가독성 향상을 위한 인터페이스 텍스트 간소화
  - "T맵지도" → "T맵" (현장정보의 네비게이션 링크)
  - "공사도면" → "도면" (작업 상세정보 옆 버튼 및 모달 제목)
  - "공도면" → "도면" (빠른메뉴 항목명)

### 📱 모바일 최적화
- **홈 화면 큰글씨 모드**: 더 간결한 용어로 모바일 사용성 개선
- **일관성 향상**: 전체 인터페이스에서 통일된 용어 사용
- **가독성 개선**: 짧은 용어로 터치 버튼의 가독성 향상

### 📋 파일 변경사항
- `components/site-info/TodaySiteInfo.tsx`: T맵 링크 및 도면 관련 용어 업데이트
- `components/dashboard/tabs/home-tab.tsx`: 빠른메뉴 항목명 업데이트
- `PRD.md`: 제품 요구사항 문서 용어 업데이트

## [2025-08-03] - 급여정보 UI 개선 및 네비게이션 접근성 향상

### ✨ 새로운 기능
- **급여 계산식 표시**: 급여정보 탭에 상세한 계산 공식 추가
  - 기본급 + 연장수당 + 제수당 - 공제액 = 실지급액 단계별 표시
  - 근무일 기준 일당/시급 평균 계산 및 표시
  - 시각적 계산 과정 (색상 코딩 및 구분선)
  - 투명한 급여 계산 과정으로 사용자 이해도 향상

### 🎨 UI/UX 개선
- **급여정보 탭 Compact 디자인**
  - 기존 카드 형태 → 테이블 형태로 변경
  - 핵심 정보만 표시: 월, 현장, 근무일, 기본급, 연장수당, 실지급액
  - 금액 단위 간소화: 원 → 만원 단위 표시
  - 현장명 자동 축약으로 공간 효율성 증대
  - 하단 상세 영역에 최근 월 급여 내역 표시

- **네비게이션 시스템 개선**
  - URL 기반 activeTab 관리 시스템 구현
  - 브라우저 뒤로가기/앞으로가기 버튼 지원
  - 직접 URL 접근 시 올바른 탭 활성화
  - 페이지 새로고침 시 탭 상태 유지

### ♿ 접근성 개선
- **ARIA 표준 준수**
  - `aria-hidden` → `inert` 속성 사용으로 접근성 경고 해결
  - 모바일 사이드바 닫힌 상태에서 포커스 차단
  - 스크린 리더 지원 향상
  - 키보드 네비게이션 개선

### 🛠 기술적 구현
- **DashboardLayout 개선**
  - `usePathname` 훅을 통한 URL 감지
  - `useEffect`로 경로 변경 시 자동 탭 업데이트
  - site-info 페이지 하드코딩 제거

- **Sidebar 컴포넌트 최적화**
  - 불필요한 import 제거 및 코드 정리
  - TypeScript 타입 오류 수정

### 🐛 버그 수정
- **site-info 페이지 네비게이션 문제 해결**
  - 다른 사이드바 메뉴 클릭 시 이동 불가 문제 수정
  - 하드코딩된 activeTab 제거로 정상적인 네비게이션 복원

## [2025-08-03] - 오늘의 현장 정보 섹션 기능 확장

### ✨ 새로운 기능
- **공사도면 보기 기능**: 작업 구간의 실제 건설 도면을 확인할 수 있는 기능 추가
  - 작업 정보 옆에 "공사도면" 버튼 배치
  - 모달 창에서 실제 도면 이미지 표시
  - 도면 다운로드 기능 구현
  - 샘플 도면 파일: `/docs/샘플도면5.png`

- **PTW(작업허가서) 문서 기능**: 작업허가서 문서를 미리보고 다운로드할 수 있는 기능 추가
  - 작업 정보 하단에 "PTW (작업허가서)" 섹션 추가
  - 미리보기 버튼으로 PDF 문서 표시
  - 자동 생성된 문서 번호 (PTW-2025-[site-id])
  - PDF 다운로드 기능 구현
  - PTW 문서 파일: `/docs/[양식]PTW양식_이노피앤씨.pdf`

### 🎨 UI/UX 개선
- **모바일 최적화 모달**
  - 모바일: 하단에서 슬라이드업 애니메이션
  - 데스크탑: 중앙 정렬 표시
  - 반응형 버튼 크기 및 레이아웃
  
- **모달 디자인 개선**
  - 다크 모드 완벽 지원
  - 부드러운 전환 효과
  - 터치 친화적인 버튼 크기 (최소 44x44px)
  - NavBar와 겹치지 않도록 z-index 조정 (z-[100])

### 🛠 기술적 구현
- **컴포넌트 업데이트**: `TodaySiteInfo.tsx` 컴포넌트 확장
  - 새로운 상태 관리: `showBlueprintModal`, `showPTWModal`
  - 파일 다운로드 로직 구현
  - iframe을 통한 PDF 미리보기
  
- **애니메이션 개선**: Tailwind 설정 업데이트
  - `slideUp` 애니메이션을 모바일 친화적으로 수정
  - 100% 위치에서 0%로 이동하는 자연스러운 효과

### 📚 문서 업데이트
- **PRD.md**: 오늘의 현장 정보 섹션 스펙 업데이트
- **CLAUDE.md**: Recent Updates 섹션 추가
- **README.md**: 현장정보 관리 시스템 섹션 추가

## [2025-08-02] - UI 개선 및 기능 구현

### ✅ 완료된 기능
- 전체 섹션 한번에 접기/펼치기 토글 (헤더 우상단)
- '진행률' → '작성 진행률' 용어 변경
- 컴팩트 UI 디자인 (모든 섹션)
- 작업자 입력 섹션 3열 그리드 레이아웃 (작업자 2/3 + 공수 1/3)
- 작업자 헤더에 번호 표시 (작업자 1, 작업자 2...)
- 모바일 최적화 터치 타겟 (최소 44px)
- React controlled/uncontrolled input 오류 완전 해결
- NotificationDropdown import 오류 수정
- useEffect 무한 루프 오류 해결
- Next.js 서버 충돌 및 404 오류 해결
- 컴팩트 카드 레이아웃
- 2x2 통계 그리드
- 검색 인터페이스 통합
- 모바일 최적화 간격

## [2025-08-01] - 현장 정보 시스템 구현 및 실제 DB 연동

### ✨ 새로운 기능
- **현장 정보 실시간 표시**: 로그인한 사용자의 현재 배정된 현장 정보를 실제 데이터베이스에서 조회
  - 현장 주소, 숙소 주소, 작업공정, 작업구간, 부재명 정보 표시
  - 건축 담당자 및 안전 담당자 연락처 표시
  - 주소 복사, T-Map 연결, 전화걸기 기능 지원
- **현장 참여 이력**: 사용자가 그동안 참여했던 모든 현장 이력 표시
  - 현장별 참여 기간, 역할, 상태 정보 표시
  - 현재 활성 현장과 과거 현장 구분 표시
  - 스크롤 가능한 컴팩트 리스트 형태로 구현

### 🛠 기술적 개선
- **데이터베이스 스키마 확장**: Sites 테이블에 상세 현장 정보 컬럼 추가
  - work_process, work_section, component_name (작업 정보)
  - manager_name, safety_manager_name (담당자 정보)
  - site_assignments 테이블에 role 컬럼 추가
- **서버 액션 구현**: 현장 정보 조회를 위한 전용 서버 액션
  - getCurrentUserSite(): 현재 사용자 배정 현장 조회
  - getUserSiteHistory(): 사용자 현장 참여 이력 조회
  - 관리자용 현장 관리 기능 (assignUserToSite, getAllSites 등)
- **PostgreSQL 함수 및 뷰**: 효율적인 데이터 조회를 위한 DB 함수
  - get_current_user_site(): 현재 사용자 현장 정보 조회
  - get_user_site_history(): 사용자 현장 이력 조회
  - current_site_assignments 뷰: 활성 현장 배정 조회 최적화
- **TypeScript 타입 정의**: 현장 정보 관련 완전한 타입 시스템
  - CurrentUserSite, UserSiteHistory, SiteAssignment 인터페이스
  - SiteAssignmentRole 타입 정의

### 🔄 UI 개선  
- **로딩 상태 표시**: 현장 정보 로딩 중 스피너 및 상태 메시지
- **에러 처리**: 데이터 로딩 실패 시 에러 메시지 및 재시도 기능
- **빈 상태 처리**: 배정된 현장이 없을 때 안내 메시지 표시
- **조건부 렌더링**: 데이터 존재 여부에 따른 섹션별 조건부 표시
- **반응형 디자인**: 모바일 친화적 현장 이력 리스트 구현

### 📊 데이터 구조
- **확장된 Sites 테이블**: 상세 현장 정보 저장
- **개선된 Site Assignments**: 역할 기반 현장 배정 관리
- **성능 최적화**: 인덱스 및 뷰를 통한 쿼리 성능 향상
- **샘플 데이터**: 개발/테스트용 현장 정보 데이터 추가

### 🎯 사용자 경험
- **실시간 정보**: Mock 데이터에서 실제 DB 데이터로 완전 전환
- **직관적 인터페이스**: 현장 정보와 이력을 명확히 구분하여 표시
- **빠른 액세스**: 주소 복사, 길찾기, 전화걸기 원클릭 기능
- **컴팩트 표시**: 공간 효율적인 현장 이력 표시

## [2025-08-01] - 홈 탭 개선 및 빠른 메뉴 설정 기능 구현

### ✨ 새로운 기능
- **빠른 메뉴 커스터마이징**: 사용자가 홈 화면 빠른 메뉴를 자유롭게 설정할 수 있는 기능 추가
  - 12개 메뉴 항목 중 최대 8개 선택 가능
  - 설정 모달을 통한 직관적인 선택 인터페이스
  - localStorage를 통한 설정 저장 및 복원
  - 각 메뉴별 고유 아이콘과 색상 코딩

### 🔄 UI 개선
- **홈 탭 간소화**: 불필요한 대시보드 카드 및 웰컴 섹션 제거
  - "안녕하세요, Site Manager님" 섹션 제거
  - 4개 통계 카드 (작업일지, 승인대기, 활성작업자, 새알림) 제거
  - "추가" 카드 제거로 깔끔한 레이아웃 구현

### 🎨 사용자 경험 개선
- **개인화된 대시보드**: 사용자별 맞춤 빠른 메뉴 구성
- **직관적인 설정**: 체크박스 기반 선택 UI
- **시각적 피드백**: 선택/해제 상태의 명확한 표시
- **반응형 디자인**: 모바일 친화적 2열 그리드 레이아웃

### 📋 사용 가능한 빠른 메뉴
1. 출근현황 - 근무 현황 확인
2. 내문서함 - 개인 문서 관리
3. 현장정보 - 현장 세부 정보
4. 공도면 - 공유 도면 및 문서
5. 작업일지 - 일일 작업 보고서
6. 작업자관리 - 작업자 정보 관리
7. 통계현황 - 작업 통계 및 분석
8. 자재관리 - 자재 현황 및 관리
9. 안전관리 - 안전 점검 및 관리
10. 알림 - 알림 및 메시지
11. 업무목록 - 할 일 및 업무 관리
12. 메시지 - 메시지 및 소통

### 🛠 기술적 개선
- **상태 관리**: React hooks 기반 설정 상태 관리
- **데이터 지속성**: localStorage 기반 사용자 설정 저장
- **타입 안전성**: TypeScript 인터페이스 정의
- **컴포넌트 최적화**: 불필요한 import 및 코드 제거

## [2025-08-01] - UI 개선 및 기능 구현

### ✅ 완료된 기능
- 전체 섹션 한번에 접기/펼치기 토글 (헤더 우상단)
- '진행률' → '작성 진행률' 용어 변경
- 컴팩트 UI 디자인 (모든 섹션)
- 작업자 입력 섹션 3열 그리드 레이아웃 (작업자 2/3 + 공수 1/3)
- 작업자 헤더에 번호 표시 (작업자 1, 작업자 2...)
- 모바일 최적화 터치 타겟 (최소 44px)
- React controlled/uncontrolled input 오류 완전 해결
- NotificationDropdown import 오류 수정
- useEffect 무한 루프 오류 해결
- Next.js 서버 충돌 및 404 오류 해결
- 컴팩트 카드 레이아웃
- 2x2 통계 그리드
- 검색 인터페이스 통합
- 모바일 최적화 간격

