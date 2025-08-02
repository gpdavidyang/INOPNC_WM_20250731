# UI 가이드라인 문서 체계

## 개요
INOPNC 프로젝트의 UI 가이드라인은 이제 통합된 단일 시스템으로 관리됩니다.

## 문서 구조

### 1. 메인 가이드라인 (`/UI_Guidelines.md`)
- **역할**: Single Source of Truth
- **내용**: 전체 UI 디자인 시스템
- **버전**: v2.0.0 (2024-01)
- **기반**: Toss Design System + 건설업 특화

### 2. JSON 스키마 (`/UI_Guidelines.json`)
- **역할**: 프로그래밍적 접근용
- **내용**: UI_Guidelines.md의 구조화된 데이터
- **용도**: 
  - 디자인 토큰 시스템
  - 자동화된 스타일 가이드
  - 컴포넌트 생성기

### 3. 통합 가이드 (`/docs/ui-design-system.md`)
- **역할**: 문서 체계 안내
- **내용**: 전체 UI 시스템 개요 및 사용법

### 4. 하단 네비게이션 바 가이드 (`/docs/BottomNavBar_Guidelines.md`)
- **역할**: 모바일 하단 네비게이션 바 전용 가이드라인
- **내용**: 
  - 5개 메뉴 구성 및 동작 사양
  - 디자인 가이드라인 (레이아웃, 아이콘, 색상)
  - 플랫폼별 대응 (iOS, Android)
  - 접근성 및 성능 요구사항
- **연동**: PRD.md에 통합 완료

### 5. 레거시 문서 (`/docs/mobile-design-guide.md`)
- **상태**: 참조용으로만 유지
- **내용**: 모바일 특화 디자인 (UI_Guidelines.md에 통합됨)

## 사용 방법

### 1. UI 변경 시
```bash
# 1. UI_Guidelines.md 수정
# 2. 동기화 실행
npm run sync:ui-guidelines
```

### 2. 빌드 시 자동 동기화
```bash
npm run build
# prebuild 스크립트가 자동으로 sync:ui-guidelines 실행
```

### 3. 수동 동기화
```bash
npm run sync:ui-guidelines
```

## 업데이트 프로세스

### 1. 일반 UI 가이드라인 변경
1. **변경사항 작성**: `UI_Guidelines.md` 수정
2. **버전 업데이트**: 버전 번호 및 날짜 수정
3. **동기화 실행**: `npm run sync:ui-guidelines`
4. **검증**: JSON 파일이 올바르게 생성되었는지 확인
5. **커밋**: 모든 변경사항을 함께 커밋

### 2. 하단 네비게이션 바 가이드라인 변경
1. **가이드라인 수정**: `docs/BottomNavBar_Guidelines.md` 수정
2. **PRD 동기화**: 변경사항을 `PRD.md`에 반영
   - Navigation System 섹션 (2.2)
   - 모바일 특화 기능 섹션
   - 기술 아키텍처 섹션
3. **검증**: 모든 관련 문서가 일관성 있게 업데이트되었는지 확인
4. **커밋**: 모든 변경사항을 함께 커밋

## 주의사항

- `UI_Guidelines.json`을 직접 수정하지 마세요
- 모든 UI 변경은 `UI_Guidelines.md`에서 시작합니다
- 동기화 스크립트는 기본적인 파싱만 수행합니다
- 복잡한 구조는 수동으로 JSON을 검토해야 할 수 있습니다
- **하단 네비게이션 바 변경 시**: `BottomNavBar_Guidelines.md`와 `PRD.md`를 함께 업데이트해야 합니다
- 모바일 UI 관련 변경사항은 여러 문서에 영향을 줄 수 있으므로 주의 깊게 검토하세요

## 향후 개선사항

1. **고급 파싱**: Markdown AST를 사용한 정확한 파싱
2. **검증 시스템**: JSON 스키마 검증
3. **자동 생성**: JSON에서 TypeScript 타입 생성
4. **시각화**: 디자인 토큰 미리보기 페이지
5. **버전 관리**: 변경 이력 자동 추적