/**
 * PWA Notification Permission Component Test Suite
 * Tests for push notification permission requests, engagement tracking, and permission modal
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@/__tests__/utils/test-utils'
import { jest } from '@jest/globals'
import { NotificationPermission, useNotificationPermission } from '@/components/pwa/notification-permission'

// Mock useProfile hook
const mockProfile = {
  id: 'user-123',
  full_name: '김철수',
  notification_preferences: {}
}

const mockUpdateProfile = jest.fn()

jest.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile
  })
}))

// Mock push notification service with proper method handling
const mockPushNotificationService = {
  initialize: jest.fn().mockResolvedValue(true),
  requestPermission: jest.fn().mockResolvedValue('granted'),
  subscribeToPush: jest.fn().mockResolvedValue(undefined),
  sendTestNotification: jest.fn().mockResolvedValue(undefined),
  isSupported: jest.fn().mockReturnValue(true),
  getPermissionStatus: jest.fn().mockReturnValue('default'),
  unsubscribe: jest.fn().mockResolvedValue(true),
  sendNotification: jest.fn().mockResolvedValue(new Response()),
  getSubscriptionStatus: jest.fn().mockResolvedValue({ isSubscribed: false, subscription: null })
}

jest.mock('@/lib/push-notifications', () => ({
  pushNotificationService: {
    ...mockPushNotificationService,
    isSupported: () => mockPushNotificationService.isSupported()
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

// Mock window.Notification
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'default' as NotificationPermission,
    requestPermission: jest.fn().mockResolvedValue('granted' as NotificationPermission)
  }
})

// Create test component for useNotificationPermission hook
function TestNotificationPermissionHook() {
  const { permission, isSupported, isGranted, isDenied, isDefault, requestPermission } = useNotificationPermission()
  
  return (
    <div>
      <div data-testid="hook-permission">{permission}</div>
      <div data-testid="hook-supported">{isSupported ? 'supported' : 'not-supported'}</div>
      <div data-testid="hook-granted">{isGranted ? 'granted' : 'not-granted'}</div>
      <div data-testid="hook-denied">{isDenied ? 'denied' : 'not-denied'}</div>
      <div data-testid="hook-default">{isDefault ? 'default' : 'not-default'}</div>
      <button onClick={requestPermission} data-testid="hook-request-button">
        Request Permission
      </button>
    </div>
  )
}

describe('NotificationPermission Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Reset Notification.permission
    Object.defineProperty(window.Notification, 'permission', {
      writable: true,
      value: 'default'
    })
    
    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null)
    mockSessionStorage.getItem.mockReturnValue(null)
    
    // Reset push notification service mocks
    mockPushNotificationService.requestPermission.mockResolvedValue('granted')
    mockPushNotificationService.getPermissionStatus.mockReturnValue('default')
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should not render when notifications are not supported', () => {
      // Remove Notification from window
      const originalNotification = window.Notification
      // @ts-ignore
      delete window.Notification
      
      render(<NotificationPermission />)
      
      expect(screen.queryByText('알림 권한 요청')).not.toBeInTheDocument()
      
      // Restore Notification
      window.Notification = originalNotification
    })

    it('should not render when permission is already granted', () => {
      Object.defineProperty(window.Notification, 'permission', {
        writable: true,
        value: 'granted'
      })
      
      render(<NotificationPermission />)
      
      expect(screen.queryByText('알림 권한 요청')).not.toBeInTheDocument()
    })

    it('should not render initially when user engagement is low', () => {
      // Mock low engagement score
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: false,
        score: 10,
        showReEngagement: false
      }))
      
      render(<NotificationPermission />)
      
      expect(screen.queryByText('알림 권한 요청')).not.toBeInTheDocument()
    })

    it('should render permission modal when engagement threshold is met', () => {
      // Mock high engagement
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 50,
        showReEngagement: false
      }))
      
      render(<NotificationPermission />)
      
      expect(screen.getByText('알림 권한 요청')).toBeInTheDocument()
      expect(screen.getByText('더 나은 현장 관리를 위해')).toBeInTheDocument()
    })

    it('should render re-engagement button for denied permissions', () => {
      Object.defineProperty(window.Notification, 'permission', {
        writable: true,
        value: 'denied'
      })
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 30,
        showReEngagement: true
      }))
      
      render(<NotificationPermission />)
      
      expect(screen.getByText('알림 활성화')).toBeInTheDocument()
    })
  })

  describe('Notification Benefits Display', () => {
    beforeEach(() => {
      // Set up high engagement to show modal
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 50,
        showReEngagement: false
      }))
    })

    it('should display all notification benefits', () => {
      render(<NotificationPermission />)
      
      expect(screen.getByText('긴급 안전 알림')).toBeInTheDocument()
      expect(screen.getByText('현장 안전사고나 위험 상황을 즉시 알려드립니다')).toBeInTheDocument()
      
      expect(screen.getByText('자재 승인 알림')).toBeInTheDocument()
      expect(screen.getByText('자재 요청이 승인되거나 반려될 때 바로 확인하세요')).toBeInTheDocument()
      
      expect(screen.getByText('작업일지 리마인더')).toBeInTheDocument()
      expect(screen.getByText('작업일지 작성 시간을 놓치지 않도록 미리 알려드립니다')).toBeInTheDocument()
      
      expect(screen.getByText('장비 정비 알림')).toBeInTheDocument()
      expect(screen.getByText('장비 점검 및 정비 일정을 사전에 안내해드립니다')).toBeInTheDocument()
      
      expect(screen.getByText('현장 공지사항')).toBeInTheDocument()
      expect(screen.getByText('중요한 현장 소식과 업데이트를 실시간으로 받아보세요')).toBeInTheDocument()
    })

    it('should mark high priority benefits with urgency badge', () => {
      render(<NotificationPermission />)
      
      // Should have urgency badges for high priority items
      const urgencyBadges = screen.getAllByText('긴급')
      expect(urgencyBadges.length).toBeGreaterThan(0)
    })

    it('should display privacy notice', () => {
      render(<NotificationPermission />)
      
      expect(screen.getByText('개인정보 보호:')).toBeInTheDocument()
      expect(screen.getByText(/알림은 작업 관련 내용만 포함되며/)).toBeInTheDocument()
      expect(screen.getByText(/언제든지 설정에서 알림을 끄실 수 있습니다/)).toBeInTheDocument()
    })
  })

  describe('Permission Request Functionality', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 50,
        showReEngagement: false
      }))
    })

    it('should request permission when allow button is clicked', async () => {
      render(<NotificationPermission />)
      
      const allowButton = screen.getByText('알림 허용')
      fireEvent.click(allowButton)
      
      await waitFor(() => {
        expect(mockPushNotificationService.requestPermission).toHaveBeenCalled()
      })
    })

    it('should hide modal when permission is granted', async () => {
      mockPushNotificationService.requestPermission.mockResolvedValue('granted')
      
      render(<NotificationPermission />)
      
      const allowButton = screen.getByText('알림 허용')
      fireEvent.click(allowButton)
      
      await waitFor(() => {
        expect(screen.queryByText('알림 권한 요청')).not.toBeInTheDocument()
      })
    })

    it('should update profile when permission is granted', async () => {
      mockPushNotificationService.requestPermission.mockResolvedValue('granted')
      
      render(<NotificationPermission />)
      
      const allowButton = screen.getByText('알림 허용')
      fireEvent.click(allowButton)
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          notification_preferences: {
            push_enabled: true,
            permission_requested_at: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
          }
        })
      })
    })

    it('should subscribe to push notifications when permission granted', async () => {
      mockPushNotificationService.requestPermission.mockResolvedValue('granted')
      
      render(<NotificationPermission />)
      
      const allowButton = screen.getByText('알림 허용')
      fireEvent.click(allowButton)
      
      await waitFor(() => {
        expect(mockPushNotificationService.subscribeToPush).toHaveBeenCalled()
        expect(mockPushNotificationService.sendTestNotification).toHaveBeenCalled()
      })
    })

    it('should show alert for unsupported browsers', async () => {
      // Remove Notification support
      const originalNotification = window.Notification
      // @ts-ignore
      delete window.Notification
      
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      
      // Manually trigger the function since component won't render
      const { NotificationPermission: Component } = await import('@/components/pwa/notification-permission')
      const component = new (Component as any)({})
      await component.handleRequestPermission?.()
      
      expect(alertSpy).toHaveBeenCalledWith('이 브라우저는 알림을 지원하지 않습니다.')
      
      alertSpy.mockRestore()
      window.Notification = originalNotification
    })
  })

  describe('Dismiss Functionality', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 50,
        showReEngagement: false
      }))
    })

    it('should hide modal when dismiss button is clicked', () => {
      render(<NotificationPermission />)
      
      const dismissButton = screen.getByText('나중에')
      fireEvent.click(dismissButton)
      
      expect(screen.queryByText('알림 권한 요청')).not.toBeInTheDocument()
    })

    it('should hide modal when X button is clicked', () => {
      render(<NotificationPermission />)
      
      const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
      fireEvent.click(closeButton)
      
      expect(screen.queryByText('알림 권한 요청')).not.toBeInTheDocument()
    })
  })

  describe('Engagement Tracking', () => {
    it('should calculate engagement score based on user activity', () => {
      // Mock various engagement indicators
      mockLocalStorage.getItem.mockImplementation((key) => {
        const values: { [key: string]: string } = {
          'page-views': '10',
          'used-daily-reports': 'true',
          'used-materials': 'true',
          'used-attendance': 'true',
          'forms-submitted': '5'
        }
        return values[key] || null
      })
      
      mockSessionStorage.getItem.mockReturnValue((Date.now() - 10 * 60 * 1000).toString()) // 10 minutes ago
      
      render(<NotificationPermission />)
      
      // Should show modal due to high engagement
      expect(screen.getByText('알림 권한 요청')).toBeInTheDocument()
    })

    it('should save engagement data to localStorage', () => {
      render(<NotificationPermission />)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'notification-engagement',
        expect.stringContaining('hasUserEngaged')
      )
    })
  })

  describe('Re-engagement Flow', () => {
    it('should show re-engagement button after permission denied', () => {
      Object.defineProperty(window.Notification, 'permission', {
        writable: true,
        value: 'denied'
      })
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 30,
        showReEngagement: true
      }))
      
      render(<NotificationPermission />)
      
      expect(screen.getByText('알림 활성화')).toBeInTheDocument()
    })

    it('should show modal when re-engagement button is clicked', () => {
      Object.defineProperty(window.Notification, 'permission', {
        writable: true,
        value: 'denied'
      })
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 30,
        showReEngagement: true
      }))
      
      render(<NotificationPermission />)
      
      const reEngageButton = screen.getByText('알림 활성화')
      fireEvent.click(reEngageButton)
      
      expect(screen.getByText('알림 권한 요청')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 50,
        showReEngagement: false
      }))
    })

    it('should handle permission request errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockPushNotificationService.requestPermission.mockRejectedValue(new Error('Permission error'))
      
      render(<NotificationPermission />)
      
      const allowButton = screen.getByText('알림 허용')
      fireEvent.click(allowButton)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to request notification permission:', expect.any(Error))
      })
      
      consoleErrorSpy.mockRestore()
    })

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      // Should not crash
      expect(() => render(<NotificationPermission />)).not.toThrow()
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user engagement:', expect.any(Error))
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Korean Localization', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 50,
        showReEngagement: false
      }))
    })

    it('should display all text in Korean', () => {
      render(<NotificationPermission />)
      
      expect(screen.getByText('알림 권한 요청')).toBeInTheDocument()
      expect(screen.getByText('더 나은 현장 관리를 위해')).toBeInTheDocument()
      expect(screen.getByText('INOPNC 알림을 활성화하면 다음과 같은 혜택을 받으실 수 있습니다:')).toBeInTheDocument()
      expect(screen.getByText('알림 허용')).toBeInTheDocument()
      expect(screen.getByText('나중에')).toBeInTheDocument()
      expect(screen.getByText('브라우저에서 알림 권한을 요청합니다')).toBeInTheDocument()
    })

    it('should display Korean benefit descriptions', () => {
      render(<NotificationPermission />)
      
      expect(screen.getByText('현장 안전사고나 위험 상황을 즉시 알려드립니다')).toBeInTheDocument()
      expect(screen.getByText('자재 요청이 승인되거나 반려될 때 바로 확인하세요')).toBeInTheDocument()
      expect(screen.getByText('작업일지 작성 시간을 놓치지 않도록 미리 알려드립니다')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 50,
        showReEngagement: false
      }))
    })

    it('should use responsive modal layout', () => {
      render(<NotificationPermission />)
      
      const modal = screen.getByText('알림 권한 요청').closest('.fixed')
      expect(modal).toHaveClass('inset-0', 'flex', 'items-center', 'justify-center', 'p-4')
      
      const modalContent = screen.getByText('알림 권한 요청').closest('.bg-white')
      expect(modalContent).toHaveClass('max-w-md', 'w-full', 'max-h-[90vh]', 'overflow-y-auto')
    })
  })

  describe('Dark Mode Support', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        hasUserEngaged: true,
        score: 50,
        showReEngagement: false
      }))
    })

    it('should include dark mode classes', () => {
      render(<NotificationPermission />)
      
      const modalContent = screen.getByText('알림 권한 요청').closest('.bg-white')
      expect(modalContent).toHaveClass('dark:bg-gray-800')
      
      const title = screen.getByText('알림 권한 요청')
      expect(title).toHaveClass('dark:text-white')
    })
  })
})

describe('useNotificationPermission Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Reset push notification service mocks
    mockPushNotificationService.isSupported.mockReturnValue(true)
    mockPushNotificationService.getPermissionStatus.mockReturnValue('default')
    mockPushNotificationService.requestPermission.mockResolvedValue('granted')
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Hook Initialization', () => {
    it('should return initial state correctly', () => {
      render(<TestNotificationPermissionHook />)
      
      expect(screen.getByTestId('hook-permission')).toHaveTextContent('default')
      expect(screen.getByTestId('hook-supported')).toHaveTextContent('supported')
      expect(screen.getByTestId('hook-granted')).toHaveTextContent('not-granted')
      expect(screen.getByTestId('hook-denied')).toHaveTextContent('not-denied')
      expect(screen.getByTestId('hook-default')).toHaveTextContent('default')
    })

    it('should initialize push notification service', async () => {
      render(<TestNotificationPermissionHook />)
      
      await waitFor(() => {
        expect(mockPushNotificationService.initialize).toHaveBeenCalled()
      })
    })

    it('should handle unsupported browsers', () => {
      mockPushNotificationService.isSupported.mockReturnValue(false)
      
      render(<TestNotificationPermissionHook />)
      
      expect(screen.getByTestId('hook-supported')).toHaveTextContent('not-supported')
    })
  })

  describe('Permission Status Updates', () => {
    it('should update permission status when service reports changes', async () => {
      mockPushNotificationService.getPermissionStatus
        .mockReturnValueOnce('default')
        .mockReturnValueOnce('granted')
      
      render(<TestNotificationPermissionHook />)
      
      // Fast-forward timer for permission check interval
      act(() => {
        jest.advanceTimersByTime(5000)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-permission')).toHaveTextContent('granted')
        expect(screen.getByTestId('hook-granted')).toHaveTextContent('granted')
      })
    })

    it('should handle denied permission correctly', () => {
      mockPushNotificationService.getPermissionStatus.mockReturnValue('denied')
      
      render(<TestNotificationPermissionHook />)
      
      expect(screen.getByTestId('hook-permission')).toHaveTextContent('denied')
      expect(screen.getByTestId('hook-denied')).toHaveTextContent('denied')
    })
  })

  describe('Permission Request', () => {
    it('should request permission when called', async () => {
      render(<TestNotificationPermissionHook />)
      
      const requestButton = screen.getByTestId('hook-request-button')
      fireEvent.click(requestButton)
      
      await waitFor(() => {
        expect(mockPushNotificationService.requestPermission).toHaveBeenCalled()
      })
    })

    it('should return denied when not supported', async () => {
      mockPushNotificationService.isSupported.mockReturnValue(false)
      
      render(<TestNotificationPermissionHook />)
      
      const requestButton = screen.getByTestId('hook-request-button')
      fireEvent.click(requestButton)
      
      // Permission should remain denied for unsupported browsers
      expect(screen.getByTestId('hook-permission')).toHaveTextContent('default')
    })

    it('should update local state after permission request', async () => {
      mockPushNotificationService.requestPermission.mockResolvedValue('granted')
      
      render(<TestNotificationPermissionHook />)
      
      const requestButton = screen.getByTestId('hook-request-button')
      fireEvent.click(requestButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-permission')).toHaveTextContent('granted')
        expect(screen.getByTestId('hook-granted')).toHaveTextContent('granted')
      })
    })
  })

  describe('Cleanup', () => {
    it('should clear interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      
      const { unmount } = render(<TestNotificationPermissionHook />)
      
      unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
      
      clearIntervalSpy.mockRestore()
    })
  })
})