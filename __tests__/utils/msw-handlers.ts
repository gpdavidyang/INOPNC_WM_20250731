/**
 * MSW (Mock Service Worker) handlers for API mocking
 * Provides consistent API response mocking for all tests
 */

import { http, HttpResponse } from 'msw'
import { createMockProfile, createMockWorkLog, createMockSite, createMockDailyReport, createMockAttendanceRecord } from './test-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'

export const handlers = [
  // Authentication endpoints
  http.post(`${API_BASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          phone: '+1234567890',
          role: 'worker',
        },
      },
    })
  }),

  http.get(`${API_BASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'test-user-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        phone: '+1234567890',
        role: 'worker',
      },
    })
  }),

  // Profiles endpoint
  http.get(`${API_BASE_URL}/rest/v1/profiles`, ({ request }) => {
    const url = new URL(request.url)
    const select = url.searchParams.get('select')
    
    // Handle different select queries
    if (select?.includes('id,full_name,role')) {
      return HttpResponse.json([
        createMockProfile({ id: 'test-user-123', full_name: 'Test User', role: 'worker' })
      ])
    }
    
    return HttpResponse.json([createMockProfile()])
  }),

  http.get(`${API_BASE_URL}/rest/v1/profiles`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('id')
    
    if (userId === 'eq.test-user-123') {
      return HttpResponse.json([createMockProfile()])
    }
    
    return HttpResponse.json([])
  }),

  // Sites endpoint
  http.get(`${API_BASE_URL}/rest/v1/sites`, () => {
    return HttpResponse.json([
      createMockSite({ id: 'site-1', name: '강남 A현장' }),
      createMockSite({ id: 'site-2', name: '서초 B현장' }),
    ])
  }),

  // Work logs endpoint
  http.get(`${API_BASE_URL}/rest/v1/work_logs`, () => {
    return HttpResponse.json([
      createMockWorkLog({ id: 'log-1', site_name: '강남 A현장' }),
      createMockWorkLog({ id: 'log-2', site_name: '서초 B현장' }),
    ])
  }),

  http.post(`${API_BASE_URL}/rest/v1/work_logs`, async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json(
      createMockWorkLog({ ...body, id: 'new-log-123' }),
      { status: 201 }
    )
  }),

  // Daily reports endpoint
  http.get(`${API_BASE_URL}/rest/v1/daily_reports`, () => {
    return HttpResponse.json([
      createMockDailyReport({ id: 'report-1' }),
      createMockDailyReport({ id: 'report-2' }),
    ])
  }),

  http.post(`${API_BASE_URL}/rest/v1/daily_reports`, async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json(
      createMockDailyReport({ ...body, id: 'new-report-123' }),
      { status: 201 }
    )
  }),

  // Attendance records endpoint
  http.get(`${API_BASE_URL}/rest/v1/attendance_records`, () => {
    return HttpResponse.json([
      createMockAttendanceRecord({ id: 'attendance-1' }),
      createMockAttendanceRecord({ id: 'attendance-2' }),
    ])
  }),

  // Notifications endpoint
  http.get(`${API_BASE_URL}/rest/v1/notifications`, () => {
    return HttpResponse.json([
      {
        id: 'notification-1',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        read: false,
        created_at: '2024-08-01T08:00:00Z',
      },
    ])
  }),

  // Health check endpoints
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
  }),

  http.get('/api/health/ready', () => {
    return HttpResponse.json({ 
      status: 'ready', 
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString() 
    })
  }),

  // Feature flags endpoint
  http.get('/api/feature-flags', () => {
    return HttpResponse.json({
      new_dashboard_ui: true,
      enhanced_analytics: false,
      beta_markup_tools: true,
    })
  }),

  // Error handlers for testing error states
  http.get(`${API_BASE_URL}/rest/v1/error-test`, () => {
    return HttpResponse.json(
      { error: 'Test error', message: 'This is a test error' },
      { status: 500 }
    )
  }),

  // Network timeout simulation
  http.get(`${API_BASE_URL}/rest/v1/timeout-test`, () => {
    return new Promise(() => {
      // Never resolve to simulate timeout
    })
  }),
]

// Handlers for specific test scenarios
export const errorHandlers = [
  http.get(`${API_BASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }),
]

export const emptyHandlers = [
  http.get(`${API_BASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([])
  }),
  
  http.get(`${API_BASE_URL}/rest/v1/sites`, () => {
    return HttpResponse.json([])
  }),
  
  http.get(`${API_BASE_URL}/rest/v1/work_logs`, () => {
    return HttpResponse.json([])
  }),
]

export const slowHandlers = [
  http.get(`${API_BASE_URL}/rest/v1/profiles`, async () => {
    // Simulate slow response
    await new Promise(resolve => setTimeout(resolve, 2000))
    return HttpResponse.json([createMockProfile()])
  }),
]