import { GET } from '@/app/api/analytics/web-vitals/route'
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
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase)
}

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/analytics/web-vitals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
  })

  describe('GET', () => {
    it('should return web vitals data with default time range', async () => {
      const mockWebVitalsData = [
        {
          metric_type: 'web_vitals_lcp',
          metric_value: 2000,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          metric_type: 'web_vitals_inp',
          metric_value: 150,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          metric_type: 'web_vitals_cls',
          metric_value: 0.05,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          metric_type: 'web_vitals_fcp',
          metric_value: 1500,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          metric_type: 'web_vitals_ttfb',
          metric_value: 600,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockWebVitalsData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toHaveLength(5) // All Web Vitals metrics
      
      // Check LCP metric
      const lcpMetric = json.find((metric: any) => metric.name === 'LCP')
      expect(lcpMetric.value).toBe(2000)
      expect(lcpMetric.rating).toBe('good') // 2000ms is good for LCP
      expect(lcpMetric.threshold).toEqual({ good: 2500, needs_improvement: 4000 })

      // Check INP metric
      const inpMetric = json.find((metric: any) => metric.name === 'INP')
      expect(inpMetric.value).toBe(150)
      expect(inpMetric.rating).toBe('good') // 150ms is good for INP

      // Check CLS metric
      const clsMetric = json.find((metric: any) => metric.name === 'CLS')
      expect(clsMetric.value).toBe(0.05)
      expect(clsMetric.rating).toBe('good') // 0.05 is good for CLS

      // Check FCP metric
      const fcpMetric = json.find((metric: any) => metric.name === 'FCP')
      expect(fcpMetric.value).toBe(1500)
      expect(fcpMetric.rating).toBe('good') // 1500ms is good for FCP

      // Check TTFB metric
      const ttfbMetric = json.find((metric: any) => metric.name === 'TTFB')
      expect(ttfbMetric.value).toBe(600)
      expect(ttfbMetric.rating).toBe('good') // 600ms is good for TTFB
    })

    it('should handle different time ranges correctly', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      // Test 1 hour range
      let request = new NextRequest('http://localhost:3000/api/analytics/web-vitals?timeRange=1h')
      let response = await GET(request)
      expect(response.status).toBe(200)

      // Test 7 days range
      request = new NextRequest('http://localhost:3000/api/analytics/web-vitals?timeRange=7d')
      response = await GET(request)
      expect(response.status).toBe(200)

      // Test 30 days range
      request = new NextRequest('http://localhost:3000/api/analytics/web-vitals?timeRange=30d')
      response = await GET(request)
      expect(response.status).toBe(200)

      // Verify the gte call was made with different timestamps
      expect(mockSupabase.gte).toHaveBeenCalledTimes(3)
    })

    it('should rate metrics correctly based on thresholds', async () => {
      const mockWebVitalsData = [
        {
          metric_type: 'web_vitals_lcp',
          metric_value: 3000, // needs-improvement
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          metric_type: 'web_vitals_cls',
          metric_value: 0.3, // poor
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockWebVitalsData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)

      // Check LCP rating (needs-improvement)
      const lcpMetric = json.find((metric: any) => metric.name === 'LCP')
      expect(lcpMetric.value).toBe(3000)
      expect(lcpMetric.rating).toBe('needs-improvement')

      // Check CLS rating (poor)
      const clsMetric = json.find((metric: any) => metric.name === 'CLS')
      expect(clsMetric.value).toBe(0.3)
      expect(clsMetric.rating).toBe('poor')

      // Check metrics with no data (should have value 0 and rating 'good')
      const inpMetric = json.find((metric: any) => metric.name === 'INP')
      expect(inpMetric.value).toBe(0)
      expect(inpMetric.rating).toBe('good')
    })

    it('should handle multiple readings and use latest values', async () => {
      const mockWebVitalsData = [
        {
          metric_type: 'web_vitals_lcp',
          metric_value: 2000,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          metric_type: 'web_vitals_lcp',
          metric_value: 2500, // Older reading
          created_at: '2024-01-15T09:00:00Z'
        },
        {
          metric_type: 'web_vitals_lcp',
          metric_value: 1800, // Latest reading
          created_at: '2024-01-15T11:00:00Z'
        }
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockWebVitalsData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)

      // Should use the latest LCP value (1800)
      const lcpMetric = json.find((metric: any) => metric.name === 'LCP')
      expect(lcpMetric.value).toBe(1800)
      expect(lcpMetric.rating).toBe('good')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('Failed to fetch Web Vitals data')
    })

    it('should return empty values when no data is available', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toHaveLength(5) // All 5 metrics

      // All metrics should have value 0 and rating 'good'
      json.forEach((metric: any) => {
        expect(metric.value).toBe(0)
        expect(metric.rating).toBe('good')
        expect(metric.threshold).toBeDefined()
      })
    })

    it('should query the correct metric types', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals')
      await GET(request)

      expect(mockSupabase.in).toHaveBeenCalledWith(
        'metric_type',
        ['web_vitals_lcp', 'web_vitals_inp', 'web_vitals_cls', 'web_vitals_fcp', 'web_vitals_ttfb']
      )
    })

    it('should handle invalid time range parameters', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      // Test invalid time range - should default to 24h
      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals?timeRange=invalid')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Should still process and return metrics with default time range
    })

    it('should return all expected thresholds', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockReturnValueOnce(mockSupabase)
      mockSupabase.gte.mockReturnValueOnce(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)

      const expectedThresholds = {
        LCP: { good: 2500, needs_improvement: 4000 },
        INP: { good: 200, needs_improvement: 500 },
        CLS: { good: 0.1, needs_improvement: 0.25 },
        FCP: { good: 1800, needs_improvement: 3000 },
        TTFB: { good: 800, needs_improvement: 1800 }
      }

      json.forEach((metric: any) => {
        expect(metric.threshold).toEqual(expectedThresholds[metric.name])
      })
    })

    it('should handle unexpected exceptions gracefully', async () => {
      // Mock an unexpected error during execution
      mockSupabase.select.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/web-vitals')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('Internal server error')
    })
  })
})