/**
 * Custom render functions with all required providers
 * Provides standardized testing environment for React components
 */

import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from '@testing-library/react'

// Mock providers that might be needed
const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>
}

const MockThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>
}

const MockNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>
}

/**
 * Custom render options
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Auth context options
  authUser?: any
  authLoading?: boolean
  authError?: string | null
  
  // Query client options
  queryClient?: QueryClient
  
  // Theme options
  theme?: 'light' | 'dark'
  
  // Notification options
  notifications?: any[]
  
  // Router options
  initialRoute?: string
  routerPush?: jest.Mock
  routerReplace?: jest.Mock
  
  // Provider options
  withAuth?: boolean
  withQuery?: boolean
  withTheme?: boolean
  withNotifications?: boolean
  withRouter?: boolean
}

/**
 * Create a test query client
 */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * All providers wrapper
 */
const AllTheProviders: React.FC<{
  children: ReactNode
  options: CustomRenderOptions
}> = ({ children, options }) => {
  const {
    queryClient = createTestQueryClient(),
    authUser,
    authLoading = false,
    authError = null,
    theme = 'light',
    notifications = [],
    withAuth = true,
    withQuery = true,
    withTheme = true,
    withNotifications = true,
  } = options

  let content = children

  // Wrap with QueryClient provider
  if (withQuery) {
    content = (
      <QueryClientProvider client={queryClient}>
        {content}
      </QueryClientProvider>
    )
  }

  // Wrap with Auth provider
  if (withAuth) {
    content = (
      <MockAuthProvider>
        {content}
      </MockAuthProvider>
    )
  }

  // Wrap with Theme provider
  if (withTheme) {
    content = (
      <MockThemeProvider>
        {content}
      </MockThemeProvider>
    )
  }

  // Wrap with Notification provider
  if (withNotifications) {
    content = (
      <MockNotificationProvider>
        {content}
      </MockNotificationProvider>
    )
  }

  return <>{content}</>
}

/**
 * Custom render function with all providers
 */
const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { 
    queryClient = createTestQueryClient(),
    ...renderOptions 
  } = options

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AllTheProviders options={{ queryClient, ...options }}>
      {children}
    </AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Custom render with authentication context
 */
export const renderWithAuth = (
  ui: ReactElement,
  authOptions: {
    user?: any
    loading?: boolean
    error?: string | null
  } = {},
  renderOptions: CustomRenderOptions = {}
) => {
  return customRender(ui, {
    ...renderOptions,
    authUser: authOptions.user,
    authLoading: authOptions.loading,
    authError: authOptions.error,
    withAuth: true,
  })
}

/**
 * Custom render with React Query
 */
export const renderWithQuery = (
  ui: ReactElement,
  queryOptions: {
    client?: QueryClient
  } = {},
  renderOptions: CustomRenderOptions = {}
) => {
  return customRender(ui, {
    ...renderOptions,
    queryClient: queryOptions.client || createTestQueryClient(),
    withQuery: true,
  })
}

/**
 * Custom render with router context
 */
export const renderWithRouter = (
  ui: ReactElement,
  routerOptions: {
    initialRoute?: string
    push?: jest.Mock
    replace?: jest.Mock
  } = {},
  renderOptions: CustomRenderOptions = {}
) => {
  // Mock Next.js router
  const mockRouter = {
    push: routerOptions.push || jest.fn(),
    replace: routerOptions.replace || jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    pathname: routerOptions.initialRoute || '/test',
    query: {},
    asPath: routerOptions.initialRoute || '/test',
  }

  // Mock useRouter hook
  jest.doMock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => mockRouter.pathname,
    useSearchParams: () => new URLSearchParams(),
  }))

  return customRender(ui, {
    ...renderOptions,
    withRouter: true,
  })
}

/**
 * Custom render with all providers (kitchen sink)
 */
export const renderWithAllProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return customRender(ui, {
    withAuth: true,
    withQuery: true,
    withTheme: true,
    withNotifications: true,
    withRouter: true,
    ...options,
  })
}

/**
 * Async render helper that waits for initial effects
 */
export const renderAsync = async (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  let result: RenderResult

  await act(async () => {
    result = customRender(ui, options)
    // Wait for initial effects to run
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  return result!
}

/**
 * Helper to render component and wait for loading to complete
 */
export const renderAndWaitForLoading = async (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const result = await renderAsync(ui, options)
  
  // Wait for any loading states to complete
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
  })
  
  return result
}

/**
 * Helper to test component with different auth states
 */
export const testWithAuthStates = async (
  ui: ReactElement,
  testFn: (result: RenderResult, authState: string) => Promise<void>
) => {
  const authStates = [
    { name: 'unauthenticated', user: null, loading: false },
    { name: 'loading', user: null, loading: true },
    { name: 'authenticated', user: { id: 'test-user' }, loading: false },
  ]

  for (const authState of authStates) {
    const result = renderWithAuth(ui, authState)
    await testFn(result, authState.name)
    result.unmount()
  }
}

/**
 * Helper to test component with different screen sizes
 */
export const testWithScreenSizes = async (
  ui: ReactElement,
  testFn: (result: RenderResult, screenSize: string) => Promise<void>
) => {
  const screenSizes = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ]

  for (const screenSize of screenSizes) {
    // Mock window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: screenSize.width,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: screenSize.height,
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))

    const result = customRender(ui)
    await testFn(result, screenSize.name)
    result.unmount()
  }
}

/**
 * Helper to create controlled render for testing interactions
 */
export const createControlledRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const result = customRender(ui, options)
  
  const rerender = (newUi?: ReactElement) => {
    return act(() => {
      result.rerender(newUi || ui)
    })
  }

  const unmount = () => {
    return act(() => {
      result.unmount()
    })
  }

  return {
    ...result,
    rerender,
    unmount,
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render method
export { customRender as render }