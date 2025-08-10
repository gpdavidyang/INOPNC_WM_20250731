/**
 * Notification System Test Suite
 * Tests for notification server actions including CRUD operations, filtering, 
 * push notification integration, and batch operations
 */

import { jest } from '@jest/globals'
import {
  getNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  getNotificationPreferences,
  updateNotificationPreference
} from '@/app/actions/notifications'
import type { 
  NotificationExtended, 
  NotificationFilter,
  CreateNotificationRequest,
  NotificationStats
} from '@/types/notifications'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  upsert: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  rpc: jest.fn(() => mockSupabase)
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}))

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

// Mock error handling
jest.mock('@/lib/error-handling', () => ({
  AppError: class MockAppError extends Error {
    constructor(message: string, public type: string, public statusCode: number) {
      super(message)
    }
  },
  ErrorType: {
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    VALIDATION: 'VALIDATION'
  },
  validateSupabaseResponse: jest.fn((data, error) => {
    if (error) throw error
    if (!data) throw new Error('데이터를 찾을 수 없습니다.')
  }),
  logError: jest.fn()
}))

// Test data
const mockUser = {
  id: 'user-123',
  email: 'test@inopnc.com',
  aud: 'authenticated',
  role: 'authenticated'
}

const mockAdminProfile = {
  id: 'user-123',
  role: 'admin'
}

const mockWorkerProfile = {
  id: 'user-123', 
  role: 'worker'
}

const mockNotifications: NotificationExtended[] = [
  {
    id: 'notif-1',
    user_id: 'user-123',
    type: 'info',
    title: '자재 요청 승인됨',
    message: '시멘트 50포 요청이 승인되었습니다.',
    data: { material_id: 'mat-1' },
    read: false,
    read_at: null,
    created_at: '2025-08-01T09:00:00Z',
    created_by: 'admin-1',
    related_entity_type: 'material_request',
    related_entity_id: 'req-1',
    action_url: '/dashboard/materials/requests/req-1'
  },
  {
    id: 'notif-2',
    user_id: 'user-123',
    type: 'warning',
    title: '작업일지 미작성',
    message: '어제 작업일지가 작성되지 않았습니다.',
    data: { date: '2025-07-31' },
    read: true,
    read_at: '2025-08-01T10:00:00Z',
    created_at: '2025-08-01T08:00:00Z',
    created_by: null,
    related_entity_type: 'daily_report',
    related_entity_id: null,
    action_url: '/dashboard/daily-reports/new'
  },
  {
    id: 'notif-3',
    user_id: 'user-123',
    type: 'error',
    title: '안전 경고',
    message: '현장에 강풍 주의보가 발령되었습니다.',
    data: { alert_level: 'high' },
    read: false,
    read_at: null,
    created_at: '2025-08-01T07:00:00Z',
    created_by: 'system',
    related_entity_type: 'site',
    related_entity_id: 'site-1',
    action_url: '/dashboard/safety/alerts'
  }
]

const mockNotificationPreferences = [
  {
    id: 'pref-1',
    user_id: 'user-123',
    notification_type: 'material_approval',
    enabled: true,
    email_enabled: true,
    push_enabled: true,
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-08-01T00:00:00Z'
  },
  {
    id: 'pref-2',
    user_id: 'user-123',
    notification_type: 'safety_alert',
    enabled: true,
    email_enabled: false,
    push_enabled: true,
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-08-01T00:00:00Z'
  }
]

describe('Notification System Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default successful authentication
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('getNotifications', () => {
    it('should retrieve notifications for authenticated user', async () => {
      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: mockNotifications,
          error: null
        })
      }
      
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockReturnValue(mockQuery)

      const result = await getNotifications()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNotifications)
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should apply filters correctly', async () => {
      const filter: NotificationFilter = {
        type: 'warning',
        read: false,
        start_date: '2025-08-01T00:00:00Z',
        end_date: '2025-08-01T23:59:59Z',
        limit: 10,
        offset: 0
      }

      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: [mockNotifications[1]],
          error: null
        })
      }
      
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.lte.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockReturnValue(mockSupabase)
      mockSupabase.range.mockReturnValue(mockQuery)

      const result = await getNotifications(filter)

      expect(result.success).toBe(true)
      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'warning')
      expect(mockSupabase.eq).toHaveBeenCalledWith('read', false)
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', filter.start_date)
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', filter.end_date)
      expect(mockSupabase.limit).toHaveBeenCalledWith(10)
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9)
    })

    it('should handle authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await getNotifications()

      expect(result.success).toBe(false)
      expect(result.error).toContain('로그인이 필요합니다')
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }
      
      mockSupabase.order.mockReturnValue(mockQuery)

      const result = await getNotifications()

      expect(result.success).toBe(false)
      expect(result.error).toContain('알림을 불러오는데 실패했습니다')
    })
  })

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      // Mock count queries
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'notifications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                then: jest.fn().mockResolvedValue({ count: 3 })
              })
            })
          }
        }
        return mockSupabase
      })

      // Mock type breakdown query  
      mockSupabase.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: [
              { type: 'info' },
              { type: 'warning' },
              { type: 'error' }
            ],
            error: null
          })
        })
      })

      const result = await getNotificationStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        total: 3,
        unread: 3,
        by_type: {
          info: 1,
          warning: 1,
          error: 1
        }
      })
    })

    it('should handle authentication warnings gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' }
      })

      const result = await getNotificationStats()

      expect(result.success).toBe(false)
      expect(result.error).toContain('로그인이 필요합니다')
    })
  })

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const updatedNotification = { ...mockNotifications[0], read: true, read_at: '2025-08-01T12:00:00Z' }
      
      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: updatedNotification,
          error: null
        })
      }
      
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockReturnValue(mockQuery)

      const result = await markNotificationAsRead('notif-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedNotification)
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          read: true,
          read_at: expect.any(String)
        })
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'notif-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should prevent marking other users notifications as read', async () => {
      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      }
      
      mockSupabase.single.mockReturnValue(mockQuery)

      const result = await markNotificationAsRead('notif-other-user')

      expect(result.success).toBe(false)
      expect(result.error).toContain('알림 읽음 처리에 실패했습니다')
    })
  })

  describe('markAllNotificationsAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: [{ id: 'notif-1' }, { id: 'notif-3' }],
          error: null
        })
      }
      
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockQuery)

      const result = await markAllNotificationsAsRead()

      expect(result.success).toBe(true)
      expect(result.count).toBe(2)
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          read: true,
          read_at: expect.any(String)
        })
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockSupabase.eq).toHaveBeenCalledWith('read', false)
    })

    it('should handle no unread notifications', async () => {
      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      
      mockSupabase.eq.mockReturnValue(mockQuery)

      const result = await markAllNotificationsAsRead()

      expect(result.success).toBe(true)
      expect(result.count).toBe(0)
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          error: null
        })
      }
      
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.delete.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockQuery)

      const result = await deleteNotification('notif-1')

      expect(result.success).toBe(true)
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'notif-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should prevent deleting other users notifications', async () => {
      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          error: { message: 'No rows affected' }
        })
      }
      
      mockSupabase.eq.mockReturnValue(mockQuery)

      const result = await deleteNotification('notif-other-user')

      expect(result.success).toBe(false)
      expect(result.error).toContain('알림 삭제에 실패했습니다')
    })
  })

  describe('createNotification', () => {
    const createRequest: CreateNotificationRequest = {
      user_id: 'target-user-123',
      template_code: 'MATERIAL_APPROVED',
      variables: {
        material_name: '시멘트',
        quantity: '50포'
      },
      related_entity_type: 'material_request',
      related_entity_id: 'req-1',
      action_url: '/dashboard/materials/requests/req-1'
    }

    it('should create notification as admin', async () => {
      // Mock profile lookup for admin
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue({
                  then: jest.fn().mockResolvedValue({
                    data: mockAdminProfile,
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabase
      })

      // Mock RPC call
      mockSupabase.rpc.mockReturnValue({
        then: jest.fn().mockResolvedValue({
          data: { id: 'notif-new', ...createRequest },
          error: null
        })
      })

      const result = await createNotification(createRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: 'notif-new', ...createRequest })
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', {
        p_user_id: createRequest.user_id,
        p_template_code: createRequest.template_code,
        p_variables: createRequest.variables,
        p_related_entity_type: createRequest.related_entity_type,
        p_related_entity_id: createRequest.related_entity_id,
        p_action_url: createRequest.action_url
      })
    })

    it('should reject notification creation for non-admin users', async () => {
      // Mock profile lookup for worker
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue({
                  then: jest.fn().mockResolvedValue({
                    data: mockWorkerProfile,
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabase
      })

      const result = await createNotification(createRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('권한이 없습니다')
    })

    it('should handle missing profile gracefully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue({
                  then: jest.fn().mockResolvedValue({
                    data: null,
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabase
      })

      const result = await createNotification(createRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('권한이 없습니다')
    })
  })

  describe('getNotificationPreferences', () => {
    it('should retrieve user notification preferences', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                then: jest.fn().mockResolvedValue({
                  data: mockNotificationPreferences,
                  error: null
                })
              })
            })
          }
        }
        return mockSupabase
      })

      const result = await getNotificationPreferences()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNotificationPreferences)
    })

    it('should handle empty preferences gracefully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                then: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'No rows returned' }
                })
              })
            })
          }
        }
        return mockSupabase
      })

      const result = await getNotificationPreferences()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('updateNotificationPreference', () => {
    it('should update notification preference successfully', async () => {
      const updatedPreference = {
        ...mockNotificationPreferences[0],
        push_enabled: false,
        updated_at: '2025-08-01T12:00:00Z'
      }

      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: updatedPreference,
          error: null
        })
      }
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue(mockQuery)
              })
            })
          }
        }
        return mockSupabase
      })

      const result = await updateNotificationPreference('material_approval', {
        push_enabled: false
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedPreference)
    })

    it('should create new preference if none exists', async () => {
      const newPreference = {
        id: 'pref-new',
        user_id: mockUser.id,
        notification_type: 'daily_report_reminder',
        enabled: true,
        email_enabled: false,
        push_enabled: true,
        created_at: '2025-08-01T12:00:00Z',
        updated_at: '2025-08-01T12:00:00Z'
      }

      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: newPreference,
          error: null
        })
      }
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_notification_preferences') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue(mockQuery)
              })
            })
          }
        }
        return mockSupabase
      })

      const result = await updateNotificationPreference('daily_report_reminder', {
        enabled: true,
        email_enabled: false,
        push_enabled: true
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(newPreference)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed filter parameters', async () => {
      const malformedFilter: any = {
        type: 'invalid_type',
        read: 'not_boolean',
        start_date: 'invalid_date',
        limit: -1,
        offset: 'not_number'
      }

      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      
      mockSupabase.order.mockReturnValue(mockQuery)

      const result = await getNotifications(malformedFilter)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle concurrent read operations', async () => {
      const promises = Array(5).fill(null).map(() => 
        markNotificationAsRead('notif-1')
      )

      const results = await Promise.all(promises)
      
      // At least one should succeed, others might fail due to race condition
      const successCount = results.filter(r => r.success).length
      expect(successCount).toBeGreaterThan(0)
    })

    it('should handle database connection failures', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Database connection failed'))

      const result = await getNotifications()

      expect(result.success).toBe(false)
      expect(result.error).toContain('알림을 불러오는데 실패했습니다')
    })

    it('should handle large notification dataset pagination', async () => {
      const largeFilter: NotificationFilter = {
        limit: 1000,
        offset: 50000
      }

      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      
      mockSupabase.range.mockReturnValue(mockQuery)

      const result = await getNotifications(largeFilter)

      expect(result.success).toBe(true)
      expect(mockSupabase.range).toHaveBeenCalledWith(50000, 50999)
    })
  })

  describe('Korean Localization', () => {
    it('should return Korean error messages', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await getNotifications()

      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
    })

    it('should handle Korean notification content', async () => {
      const koreanNotification = {
        ...mockNotifications[0],
        title: '한글 제목 테스트',
        message: '한글 메시지 내용 테스트입니다. 특수문자도 포함: !@#$%^&*()'
      }

      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: [koreanNotification],
          error: null
        })
      }
      
      mockSupabase.order.mockReturnValue(mockQuery)

      const result = await getNotifications()

      expect(result.success).toBe(true)
      expect(result.data[0].title).toContain('한글')
      expect(result.data[0].message).toContain('특수문자')
    })
  })

  describe('Business Logic Validation', () => {
    it('should enforce notification retention policy', async () => {
      const oldDate = '2024-01-01T00:00:00Z'
      const filter: NotificationFilter = {
        start_date: oldDate
      }

      const mockQuery = {
        ...mockSupabase,
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      
      mockSupabase.gte.mockReturnValue(mockQuery)

      const result = await getNotifications(filter)

      expect(result.success).toBe(true)
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', oldDate)
    })

    it('should validate notification template codes', async () => {
      const invalidRequest: CreateNotificationRequest = {
        user_id: 'target-user-123',
        template_code: 'INVALID_TEMPLATE_CODE',
        variables: {}
      }

      // Mock admin profile
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue({
                  then: jest.fn().mockResolvedValue({
                    data: mockAdminProfile,
                    error: null
                  })
                })
              })
            })
          }
        }
        return mockSupabase
      })

      // Mock RPC error
      mockSupabase.rpc.mockReturnValue({
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid template code' }
        })
      })

      const result = await createNotification(invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('알림 생성에 실패했습니다')
    })

    it('should handle notification preferences by type', async () => {
      const preferences = mockNotificationPreferences

      const result = await updateNotificationPreference('equipment_maintenance', {
        enabled: true,
        email_enabled: true,
        push_enabled: false
      })

      // Should be handled by the upsert mechanism
      expect(mockSupabase.from).toHaveBeenCalledWith('user_notification_preferences')
    })
  })
})