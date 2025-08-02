import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { AuthProvider } from '@/contexts/auth-context'
import type { NotificationExtended } from '@/types/notifications'

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    message: jest.fn(),
    info: jest.fn(),
    default: jest.fn(),
  },
}))

// Test component that uses real-time notifications
const RealtimeNotificationTestComponent = ({ onNotification }: { onNotification?: (notification: NotificationExtended) => void }) => {
  const [notifications, setNotifications] = React.useState<NotificationExtended[]>([])

  useRealtimeNotifications({
    onNewNotification: (notification) => {
      setNotifications(prev => [notification, ...prev])
      onNotification?.(notification)
    },
    showToast: false // Disable toast for testing
  })

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="notifications">
        {notifications.map(notification => (
          <div key={notification.id} data-testid={`notification-${notification.id}`}>
            <span data-testid="title">{notification.title}</span>
            <span data-testid="message">{notification.message}</span>
            <span data-testid="type">{notification.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Test component for daily reports real-time updates
const DailyReportsRealtimeComponent = () => {
  const [reports, setReports] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const supabase = createClient()
    
    // Initial load
    const loadReports = async () => {
      const { data } = await supabase.from('daily_reports').select('*')
      setReports(data || [])
      setLoading(false)
    }

    loadReports()

    // Set up real-time subscription
    const channel = supabase
      .channel('daily_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_reports',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setReports(prev => prev.map(report => 
              report.id === payload.new.id ? payload.new : report
            ))
          } else if (payload.eventType === 'DELETE') {
            setReports(prev => prev.filter(report => report.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div data-testid="loading">Loading...</div>
  }

  return (
    <div>
      <div data-testid="reports-count">{reports.length}</div>
      <div data-testid="reports">
        {reports.map(report => (
          <div key={report.id} data-testid={`report-${report.id}`}>
            <span data-testid="title">{report.title}</span>
            <span data-testid="status">{report.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

describe('Real-time Data Flow Integration Tests', () => {
  let mockSupabase: any
  let mockChannel: any

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock channel for real-time subscriptions
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    }

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        }),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } }
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }),
      channel: jest.fn().mockReturnValue(mockChannel),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('Notification Real-time Updates', () => {
    it('should receive and handle new notifications in real-time', async () => {
      let notificationHandler: Function

      // Capture the notification handler
      mockChannel.on.mockImplementation((event, config, handler) => {
        if (config.table === 'notifications') {
          notificationHandler = handler
        }
        return mockChannel
      })

      const onNotification = jest.fn()

      render(
        <AuthProvider>
          <RealtimeNotificationTestComponent onNotification={onNotification} />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('notifications')
        expect(mockChannel.on).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${mockUser.id}`
          }),
          expect.any(Function)
        )
      })

      // Simulate receiving a new notification
      const newNotification: NotificationExtended = {
        id: 'notif-1',
        title: 'New Notification',
        message: 'You have a new message',
        type: 'success',
        user_id: 'user-123',
        action_url: null,
        is_read: false,
        created_at: '2023-01-01T00:00:00Z',
        created_by: null,
        site_id: null,
      }

      act(() => {
        notificationHandler!({ new: newNotification })
      })

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
        expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument()
        expect(screen.getByTestId('title')).toHaveTextContent('New Notification')
        expect(screen.getByTestId('message')).toHaveTextContent('You have a new message')
        expect(screen.getByTestId('type')).toHaveTextContent('success')
      })

      expect(onNotification).toHaveBeenCalledWith(newNotification)
    })

    it('should handle multiple notification types', async () => {
      let notificationHandler: Function

      mockChannel.on.mockImplementation((event, config, handler) => {
        notificationHandler = handler
        return mockChannel
      })

      const onNotification = jest.fn()

      render(
        <AuthProvider>
          <RealtimeNotificationTestComponent onNotification={onNotification} />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalled()
      })

      // Simulate different notification types
      const notifications = [
        { id: 'notif-1', title: 'Success', type: 'success', user_id: 'user-123' },
        { id: 'notif-2', title: 'Error', type: 'error', user_id: 'user-123' },
        { id: 'notif-3', title: 'Warning', type: 'warning', user_id: 'user-123' },
        { id: 'notif-4', title: 'System', type: 'system', user_id: 'user-123' },
      ]

      for (const notification of notifications) {
        act(() => {
          notificationHandler!({ new: notification })
        })
      }

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('4')
        notifications.forEach(notification => {
          expect(screen.getByTestId(`notification-${notification.id}`)).toBeInTheDocument()
        })
      })

      expect(onNotification).toHaveBeenCalledTimes(4)
    })

    it('should unsubscribe when component unmounts', async () => {
      render(
        <AuthProvider>
          <RealtimeNotificationTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Unmount component
      const { unmount } = render(<div />)
      unmount()

      await waitFor(() => {
        expect(mockChannel.unsubscribe).toHaveBeenCalled()
      })
    })
  })

  describe('Daily Reports Real-time Updates', () => {
    it('should handle real-time INSERT events for daily reports', async () => {
      let reportsHandler: Function

      // Mock initial empty data
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      mockChannel.on.mockImplementation((event, config, handler) => {
        if (config.table === 'daily_reports') {
          reportsHandler = handler
        }
        return mockChannel
      })

      render(<DailyReportsRealtimeComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('0')
      })

      // Simulate new report insertion
      const newReport = {
        id: 'report-1',
        title: 'New Daily Report',
        status: 'draft',
        created_by: 'user-123'
      }

      act(() => {
        reportsHandler!({
          eventType: 'INSERT',
          new: newReport,
          old: null
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('1')
        expect(screen.getByTestId('report-report-1')).toBeInTheDocument()
        expect(screen.getByTestId('title')).toHaveTextContent('New Daily Report')
        expect(screen.getByTestId('status')).toHaveTextContent('draft')
      })
    })

    it('should handle real-time UPDATE events for daily reports', async () => {
      let reportsHandler: Function

      const initialReport = {
        id: 'report-1',
        title: 'Initial Report',
        status: 'draft'
      }

      // Mock initial data with one report
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: [initialReport],
            error: null
          })
        })
      })

      mockChannel.on.mockImplementation((event, config, handler) => {
        reportsHandler = handler
        return mockChannel
      })

      render(<DailyReportsRealtimeComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('1')
        expect(screen.getByTestId('status')).toHaveTextContent('draft')
      })

      // Simulate report update
      const updatedReport = {
        id: 'report-1',
        title: 'Updated Report',
        status: 'completed'
      }

      act(() => {
        reportsHandler!({
          eventType: 'UPDATE',
          new: updatedReport,
          old: initialReport
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('1')
        expect(screen.getByTestId('title')).toHaveTextContent('Updated Report')
        expect(screen.getByTestId('status')).toHaveTextContent('completed')
      })
    })

    it('should handle real-time DELETE events for daily reports', async () => {
      let reportsHandler: Function

      const initialReports = [
        { id: 'report-1', title: 'Report 1', status: 'draft' },
        { id: 'report-2', title: 'Report 2', status: 'completed' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: initialReports,
            error: null
          })
        })
      })

      mockChannel.on.mockImplementation((event, config, handler) => {
        reportsHandler = handler
        return mockChannel
      })

      render(<DailyReportsRealtimeComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('2')
        expect(screen.getByTestId('report-report-1')).toBeInTheDocument()
        expect(screen.getByTestId('report-report-2')).toBeInTheDocument()
      })

      // Simulate report deletion
      act(() => {
        reportsHandler!({
          eventType: 'DELETE',
          new: null,
          old: { id: 'report-1' }
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('reports-count')).toHaveTextContent('1')
        expect(screen.queryByTestId('report-report-1')).not.toBeInTheDocument()
        expect(screen.getByTestId('report-report-2')).toBeInTheDocument()
      })
    })
  })

  describe('Connection Error Handling', () => {
    it('should handle subscription connection errors gracefully', async () => {
      mockChannel.subscribe.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(
          <AuthProvider>
            <RealtimeNotificationTestComponent />
          </AuthProvider>
        )
      }).not.toThrow()

      consoleSpy.mockRestore()
    })

    it('should handle authentication errors in real-time subscriptions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      render(
        <AuthProvider>
          <RealtimeNotificationTestComponent />
        </AuthProvider>
      )

      // Should not attempt to set up subscription for unauthenticated user
      await waitFor(() => {
        expect(mockSupabase.channel).not.toHaveBeenCalled()
      })
    })

    it('should handle network reconnection scenarios', async () => {
      let notificationHandler: Function
      const onNotification = jest.fn()

      mockChannel.on.mockImplementation((event, config, handler) => {
        notificationHandler = handler
        return mockChannel
      })

      render(
        <AuthProvider>
          <RealtimeNotificationTestComponent onNotification={onNotification} />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      // Simulate connection drop and reconnection by sending notifications after delay
      setTimeout(() => {
        const notification = {
          id: 'notif-after-reconnect',
          title: 'After Reconnection',
          type: 'success',
          user_id: 'user-123'
        }

        act(() => {
          notificationHandler!({ new: notification })
        })
      }, 100)

      await waitFor(() => {
        expect(onNotification).toHaveBeenCalled()
      }, { timeout: 1000 })
    })
  })

  describe('Performance and Memory Management', () => {
    it('should not cause memory leaks with multiple subscriptions', async () => {
      const components = Array.from({ length: 5 }, (_, i) => (
        <RealtimeNotificationTestComponent key={i} />
      ))

      const { unmount } = render(
        <AuthProvider>
          {components}
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledTimes(5)
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(5)
      })

      unmount()

      await waitFor(() => {
        expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(5)
      })
    })

    it('should handle rapid real-time updates efficiently', async () => {
      let notificationHandler: Function
      const notifications: NotificationExtended[] = []

      mockChannel.on.mockImplementation((event, config, handler) => {
        notificationHandler = handler
        return mockChannel
      })

      render(
        <AuthProvider>
          <RealtimeNotificationTestComponent 
            onNotification={(notif) => notifications.push(notif)}
          />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalled()
      })

      // Simulate rapid notifications
      const rapidNotifications = Array.from({ length: 10 }, (_, i) => ({
        id: `rapid-notif-${i}`,
        title: `Rapid Notification ${i}`,
        type: 'success',
        user_id: 'user-123'
      }))

      act(() => {
        rapidNotifications.forEach(notification => {
          notificationHandler!({ new: notification })
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('10')
        expect(notifications).toHaveLength(10)
      })
    })
  })
})