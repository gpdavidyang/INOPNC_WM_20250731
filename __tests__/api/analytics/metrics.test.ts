import { GET, POST } from '@/app/api/analytics/metrics/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
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
  in: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  rpc: jest.fn(() => mockSupabase)
}

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/analytics/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  describe('GET', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })

    it('should return 404 when profile not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Profile not found')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('Profile not found')
    })

    it('should return 403 for users with insufficient permissions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user-1',
          role: 'worker', // Insufficient permission
          organization_id: 'org-1'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Insufficient permissions')
    })

    it('should return 400 for invalid metric type', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics?type=invalid_metric')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Invalid metric type')
    })

    it('should successfully return metrics for admin users', async () => {
      const mockMetrics = [
        {
          id: '1',
          metric_type: 'daily_report_completion',
          metric_date: '2024-01-15',
          metric_value: 0.85,
          metric_count: 10,
          organization_id: 'org-1',
          site_id: 'site-1'
        },
        {
          id: '2',
          metric_type: 'attendance_rate',
          metric_date: '2024-01-15',
          metric_value: 0.92,
          metric_count: 25,
          organization_id: 'org-1',
          site_id: 'site-1'
        }
      ]

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

      // Mock the metrics query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValue({
        data: mockMetrics,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics?days=7')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.count).toBe(2)
      expect(json.data).toHaveProperty('daily_report_completion')
      expect(json.data).toHaveProperty('attendance_rate')
      expect(json.filters.days).toBe(7)
    })

    it('should filter metrics by type when specified', async () => {
      const mockMetrics = [
        {
          id: '1',
          metric_type: 'daily_report_completion',
          metric_date: '2024-01-15',
          metric_value: 0.85,
          metric_count: 10
        }
      ]

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

      // Mock the metrics query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValue({
        data: mockMetrics,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics?type=daily_report_completion')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.data).toEqual(mockMetrics)
      expect(json.filters.type).toBe('daily_report_completion')
    })

    it('should apply site filter for site managers', async () => {
      const mockAssignedSites = [
        { site_id: 'site-1' },
        { site_id: 'site-2' }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user-1',
          role: 'site_manager',
          organization_id: 'org-1'
        },
        error: null
      })

      // Mock site members query for site manager
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValueOnce({
        data: mockAssignedSites,
        error: null
      })

      // Mock the metrics query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockSupabase.in).toHaveBeenCalledWith('site_id', ['site-1', 'site-2'])
    })

    it('should handle database errors gracefully', async () => {
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

      // Mock database error
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('Failed to fetch metrics')
    })

    it('should use default parameters when none provided', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/analytics/metrics')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.filters.days).toBe(30) // Default value
      expect(json.filters.organizationId).toBe('org-1')
      expect(json.filters.type).toBeNull()
      expect(json.filters.siteId).toBeNull()
    })
  })

  describe('POST', () => {
    describe('Web Vitals Metrics', () => {
      it('should store web vitals metrics successfully', async () => {
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

        const requestBody = {
          type: 'web_vitals',
          metric: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 50,
          navigationType: 'navigate',
          url: 'http://localhost:3000/dashboard',
          timestamp: Date.now()
        }

        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'content-length': JSON.stringify(requestBody).length.toString()
          }
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith({
          metric_type: 'web_vitals_lcp',
          organization_id: 'org-1',
          metric_date: expect.any(String),
          metric_value: 2000,
          metric_count: 1,
          dimensions: {
            rating: 'good',
            delta: 50,
            navigationType: 'navigate',
            url: '/dashboard'
          },
          metadata: {
            id: undefined,
            timestamp: expect.any(Number),
            userAgent: null
          }
        })
      })

      it('should store custom metrics successfully', async () => {
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

        const requestBody = {
          type: 'custom_metric',
          metric: 'page_load_time',
          value: 1500,
          url: 'http://localhost:3000/dashboard',
          unit: 'ms',
          timestamp: Date.now()
        }

        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'content-length': JSON.stringify(requestBody).length.toString()
          }
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith({
          metric_type: 'page_load_time',
          organization_id: 'org-1',
          metric_date: expect.any(String),
          metric_value: 1500,
          metric_count: 1,
          dimensions: {
            endpoint: undefined,
            unit: 'ms',
            url: '/dashboard'
          },
          metadata: {
            timestamp: expect.any(Number),
            userAgent: null
          }
        })
      })

      it('should store API performance metrics successfully', async () => {
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

        const requestBody = {
          type: 'api_performance',
          endpoint: '/api/daily-reports',
          duration: 250,
          status: 200,
          method: 'GET',
          timestamp: Date.now()
        }

        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'content-length': JSON.stringify(requestBody).length.toString()
          }
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith({
          metric_type: 'api_response_time',
          organization_id: 'org-1',
          metric_date: expect.any(String),
          metric_value: 250,
          metric_count: 1,
          dimensions: {
            endpoint: '/api/daily-reports',
            status: 200,
            method: 'GET'
          },
          metadata: {
            timestamp: expect.any(Number),
            userAgent: null
          }
        })
      })

      it('should return 400 for empty request body', async () => {
        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          headers: {
            'content-length': '0'
          }
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(400)
        expect(json.error).toBe('Request body is required')
      })

      it('should return 400 for invalid JSON', async () => {
        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          body: 'invalid json',
          headers: {
            'content-length': '12'
          }
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(400)
        expect(json.error).toBe('Invalid JSON in request body')
      })

      it('should handle database errors when storing metrics', async () => {
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
          error: new Error('Database error')
        })

        const requestBody = {
          type: 'web_vitals',
          metric: 'LCP',
          value: 2000
        }

        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'content-length': JSON.stringify(requestBody).length.toString()
          }
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(500)
        expect(json.error).toBe('Failed to store metric')
      })
    })

    describe('Manual Aggregation', () => {
      it('should trigger manual aggregation for admin users', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null
        })

        mockSupabase.select.mockReturnValueOnce(mockSupabase)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase)
        mockSupabase.single.mockResolvedValue({
          data: {
            role: 'admin',
            organization_id: 'org-1'
          },
          error: null
        })

        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: null
        })

        const requestBody = {
          date: '2024-01-15',
          siteId: 'site-1'
        }

        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'content-length': JSON.stringify(requestBody).length.toString()
          }
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
        expect(json.message).toBe('Metrics aggregated successfully')
        expect(mockSupabase.rpc).toHaveBeenCalledWith('aggregate_daily_analytics', {
          p_organization_id: 'org-1',
          p_site_id: 'site-1',
          p_date: '2024-01-15'
        })
      })

      it('should deny manual aggregation for non-admin users', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null
        })

        mockSupabase.select.mockReturnValueOnce(mockSupabase)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase)
        mockSupabase.single.mockResolvedValue({
          data: {
            role: 'site_manager',
            organization_id: 'org-1'
          },
          error: null
        })

        const requestBody = {
          date: '2024-01-15'
        }

        const request = new NextRequest('http://localhost:3000/api/analytics/metrics', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
            'content-length': JSON.stringify(requestBody).length.toString()
          }
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(403)
        expect(json.error).toBe('Insufficient permissions')
      })
    })
  })
})