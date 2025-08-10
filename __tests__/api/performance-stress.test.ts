/**
 * Performance and Stress Testing for API Endpoints
 * 
 * Tests API performance under various load conditions and ensures
 * response times meet acceptable thresholds for Task 12.5
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

// Increase timeout for performance tests
jest.setTimeout(30000)

describe('API Performance and Stress Testing', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockProfile = { id: 'user-123', site_id: 'site-123' }
  
  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Setup authenticated user by default
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Response Time Performance', () => {
    it('should respond to GET requests within 100ms', async () => {
      const mockDocuments = Array.from({ length: 20 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i}`,
        created_by: mockUser.id,
        created_at: new Date().toISOString(),
        created_by_profile: { full_name: 'Test User' }
      }))

      const documentsQuery = new SupabaseQueryMock(mockDocuments, null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 20
      })
      
      mockSupabase.from.mockReturnValue(documentsQuery)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/markup-documents')
      const response = await GET(request as any)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(100) // Should respond within 100ms
    })

    it('should handle individual document GET requests within 50ms', async () => {
      const mockDocument = {
        id: 'doc-123',
        title: 'Test Document',
        created_by: mockUser.id,
        markup_data: []
      }

      const documentQuery = new SupabaseQueryMock(mockDocument, null)
      documentQuery.select = jest.fn().mockReturnValue(documentQuery)
      documentQuery.eq = jest.fn().mockReturnValue(documentQuery)
      documentQuery.single = jest.fn().mockResolvedValue({
        data: mockDocument,
        error: null
      })
      
      mockSupabase.from.mockReturnValue(documentQuery)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/markup-documents/doc-123')
      const response = await GetById(request as any, { params: { id: 'doc-123' } })
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(50) // Single document should be faster
    })

    it('should handle POST requests within 150ms', async () => {
      const profileQuery = new SupabaseQueryMock(mockProfile, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: mockProfile, error: null })

      const mockCreatedDocument = {
        id: 'new-doc-123',
        title: 'New Document',
        created_by: mockUser.id
      }

      const insertQuery = new SupabaseQueryMock(mockCreatedDocument, null)
      insertQuery.insert = jest.fn().mockReturnValue(insertQuery)
      insertQuery.select = jest.fn().mockReturnValue(insertQuery)
      insertQuery.single = jest.fn().mockResolvedValue({ data: mockCreatedDocument, error: null })
      
      mockSupabase.from
        .mockReturnValueOnce(profileQuery)
        .mockReturnValueOnce(insertQuery)

      const payload = {
        title: 'New Document',
        original_blueprint_url: 'http://example.com/test.jpg',
        original_blueprint_filename: 'test.jpg',
        markup_data: []
      }

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      ;(request as any).json = jest.fn().mockResolvedValue(payload)

      const response = await POST(request as any)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(150) // POST operations can take slightly longer
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle 10 concurrent GET requests efficiently', async () => {
      const mockDocuments = Array.from({ length: 20 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i}`,
        created_by: mockUser.id,
        created_at: new Date().toISOString(),
        created_by_profile: { full_name: 'Test User' }
      }))

      const documentsQuery = new SupabaseQueryMock(mockDocuments, null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 20
      })
      
      mockSupabase.from.mockReturnValue(documentsQuery)

      // Create 10 concurrent requests
      const requests = Array.from({ length: 10 }, () => 
        new NextRequest('http://localhost:3000/api/markup-documents')
      )

      const startTime = Date.now()
      const responses = await Promise.all(
        requests.map(request => GET(request as any))
      )
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Total time for 10 concurrent requests should be reasonable
      expect(totalTime).toBeLessThan(500) // Should handle concurrency well
      
      // Average time per request should be low
      const avgTimePerRequest = totalTime / 10
      expect(avgTimePerRequest).toBeLessThan(100)
    })

    it('should handle mixed concurrent operations', async () => {
      // Setup mocks for different operations
      const documentsQuery = new SupabaseQueryMock([], null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      const profileQuery = new SupabaseQueryMock(mockProfile, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: mockProfile, error: null })

      const insertQuery = new SupabaseQueryMock({ id: 'new-doc' }, null)
      insertQuery.insert = jest.fn().mockReturnValue(insertQuery)
      insertQuery.select = jest.fn().mockReturnValue(insertQuery)
      insertQuery.single = jest.fn().mockResolvedValue({ data: { id: 'new-doc' }, error: null })
      
      // Create a counter to properly mock the expected call sequence
      let callCount = 0
      mockSupabase.from
        .mockImplementation(() => {
          callCount++
          // For GET requests, return documents query
          // For POST requests, alternate between profile and insert query
          if (callCount % 3 === 0) {
            return insertQuery
          } else if (callCount % 3 === 1) {
            return profileQuery
          }
          return documentsQuery
        })

      // Create mixed operations
      const operations = [
        // 5 GET requests
        ...Array.from({ length: 5 }, () => 
          GET(new NextRequest('http://localhost:3000/api/markup-documents') as any)
        ),
        // 3 POST requests
        ...Array.from({ length: 3 }, () => {
          const request = new NextRequest('http://localhost:3000/api/markup-documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Test',
              original_blueprint_url: 'http://example.com/test.jpg',
              original_blueprint_filename: 'test.jpg'
            })
          })
          ;(request as any).json = jest.fn().mockResolvedValue({
            title: 'Test',
            original_blueprint_url: 'http://example.com/test.jpg',
            original_blueprint_filename: 'test.jpg'
          })
          return POST(request as any)
        })
      ]

      const startTime = Date.now()
      const responses = await Promise.all(operations)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All operations should complete
      expect(responses).toHaveLength(8)
      
      // Should handle mixed operations efficiently
      expect(totalTime).toBeLessThan(600)
    })
  })

  describe('Large Payload Handling', () => {
    it('should handle documents with large markup data efficiently', async () => {
      // Create a large markup array (simulating complex drawings)
      const largeMarkupData = Array.from({ length: 1000 }, (_, i) => ({
        id: `mark-${i}`,
        type: 'box',
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        width: 100,
        height: 100,
        color: '#FF0000',
        annotation: `Annotation ${i} with some detailed text that makes the payload larger`
      }))

      const profileQuery = new SupabaseQueryMock(mockProfile, null)
      profileQuery.select = jest.fn().mockReturnValue(profileQuery)
      profileQuery.eq = jest.fn().mockReturnValue(profileQuery)
      profileQuery.single = jest.fn().mockResolvedValue({ data: mockProfile, error: null })

      const insertQuery = new SupabaseQueryMock({ id: 'large-doc' }, null)
      insertQuery.insert = jest.fn().mockReturnValue(insertQuery)
      insertQuery.select = jest.fn().mockReturnValue(insertQuery)
      insertQuery.single = jest.fn().mockResolvedValue({ 
        data: { id: 'large-doc', markup_count: 1000 }, 
        error: null 
      })
      
      mockSupabase.from
        .mockReturnValueOnce(profileQuery)
        .mockReturnValueOnce(insertQuery)

      const payload = {
        title: 'Large Document',
        original_blueprint_url: 'http://example.com/large.jpg',
        original_blueprint_filename: 'large.jpg',
        markup_data: largeMarkupData
      }

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      ;(request as any).json = jest.fn().mockResolvedValue(payload)

      const response = await POST(request as any)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(300) // Should still be reasonably fast
    })

    it('should handle paginated results efficiently for large datasets', async () => {
      // Create a large dataset
      const totalDocuments = 1000
      const pageSize = 20
      
      // Test different pages
      const pagesToTest = [1, 10, 25, 50]
      
      for (const page of pagesToTest) {
        const offset = (page - 1) * pageSize
        const mockDocuments = Array.from({ length: pageSize }, (_, i) => ({
          id: `doc-${offset + i}`,
          title: `Document ${offset + i}`,
          created_by: mockUser.id,
          created_at: new Date().toISOString(),
          created_by_profile: { full_name: 'Test User' }
        }))

        const documentsQuery = new SupabaseQueryMock(mockDocuments, null)
        documentsQuery.range = jest.fn().mockResolvedValue({
          data: mockDocuments,
          error: null,
          count: totalDocuments
        })
        
        mockSupabase.from.mockReturnValue(documentsQuery)

        const startTime = Date.now()
        const request = new NextRequest(`http://localhost:3000/api/markup-documents?page=${page}&limit=${pageSize}`)
        const response = await GET(request as any)
        const endTime = Date.now()
        const responseTime = endTime - startTime

        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(100) // Pagination should keep response times low
        
        // Verify pagination was applied
        expect(documentsQuery.range).toHaveBeenCalledWith(offset, offset + pageSize - 1)
      }
    })
  })

  describe('Error Recovery Performance', () => {
    it('should fail fast on authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/markup-documents')
      const response = await GET(request as any)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(401)
      expect(responseTime).toBeLessThan(20) // Should fail fast without database queries
    })

    it('should handle database errors gracefully without hanging', async () => {
      const documentsQuery = new SupabaseQueryMock(null, null)
      documentsQuery.select = jest.fn().mockReturnValue(documentsQuery)
      documentsQuery.eq = jest.fn().mockReturnValue(documentsQuery)
      documentsQuery.order = jest.fn().mockReturnValue(documentsQuery)
      documentsQuery.range = jest.fn().mockImplementation(() => {
        // Simulate a database delay then error
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: null,
              error: { message: 'Database connection timeout' },
              count: null
            })
          }, 100)
        })
      })
      
      mockSupabase.from.mockReturnValue(documentsQuery)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/markup-documents')
      const response = await GET(request as any)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(500)
      expect(responseTime).toBeLessThan(200) // Should not hang on database errors
    })
  })

  describe('Memory Usage and Resource Management', () => {
    it('should handle repeated requests without memory leaks', async () => {
      const mockDocuments = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i}`,
        created_by: mockUser.id,
        created_at: new Date().toISOString(),
        created_by_profile: { full_name: 'Test User' }
      }))

      const documentsQuery = new SupabaseQueryMock(mockDocuments, null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 10
      })
      
      // Track memory usage (simplified - in real tests you'd use process.memoryUsage())
      const iterations = 100
      const responseTimes: number[] = []

      for (let i = 0; i < iterations; i++) {
        mockSupabase.from.mockReturnValue(documentsQuery)
        
        const startTime = Date.now()
        const request = new NextRequest('http://localhost:3000/api/markup-documents')
        const response = await GET(request as any)
        const endTime = Date.now()
        
        responseTimes.push(endTime - startTime)
        expect(response.status).toBe(200)
      }

      // Response times should remain consistent (no degradation)
      const firstHalf = responseTimes.slice(0, 50)
      const secondHalf = responseTimes.slice(50)
      
      const avgFirstHalf = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const avgSecondHalf = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      
      // Performance should not degrade significantly
      expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5)
    })
  })

  describe('Search Performance', () => {
    it('should handle search queries efficiently', async () => {
      const searchResults = Array.from({ length: 5 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Blueprint ${i}`,
        created_by: mockUser.id,
        created_at: new Date().toISOString(),
        created_by_profile: { full_name: 'Test User' }
      }))

      const documentsQuery = new SupabaseQueryMock(searchResults, null)
      documentsQuery.ilike = jest.fn().mockReturnValue(documentsQuery)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: searchResults,
        error: null,
        count: 5
      })
      
      mockSupabase.from.mockReturnValue(documentsQuery)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/markup-documents?search=blueprint')
      const response = await GET(request as any)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(100) // Search should be performant
      expect(documentsQuery.ilike).toHaveBeenCalledWith('title', '%blueprint%')
    })

    it('should handle complex search patterns efficiently', async () => {
      const complexSearchTerms = [
        'construction site A-123',
        '建設現場 図面',  // Japanese characters
        'very long search term with multiple words that might slow down the query',
        'special!@#$%^&*()characters'
      ]

      for (const searchTerm of complexSearchTerms) {
        const documentsQuery = new SupabaseQueryMock([], null)
        documentsQuery.ilike = jest.fn().mockReturnValue(documentsQuery)
        documentsQuery.range = jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
        
        mockSupabase.from.mockReturnValue(documentsQuery)

        const startTime = Date.now()
        const request = new NextRequest(`http://localhost:3000/api/markup-documents?search=${encodeURIComponent(searchTerm)}`)
        const response = await GET(request as any)
        const endTime = Date.now()
        const responseTime = endTime - startTime

        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(100) // Should handle complex searches efficiently
      }
    })
  })

  describe('Stress Testing', () => {
    it('should maintain performance under sustained load', async () => {
      const mockDocuments = Array.from({ length: 20 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i}`,
        created_by: mockUser.id,
        created_at: new Date().toISOString(),
        created_by_profile: { full_name: 'Test User' }
      }))

      const documentsQuery = new SupabaseQueryMock(mockDocuments, null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 20
      })

      // Simulate sustained load for 5 seconds
      const testDuration = 5000 // 5 seconds
      const startTestTime = Date.now()
      let requestCount = 0
      const responseTimes: number[] = []

      while (Date.now() - startTestTime < testDuration) {
        mockSupabase.from.mockReturnValue(documentsQuery)
        
        const startTime = Date.now()
        const request = new NextRequest('http://localhost:3000/api/markup-documents')
        const response = await GET(request as any)
        const endTime = Date.now()
        
        expect(response.status).toBe(200)
        responseTimes.push(endTime - startTime)
        requestCount++
      }

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const maxResponseTime = Math.max(...responseTimes)
      const minResponseTime = Math.min(...responseTimes)

      console.log(`Stress test completed: ${requestCount} requests in ${testDuration}ms`)
      console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`)
      console.log(`Min/Max response time: ${minResponseTime}ms / ${maxResponseTime}ms`)

      // Performance should remain acceptable under load
      expect(avgResponseTime).toBeLessThan(50)
      expect(maxResponseTime).toBeLessThan(200) // No extreme outliers
    })

    it('should handle burst traffic patterns', async () => {
      const mockDocuments = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i}`,
        created_by: mockUser.id,
        created_at: new Date().toISOString(),
        created_by_profile: { full_name: 'Test User' }
      }))

      const documentsQuery = new SupabaseQueryMock(mockDocuments, null)
      documentsQuery.range = jest.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 10
      })
      
      mockSupabase.from.mockReturnValue(documentsQuery)

      // Simulate burst traffic: 50 requests at once
      const burstSize = 50
      const requests = Array.from({ length: burstSize }, () => 
        new NextRequest('http://localhost:3000/api/markup-documents')
      )

      const startTime = Date.now()
      const responses = await Promise.all(
        requests.map(request => GET(request as any))
      )
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All requests should succeed
      const successCount = responses.filter(r => r.status === 200).length
      expect(successCount).toBe(burstSize)

      // Should handle burst efficiently
      const avgTimePerRequest = totalTime / burstSize
      expect(avgTimePerRequest).toBeLessThan(50) // Should scale well
      
      console.log(`Burst test: ${burstSize} requests completed in ${totalTime}ms`)
      console.log(`Average time per request: ${avgTimePerRequest.toFixed(2)}ms`)
    })
  })

  describe('Performance Benchmarks', () => {
    it('should meet performance SLAs', async () => {
      // Define Service Level Agreements
      const SLAs = {
        getList: { p50: 50, p95: 100, p99: 200 },
        getById: { p50: 30, p95: 60, p99: 100 },
        create: { p50: 80, p95: 150, p99: 300 },
        update: { p50: 70, p95: 140, p99: 250 },
        delete: { p50: 40, p95: 80, p99: 150 }
      }

      // Test GET list performance
      const listTimes: number[] = []
      for (let i = 0; i < 100; i++) {
        const documentsQuery = new SupabaseQueryMock([], null)
        documentsQuery.range = jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
        mockSupabase.from.mockReturnValue(documentsQuery)

        const start = Date.now()
        await GET(new NextRequest('http://localhost:3000/api/markup-documents') as any)
        listTimes.push(Date.now() - start)
      }

      // Calculate percentiles
      listTimes.sort((a, b) => a - b)
      const p50 = listTimes[Math.floor(listTimes.length * 0.5)]
      const p95 = listTimes[Math.floor(listTimes.length * 0.95)]
      const p99 = listTimes[Math.floor(listTimes.length * 0.99)]

      console.log(`GET List Performance - P50: ${p50}ms, P95: ${p95}ms, P99: ${p99}ms`)

      // Verify SLAs are met
      expect(p50).toBeLessThanOrEqual(SLAs.getList.p50)
      expect(p95).toBeLessThanOrEqual(SLAs.getList.p95)
      expect(p99).toBeLessThanOrEqual(SLAs.getList.p99)
    })
  })
})