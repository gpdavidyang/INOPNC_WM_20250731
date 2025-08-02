# 모바일 UI 디자인 가이드

> 이 문서는 INOPNC 모바일 UI의 디자인 표준을 정의합니다. 실제 구현이 아닌 디자인 참조용입니다.

## 🎨 색상 팔레트

### Primary Colors
```css
/* 메인 브랜드 색상 */
--primary: #2563eb (blue-600)
--primary-hover: #1d4ed8 (blue-700)
--primary-light: #dbeafe (blue-100)
```

### Background Colors
```css
/* Light Mode */
--bg-primary: #ffffff (white)
--bg-secondary: #f9fafb (gray-50)
--bg-card: #ffffff (white)

/* Dark Mode */
--bg-primary-dark: #030712 (gray-950)
--bg-secondary-dark: #111827 (gray-900)
--bg-card-dark: #1f2937 (gray-800)
```

### Text Colors
```css
/* Light Mode */
--text-primary: #111827 (gray-900)
--text-secondary: #6b7280 (gray-600)
--text-muted: #9ca3af (gray-400)

/* Dark Mode */
--text-primary-dark: #f9fafb (gray-50)
--text-secondary-dark: #d1d5db (gray-300)
--text-muted-dark: #6b7280 (gray-500)
```

### Status Colors
```css
--success: #22c55e (green-500)
--warning: #f59e0b (amber-500)
--error: #ef4444 (red-500)
--info: #3b82f6 (blue-500)
```

## 📐 레이아웃 구조

### 기본 구조
```
┌─────────────────────────┐
│      Header (h-14)      │  고정 상단
├─────────────────────────┤
│                         │
│                         │
│     Main Content        │  스크롤 가능
│     (pb-16)            │
│                         │
│                         │
├─────────────────────────┤
│   Bottom Nav (h-16)     │  고정 하단
└─────────────────────────┘
```

### 여백 및 간격
- **페이지 패딩**: `p-4` (16px)
- **섹션 간격**: `space-y-6` (24px)
- **카드 간격**: `gap-3` (12px)
- **카드 내부 패딩**: `p-4` (16px)

## 🧩 컴포넌트 스타일

### 헤더
```css
.mobile-header {
  height: 56px; /* h-14 */
  background: white;
  border-bottom: 1px solid #e5e7eb; /* border-gray-200 */
  position: fixed;
  top: 0;
  z-index: 50;
}

/* 다크모드 */
.mobile-header.dark {
  background: #111827; /* gray-900 */
  border-color: #1f2937; /* gray-800 */
}
```

### 하단 네비게이션
```css
.mobile-bottom-nav {
  height: 64px; /* h-16 */
  background: white;
  border-top: 1px solid #e5e7eb;
  position: fixed;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.nav-item.active {
  color: #2563eb; /* blue-600 */
}
```

### 카드
```css
.mobile-card {
  background: white;
  border-radius: 8px; /* rounded-lg */
  padding: 16px; /* p-4 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mobile-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 다크모드 */
.mobile-card.dark {
  background: #1f2937; /* gray-800 */
  border: 1px solid #374151; /* gray-700 */
}
```

### 버튼
```css
.mobile-button {
  padding: 8px 16px;
  border-radius: 8px; /* rounded-lg */
  font-weight: 500;
  transition: all 0.2s;
}

.mobile-button.primary {
  background: #2563eb; /* blue-600 */
  color: white;
}

.mobile-button.primary:hover {
  background: #1d4ed8; /* blue-700 */
}

.mobile-button.outline {
  border: 1px solid #e5e7eb; /* border-gray-200 */
  background: transparent;
}
```

### 뱃지
```css
.mobile-badge {
  padding: 2px 8px;
  border-radius: 9999px; /* rounded-full */
  font-size: 12px; /* text-xs */
  font-weight: 500;
}

.mobile-badge.success {
  background: #dcfce7; /* green-100 */
  color: #166534; /* green-800 */
}

.mobile-badge.warning {
  background: #fef3c7; /* amber-100 */
  color: #92400e; /* amber-800 */
}

.mobile-badge.error {
  background: #fee2e2; /* red-100 */
  color: #991b1b; /* red-800 */
}
```

## 📱 반응형 디자인

### 모바일 우선 접근
- 기본 스타일은 모바일 기준
- 태블릿/데스크톱은 미디어 쿼리로 확장

### 브레이크포인트
```css
/* 모바일 (기본) */
/* 0 - 639px */

/* 태블릿 */
@media (min-width: 640px) { /* sm: */ }

/* 데스크톱 */
@media (min-width: 1024px) { /* lg: */ }
```

## 🌓 다크모드

### Tailwind CSS 클래스 사용
```html
<!-- 라이트/다크 모드 자동 전환 -->
<div class="bg-white dark:bg-gray-900">
  <h1 class="text-gray-900 dark:text-white">제목</h1>
  <p class="text-gray-600 dark:text-gray-300">내용</p>
</div>
```

### 다크모드 색상 매핑
| 라이트 모드 | 다크 모드 |
|------------|----------|
| bg-white | dark:bg-gray-900 |
| bg-gray-50 | dark:bg-gray-950 |
| text-gray-900 | dark:text-white |
| text-gray-600 | dark:text-gray-300 |
| border-gray-200 | dark:border-gray-800 |

## 🎯 사용 예시

### 모바일 화면 기본 구조
```html
<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
  <!-- 헤더 -->
  <header class="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
    <!-- 헤더 내용 -->
  </header>

  <!-- 메인 콘텐츠 -->
  <main class="pt-14 pb-16 px-4">
    <!-- 콘텐츠 -->
  </main>

  <!-- 하단 네비게이션 -->
  <nav class="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
    <!-- 네비게이션 아이템 -->
  </nav>
</div>
```

### 카드 컴포넌트 예시
```html
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
  <h3 class="font-semibold text-gray-900 dark:text-white">카드 제목</h3>
  <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">카드 내용</p>
</div>
```

## ⚠️ 주의사항

1. **이것은 디자인 가이드입니다** - 실제 구현 코드가 아닙니다
2. **참조용으로만 사용** - 실제 개발 시 이 가이드를 기반으로 구현
3. **백엔드 연결 없음** - 모든 예시는 정적 UI만 표현
4. **컴포넌트 재사용 금지** - 각 프로젝트에서 필요에 따라 새로 구현

## 📝 업데이트 이력

- 2024-03-15: 초기 가이드 작성
- 색상 팔레트, 레이아웃, 기본 컴포넌트 정의
- 다크모드 가이드라인 추가