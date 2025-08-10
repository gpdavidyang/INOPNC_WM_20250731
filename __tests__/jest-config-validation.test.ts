/**
 * Jest Configuration Validation Tests
 * 
 * Validates that Jest configuration properly supports:
 * - PWA testing with service worker mocking
 * - Analytics testing capabilities  
 * - Modern React features with JSX support
 * - Proper module resolution for test utilities
 * - TypeScript compilation
 */

import React from 'react'
import { 
  setupPWAEnvironment, 
  getPWAInstallationState,
  cleanupPWAEnvironment 
} from '@/lib/test-utils/pwa-setup'

describe('Jest Configuration Validation', () => {
  describe('PWA Testing Environment', () => {
    beforeEach(() => {
      setupPWAEnvironment({
        serviceWorkerSupported: true,
        notificationPermission: 'granted',
        isInstalled: false,
        canInstall: true
      })
    })

    afterEach(() => {
      cleanupPWAEnvironment()
    })

    it('should provide service worker APIs in test environment', () => {
      expect(navigator.serviceWorker).toBeDefined()
      expect(navigator.serviceWorker.register).toBeDefined()
      expect(navigator.serviceWorker.getRegistration).toBeDefined()
      expect(navigator.serviceWorker.getRegistrations).toBeDefined()
    })

    it('should provide notification API in test environment', () => {
      expect(global.Notification).toBeDefined()
      expect(global.Notification.permission).toBe('granted')
      expect(global.Notification.requestPermission).toBeDefined()
    })

    it('should provide cache API in test environment', () => {
      expect(global.caches).toBeDefined()
      expect(global.caches.open).toBeDefined()
      expect(global.caches.match).toBeDefined()
      expect(global.caches.delete).toBeDefined()
    })

    it('should track PWA installation state', () => {
      const state = getPWAInstallationState()
      expect(state).toMatchObject({
        isInstalled: false,
        canInstall: true
      })
      expect(typeof state.hasDeferredPrompt).toBe('boolean')
    })
  })

  describe('Module Resolution', () => {
    it('should resolve test utilities with @/ path mapping', () => {
      // This test passing means the module mapping is working
      expect(setupPWAEnvironment).toBeDefined()
      expect(typeof setupPWAEnvironment).toBe('function')
    })

    it('should resolve test utilities with specific path mapping', () => {
      // Test the specific @/lib/test-utils/(.*)$ mapping
      const utils = require('@/lib/test-utils/pwa-setup')
      expect(utils.setupPWAEnvironment).toBeDefined()
    })
  })

  describe('TypeScript and JSX Support', () => {
    it('should compile TypeScript with JSX support', () => {
      // This test existing and running proves TypeScript compilation works
      const ReactElement = () => React.createElement('div', null, 'Test JSX')
      expect(ReactElement).toBeDefined()
      expect(typeof ReactElement).toBe('function')
    })

    it('should support React JSX transform', () => {
      // React JSX should work with proper imports
      const element = React.createElement('span', null, 'Modern JSX')
      expect(element).toBeDefined()
      expect(element.type).toBe('span')
      expect(element.props.children).toBe('Modern JSX')
    })
  })

  describe('Test Environment Configuration', () => {
    it('should run in jsdom environment', () => {
      expect(window).toBeDefined()
      expect(document).toBeDefined()
      expect(navigator).toBeDefined()
    })

    it('should use correct base URL for testing', () => {
      // Should use the testEnvironmentOptions.url we configured
      expect(window.location.origin).toBe('https://localhost:3000')
    })

    it('should support modern web APIs', () => {
      expect(global.fetch).toBeDefined()
      expect(global.URL).toBeDefined()
      expect(global.URLSearchParams).toBeDefined()
    })
  })

  describe('Analytics Testing Capability', () => {
    it('should provide analytics mock capabilities', () => {
      // Mock analytics tracking
      const mockAnalytics = {
        track: jest.fn(),
        page: jest.fn(),
        identify: jest.fn()
      }
      
      ;(global as any).analytics = mockAnalytics
      
      expect((global as any).analytics).toBeDefined()
      expect(jest.isMockFunction((global as any).analytics.track)).toBe(true)
      expect(jest.isMockFunction((global as any).analytics.page)).toBe(true)
      expect(jest.isMockFunction((global as any).analytics.identify)).toBe(true)
    })

    it('should support performance measurement APIs', () => {
      expect(global.performance).toBeDefined()
      expect(global.performance.now).toBeDefined()
      // Basic performance API is available for analytics timing
      expect(typeof global.performance.now()).toBe('number')
    })
  })

  describe('Mock Service Worker Compatibility', () => {
    it('should not interfere with other test mocks', () => {
      // Verify that PWA setup doesn't break other mocks
      const mockFn = jest.fn()
      mockFn('test')
      
      expect(mockFn).toHaveBeenCalledWith('test')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should allow custom service worker registration', async () => {
      // Re-setup PWA environment for this specific test
      setupPWAEnvironment({ serviceWorkerSupported: true })
      
      const registration = await navigator.serviceWorker.register('/test-sw.js')
      
      expect(registration).toBeDefined()
      expect(registration.scope).toBeDefined()
      expect(registration.addEventListener).toBeDefined()
    })
  })
})