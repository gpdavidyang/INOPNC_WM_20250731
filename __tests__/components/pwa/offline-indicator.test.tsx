/**
 * PWA Offline Indicator Component Test Suite
 * Tests for offline status detection, pending sync counter, and offline functionality
 */

import { jest } from '@jest/globals'

// Mock offline storage utility BEFORE importing component
const mockGetPendingOfflineCount = jest.fn().mockReturnValue(0)

jest.mock('@/lib/pwa/offline-storage', () => ({
  getPendingOfflineCount: mockGetPendingOfflineCount,
  offlineStorage: {
    getPendingData: jest.fn().mockReturnValue([]),
    isOffline: jest.fn().mockReturnValue(false)
  }
}))

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@/__tests__/utils/test-utils'
import { OfflineIndicator, useOfflineIndicator } from '@/components/pwa/offline-indicator'

// Create test component for useOfflineIndicator hook
function TestOfflineIndicatorHook() {
  const { isOffline, pendingCount } = useOfflineIndicator()
  return (
    <div>
      <div data-testid="hook-offline-status">{isOffline ? 'offline' : 'online'}</div>
      <div data-testid="hook-pending-count">{pendingCount}</div>
    </div>
  )
}

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('OfflineIndicator Component', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance
  let setIntervalSpy: jest.SpyInstance
  let clearIntervalSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Reset navigator.onLine to true (online)
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
    
    // Reset mock functions
    mockGetPendingOfflineCount.mockReturnValue(0)
    
    // Spy on event listeners and timers
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    setIntervalSpy = jest.spyOn(global, 'setInterval')
    clearIntervalSpy = jest.spyOn(global, 'clearInterval')
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })

  describe('Component Rendering', () => {
    it('should not render when online with no pending data', () => {
      // Online with no pending data
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<OfflineIndicator />)
      
      expect(screen.queryByText('오프라인 모드')).not.toBeInTheDocument()
      expect(screen.queryByText('동기화 대기 중')).not.toBeInTheDocument()
    })

    it('should render when offline', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<OfflineIndicator />)
      
      expect(screen.getByText('오프라인 모드')).toBeInTheDocument()
      expect(screen.getByText('일부 기능이 제한됩니다')).toBeInTheDocument()
    })

    it('should render when online with pending data', async () => {
      // Set up navigator.onLine and pending count before rendering
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(3)
      
      // Debug: check if mock is working
      console.log('Mock return value:', mockGetPendingOfflineCount())
      
      render(<OfflineIndicator />)
      
      // Debug: check what's actually rendered
      console.log('Rendered DOM:', document.body.innerHTML)
      
      // Wait for useEffect to run and component to update
      await waitFor(() => {
        console.log('Checking for text...')
        expect(screen.getByText('동기화 대기 중')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(screen.getByText('3개 항목이 동기화를 기다리고 있습니다')).toBeInTheDocument()
    })

    it('should display pending count badge when items are pending', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(5)
      
      render(<OfflineIndicator />)
      
      // Wait for the component to render the pending count
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })
  })

  describe('Offline Status Detection', () => {
    it('should detect initial offline status', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<OfflineIndicator />)
      
      expect(screen.getByText('오프라인 모드')).toBeInTheDocument()
    })

    it('should update status when going offline', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(2)
      
      render(<OfflineIndicator />)
      
      // Initially online with pending data
      await waitFor(() => {
        expect(screen.getByText('동기화 대기 중')).toBeInTheDocument()
      })
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      act(() => {
        window.dispatchEvent(new Event('offline'))
      })
      
      expect(screen.getByText('오프라인 모드')).toBeInTheDocument()
    })

    it('should update status when going online', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<OfflineIndicator />)
      
      // Initially offline
      expect(screen.getByText('오프라인 모드')).toBeInTheDocument()
      
      // Simulate going online with pending data
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      act(() => {
        window.dispatchEvent(new Event('online'))
        // Fast-forward the timeout for updating pending count
        jest.advanceTimersByTime(2000)
      })
      
      expect(screen.getByText('동기화 대기 중')).toBeInTheDocument()
    })
  })

  describe('Pending Count Updates', () => {
    it('should update pending count periodically', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      render(<OfflineIndicator />)
      
      // Initial render
      expect(screen.getByText('1')).toBeInTheDocument()
      
      // Change mock return value
      mockGetPendingOfflineCount.mockReturnValue(3)
      
      // Fast-forward timer (30 seconds interval)
      act(() => {
        jest.advanceTimersByTime(30000)
      })
      
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should set up interval for periodic updates', () => {
      render(<OfflineIndicator />)
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000)
    })

    it('should clear interval on unmount', () => {
      const { unmount } = render(<OfflineIndicator />)
      
      unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Details Toggle', () => {
    it('should toggle details when clicked', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(2)
      
      render(<OfflineIndicator />)
      
      // Initially collapsed
      expect(screen.queryByText('연결 시 자동으로 동기화됩니다')).not.toBeInTheDocument()
      
      // Click to expand
      const indicator = screen.getByText('오프라인 모드').closest('div')
      fireEvent.click(indicator!)
      
      expect(screen.getByText('연결 시 자동으로 동기화됩니다')).toBeInTheDocument()
      expect(screen.getByText('• 작업일지, 출근기록, 자재요청 등이 대기 중입니다')).toBeInTheDocument()
      expect(screen.getByText('• 오프라인에서도 대부분의 기능을 사용할 수 있습니다')).toBeInTheDocument()
    })

    it('should show different details for online vs offline mode', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      render(<OfflineIndicator />)
      
      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('동기화 대기 중')).toBeInTheDocument()
      })
      
      // Click to expand
      const indicator = screen.getByText('동기화 대기 중').closest('div')
      fireEvent.click(indicator!)
      
      expect(screen.getByText('백그라운드에서 동기화 중입니다')).toBeInTheDocument()
    })

    it('should show expand/collapse arrows correctly', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      render(<OfflineIndicator />)
      
      // Initially collapsed - should show right arrow
      expect(screen.getByText('▶')).toBeInTheDocument()
      
      // Click to expand
      const indicator = screen.getByText('오프라인 모드').closest('div')
      fireEvent.click(indicator!)
      
      // Should show down arrow when expanded
      expect(screen.getByText('▼')).toBeInTheDocument()
    })
  })

  describe('Visual Styling', () => {
    it('should use amber colors for offline mode', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<OfflineIndicator />)
      
      const container = screen.getByText('오프라인 모드').closest('div')?.parentElement
      expect(container).toHaveClass('bg-amber-50', 'dark:bg-amber-900/20')
      expect(container).toHaveClass('border-amber-200', 'dark:border-amber-800')
    })

    it('should use blue colors for online sync mode', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      render(<OfflineIndicator />)
      
      const container = screen.getByText('동기화 대기 중').closest('div')?.parentElement
      expect(container).toHaveClass('bg-blue-50', 'dark:bg-blue-900/20')
      expect(container).toHaveClass('border-blue-200', 'dark:border-blue-800')
    })

    it('should show correct icons for offline and online states', () => {
      // Test offline icon
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      const { rerender } = render(<OfflineIndicator />)
      
      // WifiOff icon should be present for offline
      expect(document.querySelector('.lucide-wifi-off')).toBeInTheDocument()
      
      // Test online sync icon
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      rerender(<OfflineIndicator />)
      
      // CloudOff icon should be present for online sync
      expect(document.querySelector('.lucide-cloud-off')).toBeInTheDocument()
    })
  })

  describe('Event Listeners', () => {
    it('should register online/offline event listeners', () => {
      render(<OfflineIndicator />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    })

    it('should remove event listeners on unmount', () => {
      const { unmount } = render(<OfflineIndicator />)
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    })
  })

  describe('Responsive Design', () => {
    it('should use responsive positioning classes', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<OfflineIndicator />)
      
      const container = screen.getByText('오프라인 모드').closest('div')?.parentElement?.parentElement
      expect(container).toHaveClass('fixed', 'top-16', 'left-4', 'right-4')
      expect(container).toHaveClass('md:left-auto', 'md:right-4', 'md:max-w-sm')
    })
  })

  describe('Korean Localization', () => {
    it('should display all text in Korean', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(2)
      
      render(<OfflineIndicator />)
      
      expect(screen.getByText('오프라인 모드')).toBeInTheDocument()
      expect(screen.getByText('일부 기능이 제한됩니다')).toBeInTheDocument()
      
      // Switch to online mode
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      act(() => {
        window.dispatchEvent(new Event('online'))
      })
      
      expect(screen.getByText('동기화 대기 중')).toBeInTheDocument()
      expect(screen.getByText('2개 항목이 동기화를 기다리고 있습니다')).toBeInTheDocument()
    })

    it('should show Korean text in expanded details', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      render(<OfflineIndicator />)
      
      // Click to expand
      const indicator = screen.getByText('오프라인 모드').closest('div')
      fireEvent.click(indicator!)
      
      expect(screen.getByText('연결 시 자동으로 동기화됩니다')).toBeInTheDocument()
      expect(screen.getByText('• 작업일지, 출근기록, 자재요청 등이 대기 중입니다')).toBeInTheDocument()
      expect(screen.getByText('• 오프라인에서도 대부분의 기능을 사용할 수 있습니다')).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for offline state', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<OfflineIndicator />)
      
      const container = screen.getByText('오프라인 모드').closest('div')?.parentElement
      expect(container).toHaveClass('dark:bg-amber-900/20', 'dark:border-amber-800')
      
      const titleElement = screen.getByText('오프라인 모드')
      expect(titleElement).toHaveClass('dark:text-amber-200')
    })

    it('should include dark mode classes for online sync state', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      render(<OfflineIndicator />)
      
      await waitFor(() => {
        expect(screen.getByText('동기화 대기 중')).toBeInTheDocument()
      })
      
      const container = screen.getByText('동기화 대기 중').closest('div')?.parentElement
      expect(container).toHaveClass('dark:bg-blue-900/20', 'dark:border-blue-800')
      
      const titleElement = screen.getByText('동기화 대기 중')
      expect(titleElement).toHaveClass('dark:text-blue-200')
    })
  })
})

describe('useOfflineIndicator Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
    
    mockGetPendingOfflineCount.mockReturnValue(0)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Status Tracking', () => {
    it('should return initial online status', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<TestOfflineIndicatorHook />)
      
      expect(screen.getByTestId('hook-offline-status')).toHaveTextContent('online')
      expect(screen.getByTestId('hook-pending-count')).toHaveTextContent('0')
    })

    it('should return initial offline status', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(2)
      
      render(<TestOfflineIndicatorHook />)
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-offline-status')).toHaveTextContent('offline')
        expect(screen.getByTestId('hook-pending-count')).toHaveTextContent('2')
      })
    })

    it('should update when connectivity changes', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(0)
      
      render(<TestOfflineIndicatorHook />)
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-offline-status')).toHaveTextContent('online')
      })
      
      // Go offline
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      mockGetPendingOfflineCount.mockReturnValue(3)
      
      act(() => {
        window.dispatchEvent(new Event('offline'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-offline-status')).toHaveTextContent('offline')
        expect(screen.getByTestId('hook-pending-count')).toHaveTextContent('3')
      })
    })

    it('should update pending count periodically', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      mockGetPendingOfflineCount.mockReturnValue(1)
      
      render(<TestOfflineIndicatorHook />)
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-pending-count')).toHaveTextContent('1')
      })
      
      // Change pending count
      mockGetPendingOfflineCount.mockReturnValue(5)
      
      // Fast-forward timer
      act(() => {
        jest.advanceTimersByTime(30000)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-pending-count')).toHaveTextContent('5')
      })
    })
  })

  describe('Event Listener Management', () => {
    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      
      const { unmount } = render(<TestOfflineIndicatorHook />)
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(clearIntervalSpy).toHaveBeenCalled()
      
      removeEventListenerSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should handle getPendingOfflineCount errors gracefully', () => {
      mockGetPendingOfflineCount.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      // Should not crash
      expect(() => render(<TestOfflineIndicatorHook />)).not.toThrow()
    })
  })
})