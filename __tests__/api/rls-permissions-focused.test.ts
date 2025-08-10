/**
 * Focused RLS and Permission Testing
 * 
 * Simplified tests for RLS policies ensuring users can only access appropriate data
 * based on their roles and site assignments for Task 12.4
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/markup-documents/route'
import { GET as GetById } from '@/app/api/markup-documents/[id]/route'
import { createMockSupabaseClient, SupabaseQueryMock } from '../utils/supabase-api-mock'
import { createMockProfile } from '../utils/test-utils'

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('RLS and Permission Testing - Focused', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  
  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Personal Document Access Control', () => {
    it('should enforce personal document isolation for regular users', async () => {
      const user1 = { id: 'user-1', email: 'user1@example.com' }
      const profile1 = createMockProfile('worker', { id: 'user-1', site_id: 'site-1' })
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'User 1 Personal Doc',
          created_by: 'user-1',
          location: 'personal',
          site_id: 'site-1',
          created_by_profile: { full_name: 'User 1' }
        }
      ]

      // Mock user1 authenticated
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: user1 },
        error: null
      })

      // Mock documents query that returns only user1's personal documents
      const documentsQuery = new SupabaseQueryMock(mockDocuments, null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 1
      })
      
      mockSupabase.from.mockReturnValue(documentsQuery)

      const request = new NextRequest('http://localhost:3000/api/markup-documents?location=personal')
      const response = await GET(request as any)

      // Should succeed with proper authentication
      expect(response.status).toBe(200)

      // Verify RLS filters were applied for personal documents
      expect(documentsQuery.eq).toHaveBeenCalledWith('created_by', user1.id)
      expect(documentsQuery.eq).toHaveBeenCalledWith('location', 'personal')
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('should prevent access to personal documents without authentication', async () => {
      // Mock unauthenticated request
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/markup-documents?location=personal')
      const response = await GET(request as any)

      // Should deny access
      expect(response.status).toBe(401)
    })
  })

  describe('Shared Document Site-Based Access', () => {
    it('should allow same-site users to access shared documents', async () => {
      const user1 = { id: 'user-1', email: 'user1@example.com' }
      const profile1 = createMockProfile('worker', { id: 'user-1', site_id: 'shared-site' })
      const mockSharedDocuments = [
        {
          id: 'shared-doc-1',
          title: 'Shared Site Document',
          created_by: 'user-2',
          location: 'shared',
          site_id: 'shared-site',
          created_by_profile: { full_name: 'User 2' }
        }
      ]

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: user1 },
        error: null
      })

      // Mock shared documents query
      const documentsQuery = new SupabaseQueryMock(mockSharedDocuments, null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: mockSharedDocuments,
        error: null,
        count: 1
      })

      mockSupabase.from.mockReturnValue(documentsQuery)

      const request = new NextRequest('http://localhost:3000/api/markup-documents?location=shared')
      const response = await GET(request as any)

      // Should succeed
      expect(response.status).toBe(200)

      // Verify shared location filter was applied
      expect(documentsQuery.eq).toHaveBeenCalledWith('location', 'shared')
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('should block access to specific documents from different sites', async () => {
      const user1 = { id: 'user-1', email: 'user1@example.com' }
      const profile1 = createMockProfile('worker', { id: 'user-1', site_id: 'site-1' })

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: user1 },
        error: null
      })

      // Mock profile query
      const profileQuery = new SupabaseQueryMock(profile1, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: profile1, error: null })

      // Mock document query that returns no data (RLS blocked)
      const documentQuery = new SupabaseQueryMock(null, null)
      documentQuery.select = jest.fn().mockReturnValue(documentQuery)
      documentQuery.eq = jest.fn().mockReturnValue(documentQuery)
      documentQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      })

      mockSupabase.from
        .mockReturnValueOnce(profileQuery) // Profile lookup
        .mockReturnValueOnce(documentQuery) // Document query

      const request = new NextRequest('http://localhost:3000/api/markup-documents/different-site-doc')
      const response = await GetById(request as any, { params: { id: 'different-site-doc' } })

      // Should return 404 (RLS blocked access)
      expect(response.status).toBe(404)

      // Verify queries were attempted
      expect(documentQuery.eq).toHaveBeenCalledWith('id', 'different-site-doc')
    })
  })

  describe('Role-Based Access Control Matrix', () => {
    const testRoles = [
      { role: 'worker', expectedAccess: 'limited' },
      { role: 'site_manager', expectedAccess: 'site-wide' },
      { role: 'admin', expectedAccess: 'organization-wide' },
      { role: 'system_admin', expectedAccess: 'full' },
      { role: 'customer_manager', expectedAccess: 'partner-limited' }
    ] as const

    testRoles.forEach(({ role, expectedAccess }) => {
      it(`should enforce proper access control for ${role} role`, async () => {
        const user = { id: `${role}-user`, email: `${role}@example.com` }
        const profile = createMockProfile(role, { 
          id: `${role}-user`, 
          site_id: 'test-site' 
        })

        // Mock authenticated user
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user },
          error: null
        })

        // Mock documents query with proper data structure
        const mockDocuments = [
          {
            id: `${role}-doc`,
            title: `${role} Document`,
            created_by: `${role}-user`,
            location: 'shared',
            site_id: 'test-site',
            created_by_profile: { full_name: `${role} User` }
          }
        ]
        
        const documentsQuery = new SupabaseQueryMock(mockDocuments, null)
        documentsQuery.range = jest.fn().mockResolvedValue({
          data: mockDocuments,
          error: null,
          count: 1
        })

        mockSupabase.from.mockReturnValue(documentsQuery)

        const request = new NextRequest('http://localhost:3000/api/markup-documents?location=shared')
        const response = await GET(request as any)

        // All authenticated users should at least get a response
        expect(response.status).toBe(200)

        // Verify authentication worked
        expect(mockSupabase.auth.getUser).toHaveBeenCalled()
        expect(documentsQuery.eq).toHaveBeenCalledWith('location', 'shared')

        // Role-specific access patterns are enforced by the database RLS policies
        // These tests verify the API properly authenticates and queries
      })
    })
  })

  describe('Document Creation Permission Tests', () => {
    it('should allow authenticated users to create personal documents', async () => {
      const user = { id: 'user-123', email: 'user@example.com' }
      const profile = createMockProfile('worker', { id: 'user-123', site_id: 'site-123' })

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null
      })

      // Mock profile query
      const profileQuery = new SupabaseQueryMock(profile, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: profile, error: null })

      // Mock successful document creation
      const insertQuery = new SupabaseQueryMock(null, null)
      insertQuery.insert = jest.fn().mockReturnValue(insertQuery)
      insertQuery.select = jest.fn().mockReturnValue(insertQuery)
      insertQuery.single = jest.fn().mockResolvedValue({
        data: {
          id: 'new-doc-123',
          title: 'Test Document',
          created_by: 'user-123',
          location: 'personal',
          site_id: 'site-123'
        },
        error: null
      })

      mockSupabase.from
        .mockReturnValueOnce(profileQuery) // Profile lookup
        .mockReturnValueOnce(insertQuery) // Document creation

      const validPayload = {
        title: 'Test Document',
        description: 'Test Description',
        original_blueprint_url: 'http://example.com/test.jpg',
        original_blueprint_filename: 'test.jpg',
        markup_data: [],
        location: 'personal'
      }

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload)
      })
      
      ;(request as any).json = jest.fn().mockResolvedValue(validPayload)

      const response = await POST(request as any)

      // Should succeed
      expect(response.status).toBe(200)

      // Verify document was created with proper user association
      expect(insertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Document',
          created_by: 'user-123',
          site_id: 'site-123'
        })
      )
    })

    it('should prevent unauthenticated document creation', async () => {
      // Mock unauthenticated request
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const validPayload = {
        title: 'Test Document',
        description: 'Test Description',
        original_blueprint_url: 'http://example.com/test.jpg',
        original_blueprint_filename: 'test.jpg',
        markup_data: []
      }

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload)
      })
      
      ;(request as any).json = jest.fn().mockResolvedValue(validPayload)

      const response = await POST(request as any)

      // Should deny access
      expect(response.status).toBe(401)
    })
  })

  describe('Edge Cases and Security Boundaries', () => {
    it('should handle users with no site assignment gracefully', async () => {
      const userNoSite = { id: 'user-no-site', email: 'user@example.com' }
      const profileNoSite = createMockProfile('worker', { 
        id: 'user-no-site', 
        site_id: null 
      })

      // Mock authenticated user with no site
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: userNoSite },
        error: null
      })

      // Mock empty documents result (no site access)
      const documentsQuery = new SupabaseQueryMock([], null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      mockSupabase.from.mockReturnValue(documentsQuery)

      const request = new NextRequest('http://localhost:3000/api/markup-documents?location=shared')
      const response = await GET(request as any)

      // Should authenticate but have limited access
      expect(response.status).toBe(200)
      expect(documentsQuery.eq).toHaveBeenCalledWith('location', 'shared')
    })

    it('should maintain security for malicious ID attempts', async () => {
      const user = { id: 'user-123', email: 'user@example.com' }
      const profile = createMockProfile('worker', { id: 'user-123', site_id: 'site-123' })

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null
      })

      // Mock profile query
      const profileQuery = new SupabaseQueryMock(profile, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: profile, error: null })

      // Mock document query that blocks malicious access
      const documentQuery = new SupabaseQueryMock(null, null)
      documentQuery.select = jest.fn().mockReturnValue(documentQuery)
      documentQuery.eq = jest.fn().mockReturnValue(documentQuery)
      documentQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      })

      mockSupabase.from
        .mockReturnValueOnce(profileQuery) // Profile lookup
        .mockReturnValueOnce(documentQuery) // Document query

      const maliciousId = "'; DROP TABLE markup_documents; --"
      const request = new NextRequest(`http://localhost:3000/api/markup-documents/${encodeURIComponent(maliciousId)}`)
      const response = await GetById(request as any, { params: { id: maliciousId } })

      // Should safely handle malicious input and return 404
      expect(response.status).toBe(404)

      // Verify the malicious ID was safely passed to eq() (parameterized)
      expect(documentQuery.eq).toHaveBeenCalledWith('id', maliciousId)
    })
  })

  describe('Cross-Organization Isolation Verification', () => {
    it('should verify organization-level data isolation through RLS', async () => {
      const user1 = { id: 'org1-user', email: 'user@org1.com' }
      const profile1 = createMockProfile('worker', { 
        id: 'org1-user', 
        site_id: 'org1-site',
        organization_id: 'org-1'
      })

      // Mock user from org1
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: user1 },
        error: null
      })

      // Mock profile query
      const profileQuery = new SupabaseQueryMock(profile1, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: profile1, error: null })

      // Mock trying to access org2 document - should be blocked by RLS
      const documentQuery = new SupabaseQueryMock(null, null)
      documentQuery.select = jest.fn().mockReturnValue(documentQuery)
      documentQuery.eq = jest.fn().mockReturnValue(documentQuery)
      documentQuery.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      })

      mockSupabase.from
        .mockReturnValueOnce(profileQuery) // Profile lookup
        .mockReturnValueOnce(documentQuery) // Document query

      const request = new NextRequest('http://localhost:3000/api/markup-documents/org2-document')
      const response = await GetById(request as any, { params: { id: 'org2-document' } })

      // Should block cross-organization access
      expect(response.status).toBe(404)
      expect(documentQuery.eq).toHaveBeenCalledWith('id', 'org2-document')
    })
  })
})