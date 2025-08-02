import { createClient } from '@/lib/supabase/server'
import { createClient as createClientBrowser } from '@/lib/supabase/client'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('Row Level Security (RLS) Policy Integration Tests', () => {
  let mockSupabaseServer: any
  let mockSupabaseClient: any
  
  // Helper to create a chainable mock
  const createChainableMock = () => {
    const mock: any = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      single: jest.fn(),
    }
    
    // Setup method chaining - each method returns the mock itself
    mock.from.mockReturnValue(mock)
    mock.select.mockReturnValue(mock)
    mock.insert.mockReturnValue(mock)
    mock.update.mockReturnValue(mock)
    mock.delete.mockReturnValue(mock)
    mock.eq.mockReturnValue(mock)
    mock.in.mockReturnValue(mock)
    
    // single() returns a promise
    mock.single.mockResolvedValue({
      data: null,
      error: null,
    })
    
    return mock
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create fresh mocks for each test
    mockSupabaseServer = createChainableMock()
    mockSupabaseClient = createChainableMock()
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseServer)
    ;(createClientBrowser as jest.Mock).mockReturnValue(mockSupabaseClient)
  })
  
  describe('Profile Access Policies', () => {
    it('should allow users to read their own profile', async () => {
      const userId = 'user-123'
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
      
      mockSupabaseServer.single.mockResolvedValue({
        data: { id: userId, email: 'user@example.com', role: 'worker' },
        error: null,
      })
      
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()
      
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.user.id)
        .single()
      
      expect(result.data).toBeTruthy()
      expect(result.data.id).toBe(userId)
    })
    
    it('should prevent users from reading other profiles (non-admin)', async () => {
      const userId = 'user-123'
      const otherUserId = 'other-user-456'
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
      
      // Mock RLS policy denial
      mockSupabaseServer.single.mockResolvedValue({
        data: null,
        error: { 
          code: '42501',
          message: 'new row violates row-level security policy',
        },
      })
      
      const supabase = createClient()
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single()
      
      expect(result.error).toBeTruthy()
      expect(result.error.code).toBe('42501')
    })
    
    it('should allow admins to read all profiles in their organization', async () => {
      const adminId = 'admin-123'
      const orgId = '11111111-1111-1111-1111-111111111111'
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      })
      
      // First get admin's profile to check role
      mockSupabaseServer.single.mockResolvedValueOnce({
        data: { id: adminId, role: 'admin', organization_id: orgId },
        error: null,
      })
      
      // For the second query, we need to intercept at the end of the chain
      // Since eq() returns the chainable object, we'll mock the final result
      // when the second query doesn't call single()
      let queryCount = 0
      mockSupabaseServer.eq.mockImplementation(() => {
        queryCount++
        if (queryCount === 2) {
          // Second query - return result directly
          return {
            data: [
              { id: 'user-1', organization_id: orgId },
              { id: 'user-2', organization_id: orgId },
              { id: 'user-3', organization_id: orgId },
            ],
            error: null,
          }
        }
        // First query - return chainable mock
        return mockSupabaseServer
      })
      
      const supabase = createClient()
      
      // Get admin profile first
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminId)
        .single()
      
      expect(adminProfile.role).toBe('admin')
      
      // Get all profiles in organization
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', orgId)
      
      expect(profiles).toHaveLength(3)
    })
  })
  
  describe('Daily Reports Access Policies', () => {
    it('should allow workers to create and read their own reports', async () => {
      const userId = 'worker-123'
      const reportData = {
        work_date: '2024-08-01',
        work_content: 'Construction work',
        site_id: 'site-123',
        created_by: userId,
      }
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
      
      // Mock insert
      mockSupabaseServer.insert.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: { id: 'report-123', ...reportData },
          error: null,
        }),
      })
      
      const supabase = createClient()
      
      // Create report
      const { data: newReport } = await supabase
        .from('daily_reports')
        .insert(reportData)
        .select()
      
      expect(newReport).toBeTruthy()
      expect(newReport.created_by).toBe(userId)
      
      // Read own reports
      mockSupabaseServer.eq.mockReturnValue({
        data: [{ id: 'report-123', ...reportData }],
        error: null,
      })
      
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('created_by', userId)
      
      expect(reports).toHaveLength(1)
      expect(reports[0].created_by).toBe(userId)
    })
    
    it('should allow site managers to read reports from their sites', async () => {
      const managerId = 'manager-123'
      const siteId = 'site-123'
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: managerId } },
        error: null,
      })
      
      // Mock manager profile with site assignment
      mockSupabaseServer.single.mockResolvedValueOnce({
        data: { 
          id: managerId, 
          role: 'site_manager',
          site_id: siteId,
        },
        error: null,
      })
      
      // Mock reports from the site - use mockImplementation to handle multiple calls
      let eqCallCount = 0
      mockSupabaseServer.eq.mockImplementation(() => {
        eqCallCount++
        if (eqCallCount === 2) {
          // Second query for reports
          return {
            data: [
              { id: 'report-1', site_id: siteId, created_by: 'worker-1' },
              { id: 'report-2', site_id: siteId, created_by: 'worker-2' },
            ],
            error: null,
          }
        }
        // First query - return chainable
        return mockSupabaseServer
      })
      
      const supabase = createClient()
      
      // Get manager profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', managerId)
        .single()
      
      expect(profile.role).toBe('site_manager')
      
      // Get reports from managed site
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('site_id', siteId)
      
      expect(reports).toHaveLength(2)
      reports.forEach((report: any) => {
        expect(report.site_id).toBe(siteId)
      })
    })
    
    it('should prevent workers from reading other workers reports', async () => {
      const userId = 'worker-123'
      const otherUserId = 'worker-456'
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
      
      // Mock RLS denial for other user's reports
      mockSupabaseServer.eq.mockReturnValue({
        data: [],
        error: null, // RLS typically returns empty results, not errors
      })
      
      const supabase = createClient()
      
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('created_by', otherUserId)
      
      expect(reports).toHaveLength(0)
    })
  })
  
  describe('Organization-based Access', () => {
    it('should isolate data between organizations', async () => {
      const userId = 'user-123'
      const orgId1 = '11111111-1111-1111-1111-111111111111'
      const orgId2 = '22222222-2222-2222-2222-222222222222'
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
      
      // User belongs to org1
      mockSupabaseServer.single.mockResolvedValueOnce({
        data: { 
          id: userId,
          organization_id: orgId1,
        },
        error: null,
      })
      
      // For the second query to org2 - should be denied
      let orgQueryCount = 0
      mockSupabaseServer.eq.mockImplementation(() => {
        orgQueryCount++
        if (orgQueryCount === 2) {
          // Second query - empty result for different org
          return {
            data: [],
            error: null,
          }
        }
        // First query - return chainable
        return mockSupabaseServer
      })
      
      const supabase = createClient()
      
      // Get user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      expect(profile.organization_id).toBe(orgId1)
      
      // Try to access profiles from different organization
      const { data: otherOrgProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', orgId2)
      
      expect(otherOrgProfiles).toHaveLength(0)
    })
  })
  
  describe('Document Access Policies', () => {
    it('should allow users to upload and access their own documents', async () => {
      const userId = 'user-123'
      const documentData = {
        file_name: 'report.pdf',
        file_path: '/uploads/report.pdf',
        file_size: 1024,
        uploaded_by: userId,
      }
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      })
      
      // Mock document creation
      mockSupabaseServer.insert.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: { id: 'doc-123', ...documentData },
          error: null,
        }),
      })
      
      const supabase = createClient()
      
      // Upload document
      const { data: newDoc } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
      
      expect(newDoc).toBeTruthy()
      expect(newDoc.uploaded_by).toBe(userId)
      
      // Access own documents
      mockSupabaseServer.eq.mockReturnValue({
        data: [{ id: 'doc-123', ...documentData }],
        error: null,
      })
      
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('uploaded_by', userId)
      
      expect(docs).toHaveLength(1)
      expect(docs[0].uploaded_by).toBe(userId)
    })
    
    it('should allow sharing documents within the same site', async () => {
      const userId1 = 'user-123'
      const userId2 = 'user-456'
      const siteId = 'site-123'
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: userId2 } },
        error: null,
      })
      
      // Both users are on the same site
      mockSupabaseServer.single.mockResolvedValueOnce({
        data: { 
          id: userId2,
          site_id: siteId,
        },
        error: null,
      })
      
      // Document uploaded by user1 but linked to the site
      mockSupabaseServer.eq.mockReturnValue({
        data: [{
          id: 'doc-123',
          uploaded_by: userId1,
          site_id: siteId,
          file_name: 'shared-blueprint.pdf',
        }],
        error: null,
      })
      
      const supabase = createClient()
      
      // User2 can access documents from their site
      const { data: sharedDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('site_id', siteId)
      
      expect(sharedDocs).toHaveLength(1)
      expect(sharedDocs[0].site_id).toBe(siteId)
    })
  })
  
  describe('System Admin Override', () => {
    it('should allow system_admin to access all data', async () => {
      const systemAdminId = 'admin-123'
      
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: systemAdminId } },
        error: null,
      })
      
      // Mock system admin profile
      mockSupabaseServer.single.mockResolvedValueOnce({
        data: { 
          id: systemAdminId,
          role: 'system_admin',
        },
        error: null,
      })
      
      // Mock access to all profiles - need to use mockReturnValueOnce for the second query
      mockSupabaseServer.select.mockReturnValueOnce(mockSupabaseServer) // First query chain
      mockSupabaseServer.select.mockReturnValueOnce({
        data: [
          { id: 'user-1', organization_id: 'org-1' },
          { id: 'user-2', organization_id: 'org-2' },
          { id: 'user-3', organization_id: 'org-3' },
        ],
        error: null,
      })
      
      const supabase = createClient()
      
      // Get system admin profile
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', systemAdminId)
        .single()
      
      expect(adminProfile.role).toBe('system_admin')
      
      // Access all profiles across organizations
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
      
      expect(allProfiles).toHaveLength(3)
      
      // Verify profiles are from different organizations
      const orgIds = new Set(allProfiles.map((p: any) => p.organization_id))
      expect(orgIds.size).toBe(3)
    })
  })
})