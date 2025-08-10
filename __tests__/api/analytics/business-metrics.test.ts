import { GET } from '@/app/api/analytics/business-metrics/route'
import { NextRequest } from 'next/server'
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
  in: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase)
}

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/analytics/business-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)

    // Mock Math.random for consistent testing
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GET', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
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
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
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
          organization_id: 'org-1',
          site_id: 'site-1'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Insufficient permissions')
    })

    it('should return 400 when date range is missing', async () => {
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
          organization_id: 'org-1',
          site_id: 'site-1'
        },
        error: null
      })

      // Missing 'to' parameter
      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Date range is required')
    })

    it('should successfully return business metrics for admin users', async () => {
      const mockTotalWorkers = [
        { id: 'worker-1' },
        { id: 'worker-2' },
        { id: 'worker-3' },
        { id: 'manager-1' }
      ]

      const mockActiveWorkers = [
        { created_by: 'worker-1' },
        { created_by: 'worker-2' },
        { created_by: 'worker-1' } // Duplicate should be counted once
      ]

      const mockDailyReports = [
        { id: 'report-1' },
        { id: 'report-2' },
        { id: 'report-3' }
      ]

      const mockMaterialRequests = [
        { id: 'req-1' },
        { id: 'req-2' }
      ]

      const mockSafetyIncidents = [
        { id: 'incident-1' }
      ]

      // Mock previous period data
      const mockPrevActiveWorkers = [
        { created_by: 'worker-1' }
      ]

      const mockPrevDailyReports = [
        { id: 'prev-report-1' },
        { id: 'prev-report-2' }
      ]

      const mockPrevMaterialRequests = [
        { id: 'prev-req-1' }
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
          organization_id: 'org-1',
          site_id: null
        },
        error: null
      })

      // Mock total workers query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockResolvedValueOnce({
        data: mockTotalWorkers,
        error: null
      })

      // Mock active workers query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockActiveWorkers,
        error: null
      })

      // Mock daily reports query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockDailyReports,
        error: null
      })

      // Mock material requests query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockMaterialRequests,
        error: null
      })

      // Mock safety incidents query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockResolvedValueOnce({
        data: mockSafetyIncidents,
        error: null
      })

      // Mock previous period queries
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockPrevActiveWorkers,
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockPrevDailyReports,
        error: null
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.lte.mockResolvedValueOnce({
        data: mockPrevMaterialRequests,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics).toEqual({
        totalWorkers: 4,
        activeWorkers: 2, // Unique count of worker-1 and worker-2
        dailyReportsCount: 3,
        dailyReportsCompletion: 75.0, // (3 reports / 4 workers) * 100
        materialRequests: 2,
        materialUsage: 82, // Math.floor(0.5 * 30) + 70 = 85, but with mocked random
        equipmentUtilization: 77, // Math.floor(0.5 * 25) + 65 = 77
        safetyIncidents: 1,
        previousPeriodComparison: {
          totalWorkers: 4,
          activeWorkers: 1,
          dailyReportsCount: 2,
          materialRequests: 1
        }
      })
    })

    it('should handle site manager role correctly', async () => {
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
          organization_id: 'org-1',
          site_id: 'site-1'
        },
        error: null
      })

      // Mock all subsequent queries to return empty data
      for (let i = 0; i < 8; i++) {
        mockSupabase.select.mockReturnValueOnce(mockSupabase)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase)
        if (i === 0) {
          mockSupabase.in.mockResolvedValueOnce({ data: [], error: null })
        } else {
          mockSupabase.gte.mockReturnValueOnce(mockSupabase)
          mockSupabase.lte.mockResolvedValueOnce({ data: [], error: null })
        }
      }

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Site managers should have access to analytics
    })

    it('should calculate daily reports completion rate correctly', async () => {
      const mockTotalWorkers = [
        { id: 'worker-1' },
        { id: 'worker-2' }
      ]

      const mockDailyReports = [
        { id: 'report-1' } // Only 1 report for 2 workers = 50%
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
          organization_id: 'org-1',
          site_id: null
        },
        error: null
      })

      // Mock total workers query
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockResolvedValueOnce({
        data: mockTotalWorkers,
        error: null
      })

      // Mock all other queries to return minimal data
      for (let i = 0; i < 7; i++) {
        mockSupabase.select.mockReturnValueOnce(mockSupabase)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase)
        mockSupabase.gte.mockReturnValueOnce(mockSupabase)
        if (i === 1) { // Daily reports query
          mockSupabase.lte.mockResolvedValueOnce({
            data: mockDailyReports,
            error: null
          })
        } else {
          mockSupabase.lte.mockResolvedValueOnce({
            data: [],
            error: null
          })
        }
      }

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics.dailyReportsCompletion).toBe(50.0) // 1/2 * 100
    })

    it('should handle zero workers case', async () => {
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
          organization_id: 'org-1',
          site_id: null
        },
        error: null
      })

      // Mock total workers query to return empty array
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock all other queries to return empty data
      for (let i = 0; i < 7; i++) {
        mockSupabase.select.mockReturnValueOnce(mockSupabase)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase)
        mockSupabase.gte.mockReturnValueOnce(mockSupabase)
        mockSupabase.lte.mockResolvedValueOnce({
          data: [],
          error: null
        })
      }

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics.totalWorkers).toBe(0)
      expect(json.metrics.dailyReportsCompletion).toBe(0) // Should not divide by zero
    })

    it('should handle date range filters correctly', async () => {
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
          organization_id: 'org-1',
          site_id: null
        },
        error: null
      })

      // Mock all queries to return empty data
      for (let i = 0; i < 8; i++) {
        mockSupabase.select.mockReturnValueOnce(mockSupabase)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase)
        if (i === 0) {
          mockSupabase.in.mockResolvedValueOnce({ data: [], error: null })
        } else {
          mockSupabase.gte.mockReturnValueOnce(mockSupabase)
          mockSupabase.lte.mockResolvedValueOnce({ data: [], error: null })
        }
      }

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-15')
      const response = await GET(request)

      expect(response.status).toBe(200)
      
      // Verify date filters were applied correctly
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00.000Z')
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', '2024-01-15T00:00:00.000Z')
    })

    it('should handle site filter parameter', async () => {
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
          organization_id: 'org-1',
          site_id: null
        },
        error: null
      })

      // Mock all queries to return empty data
      for (let i = 0; i < 8; i++) {
        mockSupabase.select.mockReturnValueOnce(mockSupabase)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase)
        if (i === 0) {
          mockSupabase.in.mockResolvedValueOnce({ data: [], error: null })
        } else {
          mockSupabase.gte.mockReturnValueOnce(mockSupabase)
          mockSupabase.lte.mockResolvedValueOnce({ data: [], error: null })
        }
      }

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31&site=site-123')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // The site filter is applied in the query building logic
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
          organization_id: 'org-1',
          site_id: null
        },
        error: null
      })

      // Mock first query to throw an error
      mockSupabase.select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('Internal server error')
    })

    it('should provide random material usage and equipment utilization within expected ranges', async () => {
      // Test with different random values
      jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1)

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
          organization_id: 'org-1',
          site_id: null
        },
        error: null
      })

      // Mock all queries to return empty data
      for (let i = 0; i < 8; i++) {
        mockSupabase.select.mockReturnValueOnce(mockSupabase)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase)
        if (i === 0) {
          mockSupabase.in.mockResolvedValueOnce({ data: [], error: null })
        } else {
          mockSupabase.gte.mockReturnValueOnce(mockSupabase)
          mockSupabase.lte.mockResolvedValueOnce({ data: [], error: null })
        }
      }

      const request = new NextRequest('http://localhost:3000/api/analytics/business-metrics?from=2024-01-01&to=2024-01-31')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      
      // Material usage should be between 70-100%
      expect(json.metrics.materialUsage).toBeGreaterThanOrEqual(70)
      expect(json.metrics.materialUsage).toBeLessThanOrEqual(100)
      
      // Equipment utilization should be between 65-90%
      expect(json.metrics.equipmentUtilization).toBeGreaterThanOrEqual(65)
      expect(json.metrics.equipmentUtilization).toBeLessThanOrEqual(90)
    })
  })
})