// Setup API polyfills before any imports
import '../setup/api-polyfill'

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GET, POST, PUT, DELETE } from '@/app/api/markup-documents/route'
import { GET as GetSingleDocument, PUT as UpdateDocument, DELETE as DeleteDocument } from '@/app/api/markup-documents/[id]/route'

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

describe('API Integration Tests', () => {
  let mockSupabase: any
  
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockDocument = {
    id: 'doc-123',
    title: 'Test Document',
    description: 'Test description',
    original_blueprint_url: 'https://example.com/blueprint.jpg',
    original_blueprint_filename: 'blueprint.jpg',
    markup_data: [
      {
        id: 'markup-1',
        type: 'box',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        color: 'red'
      }
    ],
    location: 'personal',
    created_by: 'user-123',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    site_id: null,
    is_deleted: false,
    markup_count: 1,
    preview_image_url: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleError.mockClear()
    mockConsoleLog.mockClear()

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
      rpc: jest.fn(),
    }

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    mockSupabase.from.mockReturnValue(mockQuery)
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Markup Documents API', () => {
    describe('GET /api/markup-documents', () => {
      it('should return documents for authenticated user', async () => {
        // Mock authenticated user
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        // Mock successful query
        const mockQueryChain = mockSupabase.from().select().eq().neq().order().range()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: [mockDocument],
          error: null,
          count: 1
        })

        const request = new NextRequest('http://localhost:3000/api/markup-documents?page=1&limit=10')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toEqual([mockDocument])
        expect(data.total).toBe(1)
        expect(mockSupabase.auth.getUser).toHaveBeenCalled()
        expect(mockSupabase.from).toHaveBeenCalledWith('markup_documents')
      })

      it('should return 401 for unauthenticated user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/markup-documents')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Unauthorized')
      })

      it('should handle search and filtering parameters', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const mockQueryChain = mockSupabase.from().select().eq().neq().ilike().order().range()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: [mockDocument],
          error: null,
          count: 1
        })

        const request = new NextRequest('http://localhost:3000/api/markup-documents?search=test&location=personal&page=1&limit=5')
        const response = await GET(request)

        expect(response.status).toBe(200)
        expect(mockSupabase.from().select().eq().neq().ilike).toHaveBeenCalled()
      })

      it('should handle database errors gracefully', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const mockQueryChain = mockSupabase.from().select().eq().neq().order().range()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })

        const request = new NextRequest('http://localhost:3000/api/markup-documents')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Database connection failed')
      })
    })

    describe('POST /api/markup-documents', () => {
      it('should create new document for authenticated user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const mockQueryChain = mockSupabase.from().insert().select().single()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })

        const requestBody = {
          title: 'New Document',
          description: 'New description',
          original_blueprint_url: 'https://example.com/new.jpg',
          original_blueprint_filename: 'new.jpg',
          markup_data: [],
          location: 'personal'
        }

        const request = new NextRequest('http://localhost:3000/api/markup-documents', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(data.data).toEqual(mockDocument)
        expect(mockSupabase.from).toHaveBeenCalledWith('markup_documents')
      })

      it('should validate required fields', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const invalidRequestBody = {
          description: 'Missing title and blueprint URL'
        }

        const request = new NextRequest('http://localhost:3000/api/markup-documents', {
          method: 'POST',
          body: JSON.stringify(invalidRequestBody),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Missing required fields')
      })

      it('should handle database insertion errors', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const mockQueryChain = mockSupabase.from().insert().select().single()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insertion failed' }
        })

        const requestBody = {
          title: 'New Document',
          original_blueprint_url: 'https://example.com/new.jpg',
          original_blueprint_filename: 'new.jpg',
          markup_data: [],
          location: 'personal'
        }

        const request = new NextRequest('http://localhost:3000/api/markup-documents', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Insertion failed')
      })
    })

    describe('GET /api/markup-documents/[id]', () => {
      it('should return specific document for authorized user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const mockQueryChain = mockSupabase.from().select().eq().single()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })

        const response = await GetSingleDocument(
          new NextRequest('http://localhost:3000/api/markup-documents/doc-123'),
          { params: { id: 'doc-123' } }
        )
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toEqual(mockDocument)
        expect(mockSupabase.from).toHaveBeenCalledWith('markup_documents')
      })

      it('should return 404 for non-existent document', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const mockQueryChain = mockSupabase.from().select().eq().single()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })

        const response = await GetSingleDocument(
          new NextRequest('http://localhost:3000/api/markup-documents/non-existent'),
          { params: { id: 'non-existent' } }
        )
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Document not found')
      })
    })

    describe('PUT /api/markup-documents/[id]', () => {
      it('should update document for authorized user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const updatedDocument = { ...mockDocument, title: 'Updated Document' }
        
        const mockQueryChain = mockSupabase.from().update().eq().select().single()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: updatedDocument,
          error: null
        })

        const requestBody = {
          title: 'Updated Document',
          description: 'Updated description'
        }

        const response = await UpdateDocument(
          new NextRequest('http://localhost:3000/api/markup-documents/doc-123', {
            method: 'PUT',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' }
          }),
          { params: { id: 'doc-123' } }
        )
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.title).toBe('Updated Document')
      })

      it('should prevent unauthorized updates', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { ...mockUser, id: 'different-user' } },
          error: null
        })

        const mockQueryChain = mockSupabase.from().update().eq().select().single()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })

        const requestBody = {
          title: 'Unauthorized Update'
        }

        const response = await UpdateDocument(
          new NextRequest('http://localhost:3000/api/markup-documents/doc-123', {
            method: 'PUT',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' }
          }),
          { params: { id: 'doc-123' } }
        )
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Document not found or access denied')
      })
    })

    describe('DELETE /api/markup-documents/[id]', () => {
      it('should soft delete document for authorized user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const mockQueryChain = mockSupabase.from().update().eq().select().single()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: { ...mockDocument, is_deleted: true },
          error: null
        })

        const response = await DeleteDocument(
          new NextRequest('http://localhost:3000/api/markup-documents/doc-123', {
            method: 'DELETE'
          }),
          { params: { id: 'doc-123' } }
        )
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toBe('Document deleted successfully')
      })

      it('should handle deletion of non-existent document', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const mockQueryChain = mockSupabase.from().update().eq().select().single()
        mockQueryChain.then = jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })

        const response = await DeleteDocument(
          new NextRequest('http://localhost:3000/api/markup-documents/non-existent', {
            method: 'DELETE'
          }),
          { params: { id: 'non-existent' } }
        )
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Document not found or access denied')
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        body: '{ invalid json }',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle missing Content-Type header', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' })
        // No Content-Type header
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Content-Type must be application/json')
    })

    it('should handle very large markup data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Create large markup data array
      const largeMarkupData = Array.from({ length: 1000 }, (_, i) => ({
        id: `markup-${i}`,
        type: 'box',
        x: i * 10,
        y: i * 10,
        width: 50,
        height: 50,
        color: 'red'
      }))

      const mockQueryChain = mockSupabase.from().insert().select().single()
      mockQueryChain.then = jest.fn().mockResolvedValue({
        data: { ...mockDocument, markup_data: largeMarkupData },
        error: null
      })

      const requestBody = {
        title: 'Large Document',
        original_blueprint_url: 'https://example.com/large.jpg',
        original_blueprint_filename: 'large.jpg',
        markup_data: largeMarkupData,
        location: 'personal'
      }

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.markup_data).toHaveLength(1000)
    })

    it('should handle concurrent requests gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockQueryChain = mockSupabase.from().select().eq().neq().order().range()
      mockQueryChain.then = jest.fn().mockResolvedValue({
        data: [mockDocument],
        error: null,
        count: 1
      })

      // Simulate concurrent requests
      const requests = Array.from({ length: 5 }, () =>
        GET(new NextRequest('http://localhost:3000/api/markup-documents'))
      )

      const responses = await Promise.all(requests)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Supabase client should be called for each request
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(5)
    })
  })
})