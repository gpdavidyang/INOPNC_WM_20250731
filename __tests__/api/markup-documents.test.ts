import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/markup-documents/route'
import { createClient } from '@/lib/supabase/server'
import { createMockSupabaseClient, SupabaseQueryMock } from '@/__tests__/utils/supabase-api-mock'

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('/api/markup-documents', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  
  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
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

    it('should handle authenticated user with default parameters', async () => {
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

    it('should handle search parameter', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Create a query mock for search
      const queryMock = new SupabaseQueryMock([], null)
      queryMock.range = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })
      
      mockSupabase.from.mockReturnValue(queryMock)

      const request = new NextRequest('http://localhost:3000/api/markup-documents?search=test')
      const response = await GET(request as any)
      
      expect(response.status).toBe(200)
      expect(queryMock.ilike).toHaveBeenCalledWith('title', '%test%')
    })

    it('should handle pagination parameters', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })
      
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange })
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const request = new NextRequest('http://localhost:3000/api/markup-documents?page=2&limit=10')
      const response = await GET(request as any)
      
      expect(response.status).toBe(200)
      expect(mockRange).toHaveBeenCalledWith(10, 19) // page 2, limit 10
    })

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockRange = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
      
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange })
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const request = new NextRequest('http://localhost:3000/api/markup-documents')
      const response = await GET(request as any)
      
      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to fetch documents')
    })
  })

  describe('POST', () => {
    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Document',
          description: 'Test Description'
        })
      })
      
      // Mock request.json()
      ;(request as any).json = jest.fn().mockResolvedValue({
        title: 'Test Document',
        description: 'Test Description'
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })

    it('should validate required fields', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Missing title'
        })
      })
      
      ;(request as any).json = jest.fn().mockResolvedValue({
        description: 'Missing title'
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Missing required fields')
    })

    it('should create document successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { id: 'user-123', site_id: 'site-123' }
      const mockDocument = {
        id: 'doc-123',
        title: 'Test Document',
        description: 'Test Description',
        created_by: 'user-123'
      }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // First call returns profile query, second call returns insert query
      const profileQuery = new SupabaseQueryMock(mockProfile, null)
      profileQuery.single = jest.fn().mockResolvedValue({ data: mockProfile, error: null })
      
      const insertQuery = new SupabaseQueryMock(mockDocument, null)
      insertQuery.single = jest.fn().mockResolvedValue({ data: mockDocument, error: null })
      
      mockSupabase.from
        .mockReturnValueOnce(profileQuery) // First call for profiles
        .mockReturnValueOnce(insertQuery) // Second call for insert

      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Document',
          description: 'Test Description',
          original_blueprint_url: 'http://example.com/image.jpg',
          original_blueprint_filename: 'image.jpg',
          markup_data: []
        })
      })
      
      ;(request as any).json = jest.fn().mockResolvedValue({
        title: 'Test Document',
        description: 'Test Description',
        original_blueprint_url: 'http://example.com/image.jpg',
        original_blueprint_filename: 'image.jpg',
        markup_data: []
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data).toEqual(mockDocument)
      
      // Verify profile was queried
      expect(profileQuery.select).toHaveBeenCalledWith('id, site_id')
      expect(profileQuery.eq).toHaveBeenCalledWith('id', 'user-123')
      
      // Verify insert was called
      expect(insertQuery.insert).toHaveBeenCalledWith({
        title: 'Test Document',
        description: 'Test Description',
        original_blueprint_url: 'http://example.com/image.jpg',
        original_blueprint_filename: 'image.jpg',
        markup_data: [],
        created_by: 'user-123',
        site_id: 'site-123',
        location: 'personal',
        preview_image_url: null,
        markup_count: 0
      })
    })
  })
})