import { renderHook, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { createClient } from '@/lib/supabase/client'
import type { NotificationExtended } from '@/types/notifications'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('sonner', () => {
  const mockToast = jest.fn()
  const mockToastSuccess = jest.fn()
  const mockToastError = jest.fn()
  const mockToastWarning = jest.fn()
  const mockToastMessage = jest.fn()
  const mockToastInfo = jest.fn()

  return {
    toast: Object.assign(mockToast, {
      success: mockToastSuccess,
      error: mockToastError,
      warning: mockToastWarning,
      message: mockToastMessage,
      info: mockToastInfo,
    }),
  }
})

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('useRealtimeNotifications', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()
  const mockGetUser = jest.fn()
  const mockChannel = jest.fn()
  const mockOn = jest.fn()
  const mockSubscribe = jest.fn()
  const mockUnsubscribe = jest.fn()

  const mockSupabase = {
    auth: {
      getUser: mockGetUser,
    },
    channel: mockChannel,
  }

  const mockChannelInstance = {
    on: mockOn,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockNotification: NotificationExtended = {
    id: 'notification-1',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'success',
    user_id: 'test-user-id',
    action_url: '/test-action',
    is_read: false,
    created_at: '2023-01-01T00:00:00Z',
    created_by: null,
    site_id: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock useRouter
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })

    // Mock createClient
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    // Mock channel chain
    mockChannel.mockReturnValue(mockChannelInstance)
    mockOn.mockReturnValue(mockChannelInstance)
    mockSubscribe.mockReturnValue(mockChannelInstance)

    // Mock successful user fetch
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
    })

    // Mock console to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('should set up subscription for authenticated user', async () => {
      renderHook(() => useRealtimeNotifications())

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled()
      })

      expect(mockChannel).toHaveBeenCalledWith('notifications')
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${mockUser.id}`,
        },
        expect.any(Function)
      )
      expect(mockSubscribe).toHaveBeenCalled()
    })

    it('should not set up subscription when no user is authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      renderHook(() => useRealtimeNotifications())

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled()
      })

      expect(mockChannel).not.toHaveBeenCalled()
    })

    it('should unsubscribe on unmount', async () => {
      const { unmount } = renderHook(() => useRealtimeNotifications())

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled()
      })

      unmount()

      // Note: In real implementation, unsubscribe would be called asynchronously
      await waitFor(() => {
        expect(mockUnsubscribe).toHaveBeenCalled()
      })
    })
  })

  describe('notification handling', () => {
    let notificationHandler: (payload: { new: NotificationExtended }) => void

    beforeEach(async () => {
      mockOn.mockImplementation((event, config, handler) => {
        notificationHandler = handler
        return mockChannelInstance
      })

      renderHook(() => useRealtimeNotifications())

      await waitFor(() => {
        expect(mockOn).toHaveBeenCalled()
      })
    })

    it('should call custom notification handler when provided', async () => {
      const onNewNotification = jest.fn()
      let localNotificationHandler: (payload: { new: NotificationExtended }) => void
      
      // Reset mock to capture the handler for this specific test
      mockOn.mockImplementation((event, config, handler) => {
        localNotificationHandler = handler
        return mockChannelInstance
      })
      
      renderHook(() => useRealtimeNotifications({ onNewNotification }))

      await waitFor(() => {
        expect(mockOn).toHaveBeenCalled()
      })

      localNotificationHandler!({ new: mockNotification })

      expect(onNewNotification).toHaveBeenCalledWith(mockNotification)
    })

    it('should show success toast for success notifications', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ new: { ...mockNotification, type: 'success' } })

      expect(toast.success).toHaveBeenCalledWith(
        mockNotification.title,
        expect.objectContaining({
          description: mockNotification.message,
          duration: 5000,
          action: expect.objectContaining({
            label: '보기',
            onClick: expect.any(Function),
          }),
        })
      )
    })

    it('should show error toast for error notifications', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ new: { ...mockNotification, type: 'error' } })

      expect(toast.error).toHaveBeenCalledWith(
        mockNotification.title,
        expect.objectContaining({
          description: mockNotification.message,
          duration: 5000,
        })
      )
    })

    it('should show warning toast for warning notifications', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ new: { ...mockNotification, type: 'warning' } })

      expect(toast.warning).toHaveBeenCalledWith(
        mockNotification.title,
        expect.objectContaining({
          description: mockNotification.message,
          duration: 5000,
        })
      )
    })

    it('should show system message toast for system notifications', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ new: { ...mockNotification, type: 'system' } })

      expect(toast.message).toHaveBeenCalledWith(
        mockNotification.title,
        expect.objectContaining({
          description: mockNotification.message,
          duration: 5000,
        })
      )
    })

    it('should show info toast for approval notifications', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ new: { ...mockNotification, type: 'approval' } })

      expect(toast.info).toHaveBeenCalledWith(
        mockNotification.title,
        expect.objectContaining({
          description: mockNotification.message,
          duration: 5000,
        })
      )
    })

    it('should show default toast for unknown notification types', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ 
        new: { ...mockNotification, type: 'unknown' as any } 
      })

      expect(toast).toHaveBeenCalledWith(
        mockNotification.title,
        expect.objectContaining({
          description: mockNotification.message,
          duration: 5000,
        })
      )
    })

    it('should not show action button when no action_url is provided', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ 
        new: { ...mockNotification, action_url: null } 
      })

      expect(toast.success).toHaveBeenCalledWith(
        mockNotification.title,
        expect.objectContaining({
          action: undefined,
        })
      )
    })

    it('should not show toast when showToast is false', async () => {
      let localNotificationHandler: (payload: { new: NotificationExtended }) => void
      
      // Reset mock to capture the handler for this specific test
      mockOn.mockImplementation((event, config, handler) => {
        localNotificationHandler = handler
        return mockChannelInstance
      })
      
      renderHook(() => useRealtimeNotifications({ showToast: false }))

      await waitFor(() => {
        expect(mockOn).toHaveBeenCalled()
      })

      localNotificationHandler!({ new: mockNotification })

      expect(toast.success).not.toHaveBeenCalled()
      expect(toast.error).not.toHaveBeenCalled()
      expect(toast.warning).not.toHaveBeenCalled()
      expect(toast.message).not.toHaveBeenCalled()
      expect(toast.info).not.toHaveBeenCalled()
      expect(toast).not.toHaveBeenCalled()
    })

    it('should refresh router after handling notification', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ new: mockNotification })

      expect(mockRefresh).toHaveBeenCalled()
    })

    it('should navigate to action URL when action button is clicked', () => {
      renderHook(() => useRealtimeNotifications())

      notificationHandler({ new: mockNotification })

      // Get the onClick function from the action
      const toastCall = (toast.success as jest.Mock).mock.calls[0]
      const toastOptions = toastCall[1]
      const actionOnClick = toastOptions.action.onClick

      actionOnClick()

      expect(mockPush).toHaveBeenCalledWith(mockNotification.action_url)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      // Reset mocks for error handling tests
      jest.clearAllMocks()
      mockChannel.mockReturnValue(mockChannelInstance)
      mockOn.mockReturnValue(mockChannelInstance)
      mockSubscribe.mockReturnValue(mockChannelInstance)
    })

    it('should handle errors when getting user', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth error'))

      // Mock console.error to prevent error output in test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useRealtimeNotifications())
      }).not.toThrow()

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled()
      })

      // Should not try to set up subscription if user fetch fails
      expect(mockChannel).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle subscription errors gracefully', async () => {
      // Reset to successful user fetch for this test
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
      
      mockSubscribe.mockImplementation(() => {
        throw new Error('Subscription error')
      })

      // Mock console.error to prevent error output in test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useRealtimeNotifications())
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })

  describe('hook dependencies', () => {
    beforeEach(() => {
      // Reset mocks for dependency tests
      jest.clearAllMocks()
      mockChannel.mockReturnValue(mockChannelInstance)
      mockOn.mockReturnValue(mockChannelInstance)
      mockSubscribe.mockReturnValue(mockChannelInstance)
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    })

    it('should update handler when dependencies change', async () => {
      const onNewNotification1 = jest.fn()
      const onNewNotification2 = jest.fn()

      const { rerender } = renderHook(
        ({ onNewNotification }) => useRealtimeNotifications({ onNewNotification }),
        { initialProps: { onNewNotification: onNewNotification1 } }
      )

      await waitFor(() => {
        expect(mockOn).toHaveBeenCalled()
      })

      // Change the callback
      rerender({ onNewNotification: onNewNotification2 })

      await waitFor(() => {
        // Should have been called again due to dependency change
        expect(mockOn).toHaveBeenCalledTimes(2)
      })
    })
  })
})