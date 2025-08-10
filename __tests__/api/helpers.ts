/**
 * API Test Utilities and Helpers
 * 
 * Centralized utilities for API testing including authentication mocks,
 * database mocking, request builders, and common test patterns.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client for testing
export const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  upsert: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  neq: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  or: jest.fn(() => mockSupabase),
  and: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  gt: jest.fn(() => mockSupabase),
  lt: jest.fn(() => mockSupabase),
  like: jest.fn(() => mockSupabase),
  ilike: jest.fn(() => mockSupabase),
  filter: jest.fn(() => mockSupabase),
  match: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  rpc: jest.fn(() => mockSupabase)
}

// Mock user profiles for different roles
export const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin',
    organization_id: 'org-1'
  },
  manager: {
    id: 'manager-1',
    email: 'manager@example.com',
    full_name: 'Site Manager',
    role: 'site_manager',
    organization_id: 'org-1'
  },
  worker: {
    id: 'worker-1',
    email: 'worker@example.com',
    full_name: 'Construction Worker',
    role: 'worker',
    organization_id: 'org-1'
  },
  customer: {
    id: 'customer-1',
    email: 'customer@example.com',
    full_name: 'Customer User',
    role: 'customer_manager',
    organization_id: 'org-2'
  }
}

// Mock sites data
export const mockSites = {
  site1: {
    id: 'site-1',
    name: 'Construction Site A',
    location: 'Seoul, Korea',
    organization_id: 'org-1',
    is_active: true
  },
  site2: {
    id: 'site-2',
    name: 'Construction Site B',
    location: 'Busan, Korea',
    organization_id: 'org-1',
    is_active: true
  }
}

// Mock daily reports
export const mockDailyReports = {
  report1: {
    id: 'report-1',
    site_id: 'site-1',
    report_date: '2024-01-15',
    weather: 'sunny',
    work_summary: 'Foundation work completed',
    created_by: 'manager-1',
    organization_id: 'org-1'
  }
}

// Mock attendance records with labor hours
export const mockAttendanceRecords = {
  fullDay: {
    id: 'att-1',
    user_id: 'worker-1',
    site_id: 'site-1',
    attendance_date: '2024-01-15',
    check_in_time: '09:00:00',
    check_out_time: '18:00:00',
    work_hours: 8,
    labor_hours: 1.0,
    overtime_hours: 0,
    status: 'present'
  },
  overtime: {
    id: 'att-2',
    user_id: 'worker-1',
    site_id: 'site-1',
    attendance_date: '2024-01-16',
    check_in_time: '08:00:00',
    check_out_time: '19:00:00',
    work_hours: 10,
    labor_hours: 1.25,
    overtime_hours: 2,
    status: 'present'
  },
  partialDay: {
    id: 'att-3',
    user_id: 'worker-1',
    site_id: 'site-1',
    attendance_date: '2024-01-17',
    check_in_time: '09:00:00',
    check_out_time: '13:00:00',
    work_hours: 4,
    labor_hours: 0.5,
    overtime_hours: 0,
    status: 'present'
  }
}

/**
 * Authentication Mock Helpers
 */
export class AuthMockHelper {
  /**
   * Mock successful authentication for a specific user role
   */
  static mockAuthenticatedUser(userType: keyof typeof mockUsers = 'worker') {
    const user = mockUsers[userType]
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: user.id, email: user.email } },
      error: null
    })

    // Mock profile lookup
    mockSupabase.select.mockReturnValueOnce(mockSupabase)
    mockSupabase.eq.mockReturnValueOnce(mockSupabase)
    mockSupabase.single.mockResolvedValueOnce({
      data: user,
      error: null
    })

    return user
  }

  /**
   * Mock authentication failure
   */
  static mockUnauthenticatedUser() {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Unauthorized')
    })
  }

  /**
   * Mock invalid authentication token
   */
  static mockInvalidToken() {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid JWT token')
    })
  }

  /**
   * Mock profile not found (authenticated but no profile)
   */
  static mockProfileNotFound() {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'orphan-user', email: 'orphan@example.com' } },
      error: null
    })

    mockSupabase.select.mockReturnValueOnce(mockSupabase)
    mockSupabase.eq.mockReturnValueOnce(mockSupabase)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: null
    })
  }
}

/**
 * Database Mock Helper
 */
export class DatabaseMockHelper {
  /**
   * Mock successful database operation
   */
  static mockSuccessfulQuery(data: any = [], count?: number) {
    return {
      data,
      error: null,
      count
    }
  }

  /**
   * Mock database error
   */
  static mockDatabaseError(message = 'Database connection failed') {
    return {
      data: null,
      error: new Error(message),
      count: null
    }
  }

  /**
   * Mock empty result set
   */
  static mockEmptyResult() {
    return {
      data: [],
      error: null,
      count: 0
    }
  }

  /**
   * Mock analytics events data
   */
  static mockAnalyticsEvents() {
    return [
      {
        id: 'event-1',
        user_id: 'worker-1',
        organization_id: 'org-1',
        event_type: 'web_vitals',
        event_data: {
          metric: 'LCP',
          value: 2000,
          page: '/dashboard'
        },
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'event-2',
        user_id: 'manager-1',
        organization_id: 'org-1',
        event_type: 'user_interaction',
        event_data: {
          action: 'button_click',
          element: 'save-report',
          page: '/dashboard/reports'
        },
        created_at: '2024-01-15T11:00:00Z'
      }
    ]
  }

  /**
   * Mock Web Vitals data with ratings
   */
  static mockWebVitalsData() {
    return [
      {
        id: 'wv-1',
        metric: 'LCP',
        value: 1800,
        rating: 'good',
        page: '/dashboard',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'wv-2',
        metric: 'INP',
        value: 150,
        rating: 'good',
        page: '/dashboard',
        created_at: '2024-01-15T10:01:00Z'
      },
      {
        id: 'wv-3',
        metric: 'CLS',
        value: 0.08,
        rating: 'good',
        page: '/dashboard',
        created_at: '2024-01-15T10:02:00Z'
      }
    ]
  }
}

/**
 * Request Builder Helper
 */
export class RequestBuilder {
  private url: string
  private method: string = 'GET'
  private headers: Record<string, string> = {}
  private body?: string

  constructor(url: string) {
    this.url = url
  }

  /**
   * Set HTTP method
   */
  setMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') {
    this.method = method
    return this
  }

  /**
   * Add authentication header
   */
  withAuth(token = 'valid-jwt-token') {
    this.headers['authorization'] = `Bearer ${token}`
    return this
  }

  /**
   * Add JSON body
   */
  withJsonBody(data: any) {
    this.headers['content-type'] = 'application/json'
    this.body = JSON.stringify(data)
    return this
  }

  /**
   * Add custom header
   */
  withHeader(key: string, value: string) {
    this.headers[key] = value
    return this
  }

  /**
   * Add multiple headers
   */
  withHeaders(headers: Record<string, string>) {
    this.headers = { ...this.headers, ...headers }
    return this
  }

  /**
   * Build NextRequest object
   */
  build(): NextRequest {
    const options: RequestInit = {
      method: this.method,
      headers: this.headers
    }

    if (this.body) {
      options.body = this.body
      // Automatically set content-length for better testing
      this.headers['content-length'] = this.body.length.toString()
    }

    return new NextRequest(this.url, options)
  }

  /**
   * Create a GET request
   */
  static get(url: string): RequestBuilder {
    return new RequestBuilder(url).setMethod('GET')
  }

  /**
   * Create a POST request
   */
  static post(url: string): RequestBuilder {
    return new RequestBuilder(url).setMethod('POST')
  }

  /**
   * Create a PUT request
   */
  static put(url: string): RequestBuilder {
    return new RequestBuilder(url).setMethod('PUT')
  }

  /**
   * Create a DELETE request
   */
  static delete(url: string): RequestBuilder {
    return new RequestBuilder(url).setMethod('DELETE')
  }
}

/**
 * Response Assertion Helpers
 */
export class ResponseAssertions {
  /**
   * Assert successful response
   */
  static assertSuccess(response: Response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus)
    expect(response.ok).toBe(true)
  }

  /**
   * Assert error response
   */
  static assertError(response: Response, expectedStatus: number, expectedError?: string) {
    expect(response.status).toBe(expectedStatus)
    expect(response.ok).toBe(false)
    
    if (expectedError) {
      return response.json().then(json => {
        expect(json.error).toBe(expectedError)
        return json
      })
    }
  }

  /**
   * Assert response has required fields
   */
  static assertHasFields(data: any, fields: string[]) {
    fields.forEach(field => {
      expect(data).toHaveProperty(field)
    })
  }

  /**
   * Assert response structure for paginated results
   */
  static assertPaginatedResponse(data: any) {
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('pages')
    expect(Array.isArray(data.data)).toBe(true)
    expect(typeof data.total).toBe('number')
    expect(typeof data.pages).toBe('number')
  }

  /**
   * Assert Web Vitals metric structure
   */
  static assertWebVitalsMetric(metric: any) {
    expect(metric).toHaveProperty('metric')
    expect(metric).toHaveProperty('value')
    expect(metric).toHaveProperty('rating')
    expect(['good', 'needs_improvement', 'poor']).toContain(metric.rating)
  }

  /**
   * Assert attendance record structure
   */
  static assertAttendanceRecord(record: any) {
    expect(record).toHaveProperty('id')
    expect(record).toHaveProperty('user_id')
    expect(record).toHaveProperty('site_id')
    expect(record).toHaveProperty('attendance_date')
    expect(record).toHaveProperty('labor_hours')
    expect(typeof record.labor_hours).toBe('number')
  }
}

/**
 * Test Data Generators
 */
export class TestDataGenerator {
  /**
   * Generate analytics event data
   */
  static generateAnalyticsEvent(overrides: Partial<any> = {}) {
    return {
      type: 'web_vitals',
      metric: 'LCP',
      value: 2000,
      page: '/dashboard',
      user_agent: 'Mozilla/5.0...',
      timestamp: new Date().toISOString(),
      ...overrides
    }
  }

  /**
   * Generate attendance data
   */
  static generateAttendanceData(overrides: Partial<any> = {}) {
    return {
      site_id: 'site-1',
      user_id: 'worker-1',
      check_in_time: '09:00:00',
      check_out_time: '18:00:00',
      work_hours: 8,
      labor_hours: 1.0,
      overtime_hours: 0,
      status: 'present',
      ...overrides
    }
  }

  /**
   * Generate salary calculation data
   */
  static generateSalaryData(overrides: Partial<any> = {}) {
    return {
      worker_id: 'worker-1',
      site_id: 'site-1',
      work_date: '2024-01-15',
      regular_hours: 8,
      overtime_hours: 0,
      base_pay: 120000,
      overtime_pay: 0,
      total_pay: 120000,
      status: 'calculated',
      ...overrides
    }
  }

  /**
   * Generate daily report data
   */
  static generateDailyReportData(overrides: Partial<any> = {}) {
    return {
      site_id: 'site-1',
      report_date: '2024-01-15',
      weather: 'sunny',
      work_summary: 'Foundation work in progress',
      safety_notes: 'No incidents reported',
      created_by: 'manager-1',
      ...overrides
    }
  }
}

/**
 * Performance Test Helpers
 */
export class PerformanceTestHelper {
  /**
   * Measure response time
   */
  static async measureResponseTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now()
    const result = await operation()
    const endTime = performance.now()
    
    return {
      result,
      duration: endTime - startTime
    }
  }

  /**
   * Assert response time is within limits
   */
  static assertResponseTime(duration: number, maxMs: number) {
    expect(duration).toBeLessThan(maxMs)
  }

  /**
   * Run concurrent requests test
   */
  static async runConcurrentTest<T>(
    operation: () => Promise<T>,
    concurrency: number = 5
  ): Promise<{ results: T[]; totalDuration: number; avgDuration: number }> {
    const startTime = performance.now()
    
    const promises = Array.from({ length: concurrency }, () => operation())
    const results = await Promise.all(promises)
    
    const endTime = performance.now()
    const totalDuration = endTime - startTime
    const avgDuration = totalDuration / concurrency

    return {
      results,
      totalDuration,
      avgDuration
    }
  }
}

/**
 * Setup and teardown helpers
 */
export class TestSetupHelper {
  /**
   * Setup common mocks for API tests
   */
  static setupApiTestMocks() {
    // Mock createClient
    const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
    mockCreateClient.mockReturnValue(mockSupabase as any)

    // Mock revalidatePath
    jest.mock('next/cache', () => ({
      revalidatePath: jest.fn()
    }))

    // Mock API monitoring
    jest.mock('@/lib/monitoring/api-monitoring', () => ({
      withApiMonitoring: (handler: any) => handler
    }))

    return mockSupabase
  }

  /**
   * Clear all mocks
   */
  static clearAllMocks() {
    jest.clearAllMocks()
    Object.values(mockSupabase).forEach(mockFn => {
      if (typeof mockFn === 'function') {
        (mockFn as jest.Mock).mockClear?.()
      }
    })
  }

  /**
   * Setup fake timers for time-based tests
   */
  static setupFakeTimers(systemTime = '2024-01-15T09:00:00Z') {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(systemTime))
  }

  /**
   * Restore real timers
   */
  static restoreTimers() {
    jest.useRealTimers()
  }
}

/**
 * Validation Helpers
 */
export class ValidationHelper {
  /**
   * Validate Korean labor hours calculation
   */
  static validateLaborHours(laborHours: number, expectedActualHours: number, expectedOvertimeHours: number) {
    expect(laborHours * 8).toBe(expectedActualHours)
    expect(Math.max(0, expectedActualHours - 8)).toBe(expectedOvertimeHours)
  }

  /**
   * Validate salary calculation
   */
  static validateSalaryCalculation(
    regularHours: number,
    overtimeHours: number,
    hourlyRate: number,
    overtimeRate: number,
    expectedTotal: number
  ) {
    const regularPay = regularHours * hourlyRate
    const overtimePay = overtimeHours * overtimeRate
    const total = regularPay + overtimePay
    
    expect(total).toBe(expectedTotal)
  }

  /**
   * Validate date format
   */
  static validateDateFormat(dateString: string, format = 'YYYY-MM-DD') {
    if (format === 'YYYY-MM-DD') {
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    } else if (format === 'ISO') {
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    }
  }
}

// Export commonly used mock data
export const commonMockData = {
  users: mockUsers,
  sites: mockSites,
  dailyReports: mockDailyReports,
  attendanceRecords: mockAttendanceRecords
}

// Export singleton instance of the mock Supabase client
export default mockSupabase