/**
 * Tests for Session Authentication Business Logic
 * 
 * Testing session management and authentication flow
 * for Task 13
 */

import { getAuthenticatedUser, requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('Session Authentication', () => {
  let mockSupabase: any
  let mockAuth: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock auth methods
    mockAuth = {
      getUser: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn()
    }
    
    // Setup mock Supabase client
    mockSupabase = {
      auth: mockAuth
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  describe('getAuthenticatedUser', () => {
    it('should return user when directly available', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01'
      }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      const result = await getAuthenticatedUser()
      
      expect(result).toEqual(mockUser)
      expect(mockAuth.getUser).toHaveBeenCalled()
      expect(mockAuth.getSession).not.toHaveBeenCalled()
    })
    
    it('should try to refresh session when user not directly available', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01'
      }
      
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123'
      }
      
      // First call to getUser fails
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'No user' }
      })
      
      // Session exists
      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession }
      })
      
      // Refresh succeeds
      mockAuth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      
      // Second call to getUser succeeds after refresh
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })
      
      const result = await getAuthenticatedUser()
      
      expect(result).toEqual(mockUser)
      expect(mockAuth.getUser).toHaveBeenCalledTimes(2)
      expect(mockAuth.getSession).toHaveBeenCalled()
      expect(mockAuth.refreshSession).toHaveBeenCalled()
    })
    
    it('should return null when no session exists', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' }
      })
      
      mockAuth.getSession.mockResolvedValue({
        data: { session: null }
      })
      
      const result = await getAuthenticatedUser()
      
      expect(result).toBeNull()
      expect(mockAuth.refreshSession).not.toHaveBeenCalled()
    })
    
    it('should return null when refresh fails', async () => {
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123'
      }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' }
      })
      
      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession }
      })
      
      mockAuth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh failed' }
      })
      
      const result = await getAuthenticatedUser()
      
      expect(result).toBeNull()
    })
    
    it('should handle exceptions gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockAuth.getUser.mockRejectedValue(new Error('Network error'))
      
      const result = await getAuthenticatedUser()
      
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting authenticated user:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
    
    it('should handle getUser returning undefined data', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: undefined },
        error: null
      })
      
      mockAuth.getSession.mockResolvedValue({
        data: { session: null }
      })
      
      const result = await getAuthenticatedUser()
      
      expect(result).toBeNull()
    })
  })
  
  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01'
      }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      const result = await requireAuth()
      
      expect(result).toEqual(mockUser)
    })
    
    it('should throw error when not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' }
      })
      
      mockAuth.getSession.mockResolvedValue({
        data: { session: null }
      })
      
      await expect(requireAuth()).rejects.toThrow('Authentication required')
    })
    
    it('should throw error when getAuthenticatedUser fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockAuth.getUser.mockRejectedValue(new Error('Network error'))
      
      await expect(requireAuth()).rejects.toThrow('Authentication required')
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('Session Refresh Flow', () => {
    it('should handle expired access token with valid refresh token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01'
      }
      
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'valid-refresh-token',
        expires_at: Date.now() / 1000 - 3600 // 1 hour ago
      }
      
      const newSession = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() / 1000 + 3600 // 1 hour from now
      }
      
      // Initial getUser fails due to expired token
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Token expired' }
      })
      
      // Session exists but is expired
      mockAuth.getSession.mockResolvedValue({
        data: { session: expiredSession }
      })
      
      // Refresh succeeds with new session
      mockAuth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null
      })
      
      // getUser succeeds with new token
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })
      
      const result = await getAuthenticatedUser()
      
      expect(result).toEqual(mockUser)
      expect(mockAuth.refreshSession).toHaveBeenCalled()
    })
    
    it('should handle multiple concurrent calls efficiently', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01'
      }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      // Make multiple concurrent calls
      const results = await Promise.all([
        getAuthenticatedUser(),
        getAuthenticatedUser(),
        getAuthenticatedUser()
      ])
      
      // All should return the same user
      expect(results).toEqual([mockUser, mockUser, mockUser])
      
      // getUser should be called 3 times (once per call)
      expect(mockAuth.getUser).toHaveBeenCalledTimes(3)
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle malformed session data', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      mockAuth.getSession.mockResolvedValue({
        data: { session: {} } // Missing required fields
      })
      
      mockAuth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' }
      })
      
      const result = await getAuthenticatedUser()
      
      expect(result).toBeNull()
    })
    
    it('should handle network timeouts gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockAuth.getUser.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )
      
      const result = await getAuthenticatedUser()
      
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })
})