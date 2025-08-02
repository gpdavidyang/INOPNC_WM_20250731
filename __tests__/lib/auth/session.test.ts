import { getAuthenticatedUser, requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('Auth Session Utils', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn(),
        refreshSession: jest.fn(),
      },
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAuthenticatedUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await getAuthenticatedUser()

      expect(result).toEqual(mockUser)
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('should return null when no user exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await getAuthenticatedUser()

      expect(result).toBeNull()
    })

    it('should handle auth errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error')
      })
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await getAuthenticatedUser()

      expect(result).toBeNull()
    })

    it('should try to refresh session when user is null but session exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token123' }
      
      mockSupabase.auth.getUser
        .mockResolvedValueOnce({
          data: { user: null },
          error: null
        })
        .mockResolvedValueOnce({
          data: { user: mockUser },
          error: null
        })
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await getAuthenticatedUser()

      expect(result).toEqual(mockUser)
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await requireAuth()

      expect(result).toEqual(mockUser)
    })

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      await expect(requireAuth()).rejects.toThrow('Authentication required')
    })
  })
})