# Test Infrastructure Setup PRD - Updated for Recent Changes

## Overview
This document outlines the setup of comprehensive testing infrastructure for INOPNC Work Management System, specifically addressing the recent changes including labor hours (공수) system, unified documents UI, PWA features, and Analytics API.

## Task 1: Enhanced Testing Utilities and Mock Framework

### Description
Create a robust testing infrastructure with comprehensive mock utilities that support all recent system changes.

### Implementation Details

#### 1.1 Core Mock Framework Setup
- Create `/lib/test-utils/` directory structure
- Implement `createMockSupabaseClient()` with full auth and database mocking
- Add TypeScript types matching actual Supabase interfaces

#### 1.2 Labor Hours (공수) System Mocks
```typescript
// lib/test-utils/factories/attendance.factory.ts
export const createMockAttendanceWithLaborHours = (overrides?: Partial<AttendanceRecord>) => ({
  id: faker.string.uuid(),
  work_date: faker.date.recent().toISOString(),
  labor_hours: faker.helpers.arrayElement([0.25, 0.5, 0.75, 1.0, 1.25, 1.5]), // 공수
  hours_worked: null, // Calculated from labor_hours * 8
  site_name: faker.company.name(),
  status: 'present',
  ...overrides
})

export const createMockPayslip = () => ({
  month: '2025-08',
  total_labor_hours: 22.5, // Total 공수 for the month
  total_hours_worked: 180, // 22.5 * 8
  basic_salary: 3000000,
  overtime_pay: 500000,
  total_pay: 3500000
})
```

#### 1.3 Unified Documents System Mocks
```typescript
// lib/test-utils/factories/document.factory.ts
export const createMockDocument = (overrides?: Partial<Document>) => ({
  id: faker.string.uuid(),
  name: faker.system.fileName(),
  type: faker.helpers.arrayElement(['blueprint', 'pdf', 'doc', 'xls', 'img']),
  size: faker.number.int({ min: 1000, max: 10000000 }),
  uploadedAt: faker.date.recent().toISOString(),
  location: faker.helpers.arrayElement(['personal', 'shared']),
  // Card UI specific fields
  fileTypeBadgeColor: getFileTypeBadgeColor(type),
  cardLayout: true,
  ...overrides
})
```

#### 1.4 PWA Testing Infrastructure
```typescript
// lib/test-utils/pwa-mocks.ts
export const mockServiceWorker = {
  register: jest.fn().mockResolvedValue({
    installing: null,
    waiting: null,
    active: { state: 'activated' }
  }),
  ready: Promise.resolve({
    showNotification: jest.fn(),
    sync: { register: jest.fn() }
  })
}

export const mockPushManager = {
  subscribe: jest.fn().mockResolvedValue({
    endpoint: 'https://fcm.googleapis.com/fcm/send/...',
    toJSON: () => ({ endpoint: '...', keys: {} })
  })
}
```

#### 1.5 Analytics API Mocks
```typescript
// lib/test-utils/analytics-mocks.ts
export const mockAnalyticsResponses = {
  metrics: {
    daily_reports_count: faker.number.int({ min: 10, max: 100 }),
    active_users: faker.number.int({ min: 50, max: 200 }),
    labor_hours_total: faker.number.float({ min: 100, max: 1000 }),
    documents_uploaded: faker.number.int({ min: 20, max: 150 })
  },
  webVitals: {
    LCP: faker.number.float({ min: 0.5, max: 2.5 }),
    FID: faker.number.float({ min: 10, max: 100 }),
    CLS: faker.number.float({ min: 0, max: 0.1 })
  }
}
```

### Test Strategy
1. Unit test all mock utilities
2. Ensure mocks reflect actual data structures
3. Test labor hours calculations (1.0 공수 = 8 hours)
4. Verify PDF generation mocks work correctly
5. Test PWA mock behavior in different states

## Task 2: Jest Configuration for Modern Features

### Description
Update Jest configuration to support PWA testing, Analytics, and modern React features.

### Implementation Details
```javascript
// jest.config.js updates
module.exports = {
  // ... existing config
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/lib/test-utils/pwa-setup.ts'
  ],
  moduleNameMapper: {
    // ... existing mappings
    '^@/lib/test-utils/(.*)$': '<rootDir>/lib/test-utils/$1'
  },
  testEnvironmentOptions: {
    customExportConditions: [''],
    url: 'https://localhost:3000' // For PWA testing
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  }
}
```

## Task 3: Component Testing for New Features

### Description
Create comprehensive tests for components affected by recent changes.

### Implementation Details

#### 3.1 Attendance Tab with Labor Hours
```typescript
// __tests__/components/dashboard/tabs/attendance-tab.test.tsx
describe('AttendanceTab', () => {
  it('displays labor hours correctly in calendar', async () => {
    const mockAttendance = createMockAttendanceWithLaborHours({
      labor_hours: 1.0,
      work_date: '2025-08-03'
    })
    // Test calendar display shows "1.0 공수"
    // Test color coding (green for 1.0+, yellow for 0.5-0.9, etc.)
  })

  it('generates PDF payslip with correct calculations', async () => {
    // Test PDF generation
    // Verify labor hours to work hours conversion
  })
})
```

#### 3.2 Unified Documents Tab
```typescript
// __tests__/components/dashboard/tabs/documents-tab.test.tsx
describe('DocumentsTab', () => {
  it('renders documents in card layout', async () => {
    // Test card-based UI
    // Test file type badges with correct colors
  })

  it('handles unified personal and shared documents', async () => {
    // Test tab switching between personal/shared
    // Verify correct filtering
  })
})
```

## Task 4: API Testing for New Endpoints

### Description
Implement tests for Analytics API and updated attendance endpoints.

### Implementation Details
```typescript
// __tests__/api/analytics/*.test.ts
describe('Analytics API', () => {
  it('GET /api/analytics/metrics returns labor hours data', async () => {
    // Test metrics include labor_hours aggregations
  })

  it('POST /api/analytics/web-vitals stores performance data', async () => {
    // Test Web Vitals storage
  })
})
```

## Task 5: E2E Testing with PWA Features

### Description
Create E2E tests that validate PWA functionality and new user flows.

### Implementation Details
```typescript
// e2e/pwa-features.spec.ts
test('PWA installation and offline functionality', async ({ page }) => {
  // Test service worker registration
  // Test offline page display
  // Test app installation prompt
})

test('Labor hours entry and payslip generation', async ({ page }) => {
  // Navigate to attendance
  // Enter labor hours
  // Generate PDF payslip
  // Verify calculations
})
```

## Priority Order
1. Core mock framework with labor hours support (Critical)
2. Jest configuration updates (High)
3. Component tests for changed features (High)
4. API endpoint tests (Medium)
5. E2E tests with PWA (Medium)

## Success Criteria
- All new features have appropriate test utilities
- Labor hours calculations are accurately tested
- PWA functionality can be tested in isolation
- Analytics API responses are properly mocked
- Test coverage increases to at least 30% in first phase