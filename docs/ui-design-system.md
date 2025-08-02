# INOPNC UI Design System

> 통합된 UI 디자인 시스템 문서입니다. 이 문서는 프로젝트의 모든 UI 관련 가이드라인을 통합합니다.

## 📚 문서 구조

### 1. 메인 가이드라인
- **위치**: `/UI_Guidelines.md`
- **목적**: 전체 프로젝트의 종합적인 UI 가이드라인
- **기반**: Toss Design System + 건설업 특화 기능
- **최신 버전**: v2.0.0 (2024-01)

### 2. JSON 스키마
- **위치**: `/UI_Guidelines.json`
- **목적**: 프로그래밍적 접근을 위한 구조화된 데이터
- **용도**: 
  - 자동화된 스타일 가이드 생성
  - 디자인 토큰 시스템
  - 컴포넌트 자동 생성

### 3. 모바일 디자인 참조
- **위치**: `/docs/mobile-design-guide.md`
- **목적**: 모바일 특화 디자인 참조 (레거시)
- **상태**: UI_Guidelines.md에 통합됨

## 🔄 동기화 규칙

### 마스터 문서
`UI_Guidelines.md`가 Single Source of Truth입니다.

### 업데이트 프로세스
1. 모든 UI 변경사항은 `UI_Guidelines.md`에 먼저 반영
2. `npm run sync:ui-guidelines` 실행하여 JSON 동기화
3. 변경 내역은 버전 히스토리에 기록

### 자동 동기화 (제안)
```json
// package.json
{
  "scripts": {
    "sync:ui-guidelines": "node scripts/sync-ui-guidelines.js",
    "prebuild": "npm run sync:ui-guidelines"
  }
}
```

## 🎨 디자인 시스템 요약

### 색상 시스템
- **Primary**: Toss Blue (#2563EB)
- **Neutral**: Gray scale
- **Semantic**: Success, Error, Warning, Info
- **Dark Mode**: 완전 지원

### 타이포그래피
- **Font**: System fonts + Noto Sans KR
- **Scale**: Display → Tiny (8단계)
- **Weight**: Normal → Bold (4단계)

### 컴포넌트
- **기본 컴포넌트**: Button, Card, Form, Navigation
- **산업 특화**: Daily Report, Attendance, Materials
- **모바일 최적화**: Bottom Nav, Touch Targets

### 접근성
- **터치 타겟**: 최소 44x44px
- **폰트 크기**: 동적 조절 지원
- **스크린 리더**: 완전 지원
- **키보드 네비게이션**: Focus visible

## 📱 모바일 우선 전략

### 반응형 브레이크포인트
- Mobile: < 640px (기본)
- Tablet: 640-1024px
- Desktop: > 1024px

### 레이아웃 전략
1. **모바일**: 단일 컬럼, 하단 네비게이션
2. **태블릿**: 2컬럼, 사이드 네비게이션
3. **데스크톱**: 다중 컬럼, 향상된 기능

## 🏗️ 건설업 특화 기능

### 역할 기반 UI
- Worker (작업자)
- Site Manager (현장 관리자)
- Customer Manager (고객 관리자)
- Admin (관리자)
- System Admin (시스템 관리자)

### 도메인 컴포넌트
- 일일 작업 보고서
- 출퇴근 관리
- 자재 관리 (NPC-1000)
- 날씨 정보
- 현장 선택

### 한국어 지원
- 모든 UI 텍스트 한국어
- 날짜: YYYY년 MM월 DD일
- 시간: 24시간제 (HH:mm)
- 통화: ₩ (원)

## 🔗 관련 링크

- [컴포넌트 라이브러리](/components/ui/)
- [모바일 컴포넌트](/components/mobile/)
- [디자인 토큰](/styles/tokens/)
- [Storybook](http://localhost:6006) (개발 시)

## 📝 변경 이력

### v2.1.0 (2024-12)
- UI 가이드라인 문서 통합
- 자동 동기화 시스템 제안
- 문서 구조 정리

### v2.0.0 (2024-01)
- Toss Design System 기반 재설계
- 구현된 데모 컴포넌트 반영

### v1.0.0 (2023-12)
- 초기 디자인 시스템 정의