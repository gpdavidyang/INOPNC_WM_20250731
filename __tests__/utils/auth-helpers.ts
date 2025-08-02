/**
 * Authentication testing utilities
 * Provides helpers for testing authenticated and unauthenticated states
 */

import { act } from '@testing-library/react'
import { mockSupabase, mockAuthenticatedUser, mockUnauthenticatedUser } from './supabase-mocks'
import { createMockProfile } from './test-utils'

/**
 * Helper to setup authenticated user for tests
 */
export const setupAuthenticatedUser = (userOverrides = {}) => {
  const user = createMockProfile(userOverrides)
  mockAuthenticatedUser(user)
  return user
}

/**
 * Helper to setup unauthenticated state for tests
 */
export const setupUnauthenticatedUser = () => {
  mockUnauthenticatedUser()
}

/**
 * Helper to test authentication flow
 */
export const testAuthenticationFlow = {
  async signIn(email: string, password: string) {
    const user = createMockProfile({ email })
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user,
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user,
        },
      },
      error: null,
    })

    await act(async () => {
      const result = await mockSupabase.auth.signInWithPassword({
        email,
        password,
      })
      expect(result.error).toBeNull()
      expect(result.data.user).toEqual(user)
    })

    return user
  },

  async signOut() {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    await act(async () => {
      const result = await mockSupabase.auth.signOut()
      expect(result.error).toBeNull()
    })

    // Update auth state to unauthenticated
    mockUnauthenticatedUser()
  },

  async signUp(email: string, password: string, metadata = {}) {
    const user = createMockProfile({ email, ...metadata })
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user,
        session: null, // Usually null for email confirmation
      },
      error: null,
    })

    await act(async () => {
      const result = await mockSupabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })
      expect(result.error).toBeNull()
      expect(result.data.user).toEqual(user)
    })

    return user
  },
}

/**
 * Helper to test role-based access control
 */
export const testRoleBasedAccess = {
  worker: () => setupAuthenticatedUser({ role: 'worker' }),
  siteManager: () => setupAuthenticatedUser({ role: 'site_manager' }),
  customerManager: () => setupAuthenticatedUser({ role: 'customer_manager' }),
  admin: () => setupAuthenticatedUser({ role: 'admin' }),
  systemAdmin: () => setupAuthenticatedUser({ role: 'system_admin' }),
}

/**
 * Helper to test authentication errors
 */
export const testAuthenticationErrors = {
  invalidCredentials() {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid login credentials',
        status: 400,
      },
    })
  },

  emailNotConfirmed() {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Email not confirmed',
        status: 400,
      },
    })
  },

  userNotFound() {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'User not found',
        status: 400,
      },
    })
  },

  networkError() {
    mockSupabase.auth.signInWithPassword.mockRejectedValue(
      new Error('Network error')
    )
  },

  sessionExpired() {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: {
        message: 'Session expired',
        status: 401,
      },
    })
  },
}

/**
 * Helper to mock different user types for testing
 */
export const createTestUsers = {
  worker: (overrides = {}) => createMockProfile({
    role: 'worker',
    organization_id: 'org-123',
    site_id: 'site-123',
    ...overrides,
  }),

  siteManager: (overrides = {}) => createMockProfile({
    role: 'site_manager',
    organization_id: 'org-123',
    site_id: 'site-123',
    ...overrides,
  }),

  customerManager: (overrides = {}) => createMockProfile({
    role: 'customer_manager',
    organization_id: 'org-456',
    site_id: null,
    ...overrides,
  }),

  admin: (overrides = {}) => createMockProfile({
    role: 'admin',
    organization_id: 'org-123',
    site_id: null,
    ...overrides,
  }),

  systemAdmin: (overrides = {}) => createMockProfile({
    role: 'system_admin',
    organization_id: null,
    site_id: null,
    ...overrides,
  }),
}

/**
 * Helper to test authentication state changes
 */
export const testAuthStateChanges = {
  async triggerAuthStateChange(event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: any = null) {
    const callbacks = new Set<Function>()
    
    // Mock onAuthStateChange to collect callbacks
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      callbacks.add(callback)
      return {
        data: {
          subscription: {
            unsubscribe: () => callbacks.delete(callback),
          },
        },
      }
    })

    // Trigger the auth state change
    await act(async () => {
      callbacks.forEach(callback => {
        callback(event, session)
      })
    })
  },

  async signInStateChange(user = createMockProfile()) {
    const session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user,
    }

    await this.triggerAuthStateChange('SIGNED_IN', session)
    mockAuthenticatedUser(user)
    return { user, session }
  },

  async signOutStateChange() {
    await this.triggerAuthStateChange('SIGNED_OUT', null)
    mockUnauthenticatedUser()
  },

  async tokenRefreshStateChange(user = createMockProfile()) {
    const session = {
      access_token: 'new-mock-access-token',
      refresh_token: 'new-mock-refresh-token',
      user,
    }

    await this.triggerAuthStateChange('TOKEN_REFRESHED', session)
    mockAuthenticatedUser(user)
    return { user, session }
  },
}

/**
 * Helper to test protected routes
 */
export const testProtectedRoute = async (
  renderProtectedComponent: () => void,
  expectRedirect: () => void
) => {
  // Test unauthenticated access
  setupUnauthenticatedUser()
  
  await act(async () => {
    renderProtectedComponent()
  })
  
  expectRedirect()

  // Test authenticated access
  const user = setupAuthenticatedUser()
  
  await act(async () => {
    renderProtectedComponent()
  })
  
  return user
}

/**
 * Helper to test session management
 */
export const testSessionManagement = {
  async mockValidSession(user = createMockProfile()) {
    const session = {
      access_token: 'valid-token',
      refresh_token: 'valid-refresh-token',
      user,
      expires_at: Date.now() + 3600000, // 1 hour from now
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session },
      error: null,
    })

    return session
  },

  async mockExpiredSession() {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: {
        message: 'Session expired',
        status: 401,
      },
    })
  },

  async mockRefreshToken(user = createMockProfile()) {
    const newSession = {
      access_token: 'new-token',
      refresh_token: 'new-refresh-token',
      user,
      expires_at: Date.now() + 3600000,
    }

    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: newSession, user },
      error: null,
    })

    return newSession
  },
}