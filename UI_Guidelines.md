# INOPNC Work Management System - UI Guidelines

## Overview
This document defines the comprehensive UI design system for the INOPNC construction work management platform, based on implemented demo components and the Toss design system principles.

## Design Philosophy

### Core Principles
1. **Mobile-First**: Every interface optimized for construction site mobile usage
2. **Accessibility-First**: Large touch targets, high contrast, screen reader support
3. **Role-Based UI**: Adaptive interfaces based on user roles (worker, manager, admin)
4. **Cultural Sensitivity**: Korean language and construction industry conventions

### Design System Foundation
- **Based on**: Toss Design System with construction industry adaptations
- **Component Architecture**: Composition-based with variant system
- **Theme Support**: Light/Dark/System modes with smooth transitions
- **Responsive Strategy**: Mobile-first with desktop enhancements

## Color System

### Primary Palette
```css
/* Core Brand Colors */
--toss-blue-500: #3182F6;    /* Primary actions, links */
--toss-blue-600: #2563EB;    /* Hover states */
--toss-blue-700: #1D4ED8;    /* Active states */

/* Neutral Colors */
--toss-gray-50: #F9FAFB;     /* Light backgrounds */
--toss-gray-100: #F3F4F6;    /* Secondary backgrounds */
--toss-gray-200: #E5E7EB;    /* Borders, dividers */
--toss-gray-700: #374151;    /* Body text */
--toss-gray-800: #1F2937;    /* Headings */
--toss-gray-900: #111827;    /* Dark backgrounds */

/* Semantic Colors */
--success: #10B981;          /* Success states */
--error: #EF4444;            /* Error states */
--warning: #F59E0B;          /* Warning states */
--info: #3B82F6;             /* Information */
```

### Dark Mode Colors
```css
/* Dark Mode Backgrounds */
dark:bg-gray-900             /* Primary background */
dark:bg-gray-800             /* Card backgrounds */
dark:bg-gray-700             /* Secondary backgrounds */

/* Dark Mode Text */
dark:text-gray-100           /* Primary text */
dark:text-gray-300           /* Secondary text */
dark:text-gray-400           /* Muted text */
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, "Noto Sans KR", sans-serif;
```

### Type Scale
| Level | Class | Size | Usage |
|-------|-------|------|-------|
| Display | `text-4xl` | 36px | Page titles |
| H1 | `text-3xl` | 30px | Major sections |
| H2 | `text-2xl` | 24px | Subsections |
| H3 | `text-xl` | 20px | Card headers |
| H4 | `text-lg` | 18px | List items |
| Body | `text-base` | 16px | Default text |
| Small | `text-sm` | 14px | Secondary info |
| Tiny | `text-xs` | 12px | Labels, hints |

### Font Weights
- `font-normal`: Body text (400)
- `font-medium`: Emphasis (500)
- `font-semibold`: Subheadings (600)
- `font-bold`: Headings (700)

### Mobile Font Size Adaptation
```typescript
// Dynamic font sizing for accessibility
const { isLargeFont } = useFontSize();
className={cn(
  "font-bold",
  isLargeFont ? "text-3xl" : "text-xl"
)}
```

## Spacing System

### Base Unit: 4px
| Name | Class | Size | Usage |
|------|-------|------|-------|
| xs | `p-1` | 4px | Icon padding |
| sm | `p-2` | 8px | Compact spacing |
| md | `p-3` | 12px | Default spacing |
| lg | `p-4` | 16px | Card padding |
| xl | `p-5` | 20px | Section padding |
| 2xl | `p-6` | 24px | Large sections |

### Component Spacing
- **Card Padding**: `p-4` (16px) standard, `p-5` (20px) emphasis
- **Grid Gaps**: `gap-3` (12px) for cards, `gap-4` (16px) for sections
- **Stack Spacing**: `space-y-4` (16px) vertical rhythm

## Component Design Patterns

### Button System
```typescript
// Variant-based button system
variants: {
  primary: "bg-toss-blue-600 hover:bg-toss-blue-700 text-white",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  ghost: "hover:bg-gray-100 text-gray-700",
  outline: "border-2 border-toss-blue-600 text-toss-blue-600"
}

// Size variants
sizes: {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-lg",
  full: "h-14 w-full text-lg"
}

// Interactive states
"active:scale-95 transition-all duration-200"
"disabled:opacity-50 disabled:cursor-not-allowed"
```

### Card Components
```css
/* Standard Card */
.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md 
         hover:shadow-lg transition-shadow duration-200;
}

/* Card with emphasis */
.card-emphasis {
  @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg 
         border border-gray-200 dark:border-gray-700;
}
```

### Form Controls
```css
/* Input fields */
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg
         focus:ring-2 focus:ring-toss-blue-500 focus:border-transparent
         dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}

/* Select dropdowns */
.select {
  @apply appearance-none bg-white dark:bg-gray-700 
         border border-gray-300 dark:border-gray-600;
}
```

### Mobile-Specific Patterns

#### Bottom Navigation
```css
/* Fixed bottom nav for mobile */
.bottom-nav {
  @apply fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800
         border-t border-gray-200 dark:border-gray-700
         grid grid-cols-4 pb-safe;
}

/* Nav items */
.nav-item {
  @apply flex flex-col items-center justify-center py-2
         min-h-[56px] active:bg-gray-100 dark:active:bg-gray-700;
}
```

#### Mobile Headers
```css
.mobile-header {
  @apply sticky top-0 z-50 bg-white dark:bg-gray-900
         border-b border-gray-200 dark:border-gray-700
         backdrop-blur-md bg-opacity-90;
}
```

## Animation & Transitions

### Standard Transitions
```css
/* Default transition */
transition-all duration-200 ease-in-out

/* Hover effects */
hover:shadow-lg transition-shadow duration-200
hover:scale-105 transition-transform duration-200

/* Active states */
active:scale-95 transition-transform duration-100
```

### Loading States
```css
/* Skeleton loading */
.skeleton {
  @apply animate-pulse bg-gray-200 dark:bg-gray-700 rounded;
}

/* Spinner */
.spinner {
  @apply animate-spin h-5 w-5 text-toss-blue-600;
}
```

## Accessibility Guidelines

### Touch Targets
- **Minimum Size**: 44x44px for all interactive elements
- **Spacing**: 8px minimum between touch targets
- **Visual Feedback**: Clear hover, focus, and active states

### Focus Management
```css
/* Focus visible only on keyboard navigation */
.focus-visible:ring-2 
.focus-visible:ring-toss-blue-500 
.focus-visible:ring-offset-2
```

### Screen Reader Support
- Semantic HTML structure
- Comprehensive ARIA labels
- Role attributes for complex components
- Live regions for dynamic updates

### Font Size Accessibility
- Built-in large font mode support
- Dynamic sizing based on user preferences
- Minimum 14px for body text

## Construction Industry Specifics

### Role-Based UI Adaptations
```typescript
// Navigation filtering
const filteredItems = items.filter(item => 
  item.roles.includes(userRole)
);
```

### Domain Components
1. **Daily Reports**: Multi-section forms with tabs
2. **Attendance**: Time tracking with visual indicators
3. **Materials**: Inventory management with units
4. **Weather**: Temperature and condition inputs
5. **Site Selection**: Multi-site support

### Korean Localization
- All UI text in Korean
- Date format: YYYY년 MM월 DD일
- Time format: 24-hour (HH:mm)
- Currency: ₩ (Korean Won)

## Responsive Design

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Layout Strategies
1. **Mobile (< 640px)**: Single column, bottom nav
2. **Tablet (640-1024px)**: Two columns, side nav
3. **Desktop (> 1024px)**: Multi-column, enhanced features

## Performance Guidelines

### Component Optimization
- Lazy load mobile components
- Use dynamic imports for route-based splitting
- Implement virtual scrolling for long lists
- Optimize images with next/image

### Bundle Size
- Separate mobile/desktop component bundles
- Tree-shake unused components
- Use CSS modules for component-specific styles

## Implementation Examples

### Basic Card Component
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 
                hover:shadow-lg transition-shadow duration-200">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
    Card Title
  </h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
    Card content goes here
  </p>
</div>
```

### Mobile-Optimized Button
```tsx
<button className="w-full min-h-[56px] px-4 py-3 
                   bg-toss-blue-600 hover:bg-toss-blue-700 
                   text-white font-medium rounded-lg
                   active:scale-95 transition-all duration-200
                   focus-visible:ring-2 focus-visible:ring-toss-blue-500">
  작업 시작하기
</button>
```

### Responsive Form Field
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
    작업 내용
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-toss-blue-500 focus:border-transparent
               dark:bg-gray-700 dark:border-gray-600 dark:text-white
               text-base md:text-sm"
    placeholder="작업 내용을 입력하세요"
  />
</div>
```

## Version History
- v2.0.0 (2024-01): Updated based on implemented demo components
- v1.0.0 (2023-12): Initial design system definition

