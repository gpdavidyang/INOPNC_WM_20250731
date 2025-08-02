# INOPNC Work Management System - UI Guidelines

## Overview
This document defines the comprehensive UI design system for the INOPNC construction work management platform, optimized for mobile field workers with construction-specific patterns and high-density information layouts.

## Design Philosophy

### Core Principles
1. **Mobile-First Field Worker Focus**: Every interface optimized for construction site conditions and field worker needs
2. **High-Density Information**: Maximize information visibility while maintaining usability in confined spaces
3. **Glove-Friendly Touch Targets**: Large, accessible touch areas for workers wearing protective equipment
4. **Environmental Resilience**: High contrast modes for outdoor sunlight visibility and dust/water resistant patterns
5. **Quick Action Priority**: Fast access to common construction tasks and data entry
6. **Role-Based UI**: Adaptive interfaces for workers, site managers, and office staff
7. **Cultural & Industry Sensitivity**: Korean language and construction industry conventions

### Design System Foundation
- **Based on**: Toss Design System with construction field worker adaptations
- **Component Architecture**: Composition-based with high-density variants
- **Theme Support**: Light/Dark/High-Contrast modes with construction environment optimization
- **Responsive Strategy**: Mobile-first with tablet and desktop progressive enhancement
- **Field Optimization**: Dust/water resistant UI patterns and sunlight visibility

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

### Construction Environment Colors
```css
/* High Contrast Mode (Sunlight Visibility) */
--contrast-primary: #0052CC;    /* Deep blue for high contrast */
--contrast-success: #006644;    /* Deep green for success states */
--contrast-error: #CC1100;      /* Deep red for errors */
--contrast-warning: #CC7700;    /* Deep orange for warnings */
--contrast-text: #000000;       /* Pure black text */
--contrast-bg: #FFFFFF;         /* Pure white background */

/* Weather/Dust Resistant Colors */
--weather-sunny: #FF8800;       /* Sunny day indicator */
--weather-cloudy: #6B7280;      /* Cloudy day indicator */
--weather-rainy: #3B82F6;       /* Rainy day indicator */
--dust-overlay: rgba(0,0,0,0.8); /* Dust protection overlay */
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

/* High Contrast Dark Mode */
.high-contrast.dark {
  --bg-primary: #000000;      /* Pure black */
  --text-primary: #FFFFFF;    /* Pure white */
  --border-color: #FFFFFF;    /* White borders */
}
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

### Mobile-First Field Worker Spacing

#### Base Unit: 2px (Compact Mobile)
| Name | Class | Size | Mobile Usage | Desktop Usage |
|------|-------|------|--------------|---------------|
| xs | `p-0.5` | 2px | Icon padding, tight layouts | Detail spacing |
| sm | `p-1` | 4px | Minimal spacing | Icon padding |
| md | `p-1.5` | 6px | Compact content spacing | Compact spacing |
| lg | `p-2` | 8px | Standard mobile spacing | Default spacing |
| xl | `p-3` | 12px | Mobile card padding | Card padding |
| 2xl | `p-4` | 16px | Mobile section padding | Section padding |

#### High-Density Information Layout
- **Compact Card Padding**: `p-3` (12px) for all layouts - consistency across mobile and desktop
- **Tight Grid Gaps**: `gap-2` (8px) for all layouts - optimized information density
- **Dense Stack Spacing**: `space-y-2` (8px) for all layouts - minimal vertical waste
- **Form Field Spacing**: `space-y-1.5` (6px) for all layouts - compact form design
- **Section Headers**: `text-base` (16px) for primary sections, `text-sm` (14px) for subsections
- **Icon Sizing**: `h-5 w-5` (20px) for section icons, `h-4 w-4` (16px) for inline icons

#### Touch Target Optimization

##### Core Touch Target Standards
- **Minimum Touch Area**: 48px × 48px (iOS/Android standard)
- **Construction Field Standard**: 60px × 60px (glove-friendly, safety equipment)
- **Critical Action Standard**: 64px × 64px (emergency actions, primary CTAs)
- **Dense Layout Standard**: 44px × 44px (secondary actions in lists)

##### Touch Target Spacing
- **Minimum Gap**: 8px between interactive elements
- **Recommended Gap**: 12px for comfortable use
- **Construction Field Gap**: 16px for glove-friendly interaction
- **Dense Layout Gap**: 4px (list items, toolbar buttons)

##### Button Height Standards
```css
/* Interactive Element Heights */
.btn-compact     { min-height: 40px; }  /* Dense layouts only */
.btn-standard    { min-height: 48px; }  /* Default mobile buttons */
.btn-field       { min-height: 60px; }  /* Construction field use */
.btn-critical    { min-height: 64px; }  /* Primary actions, emergency */
.btn-full-width  { min-height: 56px; }  /* Full-width form buttons */
```

##### Touch Zone Classifications
```typescript
// Touch zone types for different use cases
interface TouchZone {
  comfortable: '60px × 60px',    // One-handed comfortable reach
  reachable: '48px × 48px',      // Standard reachable area
  dense: '44px × 44px',          // Information-dense areas
  critical: '64px × 64px'        // Emergency/primary actions
}
```

##### Thumb Zone Optimization
```css
/* Optimal thumb reach areas (portrait orientation) */
.thumb-zone-primary {
  /* Bottom 200px height, easily reachable with thumb */
  bottom: 80px;
  height: 200px;
}

.thumb-zone-secondary {
  /* Middle area, requires slight stretch */
  bottom: 280px;
  height: 150px;
}

.thumb-zone-difficult {
  /* Top area, requires two-handed use */
  top: 0;
  height: 200px;
}
```

##### Environmental Adaptation
```css
/* Glove-friendly mode (activated in construction settings) */
.glove-mode .interactive-element {
  min-height: 60px;
  min-width: 60px;
  padding: 16px;
  margin: 8px;
}

/* High-precision mode (office/management use) */
.precision-mode .interactive-element {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
  margin: 4px;
}
```

### Construction-Specific Spacing
```css
/* Field Form Layouts */
.field-form {
  @apply space-y-1.5 md:space-y-2;  /* Compact vertical rhythm */
}

/* Information Density */
.info-dense {
  @apply p-2 space-y-1 md:p-3 md:space-y-1.5;  /* High information density */
}

/* Quick Action Areas */
.quick-actions {
  @apply p-1.5 gap-1.5 md:p-2 md:gap-2;  /* Fast access buttons */
}
```

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

## Accessibility Guidelines (WCAG 2.1 AA Compliance)

### Core Accessibility Principles

#### 1. Perceivable
All information and UI components must be presentable to users in ways they can perceive.

##### Color & Contrast Standards
```css
/* Color contrast ratios (WCAG 2.1 AA) */
--text-normal: 4.5:1;        /* Normal text minimum */
--text-large: 3:1;           /* Large text (18px+ or 14px+ bold) minimum */
--ui-components: 3:1;        /* Non-text elements (buttons, icons) */
--enhanced-contrast: 7:1;    /* AAA level for critical text */

/* High contrast mode for construction environments */
.high-contrast {
  --bg-primary: #FFFFFF;
  --text-primary: #000000;
  --accent-primary: #0052CC;
  --border-primary: #000000;
  color-scheme: light;
}

.high-contrast.dark {
  --bg-primary: #000000;
  --text-primary: #FFFFFF;
  --accent-primary: #66B2FF;
  --border-primary: #FFFFFF;
  color-scheme: dark;
}
```

##### Typography Accessibility
```css
/* Minimum font sizes for accessibility */
.text-accessible-base { font-size: 16px; line-height: 1.5; }  /* Body text */
.text-accessible-large { font-size: 18px; line-height: 1.4; } /* Large text */
.text-accessible-caption { font-size: 14px; line-height: 1.6; } /* Minimum for UI text */

/* Large font mode (125% scaling) */
.large-font-mode .text-accessible-base { font-size: 20px; }
.large-font-mode .text-accessible-large { font-size: 22px; }
.large-font-mode .text-accessible-caption { font-size: 18px; }
```

##### Visual Indicators
- **Never rely on color alone** for important information
- **Include icons, patterns, or text** alongside color coding
- **Provide multiple visual cues** for state changes
- **Support forced-colors mode** (Windows High Contrast)

#### 2. Operable
UI components and navigation must be operable by all users.

##### Keyboard Navigation
```tsx
// Focus management for complex components
const FocusableComponent = ({ children, ...props }) => {
  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      {...props}
    >
      {children}
    </div>
  );
};
```

##### Touch Target Standards
```css
/* WCAG 2.1 AA compliant touch targets */
.touch-target-minimum {
  min-height: 44px;
  min-width: 44px;
}

/* Construction field optimized */
.touch-target-field {
  min-height: 60px;
  min-width: 60px;
  padding: 16px;
}

/* Critical action targets */
.touch-target-critical {
  min-height: 64px;
  min-width: 64px;
  padding: 20px;
}
```

##### Motion & Animation Controls
```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Safe animations that respect motion preferences */
.safe-animation {
  transition: opacity 0.2s ease;
}

@media (prefers-reduced-motion: no-preference) {
  .safe-animation {
    transition: all 0.2s ease;
    transform: translateY(0);
  }
}
```

#### 3. Understandable
Information and operation of UI must be understandable.

##### Form Accessibility
```tsx
// Accessible form field pattern
const AccessibleFormField = ({ label, error, required, ...props }) => {
  const id = useId();
  const errorId = `${id}-error`;
  
  return (
    <div className="form-field">
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...props}
      />
      {error && (
        <div id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};
```

##### Error Handling & Feedback
```tsx
// Accessible error and success messaging
const AccessibleAlert = ({ type, message, onDismiss }) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "p-4 rounded-lg border-l-4 flex items-start gap-3",
        type === 'error' && "bg-red-50 border-red-400 text-red-800",
        type === 'success' && "bg-green-50 border-green-400 text-green-800",
        type === 'warning' && "bg-yellow-50 border-yellow-400 text-yellow-800"
      )}
    >
      <Icon className="flex-shrink-0 w-5 h-5 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
          aria-label="알림 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
```

#### 4. Robust
Content must be robust enough to be interpreted by a wide variety of user agents.

##### Semantic HTML Structure
```tsx
// Proper semantic structure
const AccessiblePage = () => {
  return (
    <div>
      <header role="banner">
        <nav role="navigation" aria-label="주 메뉴">
          {/* Navigation items */}
        </nav>
      </header>
      
      <main role="main">
        <h1>페이지 제목</h1>
        
        <section aria-labelledby="section-1">
          <h2 id="section-1">섹션 제목</h2>
          {/* Section content */}
        </section>
      </main>
      
      <aside role="complementary" aria-label="부가 정보">
        {/* Sidebar content */}
      </aside>
      
      <footer role="contentinfo">
        {/* Footer content */}
      </footer>
    </div>
  );
};
```

##### ARIA Implementation
```tsx
// Complex component with proper ARIA
const AccessibleDropdown = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="dropdown-label"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        {value || '선택해주세요'}
        <ChevronDown className="float-right w-4 h-4 mt-0.5" />
      </button>
      
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby="dropdown-label"
          className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100",
                value === option.value && "bg-blue-50 text-blue-700",
                focusedIndex === index && "bg-gray-100"
              )}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### Construction-Specific Accessibility

#### Environmental Considerations
```css
/* Sunlight readability mode */
.sunlight-mode {
  filter: contrast(150%) brightness(110%);
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
}

/* Dust/water resistant interaction patterns */
.weather-resistant {
  /* Larger touch targets for gloved hands */
  min-height: 60px;
  min-width: 60px;
  
  /* High contrast for visibility */
  border: 2px solid currentColor;
  
  /* Clear visual states */
  transition: all 0.1s ease;
}

.weather-resistant:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
```

#### Voice and Gesture Support
```tsx
// Voice command integration
const VoiceCommandButton = ({ command, onCommand }) => {
  useEffect(() => {
    // Voice recognition setup for construction commands
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes(command)) {
        onCommand();
      }
    };
    
    return () => recognition.abort();
  }, [command, onCommand]);
  
  return (
    <button
      className="voice-command-btn"
      aria-label={`음성 명령: "${command}" 또는 터치하여 실행`}
    >
      <Mic className="w-5 h-5" />
      {command}
    </button>
  );
};
```

### Accessibility Testing Checklist

#### Automated Testing
```bash
# Include accessibility testing in CI/CD
npm install --save-dev @axe-core/playwright jest-axe

# Lighthouse accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

#### Manual Testing Requirements
- [ ] **Keyboard-only navigation** test all interactive elements
- [ ] **Screen reader compatibility** (NVDA, JAWS, VoiceOver)
- [ ] **High contrast mode** testing (Windows/macOS)
- [ ] **Mobile accessibility** with TalkBack/VoiceOver
- [ ] **Large font testing** at 200% zoom
- [ ] **Motion sensitivity** testing with reduced motion
- [ ] **Color blindness** testing with color filters
- [ ] **Construction environment** testing with simulated conditions

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

# Mobile-First Field Worker UI

## Core Mobile Patterns

### High-Density Information Cards
Optimized for maximum information in minimum screen space while maintaining touch accessibility.

#### Before/After Comparison
**Before (Standard Density):**
```tsx
<div className="bg-white rounded-lg shadow-md p-4 space-y-4">
  <h3 className="text-lg font-semibold">작업일지</h3>
  <div className="space-y-3">
    <div className="flex justify-between">
      <span>현장:</span>
      <span>서울 아파트 현장</span>
    </div>
    <div className="flex justify-between">
      <span>날짜:</span>
      <span>2025-01-15</span>
    </div>
  </div>
</div>
```

**After (High-Density):**
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-semibold text-gray-900">작업일지</h3>
    <Badge variant="primary" className="text-xs">진행중</Badge>
  </div>
  <div className="grid grid-cols-2 gap-2 text-xs">
    <div>
      <span className="text-gray-600 block">현장</span>
      <span className="font-medium">서울 아파트 현장</span>
    </div>
    <div>
      <span className="text-gray-600 block">날짜</span>
      <span className="font-medium">2025-01-15</span>
    </div>
  </div>
</div>
```

### Construction-Specific Widgets

#### Weather Information Widget
```tsx
<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Thermometer className="h-4 w-4 text-blue-600" />
      <span className="text-xs font-medium text-gray-700">현재 날씨</span>
    </div>
    <div className="text-right">
      <div className="text-lg font-bold text-blue-700">23°C</div>
      <div className="text-xs text-blue-600">맑음</div>
    </div>
  </div>
  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
    <div className="text-center">
      <div className="text-gray-600">습도</div>
      <div className="font-medium">65%</div>
    </div>
    <div className="text-center">
      <div className="text-gray-600">바람</div>
      <div className="font-medium">2m/s</div>
    </div>
    <div className="text-center">
      <div className="text-gray-600">강수</div>
      <div className="font-medium">0%</div>
    </div>
  </div>
</div>
```

#### Material Counter Widget
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-3">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <Package className="h-4 w-4 text-green-600" />
      <span className="text-sm font-semibold">NPC-1000</span>
    </div>
    <Badge variant="success" className="text-xs">충분</Badge>
  </div>
  <div className="grid grid-cols-3 gap-2 text-xs">
    <div className="text-center bg-gray-50 rounded-lg p-2">
      <div className="text-gray-600">입고</div>
      <div className="text-lg font-bold text-blue-600">150</div>
    </div>
    <div className="text-center bg-gray-50 rounded-lg p-2">
      <div className="text-gray-600">사용</div>
      <div className="text-lg font-bold text-orange-600">45</div>
    </div>
    <div className="text-center bg-gray-50 rounded-lg p-2">
      <div className="text-gray-600">재고</div>
      <div className="text-lg font-bold text-green-600">105</div>
    </div>
  </div>
</div>
```

#### Worker List Compact View
```tsx
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-700">작업자 현황</span>
      <Badge variant="primary" className="text-xs">5명 출근</Badge>
    </div>
  </div>
  <div className="divide-y divide-gray-100">
    {workers.map((worker) => (
      <div key={worker.id} className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-700">
              {worker.name.charAt(0)}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium">{worker.name}</div>
            <div className="text-xs text-gray-500">{worker.role}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">근무시간</div>
          <div className="text-sm font-medium">{worker.hours}h</div>
        </div>
      </div>
    ))}
  </div>
</div>
```

### Collapsible Sections for Information Hierarchy
```tsx
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-600 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
```

### Quick Action Patterns

#### Floating Action Button (FAB) for Primary Actions
```tsx
<button className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 
                   text-white rounded-full shadow-lg hover:shadow-xl 
                   flex items-center justify-center z-40
                   active:scale-95 transition-all duration-200">
  <Plus className="h-6 w-6" />
</button>
```

#### Quick Entry Form (Minimized)
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-3">
  <div className="flex items-center gap-2">
    <input
      type="text"
      placeholder="빠른 메모 추가..."
      className="flex-1 px-3 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500"
    />
    <Button size="sm" className="px-3 py-2 min-h-[36px]">
      <Send className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### Environmental Adaptation Patterns

#### High Contrast Mode Toggle
```tsx
<button className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={() => toggleHighContrast()}>
  <Sun className="h-5 w-5" />
  <span className="sr-only">고대비 모드 전환</span>
</button>

/* High contrast styles */
.high-contrast {
  --bg-primary: #FFFFFF;
  --text-primary: #000000;
  --border-primary: #000000;
  --button-primary: #0052CC;
}
```

#### Dust Protection Overlay
```tsx
const DustProtectionOverlay = ({ isActive, children }) => (
  <div className={cn(
    "relative",
    isActive && "before:absolute before:inset-0 before:bg-black/10 before:pointer-events-none"
  )}>
    {children}
    {isActive && (
      <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
        먼지 보호 모드
      </div>
    )}
  </div>
)
```

## Implementation Examples

### High-Density Card Component
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 p-3 
                hover:shadow-md transition-shadow duration-200">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
      작업일지 #001
    </h3>
    <Badge variant="primary" className="text-xs">진행중</Badge>
  </div>
  <div className="grid grid-cols-2 gap-2 text-xs">
    <div>
      <span className="text-gray-600 dark:text-gray-400 block">현장</span>
      <span className="font-medium">서울 아파트</span>
    </div>
    <div>
      <span className="text-gray-600 dark:text-gray-400 block">작업자</span>
      <span className="font-medium">5명</span>
    </div>
  </div>
</div>
```

### Glove-Friendly Button
```tsx
<button className="w-full min-h-[56px] px-4 py-3 
                   bg-toss-blue-600 hover:bg-toss-blue-700 active:bg-toss-blue-800
                   text-white font-medium rounded-xl
                   active:scale-95 transition-all duration-200
                   focus-visible:ring-4 focus-visible:ring-toss-blue-500/50
                   touch-manipulation">
  작업 시작하기
</button>
```

### Compact Responsive Form Field
```tsx
<div className="space-y-1.5">
  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block">
    작업 내용 <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    className="w-full h-11 px-3 text-sm bg-gray-50 border border-gray-300 rounded-xl
               focus:bg-white focus:ring-2 focus:ring-toss-blue-500 focus:border-transparent
               dark:bg-gray-700 dark:border-gray-600 dark:text-white
               placeholder-gray-500 touch-manipulation"
    placeholder="작업 내용을 입력하세요"
  />
</div>
```

### Mobile Bottom Sheet Action Menu
```tsx
<div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl p-6 pb-8 shadow-2xl z-50
                animate-in slide-in-from-bottom-full duration-300">
  <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
  <h3 className="text-lg font-semibold text-center mb-6">작업 옵션</h3>
  <div className="space-y-3">
    <button className="w-full h-14 bg-blue-50 hover:bg-blue-100 
                       rounded-xl flex items-center justify-center gap-3 
                       text-blue-700 font-medium transition-colors">
      <Camera className="h-5 w-5" />
      사진 촬영
    </button>
    <button className="w-full h-14 bg-green-50 hover:bg-green-100 
                       rounded-xl flex items-center justify-center gap-3 
                       text-green-700 font-medium transition-colors">
      <FileText className="h-5 w-5" />
      작업일지 작성
    </button>
  </div>
</div>
```

### Quick Menu Component (빠른메뉴)
The customizable quick menu component allows users to personalize their dashboard with frequently used functions.

#### Features
- **Customizable Layout**: Users can select up to 8 menu items from 12 available options
- **Settings Modal**: Dedicated configuration interface with visual feedback
- **Persistent Storage**: User preferences saved to localStorage
- **Dynamic Icons**: Each menu item has unique color-coded icons
- **Grid Layout**: 2-column responsive grid optimized for mobile
- **Compact Design**: Reduced padding and font sizes for maximum information density

#### Available Menu Items
1. **출근현황** (Attendance) - Calendar icon, blue color
2. **내문서함** (Documents) - Folder icon, green color  
3. **현장정보** (Site Info) - Map pin icon, purple color
4. **공도면** (Shared Documents) - Share icon, orange color
5. **작업일지** (Daily Reports) - File text icon, indigo color
6. **작업자관리** (Workers) - Users icon, emerald color
7. **통계현황** (Statistics) - Bar chart icon, cyan color
8. **자재관리** (Materials) - Truck icon, amber color
9. **안전관리** (Safety) - Hard hat icon, red color
10. **알림** (Notifications) - Bell icon, violet color
11. **업무목록** (Tasks) - Clipboard icon, teal color
12. **메시지** (Messages) - Message square icon, pink color

#### Implementation Example
```tsx
// Quick Menu Section with Settings - Compact Design
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">빠른메뉴</h3>
    <button
      onClick={() => setQuickMenuSettingsOpen(true)}
      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 
                 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                 rounded-lg transition-colors"
    >
      <Settings className="h-3 w-3" />
      설정
    </button>
  </div>
  
  <div className="grid grid-cols-2 gap-2">
    {getSelectedQuickMenuItems().map((item) => (
      <button 
        key={item.id}
        onClick={() => router.push(item.path)}
        className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 
                   hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl 
                   transition-all duration-200 active:scale-95 touch-manipulation min-h-[60px]"
      >
        <div className={`mb-1 ${item.color}`}>
          <Icon className="h-5 w-5" /> {/* Standardized icon size */}
        </div>
        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
          {item.name}
        </span>
      </button>
    ))}
  </div>
</div>
```

#### Settings Modal Pattern
```tsx
// Configuration Modal with Selection Interface
{quickMenuSettingsOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 
                    w-full max-w-md max-h-[80vh] overflow-hidden">
      {/* Modal Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">빠른메뉴 설정</h3>
        <button onClick={() => setQuickMenuSettingsOpen(false)}>
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Selection Interface */}
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        <div className="space-y-2">
          {availableQuickMenuItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center p-2 rounded-lg border-2 transition-all cursor-pointer ${
                selectedQuickMenuItems.includes(item.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => toggleQuickMenuItem(item.id)}
            >
              <div className={`mr-2 ${item.color} flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.description}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                {selectedQuickMenuItems.includes(item.id) ? (
                  <Check className="h-5 w-5 text-blue-500" />
                ) : (
                  <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {selectedQuickMenuItems.length}/8 선택됨
        </span>
        <div className="flex gap-2">
          <button onClick={() => setQuickMenuSettingsOpen(false)}>취소</button>
          <button onClick={saveQuickMenuSettings}>저장</button>
        </div>
      </div>
    </div>
  </div>
)}
```

#### Design Principles
- **User Control**: Maximum customization while maintaining usability
- **Visual Feedback**: Clear selection states and confirmation patterns
- **Constraint-Based**: 8-item limit prevents overwhelming choices
- **Persistent State**: Settings survive page refreshes and sessions
- **Mobile Optimized**: Touch-friendly targets and responsive layout

## Performance Guidelines - Mobile Field Focus

### Mobile Performance Optimization
- **Critical Resource Loading**: Prioritize above-the-fold content for daily tasks
- **Offline-First**: Cache critical forms and data for construction site connectivity issues
- **Image Optimization**: Compress construction photos for mobile networks
- **Battery Efficiency**: Minimize GPS usage and background processing

### Construction Site Considerations
- **Low Bandwidth**: Optimize for 3G networks common at construction sites
- **Device Variation**: Support older Android devices commonly used by workers
- **Battery Conservation**: Efficient UI updates and minimal background activity
- **Storage Management**: Local data storage for offline work capability

## Version History
- v3.0.0 (2025-01): Major mobile-first field worker update with high-density UI patterns and construction-specific components
- v2.0.0 (2024-01): Updated based on implemented demo components
- v1.0.0 (2023-12): Initial design system definition

## Migration Guide from v2.0 to v3.0

### Breaking Changes
- **Base spacing unit changed**: From 4px to 2px for mobile optimization
- **Button minimum heights standardized**: `min-h-[36px]` for compact layouts, `min-h-[48px]` for standard
- **Card padding standardized**: `p-3` (12px) across all devices for consistency
- **New required classes**: `touch-manipulation` for iOS optimization
- **Section spacing standardized**: `space-y-2` for all vertical layouts
- **Header font sizes reduced**: `text-base` for primary headers, `text-sm` for secondary
- **Icon sizes standardized**: `h-5 w-5` for section icons, `h-4 w-4` for inline icons

### New Components
- **CollapsibleSection**: For information hierarchy management
- **Weather Widget**: Construction-specific weather information
- **Material Counter**: NPC-1000 material tracking widget
- **Worker List Compact**: High-density worker status display
- **High Contrast Mode**: Environmental accessibility feature

### Updated Components
- **Button**: Added glove-friendly variants and larger touch targets
- **Form Fields**: Compact spacing and enhanced mobile focus states
- **Cards**: High-density information layout options
- **Bottom Navigation**: Enhanced for construction workflow patterns
- **Quick Menu**: Customizable user menu with settings modal
- **Blueprint Markup System**: Canvas-based drawing interface with construction-optimized tools

## Blueprint Markup System UI Patterns ✅

### Design System Integration
The blueprint markup system follows the established INOPNC design patterns while introducing specialized patterns for Canvas-based drawing interfaces.

#### Color Scheme for Markup Tools
```css
/* Markup Tool Colors */
--markup-gray: #6B7280;      /* General area marking */
--markup-red: #EF4444;       /* Problem/attention areas */
--markup-blue: #3B82F6;      /* Completed/confirmed areas */
--markup-text: #1F2937;      /* Text annotations */
--markup-pen: #8B5CF6;       /* Freehand drawing */

/* Interface Colors */
--markup-bg: #F9FAFB;        /* Canvas background */
--markup-toolbar: #FFFFFF;   /* Toolbar background */
--markup-active: #3182F6;    /* Active tool highlight */
```

#### Layout Patterns

##### Dual-View Architecture
- **List View**: Grid-based document library with search/filter controls
- **Editor View**: Full-screen canvas with context-sensitive toolbars
- **Smooth Navigation**: Instant switching between views with state preservation

##### Tool Palette Design
```tsx
// Desktop: Vertical left sidebar
<div className="w-20 bg-white border-r border-gray-200 p-2">
  <ToolButton icon={<Square />} active={tool === 'box-gray'} />
  <ToolButton icon={<Square />} active={tool === 'box-red'} color="red" />
  // ... other tools
</div>

// Mobile: Horizontal bottom toolbar
<div className="bg-white border-t border-gray-200 px-2 py-1">
  <div className="flex justify-around">
    <ToolButton icon={<Square />} active={tool === 'box-gray'} />
    // ... other tools
  </div>
</div>
```

##### Canvas Interaction Patterns
- **Touch Targets**: Minimum 44px for mobile tool buttons
- **Gesture Support**: Pinch-to-zoom, two-finger pan
- **Visual Feedback**: Active tool highlighting, hover states
- **Precision Drawing**: Optimized for both finger and stylus input

#### Document Management UI
- **Card-Based Layout**: Visual document cards with consistent 4:3 aspect ratio
- **Progressive Loading**: Skeleton states for loading documents
- **Quick Actions**: Hover/long-press context menus
- **Search Integration**: Real-time filtering with debounced input

#### Accessibility Considerations
- **High Contrast Support**: Enhanced contrast modes for outdoor use
- **Touch Accessibility**: Large touch targets for safety glove usage
- **Keyboard Navigation**: Full keyboard shortcut support
- **Screen Reader**: Proper ARIA labels for all interactive elements

#### Performance Optimizations
- **Canvas Rendering**: Optimized for 60fps drawing performance
- **Image Handling**: Progressive loading for large blueprint files
- **Memory Management**: Efficient undo/redo stack implementation
- **Mobile Battery**: Reduced computational overhead for extended field use

