import { ProfileManager } from '@/lib/auth/profile-manager'
import { createClient } from '@supabase/supabase-js'

// Mock the createClient function
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    rpc: jest.fn(),
  })),
}))

describe('ProfileManager', () => {
  let profileManager: ProfileManager
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    profileManager = new ProfileManager()
    mockSupabase = (profileManager as any).supabase
  })

  describe('checkProfile', () => {
    it('should return profile exists and complete for valid profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'worker',
        organization_id: 'org-123',
        site_id: 'site-123',
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      })

      const result = await profileManager.checkProfile('user-123')

      expect(result).toEqual({
        exists: true,
        isComplete: true,
        missingFields: [],
        profile: mockProfile,
      })
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_profile_complete', {
        user_id: 'user-123',
      })
    })

    it('should identify missing required fields', async () => {
      const incompleteProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: '',
        role: 'worker',
        organization_id: 'org-123',
        site_id: null,
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: incompleteProfile,
        error: null,
      })

      const result = await profileManager.checkProfile('user-123')

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
      expect(result.missingFields).toContain('full_name')
      expect(result.missingFields).toContain('site_id')
    })

    it('should handle profile not found', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Profile not found' },
      })

      const result = await profileManager.checkProfile('user-123')

      expect(result).toEqual({
        exists: false,
        isComplete: false,
        missingFields: ['profile'],
        profile: null,
      })
    })
  })

  describe('upsertProfile', () => {
    it('should create profile with auto-assigned role based on email', async () => {
      const user = {
        id: 'user-123',
        email: 'worker@inopnc.com',
      }

      const fromMock = {
        upsert: jest.fn().mockResolvedValueOnce({ error: null }),
      }
      mockSupabase.from.mockReturnValue(fromMock)

      const result = await profileManager.upsertProfile(user as any)

      expect(result.success).toBe(true)
      expect(fromMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'worker@inopnc.com',
          role: 'worker',
          organization_id: '11111111-1111-1111-1111-111111111111',
          site_id: '33333333-3333-3333-3333-333333333333',
          status: 'active',
        })
      )
    })

    it('should handle system admin email specially', async () => {
      const user = {
        id: 'user-123',
        email: 'davidswyang@gmail.com',
      }

      const fromMock = {
        upsert: jest.fn().mockResolvedValueOnce({ error: null }),
      }
      mockSupabase.from.mockReturnValue(fromMock)

      const result = await profileManager.upsertProfile(user as any)

      expect(result.success).toBe(true)
      expect(fromMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'system_admin',
          organization_id: '11111111-1111-1111-1111-111111111111',
        })
      )
    })

    it('should handle database errors', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const fromMock = {
        upsert: jest.fn().mockResolvedValueOnce({
          error: { message: 'Database error' },
        }),
      }
      mockSupabase.from.mockReturnValue(fromMock)

      const result = await profileManager.upsertProfile(user as any)

      expect(result).toEqual({
        success: false,
        error: 'Database error',
      })
    })
  })

  describe('hasRole', () => {
    it('should return true when user has allowed role', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      })

      const result = await profileManager.hasRole('user-123', ['admin', 'site_manager'])

      expect(result).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('user_has_role', {
        user_id: 'user-123',
        allowed_roles: ['admin', 'site_manager'],
      })
    })

    it('should return false when user lacks required role', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: false,
        error: null,
      })

      const result = await profileManager.hasRole('user-123', ['admin'])

      expect(result).toBe(false)
    })
  })

  describe('canAccessSite', () => {
    it('should check site access permission', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      })

      const result = await profileManager.canAccessSite('user-123', 'site-456')

      expect(result).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('user_can_access_site', {
        user_id: 'user-123',
        check_site_id: 'site-456',
      })
    })
  })

  describe('getRoleBasedRedirect', () => {
    it.each([
      ['system_admin', '/admin/system'],
      ['admin', '/admin/dashboard'],
      ['site_manager', '/dashboard'],
      ['customer_manager', '/reports'],
      ['worker', '/dashboard/daily-reports'],
      ['unknown', '/dashboard'],
    ])('should return correct redirect for %s role', (role, expectedPath) => {
      const redirect = profileManager.getRoleBasedRedirect(role)
      expect(redirect).toBe(expectedPath)
    })
  })
})