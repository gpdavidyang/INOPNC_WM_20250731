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

// Mock ProfileManager
jest.mock('@/lib/auth/profile-manager', () => ({
  ProfileManager: {
    createProfile: jest.fn(),
    assignWorkerToDefaultSite: jest.fn(),
  },
}))

describe('Authentication Actions', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create individual mock query objects to avoid conflicts
    const createMockQuery = () => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })
    
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn((table: string) => createMockQuery()),
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

      // Mock profile query
      const profileQuery = mockSupabase.from('profiles')
      profileQuery.single.mockResolvedValueOnce({
        data: { login_count: 5 },
        error: null,
      })

      // Mock profile update
      profileQuery.update.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await signIn('test@example.com', 'password123')

      expect(result).toEqual({ success: true })
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      const result = await signIn('test@example.com', 'wrongpassword')

      expect(result).toEqual({ error: 'Invalid login credentials' })
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

      // Mock profile query failure
      const profileQuery = mockSupabase.from('profiles')
      profileQuery.single.mockRejectedValueOnce(new Error('Database error'))

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

      // Mock upsert responses for all tables
      const profilesTable = mockSupabase.from('profiles')
      profilesTable.upsert.mockResolvedValue({ error: null })
      
      const userOrgTable = mockSupabase.from('user_organizations')
      userOrgTable.upsert.mockResolvedValue({ error: null })
      
      const siteAssignTable = mockSupabase.from('site_assignments')
      siteAssignTable.upsert.mockResolvedValue({ error: null })

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

      // Verify calls were made to the right tables
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_organizations')
      expect(mockSupabase.from).toHaveBeenCalledWith('site_assignments')
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

      // Mock upsert responses
      const profilesTable = mockSupabase.from('profiles')
      profilesTable.upsert.mockResolvedValue({ error: null })
      
      const userOrgTable = mockSupabase.from('user_organizations')
      userOrgTable.upsert.mockResolvedValue({ error: null })

      const result = await signUp(
        'davidswyang@gmail.com',
        'password123',
        'David Yang',
        '+1234567890',
        'worker' // Should be overridden to system_admin
      )

      expect(result).toEqual({ success: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
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

      // Mock the first call to profiles table to return an error
      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          callCount++
          if (callCount === 1) {
            return {
              upsert: jest.fn().mockResolvedValue({
                error: { message: 'Profile creation failed' },
              }),
            }
          }
        }
        // Return normal mock for other calls
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          upsert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }
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
    it('should successfully sign out user', async () => {
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

      const result = await signOut()

      expect(result).toEqual({ success: true })
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      // Note: RPC logging is commented out in implementation
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