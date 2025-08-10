# Testing Infrastructure Guide

Complete testing infrastructure for the INOPNC Work Management System, covering component testing, E2E testing, performance monitoring, accessibility compliance, and cross-browser compatibility.

## Overview

Our testing infrastructure includes:

- **Component Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright with Page Object Pattern
- **Performance Testing**: Lighthouse CI with Core Web Vitals monitoring
- **Accessibility Testing**: WCAG 2.1 AA compliance with axe-core
- **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iPhone, iPad, Android devices with touch gestures
- **Visual Regression**: Screenshot-based UI consistency testing
- **PWA Testing**: Service workers, offline functionality, installation

## Quick Start

```bash
# Install dependencies
npm ci

# Run all test suites
npm test                    # Component tests
npm run test:e2e           # E2E tests
npm run test:lighthouse    # Performance audits
npm run test:budget        # Performance budget checks

# Cross-browser testing
npm run test:cross-browser:full

# Accessibility testing
npm run test:e2e:accessibility

# Visual regression testing
npm run test:e2e:visual
```

## Test Structure

### Component Tests (`__tests__/`)

```
__tests__/
├── components/
│   ├── attendance/
│   │   └── attendance-calendar.test.tsx
│   ├── daily-reports/
│   │   └── daily-report-list.test.tsx
│   ├── equipment/
│   │   └── equipment-list.test.tsx
│   └── ui/
│       ├── card.test.tsx
│       └── weather-resistant-input.test.tsx
├── lib/
│   ├── auth/
│   │   └── session.test.ts
│   └── supabase/
│       └── daily-reports.test.ts
└── utils/
    └── test-utils.tsx
```

### E2E Tests (`e2e/`)

```
e2e/
├── auth/
│   └── login.spec.ts
├── daily-reports/
│   ├── create-report.spec.ts
│   └── report-management.spec.ts
├── markup/
│   └── markup-tool.spec.ts
├── mobile/
│   ├── responsive-design.spec.ts
│   ├── touch-gestures.spec.ts
│   └── pwa-functionality.spec.ts
├── cross-browser/
│   └── compatibility.spec.ts
├── performance/
│   └── lighthouse-performance.spec.ts
├── accessibility/
│   └── wcag-compliance.spec.ts
├── visual/
│   └── visual-regression.spec.ts
└── utils/
    └── browser-detection.ts
```

## Component Testing

### Features
- **Custom Providers**: FontSizeProvider, TouchModeProvider
- **Korean Business Logic**: 공수 (labor hours) calculations
- **User Interaction Testing**: Click, form submissions, navigation
- **Accessibility Testing**: ARIA attributes, keyboard navigation
- **Error Boundary Testing**: Component error handling

### Example Test

```typescript
describe('AttendanceCalendar', () => {
  test('should display attendance data with 공수 indicators', async () => {
    const mockAttendance = [
      {
        id: '1',
        worker_name: '김작업자',
        attendance_date: '2024-01-15',
        labor_hours: 1.0, // Full day
        status: 'present'
      }
    ]

    render(
      <TestProviders>
        <AttendanceCalendar initialAttendance={mockAttendance} />
      </TestProviders>
    )

    const presentDay = screen.getByText('15')
    expect(presentDay).toHaveClass('bg-green-100') // Full day indicator
  })
})
```

### Running Component Tests

```bash
# All component tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:unit

# Specific test file
npm test attendance-calendar
```

## E2E Testing

### Playwright Configuration
- **12 Browser/Device Combinations**
- **Page Object Pattern**
- **Automatic Screenshot/Video on Failure**
- **Parallel Execution**
- **Custom Timeouts and Retries**

### Device Matrix
```javascript
const devices = [
  'chromium',           // Desktop Chrome
  'firefox',           // Desktop Firefox  
  'webkit',            // Desktop Safari
  'edge',              // Desktop Edge
  'iphone-14',         // iPhone 14
  'iphone-14-pro',     // iPhone 14 Pro
  'iphone-se',         // iPhone SE
  'pixel-7',           // Google Pixel 7
  'galaxy-s9',         // Samsung Galaxy S9
  'ipad',              // iPad
  'desktop-large',     // 1920x1080 Desktop
  'mobile-slow-3g'     // Mobile with 3G simulation
]
```

### E2E Test Scripts

```bash
# All E2E tests
npm run test:e2e

# Mobile devices only
npm run test:e2e:mobile

# Cross-browser compatibility
npm run test:e2e:cross-browser

# Touch gesture testing
npm run test:e2e:touch

# Responsive design
npm run test:e2e:responsive

# PWA functionality
npm run test:e2e:pwa

# All devices comprehensive
npm run test:e2e:all-devices
```

### Example E2E Test

```typescript
test('should create daily report with 공수 entry', async ({ page }) => {
  await page.goto('/dashboard/daily-reports/create')
  
  // Fill form
  await page.fill('[name="title"]', '일일 작업 보고서')
  await page.fill('[name="description"]', '오늘의 작업 내용')
  await page.selectOption('[name="labor_hours"]', '1.0')
  
  // Submit
  await page.click('button[type="submit"]')
  
  // Verify success
  await expect(page.locator('.success-message')).toBeVisible()
  await expect(page).toHaveURL('/dashboard/daily-reports')
})
```

## Performance Testing

### Lighthouse CI Configuration
- **Core Web Vitals Monitoring**
- **Performance Budgets**
- **Resource Optimization**
- **Automated CI Integration**

### Performance Budgets

```javascript
const budgets = {
  'first-contentful-paint': 2500,    // 2.5s
  'largest-contentful-paint': 2500,  // 2.5s  
  'first-input-delay': 100,          // 100ms
  'cumulative-layout-shift': 0.1,    // 0.1
  'total-blocking-time': 300,        // 300ms
  'performance-score': 80,           // 80/100
  'accessibility-score': 90,         // 90/100
  'total-byte-weight': 2048,         // 2MB
  'unused-javascript': 40            // 40KB
}
```

### Performance Testing Scripts

```bash
# Lighthouse audits
npm run test:lighthouse

# Performance budget checks
npm run test:budget

# Performance E2E tests
npm run test:e2e:performance
```

### Performance Test Features
- **Multiple Page Audits**: Login, Dashboard, Reports, Markup Tool
- **Network Throttling**: Slow 3G simulation
- **Memory Leak Detection**: Extended usage patterns
- **Bundle Size Analysis**: JS/CSS optimization
- **Frame Rate Testing**: Smooth animations
- **Concurrent User Simulation**: Load testing

## Accessibility Testing

### WCAG 2.1 AA Compliance
- **Automated Testing**: axe-core integration
- **Manual Testing**: Keyboard navigation, screen readers
- **Color Contrast**: Minimum 4.5:1 ratio
- **Touch Targets**: 44x44px minimum
- **Korean Language Support**: Proper lang attributes

### Accessibility Test Coverage

```typescript
const accessibilityTests = [
  'WCAG standards compliance',
  'Heading hierarchy validation', 
  'Form label associations',
  'Keyboard navigation support',
  'Screen reader compatibility',
  'Color contrast ratios',
  'High contrast mode support',
  'Reduced motion preferences',
  'Error message accessibility',
  'Table header associations',
  'Modal dialog accessibility',
  'Korean language content',
  'Touch device accessibility'
]
```

### Running Accessibility Tests

```bash
# All accessibility tests
npm run test:e2e:accessibility

# Specific accessibility project
npx playwright test e2e/accessibility --project="desktop-accessibility"
```

## Cross-Browser Testing

### Browser Support Matrix
| Browser | Desktop | Mobile | Touch | PWA |
|---------|---------|--------|-------|-----|
| Chrome  | ✅      | ✅     | ✅    | ✅  |
| Firefox | ✅      | ❌     | ❌    | ⚠️  |
| Safari  | ✅      | ✅     | ✅    | ⚠️  |
| Edge    | ✅      | ❌     | ❌    | ✅  |

### Cross-Browser Test Runner
- **Comprehensive Test Suite**: 6 test categories
- **Parallel Execution**: Multiple browsers simultaneously
- **Detailed Reporting**: HTML + JSON reports
- **Pre-flight Checks**: Server availability verification
- **Critical Test Identification**: Must-pass vs nice-to-have

```bash
# Full cross-browser test suite
npm run test:cross-browser:full

# Individual browser compatibility
npm run test:e2e:compatibility
```

## Visual Regression Testing

### Screenshot Comparison
- **Baseline Screenshots**: Reference images for UI consistency
- **Cross-Browser Visual Testing**: Same UI across browsers
- **Responsive Design Validation**: Different viewport sizes
- **Component State Testing**: Empty, loading, error states
- **Theme Variation Testing**: Light/dark mode consistency

### Visual Test Categories
```typescript
const visualTests = [
  'Page screenshots across viewports',
  'Form state variations',
  'Modal dialog consistency', 
  'Data table presentations',
  'Navigation state changes',
  'Canvas element rendering',
  'Theme variation testing',
  'Error state presentations',
  'Loading state consistency'
]
```

### Running Visual Tests

```bash
# Visual regression tests
npm run test:e2e:visual

# Update visual baselines
npx playwright test e2e/visual --update-snapshots
```

## Mobile & Touch Testing

### Touch Gesture Support
- **Canvas Interactions**: Drawing, zooming, panning
- **Form Interactions**: Touch-friendly inputs
- **Navigation Gestures**: Swipe, tap, pinch
- **PWA Gestures**: Install prompts, offline usage

### Mobile Test Features
```typescript
const mobileFeatures = [
  'Responsive design (375px to 1920px)',
  'Touch target sizes (44x44px minimum)',
  'Pinch-to-zoom functionality',
  'Canvas drawing with touch',
  'Mobile navigation menus', 
  'Form input optimization',
  'PWA installation flow',
  'Offline functionality',
  'Service worker registration',
  'Push notification support'
]
```

### Mobile Testing Scripts

```bash
# All mobile tests
npm run test:e2e:mobile

# Touch gestures only
npm run test:e2e:touch

# Responsive design
npm run test:e2e:responsive

# PWA functionality  
npm run test:e2e:pwa
```

## CI/CD Integration

### GitHub Actions Workflow
- **Automated Testing**: On push/PR to main branches
- **Scheduled Monitoring**: Daily performance audits
- **Multi-Matrix Testing**: Parallel browser execution
- **Report Generation**: HTML dashboards
- **Notification System**: Slack/GitHub issue creation

### Performance Monitoring Pipeline
```yaml
jobs:
  lighthouse-ci:          # Performance audits
  accessibility-audit:    # WCAG compliance  
  visual-regression:      # UI consistency
  cross-browser-testing:  # Browser compatibility
  performance-budgets:    # Budget enforcement
  monitoring-dashboard:   # Report aggregation
  notification:           # Alert system
```

### Monitoring Dashboard
- **Performance Metrics**: Core Web Vitals tracking
- **Accessibility Scores**: WCAG compliance trends  
- **Cross-Browser Results**: Compatibility matrix
- **Visual Regression**: UI change detection
- **Historical Trends**: Performance over time

## Performance Budgets

### Budget Enforcement
- **Automated Checks**: CI pipeline integration
- **Threshold Alerts**: Warning and error levels
- **Detailed Reports**: HTML + JSON output
- **Trend Analysis**: Performance over time
- **Budget Categories**: Performance, Accessibility, Resource Usage

### Budget Configuration

```javascript
// lighthouserc.js
const budgets = {
  assertions: {
    'categories:performance': ['warn', { minScore: 0.8 }],
    'categories:accessibility': ['error', { minScore: 0.9 }],
    'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
    'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
    'unused-javascript': ['warn', { maxNumericValue: 40000 }]
  }
}
```

## Troubleshooting

### Common Issues

#### E2E Test Timeouts
```bash
# Check server status
npm run dev

# Increase timeout in playwright.config.ts
timeout: 60000  // 60 seconds
```

#### Visual Regression Failures
```bash
# Update baselines after UI changes
npx playwright test e2e/visual --update-snapshots

# Compare specific screenshots
npx playwright show-trace test-results/visual-regression-*/trace.zip
```

#### Performance Budget Failures
```bash
# Analyze bundle size
npm run analyze:bundle

# Check specific metrics
npm run test:budget

# Generate detailed report
npm run test:lighthouse
```

#### Accessibility Failures
```bash
# Run accessibility audit
npm run test:e2e:accessibility

# Check specific WCAG guidelines
npx playwright test e2e/accessibility/wcag-compliance.spec.ts --headed
```

### Debug Mode

```bash
# Run tests in headed mode
npx playwright test --headed

# Debug specific test
npx playwright test e2e/auth/login.spec.ts --debug

# Generate trace files
npx playwright test --trace on
```

## Best Practices

### Test Writing Guidelines
1. **Use Page Object Pattern** for E2E tests
2. **Mock External Dependencies** in component tests
3. **Test User Journeys** not just individual features
4. **Include Accessibility Checks** in all test levels
5. **Test with Real Data** similar to production
6. **Cover Error States** and edge cases
7. **Use Consistent Test Data** for reliable results
8. **Document Test Intent** with clear descriptions

### Performance Optimization
1. **Monitor Core Web Vitals** continuously
2. **Set Realistic Budgets** based on user needs
3. **Test on Real Devices** when possible
4. **Optimize Critical Path** loading
5. **Minimize Bundle Sizes** through code splitting
6. **Use Performance API** for accurate measurements
7. **Test Network Conditions** including slow connections

### Accessibility Standards
1. **Follow WCAG 2.1 AA** guidelines
2. **Test with Screen Readers** regularly
3. **Ensure Keyboard Navigation** works everywhere
4. **Maintain Color Contrast** ratios
5. **Provide Alternative Text** for images
6. **Use Semantic HTML** structure
7. **Test with Real Users** including disabled users

## Maintenance

### Regular Tasks
- **Update Test Dependencies** monthly
- **Review Performance Budgets** quarterly
- **Update Visual Baselines** after UI changes
- **Validate Accessibility Standards** with each release
- **Monitor Test Flakiness** and fix unstable tests
- **Review Test Coverage** and add missing scenarios

### Monitoring
- **Daily Performance Audits** via GitHub Actions
- **Weekly Cross-Browser Testing** comprehensive suite  
- **Monthly Accessibility Reviews** with manual testing
- **Quarterly Budget Reviews** and adjustment
- **Continuous Integration** test result monitoring

This testing infrastructure provides comprehensive coverage for performance, accessibility, cross-browser compatibility, and visual consistency, ensuring a high-quality user experience across all devices and browsers.