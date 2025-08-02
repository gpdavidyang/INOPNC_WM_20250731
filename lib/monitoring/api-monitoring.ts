import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { performanceTracker } from './performance-metrics'
import { checkPerformanceBudget } from './performance-budgets'

// Wrapper for API route handlers with performance monitoring
export function withApiMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>,
  options?: {
    name?: string
    trackPerformance?: boolean
  }
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest
    const routeName = options?.name || request.url
    
    // Start Sentry transaction
    const transaction = Sentry.startTransaction({
      name: `API: ${routeName}`,
      op: 'http.server',
      tags: {
        'http.method': request.method,
        'http.url': request.url,
      },
    })
    
    // Set transaction on scope
    Sentry.getCurrentScope().setSpan(transaction)
    
    const startTime = performance.now()
    
    try {
      // Execute the handler
      const response = await handler(...args)
      const duration = performance.now() - startTime
      
      // Set transaction data
      transaction.setHttpStatus(response.status)
      transaction.setMeasurement('http.response_time', duration, 'millisecond')
      
      // Track performance metrics
      if (options?.trackPerformance !== false) {
        performanceTracker.trackApiCall(routeName, async () => response)
      }

      // Check API performance budget
      const alert = checkPerformanceBudget('api_response_time', duration, {
        endpoint: routeName,
        method: request.method,
        status: response.status,
        timestamp: new Date().toISOString(),
      })

      if (alert) {
        console.warn(`API performance budget violation:`, alert)
      }
      
      // Add performance headers
      const headers = new Headers(response.headers)
      headers.set('X-Response-Time', `${duration}ms`)
      headers.set('X-Transaction-Id', transaction.spanId)
      
      // Log slow API calls
      if (duration > 1000) {
        Sentry.captureMessage(
          `Slow API response: ${routeName} took ${duration}ms`,
          'warning'
        )
      }
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      // Capture error in Sentry
      Sentry.captureException(error, {
        tags: {
          api_route: routeName,
        },
      })
      
      transaction.setStatus('internal_error')
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'Internal server error',
          transactionId: transaction.spanId,
        },
        { status: 500 }
      )
    } finally {
      transaction.finish()
    }
  }
}

// Middleware for database query monitoring
export async function withDatabaseMonitoring<T>(
  queryName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  const span = Sentry.getCurrentScope().getSpan()?.startChild({
    op: 'db.query',
    description: queryName,
  })
  
  try {
    const result = await fn()
    const duration = performance.now() - startTime
    
    // Track database performance
    performanceTracker.trackDatabaseQuery(queryName, duration)
    
    if (span) {
      span.setData('db.duration', duration)
      span.setStatus('ok')
    }
    
    return result
  } catch (error) {
    if (span) {
      span.setStatus('internal_error')
    }
    throw error
  } finally {
    span?.finish()
  }
}

// Helper to track specific API operations
export const apiMetrics = {
  // Track daily report operations
  trackDailyReportLoad: (duration: number) => {
    performanceTracker.trackDailyReportOperation('load', duration)
  },
  
  trackDailyReportSave: (duration: number) => {
    performanceTracker.trackDailyReportOperation('save', duration)
  },
  
  trackDailyReportSubmit: (duration: number) => {
    performanceTracker.trackDailyReportOperation('submit', duration)
  },
  
  // Track image operations
  trackImageUpload: (fileSize: number, duration: number) => {
    performanceTracker.trackImageUpload(fileSize, duration)
  },
  
  // Track offline sync
  trackOfflineSync: (itemCount: number, duration: number) => {
    performanceTracker.trackOfflineSync(itemCount, duration)
  },
}

// Example usage in an API route:
/*
export const GET = withApiMonitoring(
  async (request: NextRequest) => {
    // Query database with monitoring
    const data = await withDatabaseMonitoring('get_daily_reports', async () => {
      return await supabase
        .from('daily_reports')
        .select('*')
        .order('created_at', { ascending: false })
    })
    
    return NextResponse.json({ data })
  },
  { name: 'getDailyReports' }
)
*/