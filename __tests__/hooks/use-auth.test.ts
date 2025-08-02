import { renderHook, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('useAuth', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()
  const mockGetUser = jest.fn()
  const mockOnAuthStateChange = jest.fn()
  const mockUnsubscribe = jest.fn()

  const mockSupabase = {
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock useRouter
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })

    // Mock createClient
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    // Mock onAuthStateChange to return subscription
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })

    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should start with loading true and user null', () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
    })
  })

  describe('Initial Session Loading', () => {
    it('should load user from initial session', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(mockGetUser).toHaveBeenCalled()
    })

    it('should handle error when getting initial user', async () => {
      mockGetUser.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(console.error).toHaveBeenCalledWith('Error getting user:', expect.any(Error))
    })

    it('should set loading to false even when user is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
    })
  })

  describe('Auth State Changes', () => {
    it('should set up auth state change listener', () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      renderHook(() => useAuth())

      expect(mockOnAuthStateChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle SIGNED_IN event', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      let authStateCallback: Function

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { result } = renderHook(() => useAuth())

      const mockUser = { id: '1', email: 'test@example.com' }
      const mockSession = { user: mockUser }

      // Simulate SIGNED_IN event
      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      expect(mockRefresh).toHaveBeenCalled()
    })

    it('should handle SIGNED_OUT event', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: '1' } } })
      let authStateCallback: Function

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { result } = renderHook(() => useAuth())

      // Simulate SIGNED_OUT event
      await authStateCallback!('SIGNED_OUT', null)

      await waitFor(() => {
        expect(result.current.user).toBe(null)
      })

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('should handle TOKEN_REFRESHED event', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      let authStateCallback: Function

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { result } = renderHook(() => useAuth())

      const mockUser = { id: '1', email: 'test@example.com' }
      const mockSession = { user: mockUser }

      // Simulate TOKEN_REFRESHED event
      act(() => {
        authStateCallback!('TOKEN_REFRESHED', mockSession)
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Should not call refresh for token refresh
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('should log auth state changes', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      let authStateCallback: Function

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      renderHook(() => useAuth())

      const mockSession = { user: { email: 'test@example.com' } }
      await authStateCallback!('SIGNED_IN', mockSession)

      expect(console.log).toHaveBeenCalledWith(
        'Auth state change:',
        'SIGNED_IN',
        'test@example.com'
      )
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const { unmount } = renderHook(() => useAuth())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})