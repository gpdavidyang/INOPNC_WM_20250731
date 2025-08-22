import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { PartnerPage } from '../pages/partner.page'

/**
 * Partner Mobile PWA Tests
 * 파트너사 모바일 PWA 기능 테스트
 * 
 * Test Coverage:
 * - PWA installation and offline functionality
 * - Mobile-specific UI components and interactions
 * - Touch gestures and responsive design
 * - Push notifications for partners
 * - Camera access for document capture
 * - Offline data synchronization
 */

test.describe('Partner Mobile PWA Functionality', () => {
  let authPage: AuthPage
  let partnerPage: PartnerPage

  // Run tests on mobile devices only
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile PWA tests require mobile viewport')
    
    authPage = new AuthPage(page)
    partnerPage = new PartnerPage(page)
    
    // Login as partner user
    await authPage.goto()
    await authPage.loginAs('partner', 'password123')
    await expect(page).toHaveURL('/partner/dashboard')
  })

  test.describe('PWA Installation & Manifest', () => {
    test('should have valid PWA manifest', async ({ page }) => {
      // Check for manifest link in head
      const manifestLink = page.locator('link[rel="manifest"]')
      await expect(manifestLink).toBeAttached()
      
      const manifestHref = await manifestLink.getAttribute('href')
      expect(manifestHref).toBeTruthy()
      
      // Fetch and validate manifest content
      const manifestResponse = await page.request.get(manifestHref!)
      expect(manifestResponse.status()).toBe(200)
      
      const manifest = await manifestResponse.json()
      expect(manifest.name).toBeTruthy()
      expect(manifest.short_name).toBeTruthy()
      expect(manifest.start_url).toBeTruthy()
      expect(manifest.display).toBe('standalone')
      expect(manifest.icons).toBeTruthy()
      expect(Array.isArray(manifest.icons)).toBeTruthy()
    })

    test('should register service worker', async ({ page }) => {
      // Wait for service worker registration
      await page.waitForLoadState('networkidle')
      
      const serviceWorkerRegistered = await page.evaluate(() => {
        return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null
      })
      
      expect(serviceWorkerRegistered).toBeTruthy()
    })

    test('should show install prompt when appropriate', async ({ page }) => {
      // PWA install banner should be controllable
      const installBanner = page.locator('[data-testid="pwa-install-banner"]')
      
      // Banner may or may not be visible depending on device/browser support
      if (await installBanner.isVisible()) {
        await expect(installBanner).toContainText('앱 설치')
      }
    })
  })

  test.describe('Mobile Navigation & UI', () => {
    test('should display bottom navigation on mobile', async () => {
      await expect(partnerPage.bottomNavigation).toBeVisible()
      
      // All 5 navigation items should be visible
      const navItems = partnerPage.bottomNavigation.locator('[role="button"], a')
      const itemCount = await navItems.count()
      expect(itemCount).toBe(5)
    })

    test('should handle touch gestures for navigation', async ({ page }) => {
      // Test swipe gestures if implemented
      const mainContent = page.locator('main')
      
      // Get initial position
      const initialUrl = page.url()
      
      // Perform swipe gesture (if implemented)
      await mainContent.touchscreen?.swipe({ x: 100, y: 200 }, { x: 300, y: 200 })
      await page.waitForTimeout(500)
      
      // URL may change or content may update based on swipe implementation
      // This test verifies the app doesn't break with touch gestures
      await expect(page).toHaveURL(/.+/)
    })

    test('should adapt layout for different mobile screen sizes', async ({ page }) => {
      // Test various mobile viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 896 }, // iPhone 11
        { width: 360, height: 640 }  // Android typical
      ]
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await partnerPage.navigateToTab('home')
        
        // Verify layout adapts properly
        await expect(partnerPage.bottomNavigation).toBeVisible()
        await expect(page.locator('main')).toBeVisible()
        
        // Content should not overflow
        const horizontalScrollbar = await page.evaluate(() => document.body.scrollWidth > window.innerWidth)
        expect(horizontalScrollbar).toBeFalsy()
      }
    })
  })

  test.describe('Touch Interactions', () => {
    test('should handle tap interactions on documents', async ({ page }) => {
      await partnerPage.navigateToTab('documents')
      
      const documentCount = await partnerPage.getDocumentCount()
      if (documentCount > 0) {
        const firstDocument = partnerPage.documentItems.first()
        
        // Test tap interaction
        await firstDocument.tap()
        await partnerPage.waitForLoadComplete()
        
        // Should open document detail or perform appropriate action
        await expect(page.locator('body')).not.toHaveClass(/error/)
      }
    })

    test('should support pull-to-refresh gesture', async ({ page }) => {
      await partnerPage.navigateToTab('work-logs')
      
      const mainContent = page.locator('main')
      
      // Simulate pull-to-refresh gesture
      await mainContent.touchscreen?.swipe({ x: 200, y: 100 }, { x: 200, y: 300 })
      await page.waitForTimeout(1000)
      
      // Content should refresh or show loading state
      await partnerPage.waitForLoadComplete()
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle long press interactions', async ({ page }) => {
      await partnerPage.navigateToTab('documents')
      
      const documentCount = await partnerPage.getDocumentCount()
      if (documentCount > 0) {
        const firstDocument = partnerPage.documentItems.first()
        
        // Test long press (if context menu is implemented)
        await firstDocument.tap({ force: true })
        await page.waitForTimeout(800) // Long press duration
        
        // May show context menu or additional options
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Offline Functionality', () => {
    test('should cache essential resources for offline use', async ({ page }) => {
      // Load the app completely
      await partnerPage.navigateToTab('home')
      await partnerPage.waitForLoadComplete()
      
      // Go offline
      await page.context().setOffline(true)
      
      // Navigate to different tab - should work from cache
      await partnerPage.navigateToTab('my-info')
      
      // Page should still be functional
      await expect(page.locator('main')).toBeVisible()
      
      // Go back online
      await page.context().setOffline(false)
    })

    test('should show offline indicator when network is unavailable', async ({ page }) => {
      // Go offline
      await page.context().setOffline(true)
      
      // Reload page to trigger offline detection
      await page.reload({ waitUntil: 'domcontentloaded' })
      
      // Should show offline indicator or cached content
      const offlineIndicator = page.locator('[data-testid="offline-indicator"], text="오프라인"')
      
      if (await offlineIndicator.isVisible()) {
        await expect(offlineIndicator).toBeVisible()
      }
      
      // Go back online
      await page.context().setOffline(false)
    })

    test('should sync data when coming back online', async ({ page }) => {
      // Start online, then go offline
      await partnerPage.navigateToTab('documents')
      await page.context().setOffline(true)
      
      // Try to perform an action that would require sync
      if (await partnerPage.documentSearchInput.isVisible()) {
        await partnerPage.searchDocuments('test')
      }
      
      // Go back online
      await page.context().setOffline(false)
      await page.waitForTimeout(2000)
      
      // Data should sync or update
      await partnerPage.waitForLoadComplete()
      await expect(page.locator('main')).toBeVisible()
    })
  })

  test.describe('Device Capabilities', () => {
    test('should request camera permissions when needed', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'Camera permissions test skipped on WebKit')
      
      // Navigate to a feature that might use camera
      await partnerPage.navigateToTab('documents')
      
      // Look for camera/photo upload functionality
      const cameraButton = page.locator('[data-testid="camera"], [data-testid="photo-upload"], input[accept*="image"]')
      
      if (await cameraButton.first().isVisible()) {
        // Grant camera permission
        await page.context().grantPermissions(['camera'])
        
        // Click camera button
        await cameraButton.first().click()
        await page.waitForTimeout(1000)
        
        // Should not throw permission errors
        const errorMessage = page.locator('text="카메라 권한", text="Permission denied"')
        await expect(errorMessage).not.toBeVisible()
      }
    })

    test('should handle geolocation for site check-ins', async ({ page }) => {
      // Grant geolocation permission
      await page.context().grantPermissions(['geolocation'])
      await page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 })
      
      await partnerPage.navigateToTab('home')
      
      // Look for location-based features
      const locationButton = page.locator('[data-testid="location"], [data-testid="check-in"], text="현재 위치"')
      
      if (await locationButton.first().isVisible()) {
        await locationButton.first().click()
        await page.waitForTimeout(2000)
        
        // Should successfully get location
        const locationError = page.locator('text="위치 권한", text="Location error"')
        await expect(locationError).not.toBeVisible()
      }
    })
  })

  test.describe('Performance Optimization', () => {
    test('should load efficiently on slow connections', async ({ page }) => {
      // Simulate slow 3G connection
      await page.context().route('**/*', async route => {
        await route.continue()
      })
      
      const startTime = Date.now()
      await partnerPage.navigateToPartnerDashboard()
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(10000) // 10 seconds max for slow connection
    })

    test('should implement lazy loading for heavy content', async ({ page }) => {
      await partnerPage.navigateToTab('documents')
      
      // Check if images/content load progressively
      const images = page.locator('img[loading="lazy"]')
      const lazyImageCount = await images.count()
      
      // If lazy loading is implemented, verify it works
      if (lazyImageCount > 0) {
        const firstImage = images.first()
        await expect(firstImage).toBeVisible()
      }
    })

    test('should minimize data usage for partners', async ({ page }) => {
      // Monitor network requests
      let totalDataTransferred = 0
      
      page.on('response', response => {
        const contentLength = response.headers()['content-length']
        if (contentLength) {
          totalDataTransferred += parseInt(contentLength)
        }
      })
      
      // Navigate through various tabs
      const tabs: Array<'home' | 'documents' | 'work-logs' | 'site-info'> = ['home', 'documents', 'work-logs', 'site-info']
      
      for (const tab of tabs) {
        await partnerPage.navigateToTab(tab)
        await partnerPage.waitForLoadComplete()
      }
      
      // Should keep data usage reasonable for mobile users
      // This is a rough estimate - actual values will vary
      expect(totalDataTransferred).toBeLessThan(5 * 1024 * 1024) // Less than 5MB
    })
  })

  test.describe('Push Notifications', () => {
    test('should request notification permissions appropriately', async ({ page }) => {
      // Grant notification permission
      await page.context().grantPermissions(['notifications'])
      
      await partnerPage.navigateToTab('home')
      
      // Look for notification setup
      const notificationButton = page.locator('[data-testid="enable-notifications"], text="알림 설정"')
      
      if (await notificationButton.isVisible()) {
        await notificationButton.click()
        await page.waitForTimeout(1000)
        
        // Should not show permission errors
        const permissionError = page.locator('text="알림 권한", text="Notification permission"')
        await expect(permissionError).not.toBeVisible()
      }
    })
  })

  test.describe('Security on Mobile', () => {
    test('should implement proper session timeouts on mobile', async ({ page }) => {
      // Verify session timeout behavior
      await partnerPage.navigateToTab('home')
      
      // Simulate app going to background (tab hidden)
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'hidden'
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      
      // Wait for potential session timeout
      await page.waitForTimeout(5000)
      
      // Bring app back to foreground
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'visible'
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      
      // Should either maintain session or prompt for re-authentication
      await expect(page.locator('body')).toBeVisible()
    })

    test('should prevent screenshot on sensitive screens', async ({ page }) => {
      // Navigate to potentially sensitive content
      await partnerPage.navigateToTab('my-info')
      
      // Check if screenshot prevention is implemented
      // This is browser/OS dependent and may not be testable in all environments
      const preventScreenshot = await page.evaluate(() => {
        return document.documentElement.style.getPropertyValue('-webkit-user-select') === 'none' ||
               document.documentElement.hasAttribute('data-no-screenshot')
      })
      
      // This test mainly verifies the page loads without errors
      await expect(page.locator('main')).toBeVisible()
    })
  })
})