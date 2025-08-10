/**
 * Tests for Performance Monitoring Utility
 */

import { PerformanceMonitor, generatePerformanceReport, DEFAULT_SLAS } from './performance-monitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
  })

  describe('Basic Recording', () => {
    it('should record performance metrics', () => {
      monitor.record({
        endpoint: '/api/documents',
        method: 'GET',
        responseTime: 45,
        statusCode: 200,
        timestamp: new Date()
      })

      const summary = monitor.getSummary('/api/documents', 'GET')
      expect(summary).toBeDefined()
      expect(summary?.count).toBe(1)
      expect(summary?.avgResponseTime).toBe(45)
    })

    it('should calculate statistics correctly', () => {
      const times = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      
      times.forEach(time => {
        monitor.record({
          endpoint: '/api/documents',
          method: 'GET',
          responseTime: time,
          statusCode: 200,
          timestamp: new Date()
        })
      })

      const summary = monitor.getSummary('/api/documents', 'GET')
      expect(summary?.count).toBe(10)
      expect(summary?.avgResponseTime).toBe(55)
      expect(summary?.minResponseTime).toBe(10)
      expect(summary?.maxResponseTime).toBe(100)
      expect(summary?.p50).toBe(50) // 50th percentile of 10 values is 5th value
      expect(summary?.p95).toBe(100)
      expect(summary?.p99).toBe(100)
    })

    it('should track error rates', () => {
      // Record some successful requests
      for (let i = 0; i < 8; i++) {
        monitor.record({
          endpoint: '/api/documents',
          method: 'POST',
          responseTime: 50,
          statusCode: 201,
          timestamp: new Date()
        })
      }

      // Record some errors
      for (let i = 0; i < 2; i++) {
        monitor.record({
          endpoint: '/api/documents',
          method: 'POST',
          responseTime: 10,
          statusCode: 400,
          timestamp: new Date(),
          error: 'Bad Request'
        })
      }

      const summary = monitor.getSummary('/api/documents', 'POST')
      expect(summary?.count).toBe(10)
      expect(summary?.errorRate).toBe(20)
      expect(summary?.successRate).toBe(80)
    })
  })

  describe('SLA Checking', () => {
    it('should pass SLA when performance is good', () => {
      // Record fast requests
      for (let i = 0; i < 100; i++) {
        monitor.record({
          endpoint: '/api/documents',
          method: 'GET',
          responseTime: Math.random() * 30, // 0-30ms
          statusCode: 200,
          timestamp: new Date()
        })
      }

      const passingSLA = monitor.checkSLA(DEFAULT_SLAS.read)
      expect(passingSLA).toBe(true)
    })

    it('should fail SLA when performance is poor', () => {
      // Record slow requests
      for (let i = 0; i < 100; i++) {
        monitor.record({
          endpoint: '/api/documents',
          method: 'GET',
          responseTime: 100 + Math.random() * 200, // 100-300ms
          statusCode: 200,
          timestamp: new Date()
        })
      }

      const passingSLA = monitor.checkSLA(DEFAULT_SLAS.read)
      expect(passingSLA).toBe(false)
    })
  })

  describe('Slow Request Detection', () => {
    it('should identify slow requests', () => {
      // Mix of fast and slow requests
      const requests = [
        { time: 20, endpoint: '/api/fast' },
        { time: 150, endpoint: '/api/slow1' },
        { time: 30, endpoint: '/api/fast' },
        { time: 200, endpoint: '/api/slow2' },
        { time: 300, endpoint: '/api/very-slow' }
      ]

      requests.forEach(req => {
        monitor.record({
          endpoint: req.endpoint,
          method: 'GET',
          responseTime: req.time,
          statusCode: 200,
          timestamp: new Date()
        })
      })

      const slowRequests = monitor.getSlowRequests(100)
      expect(slowRequests).toHaveLength(3)
      expect(slowRequests[0].responseTime).toBe(300)
      expect(slowRequests[0].endpoint).toBe('/api/very-slow')
    })
  })

  describe('Error Tracking', () => {
    it('should track error requests', () => {
      const now = new Date()
      
      monitor.record({
        endpoint: '/api/documents',
        method: 'POST',
        responseTime: 50,
        statusCode: 400,
        timestamp: new Date(now.getTime() - 1000),
        error: 'Bad Request'
      })

      monitor.record({
        endpoint: '/api/documents/123',
        method: 'GET',
        responseTime: 30,
        statusCode: 404,
        timestamp: now,
        error: 'Not Found'
      })

      const errors = monitor.getErrorRequests()
      expect(errors).toHaveLength(2)
      expect(errors[0].statusCode).toBe(404) // Most recent first
      expect(errors[0].error).toBe('Not Found')
    })
  })

  describe('Memory Management', () => {
    it('should limit stored metrics to prevent memory issues', () => {
      // Record more than maxMetrics (10000)
      for (let i = 0; i < 11000; i++) {
        monitor.record({
          endpoint: '/api/documents',
          method: 'GET',
          responseTime: 50,
          statusCode: 200,
          timestamp: new Date()
        })
      }

      const exported = monitor.export()
      expect(exported.length).toBe(10000) // Should keep only last 10k
    })
  })

  describe('Report Generation', () => {
    it('should generate a comprehensive performance report', () => {
      // Add various metrics
      for (let i = 0; i < 50; i++) {
        monitor.record({
          endpoint: '/api/documents',
          method: 'GET',
          responseTime: 20 + Math.random() * 30,
          statusCode: 200,
          timestamp: new Date()
        })
      }

      for (let i = 0; i < 20; i++) {
        monitor.record({
          endpoint: '/api/documents',
          method: 'POST',
          responseTime: 50 + Math.random() * 50,
          statusCode: 201,
          timestamp: new Date()
        })
      }

      // Add some slow requests
      monitor.record({
        endpoint: '/api/documents',
        method: 'GET',
        responseTime: 250,
        statusCode: 200,
        timestamp: new Date()
      })

      // Add some errors
      monitor.record({
        endpoint: '/api/documents/999',
        method: 'GET',
        responseTime: 10,
        statusCode: 404,
        timestamp: new Date(),
        error: 'Document not found'
      })

      const report = generatePerformanceReport(monitor)
      
      expect(report).toContain('# API Performance Report')
      expect(report).toContain('## Summary by Endpoint')
      expect(report).toContain('/api/documents')
      expect(report).toContain('## Slow Requests')
      expect(report).toContain('## Recent Errors')
      expect(report).toContain('404')
    })
  })

  describe('Import/Export', () => {
    it('should export and import metrics', () => {
      // Record some metrics
      for (let i = 0; i < 5; i++) {
        monitor.record({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 50,
          statusCode: 200,
          timestamp: new Date()
        })
      }

      // Export metrics
      const exported = monitor.export()
      expect(exported).toHaveLength(5)

      // Clear and verify empty
      monitor.clear()
      expect(monitor.getSummary('/api/test')).toBeNull()

      // Import back
      monitor.import(exported)
      const summary = monitor.getSummary('/api/test')
      expect(summary?.count).toBe(5)
    })
  })
})