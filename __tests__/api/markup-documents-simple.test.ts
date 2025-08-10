/**
 * Simplified Markup Documents API CRUD Tests
 * 
 * Basic tests to verify API endpoints work correctly.
 * Created for Task 12.2 - Implement Markup Documents API CRUD Operation Tests
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/markup-documents/route'
import { GET as GetById, PUT, DELETE } from '@/app/api/markup-documents/[id]/route'
import { createMockSupabaseClient, SupabaseQueryMock } from '../utils/supabase-api-mock'

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('/api/markup-documents API Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockProfile = { id: 'user-123', site_id: 'site-123' }
  
  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Setup authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/markup-documents', () => {
    it('should return paginated list successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Test Document',
          created_at: '2023-01-01T00:00:00Z',
          created_by_profile: { full_name: 'Test User' }
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Create a properly chained query mock
      const queryMock = new SupabaseQueryMock(mockDocuments, null)
      // Override the range method to return the final result
      queryMock.range = jest.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 1
      })
      
      mockSupabase.from.mockReturnValue(queryMock)

      const request = new NextRequest('http://localhost:3000/api/markup-documents')
      const response = await GET(request as any)
      
      expect(response.status).toBe(200)
      
      // Verify query was called with correct parameters
      expect(mockSupabase.from).toHaveBeenCalledWith('markup_documents')
      expect(queryMock.select).toHaveBeenCalledWith(
        '*, created_by_profile:profiles!markup_documents_created_by_fkey(full_name)',
        { count: 'exact' }
      )
      expect(queryMock.eq).toHaveBeenCalledWith('is_deleted', false)
      expect(queryMock.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(queryMock.range).toHaveBeenCalledWith(0, 19) // page 1, limit 20
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/markup-documents')
      const response = await GET(request as any)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/markup-documents', () => {
    it('should create document successfully', async () => {
      const newDocument = {
        title: 'Test Document',
        description: 'Test Description',
        original_blueprint_url: 'http://example.com/image.jpg',
        original_blueprint_filename: 'image.jpg',
        markup_data: []
      }

      const mockCreatedDocument = {
        id: 'doc-123',
        ...newDocument,
        created_by: 'user-123'
      }

      // Mock profile query
      const profileQuery = new SupabaseQueryMock(mockProfile, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: mockProfile, error: null })
      
      // Mock insert query
      const insertQuery = new SupabaseQueryMock(mockCreatedDocument, null)
      insertQuery.insert = jest.fn().mockReturnValue(insertQuery)
      insertQuery.select = jest.fn().mockReturnValue(insertQuery)
      insertQuery.single = jest.fn().mockResolvedValue({ data: mockCreatedDocument, error: null })
      
      mockSupabase.from
        .mockReturnValueOnce(profileQuery) // First call for profiles
        .mockReturnValueOnce(insertQuery) // Second call for insert

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDocument)
      })
      
      ;(request as any).json = jest.fn().mockResolvedValue(newDocument)

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data).toEqual(mockCreatedDocument)
    })

    it('should validate required fields', async () => {
      const incompleteDocument = {
        description: 'Missing title'
      }

      // Mock profile query for authenticated user
      const profileQuery = new SupabaseQueryMock(mockProfile, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: mockProfile, error: null })
      mockSupabase.from.mockReturnValue(profileQuery)

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteDocument)
      })
      
      ;(request as any).json = jest.fn().mockResolvedValue(incompleteDocument)

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toContain('Missing required fields')
    })
  })

  describe('GET /api/markup-documents/[id]', () => {
    it('should return single document successfully', async () => {
      const mockDocument = {
        id: 'doc-123',
        title: 'Single Test Document',
        description: 'Detailed test document',
        original_blueprint_url: 'https://example.com/blueprint.jpg',
        original_blueprint_filename: 'blueprint.jpg',
        markup_data: [],
        location: 'personal',
        created_by: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      }

      const queryMock = new SupabaseQueryMock(mockDocument, null)
      queryMock.select = jest.fn().mockReturnValue(queryMock)
      queryMock.eq = jest.fn().mockReturnValue(queryMock)
      queryMock.single = jest.fn().mockResolvedValue({
        data: mockDocument,
        error: null
      })
      
      mockSupabase.from.mockReturnValue(queryMock)

      const request = new NextRequest('http://localhost:3000/api/markup-documents/doc-123')
      const response = await GetById(request as any, { params: { id: 'doc-123' } })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toEqual(mockDocument)
    })

    it('should return 404 for non-existent document', async () => {
      const queryMock = new SupabaseQueryMock(null, null)
      queryMock.select = jest.fn().mockReturnValue(queryMock)
      queryMock.eq = jest.fn().mockReturnValue(queryMock)
      queryMock.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' }
      })
      
      mockSupabase.from.mockReturnValue(queryMock)

      const request = new NextRequest('http://localhost:3000/api/markup-documents/non-existent')
      const response = await GetById(request as any, { params: { id: 'non-existent' } })
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('Document not found')
    })
  })

  describe('PUT /api/markup-documents/[id]', () => {
    it('should update document successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        markup_data: [],
        preview_image_url: 'https://example.com/new-preview.jpg'
      }

      const updatedDocument = {
        id: 'doc-123',
        ...updateData,
        markup_count: 0,
        updated_at: '2023-01-02T00:00:00Z'
      }

      const updateQuery = new SupabaseQueryMock(updatedDocument, null)
      updateQuery.update = jest.fn().mockReturnValue(updateQuery)
      updateQuery.eq = jest.fn().mockReturnValue(updateQuery)
      updateQuery.select = jest.fn().mockReturnValue(updateQuery)
      updateQuery.single = jest.fn().mockResolvedValue({
        data: updatedDocument,
        error: null
      })
      
      mockSupabase.from.mockReturnValue(updateQuery)

      const request = new NextRequest('http://localhost:3000/api/markup-documents/doc-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      ;(request as any).json = jest.fn().mockResolvedValue(updateData)

      const response = await PUT(request as any, { params: { id: 'doc-123' } })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toEqual(updatedDocument)
    })
  })

  describe('DELETE /api/markup-documents/[id]', () => {
    it('should soft delete document successfully', async () => {
      const deleteQuery = new SupabaseQueryMock(null, null)
      deleteQuery.update = jest.fn().mockReturnValue(deleteQuery)
      deleteQuery.eq = jest.fn().mockResolvedValue({
        data: { id: 'doc-123', is_deleted: true },
        error: null
      })
      
      mockSupabase.from.mockReturnValue(deleteQuery)

      const request = new NextRequest('http://localhost:3000/api/markup-documents/doc-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request as any, { params: { id: 'doc-123' } })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.message).toBe('Document deleted successfully')
    })
  })
})