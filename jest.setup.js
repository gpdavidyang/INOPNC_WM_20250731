// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Polyfill for MSW in Node.js environment - temporarily disabled
// import { fetch, Request, Response, Headers } from 'undici'
// import { TextEncoder, TextDecoder } from 'util'

// Set up global fetch for MSW compatibility
// if (typeof global.fetch === 'undefined') {
//   global.fetch = fetch
//   global.Request = Request
//   global.Response = Response
//   global.Headers = Headers
// }

// Set up TextEncoder/TextDecoder for undici
// if (typeof global.TextEncoder === 'undefined') {
//   global.TextEncoder = TextEncoder
//   global.TextDecoder = TextDecoder
// }

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { setupBrowserMocks } from './__tests__/utils/test-utils'

// Setup API polyfills for Node.js environment
import './__tests__/setup/api-polyfill'

// Setup MSW server for API mocking (after polyfills) - temporarily disabled
// import './__tests__/utils/msw-server'

// Setup Supabase mocks
import './__tests__/utils/supabase-mocks'

// Import additional test utilities
import './__tests__/utils/async-helpers'
import './__tests__/utils/auth-helpers'

// Setup browser mocks
setupBrowserMocks()

// Increase Jest timeout for async operations
jest.setTimeout(10000)

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/test-path'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  redirect: jest.fn(),
}))

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => {
  return function mockDynamic(importFunc) {
    const Component = importFunc()
    return Component.default || Component
  }
})

// Mock Next.js image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return React.createElement('img', { src, alt, ...props })
  }
})

// Skip window.location mocking - causes redefinition errors in JSDOM
// Tests should avoid direct window.location manipulation

// Global test utilities
global.mockSupabaseUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    phone: '+1234567890',
    role: 'worker',
  },
  ...overrides,
})

global.mockSupabaseSession = (overrides = {}) => ({
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  user: global.mockSupabaseUser(),
  ...overrides,
})

// Global cleanup for each test
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  
  // Reset DOM
  document.body.innerHTML = ''
  
  // Reset console spies
  jest.restoreAllMocks()
})

// Global error handling for tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('act(...) is required'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})