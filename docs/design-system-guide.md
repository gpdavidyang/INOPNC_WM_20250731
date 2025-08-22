# INOPNC 디자인 시스템 가이드

## 개요

INOPNC 디자인 시스템은 건설 현장의 다양한 환경 조건과 사용자 요구사항에 맞춰 설계된 통합 UI 컴포넌트 시스템입니다. 일관된 디자인 언어를 제공하며, 접근성과 사용성을 최우선으로 고려합니다.

## 주요 특징

### 🎨 **일관된 디자인 언어**
- 통일된 색상 팔레트와 타이포그래피
- 일관된 간격과 레이아웃 시스템
- 표준화된 컴포넌트 변형

### ♿ **접근성 우선**
- WCAG 2.1 AA 기준 준수
- 고대비 모드 지원
- 키보드 네비게이션 최적화
- 스크린 리더 호환성

### 🏗️ **건설 현장 최적화**
- 다양한 환경 조건 적응
- 터치 모드별 최적화
- 장갑 착용 시 사용성 고려
- 햇빛, 비, 추위, 먼지 등 환경 대응

### 📱 **반응형 디자인**
- 모바일 우선 설계
- 다양한 화면 크기 지원
- 터치 친화적 인터페이스

## 설치 및 사용법

### 1. CSS 파일 import

```css
/* app/globals.css 또는 메인 CSS 파일에 추가 */
@import '../styles/design-system.css';
```

### 2. HTML에 테마 속성 설정

```html
<!-- 라이트 모드 -->
<html data-theme="light">

<!-- 다크 모드 -->
<html data-theme="dark">
```

### 3. 환경 모드 클래스 적용

```html
<!-- 터치 모드 -->
<div class="touch-mode-glove">장갑 모드</div>
<div class="touch-mode-precision">정밀 모드</div>

<!-- 환경 조건 -->
<div class="env-bright-sun">강한 햇빛</div>
<div class="env-rain">비</div>
<div class="env-cold">추위</div>
<div class="env-dust">먼지</div>
```

## 컴포넌트 시스템

### 🃏 **카드 (Card)**

#### 기본 사용법
```html
<div class="card">
  <h3>카드 제목</h3>
  <p>카드 내용</p>
</div>
```

#### 변형
```html
<!-- 고도 카드 -->
<div class="card card-elevated">내용</div>

<!-- 강조 카드 -->
<div class="card card-prominent">내용</div>

<!-- 섹션 헤더 카드 -->
<div class="card card-section-header">내용</div>
```

#### 그림자 레벨
```html
<div class="card card-elevation-sm">작은 그림자</div>
<div class="card card-elevation-md">중간 그림자</div>
<div class="card card-elevation-lg">큰 그림자</div>
<div class="card card-elevation-xl">매우 큰 그림자</div>
```

### 🔘 **버튼 (Button)**

#### 기본 사용법
```html
<button class="btn btn-primary">프라이머리 버튼</button>
<button class="btn btn-secondary">세컨더리 버튼</button>
<button class="btn btn-main">메인 버튼</button>
<button class="btn btn-muted">뮤티드 버튼</button>
```

#### 크기 변형
```html
<!-- 컴팩트 -->
<button class="btn btn-primary" style="height: 40px; padding: 0 12px; font-size: 14px;">
  컴팩트
</button>

<!-- 표준 (기본) -->
<button class="btn btn-primary">표준</button>

<!-- 필드 -->
<button class="btn btn-primary" style="height: 60px; padding: 0 24px; font-size: 18px;">
  필드
</button>

<!-- 크리티컬 -->
<button class="btn btn-primary" style="height: 64px; padding: 0 32px; font-size: 20px;">
  크리티컬
</button>
```

#### 전체 너비
```html
<button class="btn btn-primary w-full">전체 너비 버튼</button>
```

### 🏷️ **칩 (Chip)**

```html
<span class="chip chip-a">칩 A</span>
<span class="chip chip-b">칩 B</span>
<span class="chip chip-d">칩 D</span>
<span class="chip chip-e">칩 E</span>
```

### 📝 **폼 요소 (Form Elements)**

#### 입력 필드
```html
<input type="text" class="input" placeholder="텍스트를 입력하세요">
<input type="email" class="input" placeholder="이메일을 입력하세요">
```

#### 라벨과 함께 사용
```html
<label class="block text-sm font-medium mb-2">이메일</label>
<input type="email" class="input w-full" placeholder="이메일을 입력하세요">
```

### 📋 **리스트 (Row)**

```html
<div class="row">
  <div class="flex justify-between items-center">
    <span>리스트 아이템</span>
    <span class="chip chip-a">상태</span>
  </div>
</div>
```

### 📊 **상태 표시 (Status)**

```html
<div class="status-success">성공 상태</div>
<div class="status-warning">경고 상태</div>
<div class="status-error">오류 상태</div>
<div class="status-info">정보 상태</div>
```

## 레이아웃 시스템

### 컨테이너
```html
<div class="container">
  <!-- 최대 너비 390px, 중앙 정렬 -->
  <div class="card">내용</div>
</div>
```

### 섹션
```html
<section class="section">
  <h2>섹션 제목</h2>
  <div class="card">섹션 내용</div>
</section>
```

### 그리드
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="card">카드 1</div>
  <div class="card">카드 2</div>
  <div class="card">카드 3</div>
</div>
```

### 버튼 그룹
```html
<div class="btn-group">
  <button class="btn btn-primary">확인</button>
  <button class="btn btn-muted">취소</button>
</div>
```

## 환경 적응 시스템

### 터치 모드

#### 장갑 모드 (Glove Mode)
```html
<div class="touch-mode-glove">
  <div class="card">장갑 착용 시 최적화된 카드</div>
  <button class="btn btn-primary">큰 터치 타겟</button>
</div>
```

#### 정밀 모드 (Precision Mode)
```html
<div class="touch-mode-precision">
  <div class="card">정밀한 조작을 위한 카드</div>
  <button class="btn btn-primary">작은 터치 타겟</button>
</div>
```

### 환경 조건

#### 강한 햇빛
```html
<div class="env-bright-sun">
  <div class="card">대비와 밝기가 강화된 카드</div>
</div>
```

#### 비
```html
<div class="env-rain">
  <div class="card">비 환경에 최적화된 카드</div>
</div>
```

#### 추위
```html
<div class="env-cold">
  <div class="card">추위 환경에 최적화된 카드</div>
</div>
```

#### 먼지
```html
<div class="env-dust">
  <div class="card">먼지 환경에 최적화된 카드</div>
</div>
```

## 색상 시스템

### CSS 변수 사용
```css
:root {
  --primary: #0a84ff;
  --secondary: #40c4ff;
  --point: #0068FE;
  --btn-main: #1A254F;
  --btn-muted: #99A4BE;
}
```

### 유틸리티 클래스
```html
<div class="text-primary">주요 텍스트</div>
<div class="bg-primary">주요 배경</div>
<div class="border-default">기본 테두리</div>
```

## 접근성 기능

### 고대비 모드
```html
<div class="high-contrast">
  <div class="card">고대비 모드에서 최적화된 카드</div>
</div>
```

### 키보드 네비게이션
```html
<div class="keyboard-navigation">
  <button class="btn btn-primary">키보드 포커스 최적화</button>
</div>
```

### 스킵 링크
```html
<a href="#main-content" class="skip-link">메인 콘텐츠로 건너뛰기</a>
```

## 애니메이션 및 전환

### 기본 전환
```html
<div class="card theme-transition">부드러운 테마 전환</div>
```

### 호버 효과
```html
<div class="card elevation-hover">호버 시 그림자 변화</div>
```

### 펄스 애니메이션
```html
<div class="pulse-animation">긴급 상황 표시</div>
```

## 반응형 디자인

### 모바일 최적화
```css
@media (max-width: 370px) {
  .card {
    padding: 16px; /* 패딩 감소 */
  }
  
  .btn {
    height: 44px; /* 버튼 높이 감소 */
    font-size: 14px; /* 폰트 크기 감소 */
  }
}
```

### 터치 친화적
- 최소 터치 타겟: 44x44px
- 장갑 모드: 56x56px
- 정밀 모드: 44x44px

## 성능 최적화

### CSS 최적화
- CSS 변수 사용으로 일관성 유지
- 미디어 쿼리로 조건부 스타일 적용
- 불필요한 중복 제거

### 접근성 최적화
- `prefers-reduced-motion` 지원
- `prefers-contrast` 지원
- 포커스 가시성 최적화

## 브라우저 지원

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 데모 페이지

디자인 시스템의 모든 기능을 확인하려면 다음 페이지를 방문하세요:

```
/design-system-demo
```

## 문제 해결

### 스타일이 적용되지 않는 경우
1. CSS 파일이 올바르게 import되었는지 확인
2. 클래스명이 정확한지 확인
3. CSS 우선순위 충돌 확인

### 테마가 변경되지 않는 경우
1. `data-theme` 속성이 올바르게 설정되었는지 확인
2. JavaScript로 테마 변경 시 `document.documentElement.setAttribute` 사용

### 환경 모드가 작동하지 않는 경우
1. 환경 클래스가 올바르게 적용되었는지 확인
2. 부모 요소에 환경 클래스가 있는지 확인

## 기여하기

디자인 시스템 개선을 위한 제안이나 버그 리포트는 개발팀에 문의해 주세요.

## 라이선스

이 디자인 시스템은 INOPNC 내부 사용을 위해 개발되었습니다.
