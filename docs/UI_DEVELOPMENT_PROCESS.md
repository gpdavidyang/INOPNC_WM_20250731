# UI 개발 프로세스 가이드

## 🎯 목표
UI 가이드라인 준수를 자동화하여 재작업을 최소화하고 일관된 UI 품질 유지

## 📋 개발 프로세스

### 1. Task 시작 시
```bash
# Task 정보 확인
task-master show <task-id>

# UI 컴포넌트가 필요한 경우
npm run create:component -- --name MyComponent --type card --mobile
```

### 2. 개발 중
- **VSCode 스니펫 활용**: `uicard`, `uibutton`, `uimobile`, `uiform` 입력
- **실시간 검증**: 저장 시 자동으로 린팅 및 포맷팅
- **Storybook 확인**: `npm run storybook`으로 시각적 검증

### 3. 커밋 전
```bash
# UI 가이드라인 검증
npm run validate:ui

# 자동 수정 가능한 이슈 해결
npm run ui:fix
```

### 4. Task 완료 시
```bash
# Task별 UI 검증 및 체크리스트 생성
npm run task:check <task-id>

# 모든 검증 통과 후
task-master set-status --id=<task-id> --status=done
```

## 🛠️ 자동화 도구

### 1. 컴포넌트 생성기
```bash
npm run create:component -- --name <name> [options]

옵션:
  --type <type>     컴포넌트 타입 (button, card, form, list)
  --mobile         모바일 버전 생성
  --domain <name>  도메인 (dashboard, daily-reports, materials)
```

생성되는 파일:
- `Component.tsx` - UI 가이드라인 준수 컴포넌트
- `types.ts` - TypeScript 타입 정의
- `Component.test.tsx` - 테스트 파일 (접근성 테스트 포함)
- `Component.stories.tsx` - Storybook 스토리

### 2. UI 검증기
```bash
npm run validate:ui
```

검증 항목:
- ✅ 색상 시스템 준수
- ✅ 타이포그래피 규칙
- ✅ 간격 시스템 (4px 단위)
- ✅ 접근성 표준
- ✅ 다크모드 지원
- ✅ 모바일 최적화

### 3. Pre-commit 훅
자동으로 실행되는 검증:
1. ESLint
2. TypeScript 체크
3. UI 가이드라인 검증
4. 테스트

### 4. Task 통합
```bash
npm run task:check <task-id>
```

기능:
- Task 정보 표시
- 변경된 컴포넌트 파일 확인
- UI 가이드라인 검증
- 스크린샷 제안
- 체크리스트 생성 및 저장

## 📊 검증 결과 해석

### 에러 (❌)
반드시 수정해야 하는 항목:
- 다크모드 미지원
- 모바일 최소 높이 미달
- 필수 접근성 속성 누락

### 경고 (⚠️)
권장사항:
- 하드코딩된 색상
- 비표준 간격 사용
- ARIA 라벨 누락

## 🔄 지속적 개선

### 월간 리뷰
1. UI 가이드라인 위반 통계 분석
2. 자주 발생하는 문제 파악
3. 가이드라인 업데이트
4. 도구 개선

### 피드백 수집
- 개발자 의견 수렴
- 사용성 테스트 결과 반영
- 고객 피드백 통합

## 💡 팁

### VSCode 설정
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### 디버깅
```bash
# 특정 파일만 검증
npm run validate:ui -- --file components/dashboard/Card.tsx

# 자세한 로그 출력
npm run validate:ui -- --verbose
```

## 📚 참고 자료
- [UI Guidelines](/UI_Guidelines.md)
- [컴포넌트 라이브러리](http://localhost:6006)
- [디자인 토큰](/UI_Guidelines.json)