# INOPNC Construction Work Management System - Comprehensive Test Scenarios

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Authentication and User Management Test Scenarios](#authentication-and-user-management-test-scenarios)
4. [Role-Based Access Control (RLS) Test Scenarios](#role-based-access-control-rls-test-scenarios)
5. [Construction Management Workflow Test Scenarios](#construction-management-workflow-test-scenarios)
6. [Blueprint Markup System Test Scenarios](#blueprint-markup-system-test-scenarios)
7. [Mobile-Responsive UI Test Scenarios](#mobile-responsive-ui-test-scenarios)
8. [Data Integrity and Performance Test Scenarios](#data-integrity-and-performance-test-scenarios)
9. [Test Implementation Guidelines](#test-implementation-guidelines)

## Overview

This document provides comprehensive test scenarios for the INOPNC Construction Work Management System, a Next.js 14 application with Supabase backend, TypeScript, and Canvas-based blueprint markup functionality.

### System Architecture
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **State Management**: React Hooks, Context API
- **Testing**: Jest, Playwright
- **Special Features**: HTML5 Canvas blueprint markup, Labor hours (공수) tracking

### Test Accounts
```javascript
const TEST_ACCOUNTS = {
  worker: { email: 'worker@inopnc.com', password: 'password123', role: 'worker' },
  manager: { email: 'manager@inopnc.com', password: 'password123', role: 'site_manager' },
  customer: { email: 'customer@inopnc.com', password: 'password123', role: 'customer_manager' },
  admin: { email: 'admin@inopnc.com', password: 'password123', role: 'admin' },
  production: { email: 'production@inopnc.com', password: 'password123', role: 'site_manager' }
}
```

## Test Environment Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,ts,tsx}',
    '<rootDir>/components/**/*.test.{js,ts,tsx}',
    '<rootDir>/lib/**/*.test.{js,ts,tsx}'
  ]
}
```

### Playwright Configuration
```javascript
// playwright.config.js
module.exports = {
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    }
  ]
}
```

---

## 1. Authentication and User Management Test Scenarios

### Unit Tests

#### 1.1 Supabase Client Configuration Tests
```javascript
// __tests__/lib/supabase/client.test.ts
describe('Supabase Client Configuration', () => {
  test('should create client with correct configuration', () => {
    const client = createClient()
    expect(client.supabaseUrl).toBeDefined()
    expect(client.supabaseKey).toBeDefined()
  })

  test('should handle missing environment variables', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    
    expect(() => createClient()).toThrow()
    
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  })
})
```

#### 1.2 Authentication Actions Tests
```javascript
// __tests__/app/auth/actions.test.ts
describe('Authentication Actions', () => {
  test('should handle successful login', async () => {
    const formData = new FormData()
    formData.append('email', 'worker@inopnc.com')
    formData.append('password', 'password123')
    
    const result = await signInAction(formData)
    
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test('should handle invalid credentials', async () => {
    const formData = new FormData()
    formData.append('email', 'invalid@example.com')
    formData.append('password', 'wrongpassword')
    
    const result = await signInAction(formData)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid login credentials')
  })

  test('should handle signup with valid data', async () => {
    const formData = new FormData()
    formData.append('email', 'newuser@inopnc.com')
    formData.append('password', 'newpassword123')
    formData.append('confirmPassword', 'newpassword123')
    formData.append('name', 'New User')
    
    const result = await signUpAction(formData)
    
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test('should validate password confirmation', async () => {
    const formData = new FormData()
    formData.append('email', 'newuser@inopnc.com')
    formData.append('password', 'password123')
    formData.append('confirmPassword', 'different123')
    
    const result = await signUpAction(formData)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Passwords do not match')
  })
})
```

#### 1.3 Middleware Tests
```javascript
// __tests__/middleware.test.ts
describe('Authentication Middleware', () => {
  test('should redirect unauthenticated users to login', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard')
    
    const response = await middleware(request)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/auth/login')
  })

  test('should allow authenticated users to protected routes', async () => {
    // Mock authenticated session
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'supabase-auth-token=valid-token' }
    })
    
    const response = await middleware(request)
    
    expect(response.status).toBe(200)
  })

  test('should allow unauthenticated access to public routes', async () => {
    const request = new NextRequest('http://localhost:3000/auth/login')
    
    const response = await middleware(request)
    
    expect(response.status).toBe(200)
  })
})
```

### Integration Tests

#### 1.4 Complete Authentication Flow Tests
```javascript
// __tests__/integration/auth-flow.test.ts
describe('Authentication Flow Integration', () => {
  test('should complete full login to dashboard flow', async () => {
    const { render, screen, user } = setupIntegrationTest()
    
    // Navigate to login page
    render(<LoginPage />)
    
    // Fill login form
    await user.type(screen.getByLabelText(/email/i), 'worker@inopnc.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    // Should redirect to dashboard
    expect(window.location.pathname).toBe('/dashboard')
    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
  })

  test('should handle session refresh automatically', async () => {
    // Mock expired session
    const { render, screen } = setupIntegrationTest({ 
      session: { expires_at: Date.now() - 1000 } 
    })
    
    render(<DashboardPage />)
    
    // Should trigger automatic refresh
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })
})
```

### End-to-End Tests

#### 1.5 User Authentication E2E Tests
```javascript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="signin-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid login credentials')
  })

  test('should complete signup flow', async ({ page }) => {
    await page.goto('/auth/signup')
    
    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', 'testuser@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.fill('[data-testid="confirm-password-input"]', 'testpassword123')
    await page.click('[data-testid="signup-button"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Check your email')
  })

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    await expect(page).toHaveURL('/auth/login')
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
  })
})
```

### Edge Cases and Error Handling

#### 1.6 Authentication Edge Cases
```javascript
// __tests__/auth-edge-cases.test.ts
describe('Authentication Edge Cases', () => {
  test('should handle network failures during login', async () => {
    // Mock network failure
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
    
    const formData = new FormData()
    formData.append('email', 'worker@inopnc.com')
    formData.append('password', 'password123')
    
    const result = await signInAction(formData)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })

  test('should handle corrupted session cookies', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'supabase-auth-token=corrupted-token' }
    })
    
    const response = await middleware(request)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/auth/login')
  })

  test('should handle concurrent login attempts', async () => {
    const formData = new FormData()
    formData.append('email', 'worker@inopnc.com')
    formData.append('password', 'password123')
    
    const promises = Array(5).fill().map(() => signInAction(formData))
    const results = await Promise.all(promises)
    
    // All should succeed or fail gracefully
    results.forEach(result => {
      expect(typeof result.success).toBe('boolean')
    })
  })
})
```

---

## 2. Role-Based Access Control (RLS) Test Scenarios

### Unit Tests

#### 2.1 RLS Policy Tests
```javascript
// __tests__/lib/rls-policies.test.ts
describe('RLS Policies', () => {
  test('worker should only access own data', async () => {
    const { supabase } = setupSupabaseTest('worker@inopnc.com')
    
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select('*')
    
    expect(error).toBeNull()
    reports.forEach(report => {
      expect(report.created_by).toBe(getCurrentUserId())
    })
  })

  test('site_manager should access team data within site', async () => {
    const { supabase } = setupSupabaseTest('production@inopnc.com')
    
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select('*, profiles(*)')
    
    expect(error).toBeNull()
    reports.forEach(report => {
      expect(report.profiles.site_id).toBe(getCurrentUserSiteId())
    })
  })

  test('admin should access all data', async () => {
    const { supabase } = setupSupabaseTest('admin@inopnc.com')
    
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select('*')
    
    expect(error).toBeNull()
    expect(reports.length).toBeGreaterThan(0)
  })

  test('should prevent access to other sites data', async () => {
    const { supabase } = setupSupabaseTest('worker@inopnc.com')
    
    // Try to access data from different site
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('site_id', 'different-site-id')
    
    expect(reports).toHaveLength(0)
  })
})
```

#### 2.2 Profile Management RLS Tests
```javascript
// __tests__/lib/profile-rls.test.ts
describe('Profile RLS Policies', () => {
  test('should prevent infinite recursion in profile queries', async () => {
    const { supabase } = setupSupabaseTest('worker@inopnc.com')
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
    
    expect(error).toBeNull()
    expect(Array.isArray(profiles)).toBe(true)
  })

  test('system_admin should access all profiles', async () => {
    const { supabase } = setupSupabaseTest('davidswyang@gmail.com')
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
    
    expect(error).toBeNull()
    expect(profiles.length).toBeGreaterThan(1)
  })

  test('should auto-create profile on first login', async () => {
    const newUserId = 'new-user-id'
    
    // Simulate first login trigger
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUserId)
      .single()
    
    expect(error).toBeNull()
    expect(profile.id).toBe(newUserId)
  })
})
```

### Integration Tests

#### 2.3 Role-Based UI Access Tests
```javascript
// __tests__/integration/role-access.test.ts
describe('Role-Based UI Access', () => {
  test('worker should see limited navigation options', async () => {
    const { render, screen } = setupIntegrationTest('worker@inopnc.com')
    
    render(<DashboardLayout><DashboardPage /></DashboardLayout>)
    
    expect(screen.getByText(/홈/)).toBeInTheDocument()
    expect(screen.getByText(/작업일지/)).toBeInTheDocument()
    expect(screen.queryByText(/관리/)).not.toBeInTheDocument()
  })

  test('admin should see all navigation options', async () => {
    const { render, screen } = setupIntegrationTest('admin@inopnc.com')
    
    render(<DashboardLayout><DashboardPage /></DashboardLayout>)
    
    expect(screen.getByText(/홈/)).toBeInTheDocument()
    expect(screen.getByText(/작업일지/)).toBeInTheDocument()
    expect(screen.getByText(/관리/)).toBeInTheDocument()
  })

  test('site_manager should see team management options', async () => {
    const { render, screen } = setupIntegrationTest('production@inopnc.com')
    
    render(<DashboardLayout><DashboardPage /></DashboardLayout>)
    
    expect(screen.getByText(/팀 관리/)).toBeInTheDocument()
    expect(screen.getByText(/현장 관리/)).toBeInTheDocument()
  })
})
```

### End-to-End Tests

#### 2.4 Role-Based Access E2E Tests
```javascript
// e2e/role-access.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Role-Based Access Control', () => {
  test('worker cannot access admin pages', async ({ page }) => {
    await loginAs(page, 'worker@inopnc.com', 'password123')
    
    await page.goto('/dashboard/admin')
    
    await expect(page).toHaveURL('/dashboard') // Should redirect
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible()
  })

  test('site_manager can access team data', async ({ page }) => {
    await loginAs(page, 'production@inopnc.com', 'password123')
    
    await page.goto('/dashboard/team')
    
    await expect(page.locator('[data-testid="team-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="team-member"]')).toHaveCount.greaterThan(0)
  })

  test('admin can access all sections', async ({ page }) => {
    await loginAs(page, 'admin@inopnc.com', 'password123')
    
    const adminSections = ['/dashboard/admin', '/dashboard/users', '/dashboard/sites']
    
    for (const section of adminSections) {
      await page.goto(section)
      await expect(page).toHaveURL(section)
      await expect(page.locator('[data-testid="access-denied"]')).not.toBeVisible()
    }
  })
})
```

### Edge Cases

#### 2.5 RLS Edge Cases
```javascript
// __tests__/rls-edge-cases.test.ts
describe('RLS Edge Cases', () => {
  test('should handle user without assigned site', async () => {
    const { supabase } = setupSupabaseTest('orphaned@inopnc.com')
    
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select('*')
    
    expect(error).toBeNull()
    expect(reports).toHaveLength(0)
  })

  test('should handle role change during session', async () => {
    const { supabase } = setupSupabaseTest('worker@inopnc.com')
    
    // Change role to admin
    await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', 'worker@inopnc.com')
    
    // Should still use cached role until session refresh
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select('*')
    
    // Behavior depends on session refresh mechanism
    expect(error).toBeNull()
  })

  test('should handle deleted user profile', async () => {
    const deletedUserId = 'deleted-user-id'
    
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('created_by', deletedUserId)
    
    expect(reports).toHaveLength(0)
  })
})
```

---

## 3. Construction Management Workflow Test Scenarios

### Unit Tests

#### 3.1 Labor Hours (공수) Calculation Tests
```javascript
// __tests__/lib/labor-hours.test.ts
describe('Labor Hours Calculation', () => {
  test('should calculate full day as 1.0 공수', () => {
    const hours = calculateLaborHours(8, 0) // 8 hours, 0 overtime
    expect(hours).toBe(1.0)
  })

  test('should calculate half day as 0.5 공수', () => {
    const hours = calculateLaborHours(4, 0)
    expect(hours).toBe(0.5)
  })

  test('should calculate overtime correctly', () => {
    const hours = calculateLaborHours(8, 2) // 8 regular + 2 overtime
    expect(hours).toBe(1.25) // 1.0 + 0.25
  })

  test('should handle partial hours', () => {
    const hours = calculateLaborHours(6, 0)
    expect(hours).toBe(0.75)
  })

  test('should validate minimum hours', () => {
    const hours = calculateLaborHours(0.5, 0)
    expect(hours).toBe(0.0625) // 0.5/8
  })
})
```

#### 3.2 Attendance Record Tests
```javascript
// __tests__/components/attendance/attendance-record.test.tsx
describe('Attendance Record Component', () => {
  test('should display correct 공수 visual indicators', () => {
    const records = [
      { labor_hours: 1.0, status: 'present' },
      { labor_hours: 0.5, status: 'half_day' },
      { labor_hours: 0.25, status: 'partial' }
    ]

    const { render, screen } = setupComponentTest()
    render(<AttendanceRecord records={records} />)

    expect(screen.getByTestId('labor-1.0')).toHaveClass('bg-green-500')
    expect(screen.getByTestId('labor-0.5')).toHaveClass('bg-yellow-500')
    expect(screen.getByTestId('labor-0.25')).toHaveClass('bg-orange-500')
  })

  test('should handle attendance status updates', async () => {
    const { render, screen, user } = setupComponentTest()
    render(<AttendanceRecord recordId="test-record" />)

    await user.click(screen.getByTestId('status-button'))
    await user.click(screen.getByText('출근'))

    expect(screen.getByTestId('status-display')).toContainText('출근')
  })
})
```

#### 3.3 Daily Report Tests
```javascript
// __tests__/components/reports/daily-report.test.tsx
describe('Daily Report Component', () => {
  test('should create new daily report', async () => {
    const { render, screen, user } = setupComponentTest()
    render(<DailyReportForm />)

    await user.type(screen.getByLabelText(/작업 내용/), '콘크리트 타설 작업')
    await user.type(screen.getByLabelText(/현장 상황/), '날씨 양호, 작업 순조')
    await user.click(screen.getByRole('button', { name: /저장/ }))

    expect(screen.getByText(/저장되었습니다/)).toBeInTheDocument()
  })

  test('should validate required fields', async () => {
    const { render, screen, user } = setupComponentTest()
    render(<DailyReportForm />)

    await user.click(screen.getByRole('button', { name: /저장/ }))

    expect(screen.getByText(/작업 내용을 입력해주세요/)).toBeInTheDocument()
  })
})
```

### Integration Tests

#### 3.4 Construction Workflow Integration Tests
```javascript
// __tests__/integration/construction-workflow.test.ts
describe('Construction Workflow Integration', () => {
  test('should complete full daily workflow', async () => {
    const { render, screen, user } = setupIntegrationTest('production@inopnc.com')
    
    // 1. Check attendance
    render(<AttendancePage />)
    await user.click(screen.getByTestId('check-in-button'))
    
    // 2. Create daily report
    await user.click(screen.getByText(/작업일지 작성/))
    await user.type(screen.getByLabelText(/작업 내용/), '기초 공사 진행')
    await user.click(screen.getByRole('button', { name: /저장/ }))
    
    // 3. Update attendance hours
    await user.click(screen.getByText(/출근 현황/))
    await user.selectOptions(screen.getByLabelText(/근무 시간/), '8')
    await user.click(screen.getByRole('button', { name: /업데이트/ }))
    
    expect(screen.getByText(/1.0 공수/)).toBeInTheDocument()
  })

  test('should handle site information display', async () => {
    const { render, screen } = setupIntegrationTest('worker@inopnc.com')
    
    render(<DashboardPage />)
    
    expect(screen.getByText(/현장 정보/)).toBeInTheDocument()
    expect(screen.getByTestId('site-address')).toBeInTheDocument()
    expect(screen.getByTestId('manager-contact')).toBeInTheDocument()
  })
})
```

### End-to-End Tests

#### 3.5 Construction Management E2E Tests
```javascript
// e2e/construction-workflow.spec.ts
test.describe('Construction Management Workflow', () => {
  test('site manager daily workflow', async ({ page }) => {
    await loginAs(page, 'production@inopnc.com', 'password123')
    
    // View team attendance
    await page.click('[data-testid="attendance-menu"]')
    await expect(page.locator('[data-testid="team-attendance"]')).toBeVisible()
    
    // Create daily report
    await page.click('[data-testid="daily-report-button"]')
    await page.fill('[data-testid="work-content"]', '구조물 설치 작업 진행')
    await page.fill('[data-testid="site-conditions"]', '기상 양호, 자재 충분')
    await page.click('[data-testid="save-report"]')
    
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    
    // Verify report in list
    await page.click('[data-testid="report-list-menu"]')
    await expect(page.locator('text=구조물 설치 작업 진행')).toBeVisible()
  })

  test('worker attendance check-in workflow', async ({ page }) => {
    await loginAs(page, 'worker@inopnc.com', 'password123')
    
    // Check current attendance status
    await expect(page.locator('[data-testid="attendance-status"]')).toBeVisible()
    
    // Check in
    await page.click('[data-testid="checkin-button"]')
    await expect(page.locator('text=출근 체크되었습니다')).toBeVisible()
    
    // Verify status update
    await expect(page.locator('[data-testid="attendance-status"]')).toContainText('출근')
  })

  test('labor hours calculation and display', async ({ page }) => {
    await loginAs(page, 'production@inopnc.com', 'password123')
    
    await page.goto('/dashboard/attendance')
    
    // Update worker hours
    await page.click('[data-testid="edit-hours-button"]')
    await page.fill('[data-testid="regular-hours"]', '8')
    await page.fill('[data-testid="overtime-hours"]', '2')
    await page.click('[data-testid="save-hours"]')
    
    // Verify 공수 calculation (8 regular + 2 overtime = 1.25 공수)
    await expect(page.locator('[data-testid="labor-hours-display"]')).toContainText('1.25')
    
    // Check visual indicator color
    await expect(page.locator('[data-testid="labor-indicator"]')).toHaveClass(/bg-green-500/)
  })
})
```

### Edge Cases

#### 3.6 Construction Workflow Edge Cases
```javascript
// __tests__/construction-edge-cases.test.ts
describe('Construction Workflow Edge Cases', () => {
  test('should handle duplicate attendance check-ins', async () => {
    const { supabase } = setupSupabaseTest('worker@inopnc.com')
    
    // First check-in
    const result1 = await createAttendanceRecord({
      date: '2025-08-14',
      status: 'present'
    })
    
    // Duplicate check-in
    const result2 = await createAttendanceRecord({
      date: '2025-08-14',
      status: 'present'
    })
    
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(false)
    expect(result2.error).toContain('Already checked in today')
  })

  test('should handle cross-midnight work shifts', () => {
    const startTime = new Date('2025-08-14T22:00:00')
    const endTime = new Date('2025-08-15T06:00:00')
    
    const hours = calculateWorkHours(startTime, endTime)
    
    expect(hours.regular).toBe(8)
    expect(hours.overtime).toBe(0)
    expect(hours.laborHours).toBe(1.0)
  })

  test('should handle invalid labor hour entries', async () => {
    const { render, screen, user } = setupComponentTest()
    render(<AttendanceRecord />)
    
    await user.type(screen.getByLabelText(/근무 시간/), '-5')
    await user.click(screen.getByRole('button', { name: /저장/ }))
    
    expect(screen.getByText(/올바른 시간을 입력해주세요/)).toBeInTheDocument()
  })

  test('should handle site data not loading', async () => {
    // Mock failed site data request
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
    
    const { render, screen } = setupComponentTest()
    render(<SiteInformation />)
    
    expect(screen.getByText(/현장 정보를 불러올 수 없습니다/)).toBeInTheDocument()
  })
})
```

---

## 4. Blueprint Markup System Test Scenarios

### Unit Tests

#### 4.1 Canvas Drawing Tests
```javascript
// __tests__/components/markup/canvas/markup-canvas.test.tsx
describe('Markup Canvas Component', () => {
  test('should initialize canvas with correct dimensions', () => {
    const { render, screen } = setupComponentTest()
    render(<MarkupCanvas width={800} height={600} />)
    
    const canvas = screen.getByTestId('markup-canvas')
    expect(canvas).toHaveAttribute('width', '800')
    expect(canvas).toHaveAttribute('height', '600')
  })

  test('should handle mouse drawing events', async () => {
    const onMarkupAdd = jest.fn()
    const { render, screen, user } = setupComponentTest()
    
    render(<MarkupCanvas tool="box" color="red" onMarkupAdd={onMarkupAdd} />)
    
    const canvas = screen.getByTestId('markup-canvas')
    
    // Simulate mouse drawing
    await user.pointer([
      { target: canvas, coords: { x: 100, y: 100 } },
      { keys: '[MouseLeft>]' },
      { target: canvas, coords: { x: 200, y: 200 } },
      { keys: '[/MouseLeft]' }
    ])
    
    expect(onMarkupAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'box',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: 'red'
      })
    )
  })

  test('should handle touch events on mobile', async () => {
    const onMarkupAdd = jest.fn()
    const { render, screen } = setupComponentTest()
    
    render(<MarkupCanvas tool="pen" onMarkupAdd={onMarkupAdd} />)
    
    const canvas = screen.getByTestId('markup-canvas')
    
    // Simulate touch drawing
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 50, clientY: 50 }]
    })
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 100, clientY: 100 }]
    })
    fireEvent.touchEnd(canvas)
    
    expect(onMarkupAdd).toHaveBeenCalled()
  })
})
```

#### 4.2 Markup Tools Tests
```javascript
// __tests__/components/markup/hooks/use-markup-tools.test.ts
describe('Markup Tools Hook', () => {
  test('should handle undo/redo operations', () => {
    const { result } = renderHook(() => useMarkupTools([]))
    
    // Add markup objects
    act(() => {
      result.current.addMarkup({ id: '1', type: 'box' })
      result.current.addMarkup({ id: '2', type: 'text' })
    })
    
    expect(result.current.markupObjects).toHaveLength(2)
    
    // Undo
    act(() => {
      result.current.undo()
    })
    
    expect(result.current.markupObjects).toHaveLength(1)
    
    // Redo
    act(() => {
      result.current.redo()
    })
    
    expect(result.current.markupObjects).toHaveLength(2)
  })

  test('should handle copy/paste operations', () => {
    const { result } = renderHook(() => useMarkupTools([]))
    
    act(() => {
      result.current.addMarkup({ id: '1', type: 'box', x: 100, y: 100 })
      result.current.selectObject('1')
      result.current.copy()
    })
    
    act(() => {
      result.current.paste()
    })
    
    expect(result.current.markupObjects).toHaveLength(2)
    const pastedObject = result.current.markupObjects[1]
    expect(pastedObject.x).toBe(110) // Offset by 10
    expect(pastedObject.y).toBe(110)
  })

  test('should handle delete operations', () => {
    const { result } = renderHook(() => useMarkupTools([
      { id: '1', type: 'box' },
      { id: '2', type: 'text' }
    ]))
    
    act(() => {
      result.current.selectObject('1')
      result.current.deleteSelected()
    })
    
    expect(result.current.markupObjects).toHaveLength(1)
    expect(result.current.markupObjects[0].id).toBe('2')
  })
})
```

#### 4.3 File Manager Tests
```javascript
// __tests__/components/markup/hooks/use-file-manager.test.ts
describe('File Manager Hook', () => {
  test('should save markup document', async () => {
    const { result } = renderHook(() => useFileManager())
    
    const documentData = {
      title: '테스트 도면',
      description: '테스트용 마킹 도면',
      markupObjects: [{ id: '1', type: 'box' }]
    }
    
    await act(async () => {
      const saveResult = await result.current.saveDocument(documentData)
      expect(saveResult.success).toBe(true)
    })
  })

  test('should load markup document', async () => {
    const { result } = renderHook(() => useFileManager())
    
    await act(async () => {
      const loadResult = await result.current.loadDocument('test-doc-id')
      expect(loadResult.success).toBe(true)
      expect(loadResult.data.title).toBe('테스트 도면')
    })
  })

  test('should handle document permissions', async () => {
    const { result } = renderHook(() => useFileManager())
    
    await act(async () => {
      const shareResult = await result.current.shareDocument('doc-id', 'user-id')
      expect(shareResult.success).toBe(true)
    })
  })
})
```

### Integration Tests

#### 4.4 Markup Editor Integration Tests
```javascript
// __tests__/integration/markup-editor.test.ts
describe('Markup Editor Integration', () => {
  test('should complete full markup workflow', async () => {
    const { render, screen, user } = setupIntegrationTest()
    render(<MarkupEditor />)
    
    // Upload blueprint
    const file = new File(['blueprint'], 'test-blueprint.png', { type: 'image/png' })
    const input = screen.getByTestId('file-upload')
    
    await user.upload(input, file)
    await waitFor(() => {
      expect(screen.getByTestId('markup-canvas')).toBeInTheDocument()
    })
    
    // Select tool and draw
    await user.click(screen.getByTestId('box-tool'))
    
    const canvas = screen.getByTestId('markup-canvas')
    await user.pointer([
      { target: canvas, coords: { x: 100, y: 100 } },
      { keys: '[MouseLeft>]' },
      { target: canvas, coords: { x: 200, y: 200 } },
      { keys: '[/MouseLeft]' }
    ])
    
    // Add text annotation
    await user.click(screen.getByTestId('text-tool'))
    await user.click(canvas)
    await user.type(screen.getByTestId('text-input'), '작업 구역')
    await user.click(screen.getByTestId('text-confirm'))
    
    // Save document
    await user.click(screen.getByTestId('save-button'))
    await user.type(screen.getByLabelText(/제목/), '현장 마킹 도면')
    await user.type(screen.getByLabelText(/설명/), '1층 구조 작업 구역 표시')
    await user.click(screen.getByRole('button', { name: /저장/ }))
    
    expect(screen.getByText(/저장되었습니다/)).toBeInTheDocument()
  })

  test('should handle document list operations', async () => {
    const { render, screen, user } = setupIntegrationTest()
    render(<MarkupEditor />)
    
    // Should start in list view
    expect(screen.getByTestId('document-list')).toBeInTheDocument()
    
    // Search documents
    await user.type(screen.getByTestId('search-input'), '현장')
    
    await waitFor(() => {
      const documents = screen.getAllByTestId('document-card')
      expect(documents.length).toBeGreaterThan(0)
    })
    
    // Open document
    await user.click(screen.getByTestId('document-card-open'))
    
    expect(screen.getByTestId('markup-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('document-title')).toContainText('현장')
  })
})
```

### End-to-End Tests

#### 4.5 Blueprint Markup E2E Tests
```javascript
// e2e/blueprint-markup.spec.ts
test.describe('Blueprint Markup System', () => {
  test('complete markup creation workflow', async ({ page }) => {
    await loginAs(page, 'production@inopnc.com', 'password123')
    
    // Navigate to markup tool
    await page.click('[data-testid="sidebar-markup"]')
    await expect(page.locator('[data-testid="markup-editor"]')).toBeVisible()
    
    // Create new markup
    await page.click('[data-testid="new-markup-button"]')
    
    // Upload blueprint
    await page.setInputFiles('[data-testid="file-upload"]', 'e2e/fixtures/test-blueprint.png')
    await expect(page.locator('[data-testid="markup-canvas"]')).toBeVisible()
    
    // Use box tool
    await page.click('[data-testid="box-tool"]')
    
    const canvas = page.locator('[data-testid="markup-canvas"]')
    await canvas.click({ position: { x: 100, y: 100 } })
    await canvas.dragTo(canvas, { 
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 200, y: 200 }
    })
    
    // Add text annotation
    await page.click('[data-testid="text-tool"]')
    await canvas.click({ position: { x: 250, y: 150 } })
    await page.fill('[data-testid="text-input"]', '작업 완료 구역')
    await page.click('[data-testid="text-confirm"]')
    
    // Save document
    await page.click('[data-testid="save-button"]')
    await page.fill('[data-testid="title-input"]', 'E2E 테스트 도면')
    await page.fill('[data-testid="description-input"]', '자동화 테스트로 생성된 도면')
    await page.selectOption('[data-testid="location-select"]', 'shared')
    await page.click('[data-testid="save-confirm"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Verify in document list
    await page.click('[data-testid="home-button"]')
    await expect(page.locator('text=E2E 테스트 도면')).toBeVisible()
  })

  test('markup document management', async ({ page }) => {
    await loginAs(page, 'admin@inopnc.com', 'password123')
    
    await page.goto('/dashboard/markup')
    
    // Filter by shared documents
    await page.selectOption('[data-testid="location-filter"]', 'shared')
    
    // Search documents
    await page.fill('[data-testid="search-input"]', '테스트')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Should show filtered results
    await expect(page.locator('[data-testid="document-card"]')).toHaveCount.greaterThan(0)
    
    // Edit document
    await page.hover('[data-testid="document-card"]')
    await page.click('[data-testid="edit-button"]')
    
    await expect(page.locator('[data-testid="markup-canvas"]')).toBeVisible()
    
    // Add additional markup
    await page.click('[data-testid="pen-tool"]')
    
    const canvas = page.locator('[data-testid="markup-canvas"]')
    await canvas.click({ position: { x: 300, y: 300 } })
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 300, y: 300 },
      targetPosition: { x: 400, y: 350 }
    })
    
    // Save changes
    await page.click('[data-testid="save-button"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('mobile markup functionality', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // Mobile viewport
    
    await loginAs(page, 'worker@inopnc.com', 'password123')
    await page.goto('/dashboard/markup')
    
    // Mobile tool palette should be visible
    await expect(page.locator('[data-testid="mobile-tool-palette"]')).toBeVisible()
    
    // Create new markup
    await page.click('[data-testid="new-markup-button"]')
    
    // Upload using mobile interface
    await page.setInputFiles('[data-testid="mobile-file-upload"]', 'e2e/fixtures/mobile-blueprint.jpg')
    await expect(page.locator('[data-testid="markup-canvas"]')).toBeVisible()
    
    // Test touch drawing
    const canvas = page.locator('[data-testid="markup-canvas"]')
    
    await page.click('[data-testid="box-tool-mobile"]')
    
    // Simulate touch events
    await canvas.touchscreen.tap(100, 100)
    await canvas.touchscreen.tap(200, 200)
    
    // Verify markup was created
    await expect(page.locator('[data-testid="markup-object"]')).toHaveCount(1)
    
    // Test mobile save dialog
    await page.click('[data-testid="mobile-save-button"]')
    await expect(page.locator('[data-testid="mobile-save-dialog"]')).toBeVisible()
  })
})
```

### Edge Cases

#### 4.6 Markup System Edge Cases
```javascript
// __tests__/markup-edge-cases.test.ts
describe('Markup System Edge Cases', () => {
  test('should handle large blueprint files', async () => {
    const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large.png', { type: 'image/png' })
    
    const { render, screen, user } = setupComponentTest()
    render(<BlueprintUpload onUpload={jest.fn()} />)
    
    const input = screen.getByTestId('file-upload')
    await user.upload(input, largeFile)
    
    // Should show size warning
    expect(screen.getByText(/파일 크기가 큽니다/)).toBeInTheDocument()
  })

  test('should handle corrupted markup data', async () => {
    const corruptedData = { markupObjects: 'invalid-data' }
    
    const { result } = renderHook(() => useFileManager())
    
    await act(async () => {
      const loadResult = await result.current.loadDocument('corrupted-doc', corruptedData)
      expect(loadResult.success).toBe(false)
      expect(loadResult.error).toContain('Invalid markup data')
    })
  })

  test('should handle canvas rendering failures', () => {
    // Mock canvas context failure
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null)
    
    const { render, screen } = setupComponentTest()
    render(<MarkupCanvas />)
    
    expect(screen.getByText(/Canvas를 지원하지 않는 브라우저입니다/)).toBeInTheDocument()
  })

  test('should handle concurrent editing', async () => {
    const { render, screen, user } = setupComponentTest()
    render(<MarkupEditor documentId="shared-doc" />)
    
    // Simulate another user's changes
    fireEvent(window, new CustomEvent('document-updated', {
      detail: { documentId: 'shared-doc', changes: [{ type: 'add', object: { id: 'new-1' } }] }
    }))
    
    await waitFor(() => {
      expect(screen.getByText(/다른 사용자가 수정했습니다/)).toBeInTheDocument()
    })
  })

  test('should handle offline mode', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', { value: false })
    
    const { render, screen, user } = setupComponentTest()
    render(<MarkupEditor />)
    
    await user.click(screen.getByTestId('save-button'))
    
    expect(screen.getByText(/오프라인 상태입니다/)).toBeInTheDocument()
    expect(screen.getByText(/로컬에 저장됩니다/)).toBeInTheDocument()
  })
})
```

---

## 5. Mobile-Responsive UI Test Scenarios

### Unit Tests

#### 5.1 Responsive Component Tests
```javascript
// __tests__/components/responsive/responsive-layout.test.tsx
describe('Responsive Layout Components', () => {
  test('should render desktop navigation on large screens', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024 })
    
    const { render, screen } = setupComponentTest()
    render(<DashboardLayout />)
    
    expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-bottom-nav')).not.toBeInTheDocument()
  })

  test('should render mobile navigation on small screens', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    
    const { render, screen } = setupComponentTest()
    render(<DashboardLayout />)
    
    expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument()
    expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument()
  })

  test('should handle viewport orientation changes', () => {
    const { render, screen } = setupComponentTest()
    render(<MarkupCanvas />)
    
    // Portrait mode
    Object.defineProperty(screen, 'orientation', { value: { angle: 0 } })
    fireEvent(window, new Event('orientationchange'))
    
    expect(screen.getByTestId('portrait-layout')).toBeInTheDocument()
    
    // Landscape mode
    Object.defineProperty(screen, 'orientation', { value: { angle: 90 } })
    fireEvent(window, new Event('orientationchange'))
    
    expect(screen.getByTestId('landscape-layout')).toBeInTheDocument()
  })
})
```

#### 5.2 Touch Interface Tests
```javascript
// __tests__/components/ui/touch-interface.test.tsx
describe('Touch Interface Components', () => {
  test('should handle touch gestures on tool palette', async () => {
    const { render, screen, user } = setupComponentTest()
    render(<ToolPalette />)
    
    const toolButton = screen.getByTestId('box-tool')
    
    // Test tap
    await user.pointer({ target: toolButton, keys: '[TouchA]' })
    expect(toolButton).toHaveClass('active')
    
    // Test long press
    await user.pointer([
      { target: toolButton, keys: '[TouchA>]' },
      { delay: 600 },
      { keys: '[/TouchA]' }
    ])
    
    expect(screen.getByTestId('tool-options-menu')).toBeVisible()
  })

  test('should handle pinch-to-zoom on canvas', async () => {
    const { render, screen } = setupComponentTest()
    render(<MarkupCanvas />)
    
    const canvas = screen.getByTestId('markup-canvas')
    
    // Simulate pinch gesture
    fireEvent.touchStart(canvas, {
      touches: [
        { clientX: 100, clientY: 100, identifier: 1 },
        { clientX: 200, clientY: 200, identifier: 2 }
      ]
    })
    
    fireEvent.touchMove(canvas, {
      touches: [
        { clientX: 80, clientY: 80, identifier: 1 },
        { clientX: 220, clientY: 220, identifier: 2 }
      ]
    })
    
    fireEvent.touchEnd(canvas)
    
    // Should trigger zoom
    expect(canvas).toHaveStyle('transform: scale(1.2)')
  })
})
```

#### 5.3 Font Size Context Tests
```javascript
// __tests__/context/font-size-context.test.tsx
describe('Font Size Context', () => {
  test('should provide font size scaling', () => {
    const TestComponent = () => {
      const { fontSize, setFontSize } = useFontSize()
      return (
        <div>
          <span data-testid="current-size">{fontSize}</span>
          <button onClick={() => setFontSize('large')}>Large</button>
        </div>
      )
    }
    
    const { render, screen, user } = setupComponentTest()
    render(
      <FontSizeProvider>
        <TestComponent />
      </FontSizeProvider>
    )
    
    expect(screen.getByTestId('current-size')).toHaveTextContent('medium')
    
    user.click(screen.getByText('Large'))
    expect(screen.getByTestId('current-size')).toHaveTextContent('large')
  })

  test('should apply font size classes correctly', () => {
    const { render, screen } = setupComponentTest()
    render(
      <FontSizeProvider initialSize="large">
        <div className={getFontSizeClass('large')}>Test Text</div>
      </FontSizeProvider>
    )
    
    expect(screen.getByText('Test Text')).toHaveClass('text-lg')
  })
})
```

### Integration Tests

#### 5.4 Responsive Workflow Integration Tests
```javascript
// __tests__/integration/mobile-workflow.test.ts
describe('Mobile Workflow Integration', () => {
  test('should complete construction workflow on mobile', async () => {
    // Set mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    Object.defineProperty(window, 'innerHeight', { value: 667 })
    
    const { render, screen, user } = setupIntegrationTest('worker@inopnc.com')
    render(<DashboardLayout><DashboardPage /></DashboardLayout>)
    
    // Check mobile bottom navigation
    expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument()
    
    // Navigate to attendance
    await user.click(screen.getByTestId('nav-attendance'))
    
    // Check in using mobile interface
    await user.click(screen.getByTestId('mobile-checkin'))
    expect(screen.getByText(/출근 완료/)).toBeInTheDocument()
    
    // Navigate to work log
    await user.click(screen.getByTestId('nav-worklog'))
    
    // Create work log entry
    await user.click(screen.getByTestId('mobile-add-log'))
    await user.type(screen.getByTestId('mobile-work-content'), '현장 정리 작업')
    await user.click(screen.getByTestId('mobile-save-log'))
    
    expect(screen.getByText(/작업 일지가 저장되었습니다/)).toBeInTheDocument()
  })

  test('should handle mobile markup tool workflow', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    
    const { render, screen, user } = setupIntegrationTest('production@inopnc.com')
    render(<MarkupEditor />)
    
    // Should show mobile tool palette
    expect(screen.getByTestId('mobile-tool-palette')).toBeInTheDocument()
    
    // Upload blueprint
    const file = new File(['blueprint'], 'mobile-test.png', { type: 'image/png' })
    await user.upload(screen.getByTestId('mobile-file-upload'), file)
    
    // Use mobile tools
    await user.click(screen.getByTestId('mobile-box-tool'))
    
    const canvas = screen.getByTestId('markup-canvas')
    
    // Test touch drawing
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 50, clientY: 50 }]
    })
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 100, clientY: 100 }]
    })
    fireEvent.touchEnd(canvas)
    
    // Save using mobile interface
    await user.click(screen.getByTestId('mobile-save'))
    await user.type(screen.getByTestId('mobile-title'), '모바일 테스트')
    await user.click(screen.getByTestId('mobile-save-confirm'))
    
    expect(screen.getByText(/저장 완료/)).toBeInTheDocument()
  })
})
```

### End-to-End Tests

#### 5.5 Mobile Responsive E2E Tests
```javascript
// e2e/mobile-responsive.spec.ts
import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Responsive UI', () => {
  test.use({ ...devices['iPhone 13'] })

  test('mobile navigation and workflow', async ({ page }) => {
    await loginAs(page, 'worker@inopnc.com', 'password123')
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible()
    await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible()
    
    // Test bottom navigation
    const navItems = ['홈', '출근현황', '작업일지', '문서함', '내정보']
    
    for (const item of navItems) {
      await page.click(`[data-testid="nav-${item}"]`)
      await expect(page.locator(`[data-testid="page-${item}"]`)).toBeVisible()
    }
    
    // Test mobile quick menu
    await page.click('[data-testid="nav-홈"]')
    await expect(page.locator('[data-testid="quick-menu-grid"]')).toBeVisible()
    
    const quickMenuItems = page.locator('[data-testid="quick-menu-item"]')
    await expect(quickMenuItems).toHaveCount(4)
    
    // Test mobile touch targets (minimum 48x48px)
    const touchTargets = page.locator('[data-testid*="button"], [data-testid*="nav"]')
    
    for (let i = 0; i < await touchTargets.count(); i++) {
      const target = touchTargets.nth(i)
      const box = await target.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(48)
      expect(box.height).toBeGreaterThanOrEqual(48)
    }
  })

  test('mobile markup tool interface', async ({ page }) => {
    await loginAs(page, 'production@inopnc.com', 'password123')
    await page.goto('/dashboard/markup')
    
    // Create new markup
    await page.click('[data-testid="new-markup-mobile"]')
    
    // Test mobile file upload
    await page.setInputFiles('[data-testid="mobile-file-input"]', 'e2e/fixtures/mobile-blueprint.jpg')
    
    // Verify mobile tool palette layout
    await expect(page.locator('[data-testid="mobile-tool-row-1"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-tool-row-2"]')).toBeVisible()
    
    // Test 2-row tool layout
    const row1Tools = page.locator('[data-testid="mobile-tool-row-1"] [data-testid*="tool"]')
    const row2Tools = page.locator('[data-testid="mobile-tool-row-2"] [data-testid*="tool"]')
    
    await expect(row1Tools).toHaveCount(4) // Select, Material Zone, Work Progress, Undo/Redo
    await expect(row2Tools).toHaveCount(4) // Work Complete, Text, Pen, Delete
    
    // Test tool selection
    await page.click('[data-testid="mobile-box-tool"]')
    await expect(page.locator('[data-testid="mobile-box-tool"]')).toHaveClass(/active/)
    
    // Test canvas interaction
    const canvas = page.locator('[data-testid="markup-canvas"]')
    
    // Touch drawing
    await canvas.tap({ position: { x: 100, y: 100 } })
    await canvas.tap({ position: { x: 200, y: 200 } })
    
    // Verify markup was created
    await expect(page.locator('[data-testid="markup-count"]')).toContainText('1')
    
    // Test mobile save flow
    await page.click('[data-testid="mobile-save-button"]')
    await expect(page.locator('[data-testid="mobile-save-dialog"]')).toBeVisible()
    
    await page.fill('[data-testid="mobile-title-input"]', '모바일 마킹 테스트')
    await page.selectOption('[data-testid="mobile-location-select"]', 'personal')
    await page.click('[data-testid="mobile-save-confirm"]')
    
    await expect(page.locator('[data-testid="mobile-success-toast"]')).toBeVisible()
  })

  test('landscape mode optimization', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 }) // Landscape
    
    await loginAs(page, 'worker@inopnc.com', 'password123')
    await page.goto('/dashboard/markup')
    
    // In landscape, should show more compact layout
    await expect(page.locator('[data-testid="landscape-layout"]')).toBeVisible()
    
    // Tool palette should adapt to landscape
    await expect(page.locator('[data-testid="landscape-tool-palette"]')).toBeVisible()
    
    // Canvas should utilize more width
    const canvas = page.locator('[data-testid="markup-canvas"]')
    const canvasBox = await canvas.boundingBox()
    
    expect(canvasBox.width).toBeGreaterThan(500) // Should use most of landscape width
  })
})

test.describe('Tablet Responsive UI', () => {
  test.use({ ...devices['iPad Pro'] })

  test('tablet hybrid interface', async ({ page }) => {
    await loginAs(page, 'admin@inopnc.com', 'password123')
    
    // Tablet should show hybrid interface
    await expect(page.locator('[data-testid="tablet-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="tablet-bottom-nav"]')).toBeVisible()
    
    // Test tablet markup interface
    await page.goto('/dashboard/markup')
    
    // Should show full desktop-like tool palette
    await expect(page.locator('[data-testid="full-tool-palette"]')).toBeVisible()
    
    // But maintain touch-friendly sizing
    const tools = page.locator('[data-testid*="tool-button"]')
    
    for (let i = 0; i < await tools.count(); i++) {
      const tool = tools.nth(i)
      const box = await tool.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(44) // Touch-friendly size
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })
})
```

### Edge Cases

#### 5.6 Mobile UI Edge Cases
```javascript
// __tests__/mobile-edge-cases.test.ts
describe('Mobile UI Edge Cases', () => {
  test('should handle very small screens', () => {
    Object.defineProperty(window, 'innerWidth', { value: 280 })
    Object.defineProperty(window, 'innerHeight', { value: 480 })
    
    const { render, screen } = setupComponentTest()
    render(<DashboardLayout />)
    
    // Should show ultra-compact layout
    expect(screen.getByTestId('ultra-compact-nav')).toBeInTheDocument()
    
    // Text should be appropriately sized
    const textElements = screen.getAllByTestId(/text-/)
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element)
      expect(parseInt(styles.fontSize)).toBeGreaterThanOrEqual(14)
    })
  })

  test('should handle touch mode preferences', () => {
    const { render, screen } = setupComponentTest()
    render(
      <TouchModeProvider initialMode="glove">
        <ToolPalette />
      </TouchModeProvider>
    )
    
    // In glove mode, buttons should be larger
    const buttons = screen.getAllByTestId(/tool-button/)
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button)
      expect(parseInt(styles.width)).toBeGreaterThanOrEqual(60)
      expect(parseInt(styles.height)).toBeGreaterThanOrEqual(60)
    })
  })

  test('should handle network connectivity changes', async () => {
    const { render, screen } = setupComponentTest()
    render(<MobileWorkflowPage />)
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false })
    fireEvent(window, new Event('offline'))
    
    await waitFor(() => {
      expect(screen.getByText(/오프라인 모드/)).toBeInTheDocument()
      expect(screen.getByTestId('offline-indicator')).toBeVisible()
    })
    
    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', { value: true })
    fireEvent(window, new Event('online'))
    
    await waitFor(() => {
      expect(screen.queryByText(/오프라인 모드/)).not.toBeInTheDocument()
      expect(screen.getByText(/데이터 동기화 중/)).toBeInTheDocument()
    })
  })

  test('should handle device orientation lock', async () => {
    const { render, screen } = setupComponentTest()
    render(<MarkupCanvas />)
    
    // Mock orientation lock API
    const mockLockOrientation = jest.fn()
    Object.defineProperty(screen, 'orientation', {
      value: { lock: mockLockOrientation }
    })
    
    // Trigger orientation lock request
    fireEvent.click(screen.getByTestId('lock-landscape-button'))
    
    expect(mockLockOrientation).toHaveBeenCalledWith('landscape')
  })
})
```

---

## 6. Data Integrity and Performance Test Scenarios

### Unit Tests

#### 6.1 Database Transaction Tests
```javascript
// __tests__/lib/database/transactions.test.ts
describe('Database Transaction Integrity', () => {
  test('should handle atomic daily report creation', async () => {
    const { supabase } = setupSupabaseTest('worker@inopnc.com')
    
    const reportData = {
      work_content: '콘크리트 타설 작업',
      site_conditions: '날씨 양호',
      labor_hours: 1.0
    }
    
    const result = await createDailyReportWithAttendance(reportData)
    
    // Both report and attendance should be created or both should fail
    if (result.success) {
      expect(result.data.report).toBeDefined()
      expect(result.data.attendance).toBeDefined()
    } else {
      // Verify no partial data was created
      const reports = await supabase.from('daily_reports').select('*').eq('id', result.reportId)
      const attendance = await supabase.from('attendance_records').select('*').eq('report_id', result.reportId)
      
      expect(reports.data).toHaveLength(0)
      expect(attendance.data).toHaveLength(0)
    }
  })

  test('should handle concurrent attendance updates', async () => {
    const userId = 'test-user-id'
    const date = '2025-08-14'
    
    // Simulate concurrent updates
    const updates = Array(5).fill().map(() =>
      updateAttendanceRecord(userId, date, { labor_hours: 1.0 })
    )
    
    const results = await Promise.allSettled(updates)
    
    // Only one should succeed, others should be rejected
    const successful = results.filter(r => r.status === 'fulfilled')
    const failed = results.filter(r => r.status === 'rejected')
    
    expect(successful).toHaveLength(1)
    expect(failed).toHaveLength(4)
  })

  test('should maintain referential integrity', async () => {
    const { supabase } = setupSupabaseTest('admin@inopnc.com')
    
    // Create site
    const { data: site } = await supabase
      .from('sites')
      .insert({ name: '테스트 현장' })
      .select()
      .single()
    
    // Create profile linked to site
    const { data: profile } = await supabase
      .from('profiles')
      .insert({ 
        email: 'siteuser@inopnc.com',
        site_id: site.id 
      })
      .select()
      .single()
    
    // Try to delete site (should fail due to FK constraint)
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', site.id)
    
    expect(error).toBeDefined()
    expect(error.message).toContain('foreign key constraint')
  })
})
```

#### 6.2 Data Validation Tests
```javascript
// __tests__/lib/validation/data-validation.test.ts
describe('Data Validation', () => {
  test('should validate labor hours constraints', () => {
    const validCases = [0, 0.125, 0.5, 1.0, 1.25, 2.0]
    const invalidCases = [-1, 3.0, 'invalid', null, undefined]
    
    validCases.forEach(hours => {
      expect(validateLaborHours(hours)).toBe(true)
    })
    
    invalidCases.forEach(hours => {
      expect(validateLaborHours(hours)).toBe(false)
    })
  })

  test('should validate email formats', () => {
    const validEmails = [
      'user@inopnc.com',
      'test.user+tag@inopnc.co.kr',
      'user123@sub.inopnc.com'
    ]
    
    const invalidEmails = [
      'invalid-email',
      '@inopnc.com',
      'user@',
      'user space@inopnc.com'
    ]
    
    validEmails.forEach(email => {
      expect(validateEmail(email)).toBe(true)
    })
    
    invalidEmails.forEach(email => {
      expect(validateEmail(email)).toBe(false)
    })
  })

  test('should validate markup object structure', () => {
    const validMarkup = {
      id: 'test-1',
      type: 'box',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      color: '#ff0000'
    }
    
    const invalidMarkup = {
      type: 'invalid-type',
      x: 'not-a-number',
      color: 'invalid-color'
    }
    
    expect(validateMarkupObject(validMarkup)).toBe(true)
    expect(validateMarkupObject(invalidMarkup)).toBe(false)
  })
})
```

#### 6.3 Performance Measurement Tests
```javascript
// __tests__/lib/performance/performance.test.ts
describe('Performance Measurements', () => {
  test('should measure database query performance', async () => {
    const { supabase } = setupSupabaseTest('admin@inopnc.com')
    
    const startTime = performance.now()
    
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*, profiles(*), sites(*)')
      .limit(100)
    
    const endTime = performance.now()
    const queryTime = endTime - startTime
    
    expect(error).toBeNull()
    expect(queryTime).toBeLessThan(1000) // Should complete within 1 second
  })

  test('should measure component render performance', () => {
    const { render, screen } = setupComponentTest()
    
    const startTime = performance.now()
    render(<DashboardPage />)
    const endTime = performance.now()
    
    const renderTime = endTime - startTime
    
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
    expect(renderTime).toBeLessThan(100) // Should render within 100ms
  })

  test('should measure canvas drawing performance', async () => {
    const { render, screen, user } = setupComponentTest()
    render(<MarkupCanvas />)
    
    const canvas = screen.getByTestId('markup-canvas')
    
    const startTime = performance.now()
    
    // Simulate drawing 100 objects
    for (let i = 0; i < 100; i++) {
      await user.pointer([
        { target: canvas, coords: { x: i, y: i } },
        { keys: '[MouseLeft>]' },
        { target: canvas, coords: { x: i + 10, y: i + 10 } },
        { keys: '[/MouseLeft]' }
      ])
    }
    
    const endTime = performance.now()
    const drawingTime = endTime - startTime
    
    expect(drawingTime).toBeLessThan(5000) // Should complete within 5 seconds
  })
})
```

### Integration Tests

#### 6.4 Performance Integration Tests
```javascript
// __tests__/integration/performance-integration.test.ts
describe('Performance Integration Tests', () => {
  test('should handle large dataset pagination', async () => {
    const { render, screen, user } = setupIntegrationTest('admin@inopnc.com')
    
    // Create large dataset
    const largeDataset = Array(1000).fill().map((_, i) => ({
      id: i,
      title: `Report ${i}`,
      content: `Content for report ${i}`
    }))
    
    render(<ReportList initialData={largeDataset} pageSize={50} />)
    
    // Should only render first page
    expect(screen.getAllByTestId('report-item')).toHaveLength(50)
    
    // Performance check: pagination should be fast
    const startTime = performance.now()
    
    await user.click(screen.getByText('Next'))
    
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(200)
    expect(screen.getAllByTestId('report-item')).toHaveLength(50)
  })

  test('should handle concurrent user actions', async () => {
    const { render, screen, user } = setupIntegrationTest('site_manager@inopnc.com')
    render(<TeamDashboard />)
    
    // Simulate multiple concurrent actions
    const actions = [
      () => user.click(screen.getByTestId('refresh-button')),
      () => user.click(screen.getByTestId('filter-button')),
      () => user.type(screen.getByTestId('search-input'), 'test'),
      () => user.click(screen.getByTestId('export-button'))
    ]
    
    const startTime = performance.now()
    
    await Promise.all(actions.map(action => action()))
    
    const endTime = performance.now()
    
    // All actions should complete without conflicts
    expect(endTime - startTime).toBeLessThan(3000)
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
  })

  test('should optimize image loading in markup system', async () => {
    const { render, screen } = setupIntegrationTest('worker@inopnc.com')
    
    const largeImages = Array(10).fill().map((_, i) => ({
      url: `https://example.com/blueprint-${i}.jpg`,
      size: 5 * 1024 * 1024 // 5MB each
    }))
    
    render(<MarkupDocumentList images={largeImages} />)
    
    // Should use lazy loading
    const visibleImages = screen.getAllByTestId('blueprint-thumbnail')
    expect(visibleImages.length).toBeLessThanOrEqual(6) // Only visible items loaded
    
    // Should show loading placeholders for others
    const placeholders = screen.getAllByTestId('image-placeholder')
    expect(placeholders.length).toBeGreaterThan(0)
  })
})
```

### End-to-End Performance Tests

#### 6.5 E2E Performance Tests
```javascript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance E2E Tests', () => {
  test('page load performance benchmarks', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Measure login page load
    const loginMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      }
    })
    
    expect(loginMetrics.domContentLoaded).toBeLessThan(2000)
    expect(loginMetrics.loadComplete).toBeLessThan(3000)
    
    // Login and measure dashboard load
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    
    const dashboardLoadStart = Date.now()
    await page.click('[data-testid="signin-button"]')
    await page.waitForURL('/dashboard')
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible()
    const dashboardLoadEnd = Date.now()
    
    const dashboardLoadTime = dashboardLoadEnd - dashboardLoadStart
    expect(dashboardLoadTime).toBeLessThan(4000)
  })

  test('markup system performance under load', async ({ page }) => {
    await loginAs(page, 'production@inopnc.com', 'password123')
    await page.goto('/dashboard/markup')
    
    // Create new markup with large blueprint
    await page.click('[data-testid="new-markup-button"]')
    await page.setInputFiles('[data-testid="file-upload"]', 'e2e/fixtures/large-blueprint.png')
    
    const canvasLoadStart = Date.now()
    await expect(page.locator('[data-testid="markup-canvas"]')).toBeVisible()
    const canvasLoadEnd = Date.now()
    
    expect(canvasLoadEnd - canvasLoadStart).toBeLessThan(3000)
    
    // Performance test: Add many markup objects
    const canvas = page.locator('[data-testid="markup-canvas"]')
    
    const drawingStart = Date.now()
    
    for (let i = 0; i < 50; i++) {
      await canvas.click({ position: { x: 100 + i * 2, y: 100 + i * 2 } })
      await canvas.click({ position: { x: 120 + i * 2, y: 120 + i * 2 } })
    }
    
    const drawingEnd = Date.now()
    
    // Should complete drawing operations within reasonable time
    expect(drawingEnd - drawingStart).toBeLessThan(10000)
    
    // Canvas should remain responsive
    await expect(page.locator('[data-testid="markup-count"]')).toContainText('50')
  })

  test('database query performance monitoring', async ({ page }) => {
    await page.goto('/dashboard/admin/performance')
    await loginAs(page, 'admin@inopnc.com', 'password123')
    
    // Trigger complex data loading
    await page.click('[data-testid="load-all-reports"]')
    
    // Monitor network requests
    const responses = []
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing()
        })
      }
    })
    
    await expect(page.locator('[data-testid="reports-loaded"]')).toBeVisible({ timeout: 10000 })
    
    // Verify API response times
    responses.forEach(response => {
      expect(response.status).toBe(200)
      expect(response.timing.responseEnd).toBeLessThan(2000)
    })
  })

  test('mobile performance optimization', async ({ page }) => {
    await page.emulate(devices['iPhone 13'])
    await page.goto('/auth/login')
    
    // Measure mobile-specific metrics
    const mobileMetrics = await page.evaluate(() => {
      return {
        firstPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime,
        largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime
      }
    })
    
    expect(mobileMetrics.firstPaint).toBeLessThan(1500)
    expect(mobileMetrics.firstContentfulPaint).toBeLessThan(2000)
    expect(mobileMetrics.largestContentfulPaint).toBeLessThan(2500)
    
    // Test mobile markup performance
    await loginAs(page, 'worker@inopnc.com', 'password123')
    await page.goto('/dashboard/markup')
    
    const mobileMarkupStart = Date.now()
    await page.click('[data-testid="new-markup-mobile"]')
    await page.setInputFiles('[data-testid="mobile-file-input"]', 'e2e/fixtures/mobile-blueprint.jpg')
    await expect(page.locator('[data-testid="markup-canvas"]')).toBeVisible()
    const mobileMarkupEnd = Date.now()
    
    expect(mobileMarkupEnd - mobileMarkupStart).toBeLessThan(5000)
  })
})
```

### Edge Cases and Stress Tests

#### 6.6 Data Integrity Edge Cases
```javascript
// __tests__/data-integrity-edge-cases.test.ts
describe('Data Integrity Edge Cases', () => {
  test('should handle database connection failures', async () => {
    // Mock database connection failure
    const originalFetch = global.fetch
    global.fetch = jest.fn(() => Promise.reject(new Error('Connection failed')))
    
    const { supabase } = setupSupabaseTest('worker@inopnc.com')
    
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
    
    expect(error).toBeDefined()
    expect(error.message).toContain('Connection failed')
    
    // Restore original fetch
    global.fetch = originalFetch
  })

  test('should handle memory leaks in canvas operations', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    const { render, unmount } = setupComponentTest()
    
    // Create and destroy many canvas instances
    for (let i = 0; i < 100; i++) {
      const { unmount: unmountCanvas } = render(<MarkupCanvas />)
      unmountCanvas()
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
  })

  test('should handle corrupted local storage', () => {
    // Corrupt localStorage data
    localStorage.setItem('markup-preferences', 'corrupted-json{')
    
    const { render, screen } = setupComponentTest()
    
    // Should handle gracefully and not crash
    expect(() => {
      render(<MarkupEditor />)
    }).not.toThrow()
    
    expect(screen.getByTestId('markup-editor')).toBeInTheDocument()
    
    // Should reset to defaults
    expect(localStorage.getItem('markup-preferences')).toBe(null)
  })

  test('should handle extremely large markup documents', async () => {
    const hugeDocument = {
      title: '대용량 문서',
      markupObjects: Array(10000).fill().map((_, i) => ({
        id: `object-${i}`,
        type: 'box',
        x: i % 1000,
        y: Math.floor(i / 1000),
        width: 10,
        height: 10
      }))
    }
    
    const { render, screen } = setupComponentTest()
    
    const startTime = performance.now()
    
    render(<MarkupCanvas document={hugeDocument} />)
    
    const endTime = performance.now()
    
    // Should handle large documents gracefully
    expect(endTime - startTime).toBeLessThan(5000)
    expect(screen.getByTestId('markup-canvas')).toBeInTheDocument()
    
    // Should implement virtualization for large datasets
    const visibleObjects = screen.getAllByTestId(/markup-object/)
    expect(visibleObjects.length).toBeLessThan(1000) // Only visible objects rendered
  })
})
```

---

## Test Implementation Guidelines

### Jest Test Setup
```javascript
// jest.setup.js
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Mock Supabase
const server = setupServer(
  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(ctx.json({ access_token: 'mock-token' }))
  }),
  
  rest.get('*/rest/v1/*', (req, res, ctx) => {
    return res(ctx.json({ data: [] }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Global test utilities
global.setupComponentTest = () => ({
  render: require('@testing-library/react').render,
  screen: require('@testing-library/react').screen,
  user: require('@testing-library/user-event').default.setup()
})

global.setupIntegrationTest = (userEmail = 'worker@inopnc.com') => ({
  ...global.setupComponentTest(),
  mockUser: { email: userEmail, role: 'worker' }
})

global.setupSupabaseTest = (userEmail) => ({
  supabase: createMockSupabaseClient(userEmail)
})
```

### Playwright Test Utilities
```javascript
// e2e/utils/test-helpers.ts
export async function loginAs(page, email, password) {
  await page.goto('/auth/login')
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  await page.click('[data-testid="signin-button"]')
  await page.waitForURL('/dashboard')
}

export async function createTestData(page, type, data) {
  // Helper to create test data through UI or API
  switch(type) {
    case 'daily-report':
      return await createDailyReport(page, data)
    case 'markup-document':
      return await createMarkupDocument(page, data)
    default:
      throw new Error(`Unknown test data type: ${type}`)
  }
}

export function measurePerformance(page, operation) {
  return page.evaluate(async (op) => {
    const startTime = performance.now()
    await op()
    const endTime = performance.now()
    return endTime - startTime
  }, operation)
}
```

### Manual Testing Checklist

#### Authentication Flow Manual Tests
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Signup flow creates new account
- [ ] Password reset flow works
- [ ] Session persistence across browser refresh
- [ ] Logout clears session completely

#### Role-Based Access Manual Tests
- [ ] Worker cannot access admin pages
- [ ] Site manager can view team data
- [ ] Admin has full system access
- [ ] Customer manager has limited access
- [ ] System admin has unrestricted access

#### Mobile UI Manual Tests
- [ ] All touch targets are minimum 48x48px
- [ ] Bottom navigation works on all screen sizes
- [ ] Tool palette is usable with fingers
- [ ] Canvas touch drawing is responsive
- [ ] Pinch-to-zoom works smoothly
- [ ] Device orientation changes handled

#### Performance Manual Tests
- [ ] Dashboard loads within 3 seconds
- [ ] Large reports list loads with pagination
- [ ] Canvas with 100+ objects remains responsive
- [ ] File uploads show progress indicators
- [ ] Network failures show appropriate messages

### Continuous Integration Setup
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:performance
      - run: npm run lighthouse-ci
```

This comprehensive test specification covers all major aspects of the INOPNC Construction Work Management System with specific focus on the unique features like labor hours tracking, blueprint markup system, and mobile-responsive construction workflows. Each test scenario includes implementation examples for Jest unit tests, React Testing Library integration tests, and Playwright E2E tests.