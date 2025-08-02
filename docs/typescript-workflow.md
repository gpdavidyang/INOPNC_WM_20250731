# TypeScript 워크플로우 개선 가이드

## 개요

이 문서는 TypeScript 컴파일 오류를 효율적으로 해결하기 위한 자동화 도구와 워크플로우를 설명합니다.

## 문제점 분석

이전 작업에서 확인된 문제점:
- 18회의 빌드 실행 (각 30-60초 소요)
- 동일한 패턴의 오류를 개별적으로 수정
- 총 10-15분의 빌드 시간 소모
- 많은 토큰 소비

## 개선된 워크플로우

### 1. 통합 타입 체크 명령어

```bash
# 기본 타입 체크
npm run type-check

# 자동 수정 포함
npm run type-check:fix

# Watch 모드 (실시간 감시)
npm run type-check:watch
```

### 2. 타입 오류 분석

```bash
# 오류 패턴 분석
npm run analyze:types

# 상세 리포트 생성
npm run analyze:types > typescript-error-report.md
```

### 3. 자동 수정 도구

```bash
# 일반적인 오류 자동 수정
npm run fix:types

# 수정 사항 미리보기
npm run fix:types:preview
```

## 자동 수정 가능한 패턴

1. **Button 컴포넌트 속성**
   - `variant="default"` → `variant="primary"`
   - `size="icon"` → `size="sm"`

2. **Badge 컴포넌트 속성**
   - `variant="destructive"` → `variant="error"`

3. **Set 구문**
   - `[...new Set()]` → `Array.from(new Set())`

4. **Supabase 타입**
   - `supabase.from()` → `(supabase as any).from()`

5. **Navigator API**
   - `navigator.msSaveBlob` → `(navigator as any).msSaveBlob`

6. **CronJob DateTime**
   - `.nextDate().toISOString()` → `.nextDate().toJSDate().toISOString()`

## Pre-commit Hook

커밋 시 자동으로 타입 체크가 실행됩니다:
- 오류 발견 시 커밋 차단
- 자동 수정 명령어 안내
- 문서 동기화 검증과 함께 실행

## 권장 개발 프로세스

1. **개발 중**: `npm run type-check:watch` 실행
2. **커밋 전**: `npm run type-check:fix` 실행
3. **문제 분석**: `npm run analyze:types` 확인
4. **수동 수정**: 자동 수정이 불가능한 오류 처리

## 파일 구조

```
scripts/
├── type-check.js         # 통합 타입 체크 도구
├── analyze-ts-errors.js  # 오류 패턴 분석기
└── fix-common-errors.js  # 자동 수정 스크립트

types/
└── supabase-extended.d.ts # Supabase 타입 확장
```

## 주의사항

- 자동 수정은 일반적인 패턴만 처리 가능
- 복잡한 타입 오류는 수동 수정 필요
- 수정 전 항상 변경사항 확인 권장
- `--dry-run` 옵션으로 미리보기 가능

## 성능 개선 효과

- 빌드 횟수: 18회 → 1-2회
- 소요 시간: 10-15분 → 1-2분
- 토큰 소비: 대폭 감소
- 오류 수정: 자동화로 인한 일관성 향상