import { signIn, signUp, signOut } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Authentication Actions', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
      rpc: jest.fn(),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('signIn', () => {
    it('should successfully sign in user and update login stats', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const profileMock = mockSupabase.from().single
      profileMock.mockResolvedValueOnce({
        data: { login_count: 5 },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValueOnce({ error: null })

      const result = await signIn('test@example.com', 'password123')

      expect(result).toEqual({ success: true })
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('log_auth_event', {
        user_id: 'user-123',
        event_type: 'login',
        details: { email: 'test@example.com' },
      })
    })

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      mockSupabase.rpc.mockResolvedValueOnce({ error: null })

      const result = await signIn('test@example.com', 'wrongpassword')

      expect(result).toEqual({ error: 'Invalid login credentials' })
      expect(mockSupabase.rpc).toHaveBeenCalledWith('log_auth_event', {
        user_id: 'test@example.com',
        event_type: 'login_failed',
        details: { error: 'Invalid login credentials' },
      })
    })

    it('should handle profile update failure gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const profileMock = mockSupabase.from().single
      profileMock.mockRejectedValueOnce(new Error('Database error'))

      const result = await signIn('test@example.com', 'password123')

      // Should still return success even if profile update fails
      expect(result).toEqual({ success: true })
    })
  })

  describe('signUp', () => {
    it('should create user with profile and organization assignments', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'worker@inopnc.com',
      }

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().upsert.mockResolvedValue({ error: null })

      const result = await signUp(
        'worker@inopnc.com',
        'password123',
        'Test Worker',
        '+1234567890',
        'worker'
      )

      expect(result).toEqual({ success: true })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'worker@inopnc.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test Worker',
            phone: '+1234567890',
            role: 'worker',
          },
        },
      })

      // Verify profile creation
      const profileCalls = mockSupabase.from.mock.calls
      expect(profileCalls[0][0]).toBe('profiles')
      
      const profileData = mockSupabase.from().upsert.mock.calls[0][0]
      expect(profileData).toMatchObject({
        id: 'user-123',
        email: 'worker@inopnc.com',
        full_name: 'Test Worker',
        phone: '+1234567890',
        role: 'worker',
        organization_id: '11111111-1111-1111-1111-111111111111',
        site_id: '33333333-3333-3333-3333-333333333333',
        status: 'active',
      })
    })

    it('should handle special case for davidswyang@gmail.com', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'davidswyang@gmail.com',
      }

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().upsert.mockResolvedValue({ error: null })

      const result = await signUp(
        'davidswyang@gmail.com',
        'password123',
        'David Yang',
        '+1234567890',
        'worker' // Should be overridden to system_admin
      )

      expect(result).toEqual({ success: true })

      const profileData = mockSupabase.from().upsert.mock.calls[0][0]
      expect(profileData.role).toBe('system_admin')
      expect(profileData.organization_id).toBe('11111111-1111-1111-1111-111111111111')
    })

    it('should handle signup errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already exists' },
      })

      const result = await signUp(
        'existing@example.com',
        'password123',
        'Test User',
        '+1234567890',
        'worker'
      )

      expect(result).toEqual({ error: 'Email already exists' })
    })

    it('should handle profile creation failure', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().upsert.mockResolvedValueOnce({
        error: { message: 'Profile creation failed' },
      })

      const result = await signUp(
        'test@example.com',
        'password123',
        'Test User',
        '+1234567890',
        'worker'
      )

      expect(result).toEqual({ error: 'Failed to create user profile' })
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user and log event', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: null,
      })

      mockSupabase.rpc.mockResolvedValueOnce({ error: null })

      const result = await signOut()

      expect(result).toEqual({ success: true })
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(mockSupabase.rpc).toHaveBeenCalledWith('log_auth_event', {
        user_id: 'user-123',
        event_type: 'logout',
      })
    })

    it('should handle signOut errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: { message: 'Failed to sign out' },
      })

      const result = await signOut()

      expect(result).toEqual({ error: 'Failed to sign out' })
    })
  })
})