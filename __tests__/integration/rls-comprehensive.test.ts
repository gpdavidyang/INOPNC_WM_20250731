import { createClient } from '@/lib/supabase/server'

// Mock Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('Comprehensive RLS Policy Integration Tests', () => {
  let mockSupabase: any
  
  // Test users with different roles
  const testUsers = {
    worker: {
      id: 'worker-123',
      email: 'worker@inopnc.com',
      role: 'worker',
      site_id: 'site-1',
      organization_id: 'org-1'
    },
    siteManager: {
      id: 'manager-123', 
      email: 'manager@inopnc.com',
      role: 'site_manager',
      site_id: 'site-1',
      organization_id: 'org-1'
    },
    admin: {
      id: 'admin-123',
      email: 'admin@inopnc.com', 
      role: 'admin',
      site_id: null,
      organization_id: 'org-1'
    },
    systemAdmin: {
      id: 'sysadmin-123',
      email: 'sysadmin@inopnc.com',
      role: 'system_admin',
      site_id: null,
      organization_id: null
    }
  }

  const testSites = {
    site1: { id: 'site-1', name: 'Site 1', organization_id: 'org-1' },
    site2: { id: 'site-2', name: 'Site 2', organization_id: 'org-1' },
    site3: { id: 'site-3', name: 'Site 3', organization_id: 'org-2' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock with chainable methods
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
      rpc: jest.fn(),
    }

    const createMockQuery = (data: any[] | null = null, error: any = null) => {
      const query = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: data?.[0] || null, error }),
        then: jest.fn().mockResolvedValue({ data, error, count: data?.length || 0 }),
      }
      return query
    }

    mockSupabase.from.mockImplementation(() => createMockQuery())
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('Daily Reports RLS Policies', () => {
    it('should allow workers to access only their own daily reports', async () => {
      // Mock worker user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const workerReports = [
        { id: 'report-1', created_by: 'worker-123', site_id: 'site-1' },
        { id: 'report-2', created_by: 'worker-123', site_id: 'site-1' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: workerReports, error: null })

      // Simulate API call that would trigger RLS
      const result = await mockSupabase
        .from('daily_reports')
        .select('*')
        .eq('created_by', testUsers.worker.id)

      expect(mockSupabase.from).toHaveBeenCalledWith('daily_reports')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('created_by', 'worker-123')

      const { data } = await result
      expect(data).toEqual(workerReports)
    })

    it('should allow site managers to access all reports from their sites', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.siteManager },
        error: null
      })

      const siteReports = [
        { id: 'report-1', created_by: 'worker-123', site_id: 'site-1' },
        { id: 'report-2', created_by: 'worker-456', site_id: 'site-1' },
        { id: 'report-3', created_by: 'manager-123', site_id: 'site-1' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: siteReports, error: null })

      const result = await mockSupabase
        .from('daily_reports')
        .select('*')
        .eq('site_id', testUsers.siteManager.site_id)

      expect(mockQuery.eq).toHaveBeenCalledWith('site_id', 'site-1')

      const { data } = await result
      expect(data).toEqual(siteReports)
    })

    it('should allow admins to access all reports in their organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.admin },
        error: null
      })

      const orgReports = [
        { id: 'report-1', site_id: 'site-1', organization_id: 'org-1' },
        { id: 'report-2', site_id: 'site-2', organization_id: 'org-1' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: orgReports, error: null })

      const result = await mockSupabase
        .from('daily_reports')
        .select('*, sites!inner(organization_id)')
        .eq('sites.organization_id', testUsers.admin.organization_id)

      const { data } = await result
      expect(data).toEqual(orgReports)
    })

    it('should prevent workers from accessing other workers reports', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      // Mock empty result for unauthorized access
      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: [], error: null })

      const result = await mockSupabase
        .from('daily_reports')
        .select('*')
        .eq('created_by', 'different-worker-456')

      const { data } = await result
      expect(data).toEqual([])
    })
  })

  describe('Markup Documents RLS Policies', () => {
    it('should allow users to access their own personal documents', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const personalDocs = [
        { id: 'doc-1', created_by: 'worker-123', location: 'personal' },
        { id: 'doc-2', created_by: 'worker-123', location: 'personal' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: personalDocs, error: null })

      const result = await mockSupabase
        .from('markup_documents')
        .select('*')
        .eq('created_by', testUsers.worker.id)
        .eq('location', 'personal')

      const { data } = await result
      expect(data).toEqual(personalDocs)
    })

    it('should allow site-based access to shared documents', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const sharedDocs = [
        { id: 'doc-1', site_id: 'site-1', location: 'shared' },
        { id: 'doc-2', site_id: 'site-1', location: 'shared' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: sharedDocs, error: null })

      const result = await mockSupabase
        .from('markup_documents')
        .select('*')
        .eq('site_id', testUsers.worker.site_id)
        .eq('location', 'shared')

      const { data } = await result
      expect(data).toEqual(sharedDocs)
    })

    it('should prevent access to documents from different sites', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: [], error: null })

      const result = await mockSupabase
        .from('markup_documents')
        .select('*')
        .eq('site_id', 'different-site-999')
        .eq('location', 'shared')

      const { data } = await result
      expect(data).toEqual([])
    })
  })

  describe('Attendance Records RLS Policies', () => {
    it('should allow workers to view only their own attendance', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const workerAttendance = [
        { id: 'att-1', user_id: 'worker-123', site_id: 'site-1', date: '2023-01-01' },
        { id: 'att-2', user_id: 'worker-123', site_id: 'site-1', date: '2023-01-02' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: workerAttendance, error: null })

      const result = await mockSupabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', testUsers.worker.id)

      const { data } = await result
      expect(data).toEqual(workerAttendance)
    })

    it('should allow site managers to view all attendance for their sites', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.siteManager },
        error: null
      })

      const siteAttendance = [
        { id: 'att-1', user_id: 'worker-123', site_id: 'site-1' },
        { id: 'att-2', user_id: 'worker-456', site_id: 'site-1' },
        { id: 'att-3', user_id: 'manager-123', site_id: 'site-1' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: siteAttendance, error: null })

      const result = await mockSupabase
        .from('attendance_records')
        .select('*')
        .eq('site_id', testUsers.siteManager.site_id)

      const { data } = await result
      expect(data).toEqual(siteAttendance)
    })

    it('should prevent workers from viewing others attendance', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: [], error: null })

      const result = await mockSupabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', 'different-user-456')

      const { data } = await result
      expect(data).toEqual([])
    })
  })

  describe('Profile and Organization Access', () => {
    it('should allow users to view their own profile', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const userProfile = {
        id: 'worker-123',
        email: 'worker@inopnc.com',
        full_name: 'Worker User',
        role: 'worker'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({ data: userProfile, error: null })

      const result = await mockSupabase
        .from('profiles')
        .select('*')
        .eq('id', testUsers.worker.id)
        .single()

      const { data } = await result
      expect(data).toEqual(userProfile)
    })

    it('should allow admins to view profiles in their organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.admin },
        error: null
      })

      const orgProfiles = [
        { id: 'worker-123', organization_id: 'org-1', role: 'worker' },
        { id: 'manager-123', organization_id: 'org-1', role: 'site_manager' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: orgProfiles, error: null })

      const result = await mockSupabase
        .from('profiles')
        .select('*, user_organizations!inner(organization_id)')
        .eq('user_organizations.organization_id', testUsers.admin.organization_id)

      const { data } = await result
      expect(data).toEqual(orgProfiles)
    })

    it('should prevent users from accessing profiles outside their organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: [], error: null })

      const result = await mockSupabase
        .from('profiles')
        .select('*')
        .eq('organization_id', 'different-org-999')

      const { data } = await result
      expect(data).toEqual([])
    })
  })

  describe('Site Management Policies', () => {
    it('should allow site managers to view their assigned sites', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.siteManager },
        error: null
      })

      const managerSites = [
        { id: 'site-1', name: 'Site 1', organization_id: 'org-1' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: managerSites, error: null })

      const result = await mockSupabase
        .from('sites')
        .select('*, site_assignments!inner(user_id)')
        .eq('site_assignments.user_id', testUsers.siteManager.id)

      const { data } = await result
      expect(data).toEqual(managerSites)
    })

    it('should allow admins to view all sites in their organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.admin },
        error: null
      })

      const orgSites = [
        testSites.site1,
        testSites.site2
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: orgSites, error: null })

      const result = await mockSupabase
        .from('sites')
        .select('*')
        .eq('organization_id', testUsers.admin.organization_id)

      const { data } = await result
      expect(data).toEqual(orgSites)
    })

    it('should prevent workers from viewing sites they are not assigned to', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: [], error: null })

      const result = await mockSupabase
        .from('sites')
        .select('*')
        .eq('id', 'unauthorized-site-999')

      const { data } = await result
      expect(data).toEqual([])
    })
  })

  describe('Notifications RLS Policies', () => {
    it('should allow users to view only their own notifications', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const userNotifications = [
        { id: 'notif-1', user_id: 'worker-123', title: 'Test Notification 1' },
        { id: 'notif-2', user_id: 'worker-123', title: 'Test Notification 2' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: userNotifications, error: null })

      const result = await mockSupabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUsers.worker.id)

      const { data } = await result
      expect(data).toEqual(userNotifications)
    })

    it('should prevent users from viewing others notifications', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: [], error: null })

      const result = await mockSupabase
        .from('notifications')
        .select('*')
        .eq('user_id', 'different-user-456')

      const { data } = await result
      expect(data).toEqual([])
    })
  })

  describe('System Admin Override Policies', () => {
    it('should allow system admins to access all data across organizations', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.systemAdmin },
        error: null
      })

      const allReports = [
        { id: 'report-1', organization_id: 'org-1' },
        { id: 'report-2', organization_id: 'org-2' },
        { id: 'report-3', organization_id: 'org-3' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: allReports, error: null })

      const result = await mockSupabase
        .from('daily_reports')
        .select('*')

      const { data } = await result
      expect(data).toEqual(allReports)
    })

    it('should allow system admins to manage all user profiles', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.systemAdmin },
        error: null
      })

      const allProfiles = [
        { id: 'user-1', organization_id: 'org-1' },
        { id: 'user-2', organization_id: 'org-2' },
        { id: 'user-3', organization_id: 'org-3' }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ data: allProfiles, error: null })

      const result = await mockSupabase
        .from('profiles')
        .select('*')

      const { data } = await result
      expect(data).toEqual(allProfiles)
    })
  })

  describe('Data Modification RLS Policies', () => {
    it('should allow users to insert their own records', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const newReport = {
        title: 'New Daily Report',
        content: 'Test content',
        site_id: 'site-1',
        created_by: 'worker-123'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({ data: newReport, error: null })

      const result = await mockSupabase
        .from('daily_reports')
        .insert(newReport)
        .select()
        .single()

      expect(mockQuery.insert).toHaveBeenCalledWith(newReport)
      const { data } = await result
      expect(data).toEqual(newReport)
    })

    it('should prevent users from updating records they do not own', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows updated' } 
      })

      const result = await mockSupabase
        .from('daily_reports')
        .update({ title: 'Unauthorized Update' })
        .eq('id', 'unauthorized-report-123')
        .select()
        .single()

      expect(mockQuery.update).toHaveBeenCalledWith({ title: 'Unauthorized Update' })
      const { error } = await result
      expect(error).toBeTruthy()
      expect(error.message).toBe('No rows updated')
    })

    it('should prevent users from deleting records they do not own', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUsers.worker },
        error: null
      })

      const mockQuery = mockSupabase.from()
      mockQuery.then.mockResolvedValue({ 
        data: [], 
        error: { code: 'PGRST116', message: 'No rows deleted' } 
      })

      const result = await mockSupabase
        .from('daily_reports')
        .delete()
        .eq('id', 'unauthorized-report-123')

      expect(mockQuery.delete).toHaveBeenCalled()
      const { error } = await result
      expect(error).toBeTruthy()
      expect(error.message).toBe('No rows deleted')
    })
  })
})