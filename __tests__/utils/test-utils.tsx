/**
 * Custom test utilities for React Testing Library
 * Provides common test setup, custom render functions, and utilities
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SunlightModeProvider } from '@/contexts/SunlightModeContext'
import { EnvironmentalProvider } from '@/contexts/EnvironmentalContext'

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}

// Mock Next.js navigation
export const mockNavigation = {
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}

/**
 * All the providers wrapper
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SunlightModeProvider>
      <EnvironmentalProvider>
        {children}
      </EnvironmentalProvider>
    </SunlightModeProvider>
  )
}

/**
 * Custom render function with all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

/**
 * Mock profile data for testing
 */
export const createMockProfile = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '+1234567890',
  role: 'worker' as const,
  organization_id: 'org-123',
  site_id: 'site-123',
  status: 'active' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  login_count: 5,
  last_login_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Mock work log data for testing
 */
export const createMockWorkLog = (overrides = {}) => ({
  id: 'log-123',
  work_date: '2024-08-01',
  site_name: '강남 A현장',
  work_content: '슬라브 타설 작업 진행',
  status: 'draft' as const,
  created_at: '2024-08-01T08:00:00Z',
  updated_at: '2024-08-01T10:30:00Z',
  created_by_name: '김철수',
  site_id: 'site-123',
  ...overrides,
})

/**
 * Mock site data for testing
 */
export const createMockSite = (overrides = {}) => ({
  id: 'site-123',
  name: '강남 A현장',
  location: '서울시 강남구',
  status: 'active' as const,
  organization_id: 'org-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Mock organization data for testing
 */
export const createMockOrganization = (overrides = {}) => ({
  id: 'org-123',
  name: 'INOPNC',
  type: 'contractor' as const,
  status: 'active' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Mock daily report data for testing
 */
export const createMockDailyReport = (overrides = {}) => ({
  id: 'report-123',
  work_date: '2024-08-01',
  site_id: 'site-123',
  weather: 'sunny' as const,
  temperature: 25,
  work_content: '슬라브 타설 작업',
  safety_notes: '안전점검 완료',
  quality_notes: '품질 기준 충족',
  issues_notes: '이슈 없음',
  status: 'draft' as const,
  created_by: 'user-123',
  created_at: '2024-08-01T08:00:00Z',
  updated_at: '2024-08-01T10:30:00Z',
  ...overrides,
})

/**
 * Mock attendance record data for testing
 */
export const createMockAttendanceRecord = (overrides = {}) => ({
  id: 'attendance-123',
  user_id: 'user-123',
  work_date: '2024-08-01',
  check_in_time: '08:00:00',
  check_out_time: '17:00:00',
  status: 'present' as const,
  notes: '',
  created_at: '2024-08-01T08:00:00Z',
  updated_at: '2024-08-01T17:00:00Z',
  ...overrides,
})

/**
 * Common async utilities for testing
 */
export const waitForNextTick = () => new Promise(resolve => setImmediate(resolve))

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

/**
 * Mock sessionStorage for testing
 */
export const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

/**
 * Setup function to mock browser APIs
 */
export const setupBrowserMocks = () => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  })

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock navigator.vibrate for haptic feedback
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: jest.fn(),
  })

  // Mock Web Speech API
  Object.defineProperty(window, 'SpeechRecognition', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  })

  Object.defineProperty(window, 'webkitSpeechRecognition', {
    writable: true,
    value: window.SpeechRecognition,
  })
}

/**
 * Cleanup function for tests
 */
export const cleanupMocks = () => {
  jest.clearAllMocks()
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()
  mockLocalStorage.clear.mockClear()
  
  mockSessionStorage.getItem.mockClear()
  mockSessionStorage.setItem.mockClear()
  mockSessionStorage.removeItem.mockClear()
  mockSessionStorage.clear.mockClear()
}

/**
 * Assertion helpers for common test patterns
 */
export const expectToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectToHaveAccessibleName = (element: HTMLElement, name: string) => {
  expect(element).toHaveAccessibleName(name)
}

export const expectToHaveRole = (element: HTMLElement, role: string) => {
  expect(element).toHaveAttribute('role', role)
}

/**
 * Form testing utilities
 */
export const fillForm = async (fields: Record<string, string>) => {
  const { userEvent } = await import('@testing-library/user-event')
  const user = userEvent.setup()
  
  for (const [name, value] of Object.entries(fields)) {
    const field = document.querySelector(`[name="${name}"]`) as HTMLElement
    if (field) {
      await user.clear(field)
      await user.type(field, value)
    }
  }
}

/**
 * Error boundary for testing error states
 */
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Error occurred</div>
    }

    return this.props.children
  }
}

// Test for Jest requirement - utility functions
describe('Test Utils', () => {
  it('should export test utilities', () => {
    expect(customRender).toBeDefined()
    expect(createMockProfile).toBeDefined()
    expect(setupBrowserMocks).toBeDefined()
    expect(cleanupMocks).toBeDefined()
    expect(TestErrorBoundary).toBeDefined()
  })
  
  it('should create mock profile with defaults', () => {
    const profile = createMockProfile()
    expect(profile).toMatchObject({
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'worker'
    })
  })
  
  it('should allow profile overrides', () => {
    const profile = createMockProfile({ role: 'admin', email: 'admin@test.com' })
    expect(profile.role).toBe('admin')
    expect(profile.email).toBe('admin@test.com')
  })
})