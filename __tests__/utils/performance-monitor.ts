/**
 * Performance Monitoring Utility
 * 
 * Tracks API performance metrics and helps identify bottlenecks
 */

interface PerformanceMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: Date
  error?: string
}

interface PerformanceSummary {
  endpoint: string
  method: string
  count: number
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50: number
  p95: number
  p99: number
  errorRate: number
  successRate: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics: number = 10000 // Keep last 10k metrics

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetrics) {
    this.metrics.push(metric)
    
    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Get performance summary for a specific endpoint
   */
  getSummary(endpoint: string, method?: string): PerformanceSummary | null {
    const filtered = this.metrics.filter(m => 
      m.endpoint === endpoint && (!method || m.method === method)
    )

    if (filtered.length === 0) return null

    const responseTimes = filtered
      .filter(m => m.statusCode < 500) // Exclude server errors
      .map(m => m.responseTime)
      .sort((a, b) => a - b)

    const errorCount = filtered.filter(m => m.statusCode >= 400).length
    
    return {
      endpoint,
      method: method || 'ALL',
      count: filtered.length,
      avgResponseTime: this.average(responseTimes),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p50: this.percentile(responseTimes, 0.5),
      p95: this.percentile(responseTimes, 0.95),
      p99: this.percentile(responseTimes, 0.99),
      errorRate: (errorCount / filtered.length) * 100,
      successRate: ((filtered.length - errorCount) / filtered.length) * 100
    }
  }

  /**
   * Get all summaries
   */
  getAllSummaries(): PerformanceSummary[] {
    const endpoints = new Set(this.metrics.map(m => `${m.method}:${m.endpoint}`))
    const summaries: PerformanceSummary[] = []

    endpoints.forEach(key => {
      const [method, endpoint] = key.split(':')
      const summary = this.getSummary(endpoint, method)
      if (summary) summaries.push(summary)
    })

    return summaries
  }

  /**
   * Check if performance is within SLA
   */
  checkSLA(sla: { p50: number; p95: number; p99: number }): boolean {
    const summaries = this.getAllSummaries()
    
    for (const summary of summaries) {
      if (summary.p50 > sla.p50 || 
          summary.p95 > sla.p95 || 
          summary.p99 > sla.p99) {
        return false
      }
    }
    
    return true
  }

  /**
   * Get slow requests
   */
  getSlowRequests(threshold: number = 100): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.responseTime > threshold)
      .sort((a, b) => b.responseTime - a.responseTime)
  }

  /**
   * Get error requests
   */
  getErrorRequests(): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.statusCode >= 400)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
  }

  /**
   * Export metrics for analysis
   */
  export(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Import metrics
   */
  import(metrics: PerformanceMetrics[]) {
    this.metrics = metrics
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[Math.max(0, index)]
  }
}

/**
 * Performance middleware for Next.js API routes
 */
export function withPerformanceMonitoring<T extends Function>(
  handler: T,
  monitor: PerformanceMonitor,
  endpoint: string
): T {
  return (async (req: any, ...args: any[]) => {
    const startTime = Date.now()
    const method = req.method || 'GET'
    
    try {
      const response = await handler(req, ...args)
      const responseTime = Date.now() - startTime
      
      monitor.record({
        endpoint,
        method,
        responseTime,
        statusCode: response.status || 200,
        timestamp: new Date()
      })
      
      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      monitor.record({
        endpoint,
        method,
        responseTime,
        statusCode: 500,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw error
    }
  }) as any
}

/**
 * Create a performance report
 */
export function generatePerformanceReport(monitor: PerformanceMonitor): string {
  const summaries = monitor.getAllSummaries()
  const slowRequests = monitor.getSlowRequests()
  const errorRequests = monitor.getErrorRequests()
  
  let report = '# API Performance Report\n\n'
  
  report += '## Summary by Endpoint\n\n'
  report += '| Endpoint | Method | Count | Avg (ms) | P50 | P95 | P99 | Success Rate |\n'
  report += '|----------|--------|-------|----------|-----|-----|-----|-------------|\n'
  
  summaries.forEach(summary => {
    report += `| ${summary.endpoint} | ${summary.method} | ${summary.count} | `
    report += `${summary.avgResponseTime.toFixed(2)} | ${summary.p50} | `
    report += `${summary.p95} | ${summary.p99} | ${summary.successRate.toFixed(1)}% |\n`
  })
  
  if (slowRequests.length > 0) {
    report += '\n## Slow Requests (>100ms)\n\n'
    report += '| Timestamp | Endpoint | Method | Response Time (ms) |\n'
    report += '|-----------|----------|--------|-------------------|\n'
    
    slowRequests.slice(0, 10).forEach(req => {
      report += `| ${req.timestamp.toISOString()} | ${req.endpoint} | `
      report += `${req.method} | ${req.responseTime} |\n`
    })
  }
  
  if (errorRequests.length > 0) {
    report += '\n## Recent Errors\n\n'
    report += '| Timestamp | Endpoint | Method | Status | Error |\n'
    report += '|-----------|----------|--------|--------|-------|\n'
    
    errorRequests.slice(0, 10).forEach(req => {
      report += `| ${req.timestamp.toISOString()} | ${req.endpoint} | `
      report += `${req.method} | ${req.statusCode} | ${req.error || 'N/A'} |\n`
    })
  }
  
  return report
}

// Default SLAs for different operation types
export const DEFAULT_SLAS = {
  read: { p50: 50, p95: 100, p99: 200 },
  write: { p50: 100, p95: 200, p99: 400 },
  search: { p50: 75, p95: 150, p99: 300 }
}