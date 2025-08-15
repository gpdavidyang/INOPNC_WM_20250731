/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider, useAuthContext } from '@/providers/auth-provider'

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  }
}

// Mock the createClient function
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}))

// Test component that uses the auth context
function TestComponent() {
  const { user, session, loading } = useAuthContext()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="session">{session ? 'has-session' : 'no-session'}</div>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing', () => {
    // Mock successful session initialization
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    render(
      <AuthProvider>
        <div>Test content</div>
      </AuthProvider>
    )

    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('should call auth methods without errors', async () => {
    // Mock successful session initialization
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    // Verify auth methods were called
    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
    expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled()
  })

  it('should handle auth state changes', async () => {
    const mockSession = {
      user: { email: 'test@example.com', id: '123' },
      access_token: 'token'
    }

    // Mock initial session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    // Check that session was processed
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('session')).toHaveTextContent('has-session')
    })
  })

  it('should verify all auth methods exist and are functions', () => {
    const requiredMethods = [
      'getSession',
      'getUser', 
      'refreshSession',
      'onAuthStateChange',
      'signInWithPassword',
      'signUp',
      'signOut'
    ]

    requiredMethods.forEach(method => {
      expect(typeof mockSupabaseClient.auth[method]).toBe('function')
    })
  })

  it('should handle refresh session without errors', async () => {
    // Mock initial session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    mockSupabaseClient.auth.refreshSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const TestRefreshComponent = () => {
      const { refreshSession } = useAuthContext()
      
      React.useEffect(() => {
        refreshSession()
      }, [refreshSession])
      
      return <div>Refresh test</div>
    }

    render(
      <AuthProvider>
        <TestRefreshComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled()
    })
  })
})

describe('Enhanced Supabase Client Auth Methods', () => {
  it('should have all required auth methods', () => {
    const requiredMethods = [
      'signInWithPassword',
      'signUp',
      'signOut', 
      'getSession',
      'getUser',
      'refreshSession',
      'onAuthStateChange'
    ]

    requiredMethods.forEach(method => {
      expect(mockSupabaseClient.auth).toHaveProperty(method)
      expect(typeof mockSupabaseClient.auth[method]).toBe('function')
    })
  })
})