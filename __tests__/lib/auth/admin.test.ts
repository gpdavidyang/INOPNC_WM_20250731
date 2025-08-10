/**
 * Tests for Admin Authentication Business Logic
 * 
 * Testing admin role verification and access control
 * for Task 13
 */

import { requireAdminAuth, isSystemAdmin, isAdmin } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import type { Profile } from '@/types'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

jest.mock('@/lib/auth/session', () => ({
  getAuthenticatedUser: jest.fn()
}))

describe('Admin Authentication', () => {
  let mockSupabase: any
  const mockRedirect = redirect as jest.Mock
  const mockGetAuthenticatedUser = getAuthenticatedUser as jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  describe('requireAdminAuth', () => {
    it('should redirect to login if no user is authenticated', async () => {
      mockGetAuthenticatedUser.mockResolvedValue(null)
      
      try {
        await requireAdminAuth()
      } catch (error) {
        // Expected to throw after redirect
      }
      
      expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
    })
    
    it('should redirect to login if profile fetch fails', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockGetAuthenticatedUser.mockResolvedValue(mockUser)
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      })
      
      try {
        await requireAdminAuth()
      } catch (error) {
        // Expected to throw after redirect
      }
      
      expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
    })
    
    it('should redirect to dashboard if user is not admin', async () => {
      const mockUser = { id: 'user-123', email: 'worker@example.com' }
      const mockProfile = {
        id: 'user-123',
        email: 'worker@example.com',
        role: 'worker'
      }
      
      mockGetAuthenticatedUser.mockResolvedValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null
      })
      
      try {
        await requireAdminAuth()
      } catch (error) {
        // Expected to throw after redirect
      }
      
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
    })
    
    it('should allow admin users through', async () => {
      const mockUser = { id: 'admin-123', email: 'admin@example.com' }
      const mockProfile = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
      
      mockGetAuthenticatedUser.mockResolvedValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null
      })
      
      const result = await requireAdminAuth()
      
      expect(result).toEqual({
        user: mockUser,
        profile: mockProfile
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })
    
    it('should allow system_admin users through', async () => {
      const mockUser = { id: 'sysadmin-123', email: 'sysadmin@example.com' }
      const mockProfile = {
        id: 'sysadmin-123',
        email: 'sysadmin@example.com',
        role: 'system_admin'
      }
      
      mockGetAuthenticatedUser.mockResolvedValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null
      })
      
      const result = await requireAdminAuth()
      
      expect(result).toEqual({
        user: mockUser,
        profile: mockProfile
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })
    
    it('should log warning when non-admin user attempts access', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const mockUser = { id: 'user-123', email: 'site_manager@example.com' }
      const mockProfile = {
        id: 'user-123',
        email: 'site_manager@example.com',
        role: 'site_manager'
      }
      
      mockGetAuthenticatedUser.mockResolvedValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null
      })
      
      try {
        await requireAdminAuth()
      } catch (error) {
        // Expected to throw after redirect
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'User site_manager@example.com attempted to access admin area with role: site_manager'
      )
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('isSystemAdmin', () => {
    it('should return true for system_admin role', () => {
      const profile: Profile = {
        id: 'user-123',
        email: 'admin@example.com',
        full_name: 'System Admin',
        role: 'system_admin',
        status: 'active',
        created_at: '2024-01-01'
      }
      
      expect(isSystemAdmin(profile)).toBe(true)
    })
    
    it('should return false for admin role', () => {
      const profile: Profile = {
        id: 'user-123',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01'
      }
      
      expect(isSystemAdmin(profile)).toBe(false)
    })
    
    it('should return false for other roles', () => {
      const roles: Array<Profile['role']> = ['worker', 'site_manager', 'customer_manager']
      
      roles.forEach(role => {
        const profile: Profile = {
          id: 'user-123',
          email: 'user@example.com',
          full_name: 'Test User',
          role,
          status: 'active',
          created_at: '2024-01-01'
        }
        
        expect(isSystemAdmin(profile)).toBe(false)
      })
    })
  })
  
  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const profile: Profile = {
        id: 'user-123',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01'
      }
      
      expect(isAdmin(profile)).toBe(true)
    })
    
    it('should return true for system_admin role', () => {
      const profile: Profile = {
        id: 'user-123',
        email: 'sysadmin@example.com',
        full_name: 'System Admin',
        role: 'system_admin',
        status: 'active',
        created_at: '2024-01-01'
      }
      
      expect(isAdmin(profile)).toBe(true)
    })
    
    it('should return false for non-admin roles', () => {
      const roles: Array<Profile['role']> = ['worker', 'site_manager', 'customer_manager']
      
      roles.forEach(role => {
        const profile: Profile = {
          id: 'user-123',
          email: 'user@example.com',
          full_name: 'Test User',
          role,
          status: 'active',
          created_at: '2024-01-01'
        }
        
        expect(isAdmin(profile)).toBe(false)
      })
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle profile with undefined role', () => {
      const profile = {
        id: 'user-123',
        email: 'user@example.com',
        full_name: 'Test User',
        role: undefined,
        status: 'active',
        created_at: '2024-01-01'
      } as any
      
      expect(isAdmin(profile)).toBe(false)
      expect(isSystemAdmin(profile)).toBe(false)
    })
    
    it('should handle profile fetch with network error', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockGetAuthenticatedUser.mockResolvedValue(mockUser)
      
      // Mock the from chain to throw error when single() is called
      const mockFromChain = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Network error'))
      }
      
      mockSupabase.from.mockReturnValue(mockFromChain)
      
      await expect(requireAdminAuth()).rejects.toThrow('Network error')
    })
  })
})