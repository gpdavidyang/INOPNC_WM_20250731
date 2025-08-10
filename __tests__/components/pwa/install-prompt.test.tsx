/**
 * PWA Install Prompt Component Test Suite
 * Tests for PWA installation prompts, beforeinstallprompt events, and install detection
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@/__tests__/utils/test-utils'
import { jest } from '@jest/globals'
import { InstallPrompt, useIsInstalled } from '@/components/pwa/install-prompt'

// Mock beforeinstallprompt event
const mockBeforeInstallPromptEvent = {
  preventDefault: jest.fn(),
  prompt: jest.fn().mockResolvedValue(undefined),
  userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
  platforms: ['web']
}

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
})

// Create a test wrapper component for useIsInstalled hook
function TestIsInstalledComponent() {
  const isInstalled = useIsInstalled()
  return <div data-testid="is-installed">{isInstalled ? 'installed' : 'not-installed'}</div>
}

describe('InstallPrompt Component', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Reset matchMedia to return false (not standalone)
    ;(window.matchMedia as jest.Mock).mockImplementation(() => ({ matches: false }))
    
    // Reset navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    // Reset navigator.standalone for iOS testing
    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: false
    })
    
    // Spy on addEventListener and removeEventListener
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  describe('Component Rendering', () => {
    it('should not render when app is already installed (standalone mode)', () => {
      // Mock standalone mode detection
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(display-mode: standalone)'
      }))
      
      render(<InstallPrompt />)
      
      // Should not render anything
      expect(screen.queryByText('앱 설치하기')).not.toBeInTheDocument()
    })

    it('should not render when no beforeinstallprompt event available', () => {
      render(<InstallPrompt />)
      
      // Should not render initially (no deferred prompt)
      expect(screen.queryByText('앱 설치하기')).not.toBeInTheDocument()
    })

    it('should not render when install was previously dismissed', () => {
      // Mock dismissed state
      mockLocalStorage.getItem.mockReturnValue('2025-12-31T23:59:59.000Z')
      
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        
        // Fast-forward timer for prompt delay
        jest.advanceTimersByTime(5000)
      })
      
      // Should not show prompt due to dismissal
      expect(screen.queryByText('앱 설치하기')).not.toBeInTheDocument()
    })

    it('should render install prompt after beforeinstallprompt event and delay', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        
        // Fast-forward timer for prompt delay
        jest.advanceTimersByTime(5000)
      })
      
      expect(screen.getByText('앱 설치하기')).toBeInTheDocument()
      expect(screen.getByText('INOPNC 작업관리를 모바일 앱처럼 사용하세요. 빠른 접근과 오프라인 지원을 제공합니다.')).toBeInTheDocument()
    })

    it('should display install and dismiss buttons', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      expect(screen.getByText('설치하기')).toBeInTheDocument()
      expect(screen.getByLabelText('설치 알림 닫기')).toBeInTheDocument()
    })
  })

  describe('iOS Detection', () => {
    it('should detect iOS Safari and not show prompt in standalone mode', () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      })
      
      // Mock iOS standalone mode
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: true
      })
      
      render(<InstallPrompt />)
      
      // Should not render in iOS standalone mode
      expect(screen.queryByText('앱 설치하기')).not.toBeInTheDocument()
    })

    it('should show prompt on iOS Safari not in standalone mode', () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      })
      
      // Mock iOS NOT in standalone mode
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: false
      })
      
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      expect(screen.getByText('앱 설치하기')).toBeInTheDocument()
    })
  })

  describe('Install Functionality', () => {
    it('should call prompt() when install button is clicked', async () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      const installButton = screen.getByText('설치하기')
      fireEvent.click(installButton)
      
      await waitFor(() => {
        expect(mockBeforeInstallPromptEvent.prompt).toHaveBeenCalled()
      })
    })

    it('should hide prompt when user accepts installation', async () => {
      // Mock accepted outcome
      const acceptedEvent = {
        ...mockBeforeInstallPromptEvent,
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
      }
      
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, acceptedEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      const installButton = screen.getByText('설치하기')
      fireEvent.click(installButton)
      
      await waitFor(() => {
        expect(screen.queryByText('앱 설치하기')).not.toBeInTheDocument()
      })
    })

    it('should remain visible when user dismisses installation prompt', async () => {
      // Mock dismissed outcome
      const dismissedEvent = {
        ...mockBeforeInstallPromptEvent,
        userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' })
      }
      
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, dismissedEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      const installButton = screen.getByText('설치하기')
      fireEvent.click(installButton)
      
      // Wait for userChoice to resolve
      await act(async () => {
        await dismissedEvent.userChoice
      })
      
      // Prompt should still be visible since user dismissed
      expect(screen.getByText('앱 설치하기')).toBeInTheDocument()
    })
  })

  describe('Dismiss Functionality', () => {
    it('should hide prompt when dismiss button is clicked', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      const dismissButton = screen.getByLabelText('설치 알림 닫기')
      fireEvent.click(dismissButton)
      
      expect(screen.queryByText('앱 설치하기')).not.toBeInTheDocument()
    })

    it('should save dismissal state to localStorage', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      const dismissButton = screen.getByLabelText('설치 알림 닫기')
      fireEvent.click(dismissButton)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pwa-install-dismissed',
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
      )
    })
  })

  describe('App Installed Event', () => {
    it('should hide prompt when app is installed', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      expect(screen.getByText('앱 설치하기')).toBeInTheDocument()
      
      // Trigger appinstalled event
      act(() => {
        window.dispatchEvent(new Event('appinstalled'))
      })
      
      expect(screen.queryByText('앱 설치하기')).not.toBeInTheDocument()
    })

    it('should clean up localStorage when app is installed', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      // Trigger appinstalled event
      act(() => {
        window.dispatchEvent(new Event('appinstalled'))
      })
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pwa-install-dismissed')
    })
  })

  describe('Event Listeners', () => {
    it('should register event listeners on mount', () => {
      render(<InstallPrompt />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))
    })

    it('should remove event listeners on unmount', () => {
      const { unmount } = render(<InstallPrompt />)
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))
    })
  })

  describe('Responsive Design', () => {
    it('should use responsive positioning classes', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      // Find the outermost container by data-testid or by its className pattern
      const promptContainer = document.querySelector('.fixed.bottom-20')
      expect(promptContainer).toBeInTheDocument()
      expect(promptContainer).toHaveClass('fixed', 'bottom-20', 'left-4', 'right-4', 'z-50')
      expect(promptContainer).toHaveClass('md:bottom-4', 'md:left-auto', 'md:right-4', 'md:max-w-sm')
    })

    it('should display download icon properly', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      // Check for icon container
      const iconContainer = document.querySelector('.bg-blue-600.rounded-lg')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Korean Localization', () => {
    it('should display all text in Korean', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      expect(screen.getByText('앱 설치하기')).toBeInTheDocument()
      expect(screen.getByText('INOPNC 작업관리를 모바일 앱처럼 사용하세요. 빠른 접근과 오프라인 지원을 제공합니다.')).toBeInTheDocument()
      expect(screen.getByText('설치하기')).toBeInTheDocument()
    })

    it('should have proper Korean aria-label', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      expect(screen.getByLabelText('설치 알림 닫기')).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('should include dark mode classes', () => {
      render(<InstallPrompt />)
      
      // Trigger beforeinstallprompt event
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
        jest.advanceTimersByTime(5000)
      })
      
      const promptContainer = screen.getByText('앱 설치하기').closest('.bg-white')
      expect(promptContainer).toHaveClass('dark:bg-gray-800')
      expect(promptContainer).toHaveClass('dark:border-gray-700')
    })
  })
})

describe('useIsInstalled Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset matchMedia
    ;(window.matchMedia as jest.Mock).mockImplementation(() => ({ matches: false }))
    
    // Reset navigator properties
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: false
    })
  })

  describe('Installation Detection', () => {
    it('should return false when app is not installed', () => {
      render(<TestIsInstalledComponent />)
      
      expect(screen.getByTestId('is-installed')).toHaveTextContent('not-installed')
    })

    it('should return true when app is in standalone mode', () => {
      // Mock standalone mode
      ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(display-mode: standalone)'
      }))
      
      render(<TestIsInstalledComponent />)
      
      expect(screen.getByTestId('is-installed')).toHaveTextContent('installed')
    })

    it('should return true for iOS in standalone mode', () => {
      // Mock iOS
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      })
      
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: true
      })
      
      render(<TestIsInstalledComponent />)
      
      expect(screen.getByTestId('is-installed')).toHaveTextContent('installed')
    })

    it('should return false for iOS not in standalone mode', () => {
      // Mock iOS
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      })
      
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: false
      })
      
      render(<TestIsInstalledComponent />)
      
      expect(screen.getByTestId('is-installed')).toHaveTextContent('not-installed')
    })
  })

  describe('Cross-Platform Compatibility', () => {
    const testCases = [
      {
        name: 'Android Chrome',
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        expected: 'not-installed'
      },
      {
        name: 'Windows Edge',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        expected: 'not-installed'
      },
      {
        name: 'macOS Safari',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        expected: 'not-installed'
      }
    ]

    testCases.forEach(({ name, userAgent, expected }) => {
      it(`should handle ${name} correctly`, () => {
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          value: userAgent
        })
        
        render(<TestIsInstalledComponent />)
        
        expect(screen.getByTestId('is-installed')).toHaveTextContent(expected)
      })
    })
  })
})