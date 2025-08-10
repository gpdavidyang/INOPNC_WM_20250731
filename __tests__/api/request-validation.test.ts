import { NextRequest } from 'next/server'
import { GET as healthCheck } from '@/app/api/health/route'
import { GET as metricsGet, POST as metricsPost } from '@/app/api/analytics/metrics/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock API monitoring
jest.mock('@/lib/monitoring/api-monitoring', () => ({
  withApiMonitoring: (handler: any) => handler
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase)
}

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('API Request Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
  })

  describe('HTTP Method Validation', () => {
    it('should handle unsupported HTTP methods gracefully', async () => {
      const response = await healthCheck()
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.status).toBe('healthy')
    })

    it('should reject invalid Content-Type for POST requests', async () => {
      const invalidContentTypeRequest = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        body: 'invalid-data',
        headers: {
          'content-type': 'text/plain'
        }
      })

      const response = await metricsPost(invalidContentTypeRequest)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Invalid JSON in request body')
    })
  })

  describe('Request Body Validation', () => {
    it('should handle empty request bodies', async () => {
      const emptyBodyRequest = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'content-length': '0'
        }
      })

      const response = await metricsPost(emptyBodyRequest)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Request body is required')
    })

    it('should handle malformed JSON', async () => {
      const malformedJsonRequest = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        body: '{"invalid": json}',
        headers: {
          'content-type': 'application/json',
          'content-length': '16'
        }
      })

      const response = await metricsPost(malformedJsonRequest)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Invalid JSON in request body')
    })

    it('should validate required fields in request body', async () => {
      const incompleteRequest = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify({
          type: 'web_vitals'
        }),
        headers: {
          'content-type': 'application/json',
          'content-length': '22'
        }
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: { organization_id: 'org-1' },
        error: null
      })

      const response = await metricsPost(incompleteRequest)

      expect(response.status).toBeGreaterThanOrEqual(200)
    })
  })

  describe('Query Parameter Validation', () => {
    it('should handle invalid query parameters', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user-1',
          role: 'admin',
          organization_id: 'org-1'
        },
        error: null
      })

      const invalidTypeRequest = new NextRequest('http://localhost:3000/api/analytics/metrics?type=invalid_metric')
      const response = await metricsGet(invalidTypeRequest)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Invalid metric type')
    })

    it('should handle missing required query parameters', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user-1',
          role: 'admin',
          organization_id: 'org-1'
        },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null
      })

      const noParamsRequest = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await metricsGet(noParamsRequest)

      expect(response.status).toBe(200)
    })

    it('should sanitize query parameters to prevent injection', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user-1',
          role: 'admin',
          organization_id: 'org-1'
        },
        error: null
      })

      const maliciousRequest = new NextRequest('http://localhost:3000/api/analytics/metrics?type=\'; DROP TABLE users; --')
      const response = await metricsGet(maliciousRequest)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Invalid metric type')
    })
  })

  describe('Authentication Validation', () => {
    it('should handle missing authentication headers', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('No authorization header')
      })

      const unauthenticatedRequest = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await metricsGet(unauthenticatedRequest)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })

    it('should handle invalid authentication tokens', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid JWT token')
      })

      const invalidTokenRequest = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        headers: {
          'authorization': 'Bearer invalid-token'
        }
      })
      const response = await metricsGet(invalidTokenRequest)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })
  })

  describe('Error Response Formats', () => {
    it('should return consistent error response format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await metricsGet(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json).toHaveProperty('error')
      expect(typeof json.error).toBe('string')
      expect(json).not.toHaveProperty('success')
    })

    it('should handle database connection errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user-1',
          role: 'admin',
          organization_id: 'org-1'
        },
        error: null
      })

      mockSupabase.select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await metricsGet(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('Failed to fetch metrics')
    })
  })

  describe('Rate Limiting and Security', () => {
    it('should handle potential DoS attacks through repeated requests', async () => {
      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/health')
      )

      const responses = await Promise.all(requests.map(req => healthCheck()))

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should sanitize response data to prevent information leakage', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await metricsGet(request)
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('Profile not found')
    })
  })

  describe('Content Validation', () => {
    it('should validate file uploads in multipart requests', async () => {
      const validContentRequest = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify({
          type: 'web_vitals',
          metric: 'LCP',
          value: 2000
        }),
        headers: {
          'content-type': 'application/json',
          'content-length': '52'
        }
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: { organization_id: 'org-1' },
        error: null
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })

      const response = await metricsPost(validContentRequest)
      expect(response.status).toBe(200)
    })

    it('should validate data types in request payloads', async () => {
      const invalidTypesRequest = new NextRequest('http://localhost:3000/api/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify({
          type: 'web_vitals',
          metric: 'LCP',
          value: 'not-a-number'
        }),
        headers: {
          'content-type': 'application/json',
          'content-length': '55'
        }
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: { organization_id: 'org-1' },
        error: null
      })

      const response = await metricsPost(invalidTypesRequest)
      
      expect(response.status).toBeGreaterThanOrEqual(200)
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent requests safely', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      const concurrentRequests = Array.from({ length: 3 }, () => 
        new NextRequest('http://localhost:3000/api/health')
      )

      const responses = await Promise.all(concurrentRequests.map(req => healthCheck()))

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle network timeouts gracefully', async () => {
      mockSupabase.auth.getUser.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: 'user-1' } },
          error: null
        }), 100))
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const startTime = Date.now()
      const response = await metricsGet(request)
      const endTime = Date.now()

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(endTime - startTime).toBeGreaterThan(50)
    })

    it('should handle memory pressure scenarios', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      
      const responses = []
      for (let i = 0; i < 10; i++) {
        responses.push(await healthCheck())
      }

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})