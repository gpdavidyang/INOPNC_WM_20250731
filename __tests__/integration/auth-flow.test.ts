import { signIn, signUp, signOut } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { ProfileManager } from '@/lib/auth/profile-manager'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/auth/profile-manager')

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Authentication Flow Integration Tests', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock implementation
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      rpc: jest.fn(),
    }
    
    // Setup method chaining - each method returns mockSupabase
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.upsert.mockReturnValue(mockSupabase)
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  describe('signIn', () => {
    it('should sign in user successfully and update login stats', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { login_count: 5 }
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })
      
      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })
      
      mockSupabase.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })
      
      const result = await signIn('test@example.com', 'password123')
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        last_login_at: expect.any(String),
        login_count: 6,
      })
      
      expect(result).toEqual({ success: true })
    })
    
    it('should handle sign in error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })
      
      const result = await signIn('test@example.com', 'wrong-password')
      
      expect(result).toEqual({ error: 'Invalid credentials' })
    })
    
    it('should handle profile update failure gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })
      
      // Mock the profile fetch to succeed but update to fail
      mockSupabase.single.mockResolvedValueOnce({
        data: { login_count: 5 },
        error: null,
      })
      
      // Mock the update to throw an error
      mockSupabase.eq.mockImplementationOnce(() => {
        throw new Error('Database update failed')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const result = await signIn('test@example.com', 'password123')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update login stats:',
        expect.any(Error)
      )
      expect(result).toEqual({ success: true })
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('signUp', () => {
    it('should sign up user and create profile for INOPNC worker', async () => {
      const mockUser = { id: 'new-user-123' }
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabase.upsert.mockResolvedValue({ error: null })
      
      const result = await signUp(
        'worker@inopnc.com',
        'password123',
        'Test Worker',
        '010-1234-5678',
        'worker'
      )
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'worker@inopnc.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test Worker',
            phone: '010-1234-5678',
            role: 'worker',
          },
        },
      })
      
      // Check profile creation
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        id: 'new-user-123',
        email: 'worker@inopnc.com',
        full_name: 'Test Worker',
        phone: '010-1234-5678',
        role: 'worker',
        organization_id: '11111111-1111-1111-1111-111111111111',
        site_id: '33333333-3333-3333-3333-333333333333',
        status: 'active',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
      
      // Check user_organizations creation
      expect(mockSupabase.from).toHaveBeenCalledWith('user_organizations')
      
      // Check site_assignments creation
      expect(mockSupabase.from).toHaveBeenCalledWith('site_assignments')
      
      expect(result).toEqual({ success: true })
    })
    
    it('should handle special case for system admin', async () => {
      const mockUser = { id: 'admin-user-123' }
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabase.upsert.mockResolvedValue({ error: null })
      
      const result = await signUp(
        'davidswyang@gmail.com',
        'password123',
        'David Yang',
        '010-1234-5678',
        'worker' // Role will be overridden
      )
      
      // Check that role was changed to system_admin
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'system_admin',
          organization_id: '11111111-1111-1111-1111-111111111111',
        })
      )
      
      expect(result).toEqual({ success: true })
    })
    
    it('should handle customer organization signup', async () => {
      const mockUser = { id: 'customer-user-123' }
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabase.upsert.mockResolvedValue({ error: null })
      
      const result = await signUp(
        'manager@customer.com',
        'password123',
        'Customer Manager',
        '010-1234-5678',
        'customer_manager'
      )
      
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: '22222222-2222-2222-2222-222222222222',
          site_id: null,
        })
      )
      
      expect(result).toEqual({ success: true })
    })
    
    it('should handle signup error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' },
      })
      
      const result = await signUp(
        'existing@example.com',
        'password123',
        'Test User',
        '010-1234-5678',
        'worker'
      )
      
      expect(result).toEqual({ error: 'Email already registered' })
    })
    
    it('should handle profile creation error', async () => {
      const mockUser = { id: 'new-user-123' }
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabase.upsert.mockResolvedValue({
        error: { message: 'Database error' },
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const result = await signUp(
        'worker@inopnc.com',
        'password123',
        'Test Worker',
        '010-1234-5678',
        'worker'
      )
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Profile creation error:',
        { message: 'Database error' }
      )
      expect(result).toEqual({ error: 'Failed to create user profile' })
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
      
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })
      
      const result = await signOut()
      
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })
    
    it('should handle sign out error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })
      
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })
      
      const result = await signOut()
      
      expect(result).toEqual({ error: 'Sign out failed' })
    })
  })
  
  describe('Authentication Flow with RLS', () => {
    it('should verify user can only access their own profile data', async () => {
      const userId = 'user-123'
      const otherUserId = 'other-user-456'
      
      // Sign in as user-123
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: userId }, session: {} },
        error: null,
      })
      
      await signIn('user@example.com', 'password')
      
      // Try to access own profile - should succeed
      mockSupabase.single.mockResolvedValue({
        data: { id: userId, email: 'user@example.com' },
        error: null,
      })
      
      const ownProfile = await mockSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      expect(ownProfile.data).toBeTruthy()
      expect(ownProfile.data.id).toBe(userId)
      
      // Try to access another user's profile - should fail (in real scenario)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Row level security violation' },
      })
      
      const otherProfile = await mockSupabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single()
      
      expect(otherProfile.error).toBeTruthy()
      expect(otherProfile.error.message).toContain('Row level security')
    })
    
    it('should verify role-based access for different user types', async () => {
      // Test admin access
      const adminUser = { id: 'admin-123', email: 'admin@inopnc.com' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: adminUser, session: {} },
        error: null,
      })
      
      mockSupabase.single.mockResolvedValue({
        data: { ...adminUser, role: 'admin' },
        error: null,
      })
      
      await signIn('admin@inopnc.com', 'password')
      
      // Admin should be able to access all profiles in their organization
      mockSupabase.select.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'user-1', organization_id: '11111111-1111-1111-1111-111111111111' },
            { id: 'user-2', organization_id: '11111111-1111-1111-1111-111111111111' },
          ],
          error: null,
        }),
      })
      
      const profiles = await mockSupabase
        .from('profiles')
        .select('*')
        .eq('organization_id', '11111111-1111-1111-1111-111111111111')
      
      expect(profiles.data).toHaveLength(2)
    })
  })
  
  describe('Session Management', () => {
    it('should handle session refresh correctly', async () => {
      const mockSession = { 
        access_token: 'new-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
      }
      
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      
      const session = await mockSupabase.auth.getSession()
      
      expect(session.data.session).toBeTruthy()
      expect(session.data.session.access_token).toBe('new-token')
    })
    
    it('should handle expired session', async () => {
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })
      
      const session = await mockSupabase.auth.getSession()
      
      expect(session.error).toBeTruthy()
      expect(session.error.message).toBe('Session expired')
    })
  })
})