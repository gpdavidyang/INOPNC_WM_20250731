# 간격 시스템 가이드라인 (Spacing System Guidelines)

## 개요

INOPNC 작업 관리 시스템의 일관된 UI 디자인을 위한 Tailwind CSS 간격 시스템 표준입니다.

## 간격 시스템 표준

### 섹션 간격 (Section Spacing)
- **헤더-첫번째섹션**: `mb-4` (16px) - 페이지 헤더와 첫 번째 섹션 간의 간격
- **섹션-섹션 간격**: `space-y-1` (4px) - 모든 컨테이너 및 카드 간 표준 간격

### 컨테이너 패딩 (Container Padding)
- **좌우 가장자리**: `px-px` (1px) - 모바일 최소 패딩
- **컨테이너 내부**: `p-3` (12px) - 카드 및 컨테이너 내부 패딩

### 레이아웃 간격 (Layout Spacing)
- **조밀한 레이아웃**: `gap-1` (4px) - 그리드 및 플렉스 간격 (card grids, form controls)
- **표준 레이아웃**: `gap-2` (8px) - 일반적인 컴포넌트 간격
- **여유 레이아웃**: `gap-4` (16px) - 여백이 필요한 섹션

## 적용된 컴포넌트

### 메인 화면 컴포넌트
- `components/dashboard/dashboard-layout.tsx` - 메인 콘텐츠 영역 `space-y-1`
- `components/site-info/SiteInfoPageNew.tsx` - 탭 시스템 `space-y-1`, TabsList `mb-4`
- `components/admin/SiteManagement.tsx` - 메인 컨테이너 `space-y-1`
- `components/materials/npc1000/NPC1000DailyDashboard.tsx` - 전체 레이아웃 `space-y-3`, 그리드 `gap-2`

### NPC-1000 관리 페이지 세부 조정
- 헤더 섹션: `mb-4` (기본 헤더-섹션 간격)
- 상태 카드 그리드: `gap-2` (조밀한 카드 레이아웃)
- 카드 내부 패딩: `p-3` (표준 카드 패딩)
- 전체 컨테이너: `space-y-3` (섹션 간 적절한 간격)

## 사용법

### Tailwind CSS 클래스
```css
/* 섹션 간격 */
.space-y-1 > * + * { margin-top: 0.25rem; } /* 4px */

/* 그리드/플렉스 간격 */
.gap-1 { gap: 0.25rem; } /* 4px */
.gap-2 { gap: 0.5rem; }  /* 8px */

/* 패딩 */
.p-3 { padding: 0.75rem; } /* 12px */
.px-px { padding-left: 1px; padding-right: 1px; }
.mb-4 { margin-bottom: 1rem; } /* 16px */
```

### React 컴포넌트 적용 예시
```tsx
// 메인 컨테이너 - 섹션 간 표준 간격
<div className="space-y-1">
  <PageHeader className="mb-4" />
  <Card>...</Card>
  <Card>...</Card>
</div>

// 카드 그리드 - 조밀한 레이아웃
<div className="grid grid-cols-3 gap-2">
  <Card>
    <div className="p-3">...</div>
  </Card>
</div>
```

## 설계 원칙

1. **일관성**: 모든 화면에서 동일한 간격 시스템 적용
2. **밀도**: 건설 현장용 모바일 환경에 적합한 조밀한 레이아웃
3. **계층성**: 헤더 → 섹션 → 카드 → 내용 순서의 명확한 시각적 계층
4. **접근성**: Touch Mode(장갑, 정밀, 표준)에 따른 적응적 간격

## 업데이트 내역

### 2025-08-10: 간격 시스템 표준 적용
- 기존 `space-y-2` (8px)에서 `space-y-1` (4px)로 표준 변경
- NPC-1000 관리 페이지 밀도 개선 (space-y-6 → space-y-3, gap-4 → gap-2)
- 모든 메인 화면 컴포넌트에 새로운 표준 적용 완료

---
*이 문서는 INOPNC 작업 관리 시스템의 UI 일관성을 보장하기 위해 작성되었습니다.*