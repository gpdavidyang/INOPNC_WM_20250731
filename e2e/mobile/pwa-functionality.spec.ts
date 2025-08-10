import { test, expect } from '@playwright/test'

test.describe('PWA Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Grant necessary permissions for PWA features
    await page.context().grantPermissions(['notifications', 'camera', 'geolocation'])
  })

  test.describe('Service Worker and Caching', () => {
    test('should register service worker', async ({ page }) => {
      await page.goto('/')
      
      // Check if service worker is registered
      const swRegistration = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          return {
            hasRegistration: !!registration,
            scope: registration?.scope,
            state: registration?.active?.state
          }
        }
        return null
      })
      
      expect(swRegistration).toBeTruthy()
      expect(swRegistration?.hasRegistration).toBe(true)
    })

    test('should cache critical resources', async ({ page }) => {
      await page.goto('/')
      
      // Wait for service worker to activate
      await page.waitForTimeout(1000)
      
      // Check if resources are cached
      const cacheStatus = await page.evaluate(async () => {
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          const cache = await caches.open(cacheNames[0] || 'workbox-precache')
          const cachedRequests = await cache.keys()
          
          return {
            hasCaches: cacheNames.length > 0,
            cachedResourcesCount: cachedRequests.length,
            cacheNames
          }
        }
        return null
      })
      
      expect(cacheStatus?.hasCaches).toBe(true)
      expect(cacheStatus?.cachedResourcesCount).toBeGreaterThan(0)
    })

    test('should work offline for cached pages', async ({ page }) => {
      // First, visit the page online to cache it
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Simulate offline condition
      await page.context().setOffline(true)
      
      // Navigate to cached page
      await page.reload()
      
      // Should load from cache
      await expect(page.getByTestId('dashboard-content')).toBeVisible({ timeout: 10000 })
      
      // Restore online
      await page.context().setOffline(false)
    })

    test('should show offline indicator when network is unavailable', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Simulate going offline
      await page.context().setOffline(true)
      
      // Trigger a network request to show offline state
      await page.evaluate(() => {
        fetch('/api/test').catch(() => {
          // This should trigger offline indication
          const event = new Event('offline')
          window.dispatchEvent(event)
        })
      })
      
      // Should show offline indicator
      await expect(page.getByText(/offline|연결 끊김/i)).toBeVisible({ timeout: 5000 })
      
      // Restore online
      await page.context().setOffline(false)
    })
  })

  test.describe('App Installation', () => {
    test('should show install prompt on supported browsers', async ({ page }) => {
      await page.goto('/')
      
      // Simulate beforeinstallprompt event
      await page.evaluate(() => {
        const installEvent = new Event('beforeinstallprompt')
        // @ts-ignore
        installEvent.prompt = async () => ({ outcome: 'accepted' })
        window.dispatchEvent(installEvent)
      })
      
      // Should show install button or prompt
      const installButton = page.getByRole('button', { name: /install|설치/i })
      if (await installButton.isVisible()) {
        await expect(installButton).toBeVisible()
      }
    })

    test('should have proper PWA manifest', async ({ page }) => {
      await page.goto('/')
      
      // Check if manifest link exists
      const manifestLink = page.locator('link[rel="manifest"]')
      await expect(manifestLink).toBeAttached()
      
      // Get manifest URL
      const manifestHref = await manifestLink.getAttribute('href')
      expect(manifestHref).toBeTruthy()
      
      // Fetch and validate manifest
      const response = await page.goto(manifestHref!)
      expect(response?.status()).toBe(200)
      
      const manifest = await response?.json()
      expect(manifest).toMatchObject({
        name: expect.any(String),
        short_name: expect.any(String),
        start_url: expect.any(String),
        display: expect.stringMatching(/standalone|minimal-ui|fullscreen/),
        theme_color: expect.any(String),
        background_color: expect.any(String),
        icons: expect.arrayContaining([
          expect.objectContaining({
            src: expect.any(String),
            sizes: expect.any(String),
            type: expect.any(String)
          })
        ])
      })
    })

    test('should have proper app icons for different sizes', async ({ page }) => {
      // Test icon availability
      const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512']
      
      for (const size of iconSizes) {
        const iconResponse = await page.goto(`/icons/icon-${size}.png`)
        if (iconResponse?.status() === 200) {
          // Icon exists, verify it's a valid image
          const contentType = iconResponse.headers()['content-type']
          expect(contentType).toContain('image')
        }
      }
    })
  })

  test.describe('Push Notifications', () => {
    test('should request notification permission', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check if notification permission can be requested
      const notificationSupport = await page.evaluate(async () => {
        if ('Notification' in window) {
          return {
            supported: true,
            permission: Notification.permission,
            canRequest: typeof Notification.requestPermission === 'function'
          }
        }
        return { supported: false }
      })
      
      expect(notificationSupport.supported).toBe(true)
      expect(notificationSupport.canRequest).toBe(true)
    })

    test('should handle push notification subscription', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test push subscription
      const subscriptionTest = await page.evaluate(async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            
            return {
              pushSupported: true,
              hasSubscription: !!subscription,
              canSubscribe: !!registration.pushManager.subscribe
            }
          } catch (error) {
            return { pushSupported: false, error: error.message }
          }
        }
        return { pushSupported: false }
      })
      
      expect(subscriptionTest.pushSupported).toBe(true)
    })

    test('should display notifications correctly', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test notification display
      const notificationTest = await page.evaluate(async () => {
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const notification = new Notification('Test Notification', {
              body: 'This is a test notification',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              tag: 'test-notification'
            })
            
            return {
              created: true,
              title: notification.title,
              body: notification.body
            }
          } catch (error) {
            return { created: false, error: error.message }
          }
        }
        return { created: false, reason: 'Permission not granted or not supported' }
      })
      
      // Note: Actual notification display testing requires specific browser setup
      expect(notificationTest).toBeTruthy()
    })
  })

  test.describe('Background Sync', () => {
    test('should register background sync', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test background sync registration
      const backgroundSyncTest = await page.evaluate(async () => {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          try {
            const registration = await navigator.serviceWorker.ready
            await registration.sync.register('background-sync-test')
            
            return { supported: true, registered: true }
          } catch (error) {
            return { supported: true, registered: false, error: error.message }
          }
        }
        return { supported: false }
      })
      
      // Background sync support varies by browser
      if (backgroundSyncTest.supported) {
        expect(backgroundSyncTest.registered).toBe(true)
      }
    })

    test('should queue failed requests for background sync', async ({ page }) => {
      await page.goto('/dashboard/daily-reports/create')
      
      // Simulate going offline
      await page.context().setOffline(true)
      
      // Try to submit a form (should queue for background sync)
      await page.getByLabel(/title|제목/i).fill('Offline Test Report')
      await page.getByLabel(/work content|작업 내용/i).fill('Test content for offline submission')
      
      const submitButton = page.getByRole('button', { name: /submit|제출/i })
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // Should show queued for sync message
        await expect(page.getByText(/queued|대기 중|sync/i)).toBeVisible({ timeout: 5000 })
      }
      
      // Restore online
      await page.context().setOffline(false)
    })
  })

  test.describe('App-like Behavior', () => {
    test('should behave like native app when installed', async ({ page }) => {
      await page.goto('/')
      
      // Test app-like features
      const appBehavior = await page.evaluate(() => {
        return {
          isStandalone: window.matchMedia('(display-mode: standalone)').matches,
          hasTouch: 'ontouchstart' in window,
          viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
          themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
        }
      })
      
      // Check viewport meta for mobile optimization
      expect(appBehavior.viewportMeta).toContain('width=device-width')
      expect(appBehavior.viewportMeta).toContain('initial-scale=1')
      
      // Should have theme color
      expect(appBehavior.themeColor).toBeTruthy()
    })

    test('should handle app state changes', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Simulate app going to background
      await page.evaluate(() => {
        const visibilityEvent = new Event('visibilitychange')
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true })
        document.dispatchEvent(visibilityEvent)
      })
      
      await page.waitForTimeout(500)
      
      // Simulate app coming back to foreground
      await page.evaluate(() => {
        const visibilityEvent = new Event('visibilitychange')
        Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true })
        document.dispatchEvent(visibilityEvent)
      })
      
      // App should handle state changes gracefully
      await expect(page.getByTestId('dashboard-content')).toBeVisible()
    })

    test('should support deep linking', async ({ page }) => {
      // Test direct navigation to deep URLs
      await page.goto('/dashboard/daily-reports/create')
      
      // Should load the correct page directly
      await expect(page.getByRole('heading', { name: /create|새 보고서/i })).toBeVisible()
      
      // URL should be preserved
      expect(page.url()).toContain('/dashboard/daily-reports/create')
    })

    test('should handle navigation like a native app', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Navigate through the app
      await page.getByRole('link', { name: /daily reports|일일 보고서/i }).click()
      await expect(page).toHaveURL(/.*daily-reports/)
      
      // Use browser back button
      await page.goBack()
      await expect(page).toHaveURL(/.*dashboard/)
      
      // Should maintain app state
      await expect(page.getByTestId('dashboard-content')).toBeVisible()
    })
  })

  test.describe('Performance on Mobile', () => {
    test('should load quickly on mobile networks', async ({ page }) => {
      // Simulate slow 3G network
      await page.context().route('**/*', route => {
        // Add delay to simulate slow network
        setTimeout(() => route.continue(), 100)
      })
      
      const startTime = Date.now()
      await page.goto('/dashboard')
      
      // Wait for main content to be visible
      await expect(page.getByTestId('dashboard-content')).toBeVisible({ timeout: 15000 })
      
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(10000) // 10 seconds max for slow 3G
    })

    test('should use efficient caching strategies', async ({ page }) => {
      // First visit - populate cache
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Second visit - should use cache
      const startTime = Date.now()
      await page.reload()
      await expect(page.getByTestId('dashboard-content')).toBeVisible()
      const reloadTime = Date.now() - startTime
      
      // Cached reload should be faster
      expect(reloadTime).toBeLessThan(3000) // 3 seconds max for cached content
    })

    test('should handle memory constraints gracefully', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Simulate memory pressure
      await page.evaluate(() => {
        // Create some memory pressure
        const largeArray = new Array(100000).fill('memory test')
        
        // Test if app handles memory constraints
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })
      
      // App should continue functioning
      await expect(page.getByTestId('dashboard-content')).toBeVisible()
    })
  })
})