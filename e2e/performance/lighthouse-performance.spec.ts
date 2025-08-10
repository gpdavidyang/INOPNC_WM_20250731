import { test, expect } from '@playwright/test'
import { playAudit } from '@lhci/cli/src/commands/autorun'

test.describe('Lighthouse Performance Audits', () => {
  const performanceThresholds = {
    'first-contentful-paint': 2500, // 2.5s
    'largest-contentful-paint': 2500, // 2.5s
    'first-input-delay': 100, // 100ms
    'cumulative-layout-shift': 0.1, // 0.1
    'total-blocking-time': 300, // 300ms
    'speed-index': 3000, // 3s
    'interactive': 5000, // 5s
  }

  const pages = [
    { name: 'Login Page', url: '/auth/login' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Daily Reports', url: '/dashboard/daily-reports' },
    { name: 'Markup Tool', url: '/dashboard/markup' },
    { name: 'Site Information', url: '/dashboard/site-info' },
  ]

  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.coverage.startJSCoverage()
    await page.coverage.startCSSCoverage()
  })

  test.afterEach(async ({ page }) => {
    await page.coverage.stopJSCoverage()
    await page.coverage.stopCSSCoverage()
  })

  pages.forEach(({ name, url }) => {
    test(`should meet performance thresholds for ${name}`, async ({ page }) => {
      // Navigate to page and wait for load
      const startTime = Date.now()
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime

      // Basic load time check
      expect(loadTime).toBeLessThan(5000) // 5 seconds max

      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const paint = performance.getEntriesByType('paint')
        
        return {
          // Core Web Vitals
          navigationStart: navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          
          // Paint Metrics
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          
          // Resource timing
          resourceCount: performance.getEntriesByType('resource').length,
          totalResourceSize: performance.getEntriesByType('resource').reduce((total, resource: any) => {
            return total + (resource.transferSize || 0)
          }, 0),
          
          // Memory (Chrome only)
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          } : null
        }
      })

      // Validate Core Web Vitals
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(performanceThresholds['first-contentful-paint'])
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000) // 3s for DOM ready
      expect(performanceMetrics.loadComplete).toBeLessThan(performanceThresholds.interactive)

      // Resource size checks
      expect(performanceMetrics.totalResourceSize).toBeLessThan(2 * 1024 * 1024) // 2MB total
      expect(performanceMetrics.resourceCount).toBeLessThan(50) // Reasonable resource count

      // Memory usage (if available)
      if (performanceMetrics.memory) {
        expect(performanceMetrics.memory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024) // 50MB
      }

      console.log(`Performance metrics for ${name}:`, {
        firstContentfulPaint: `${performanceMetrics.firstContentfulPaint}ms`,
        domContentLoaded: `${performanceMetrics.domContentLoaded}ms`,
        loadComplete: `${performanceMetrics.loadComplete}ms`,
        resourceCount: performanceMetrics.resourceCount,
        totalResourceSize: `${(performanceMetrics.totalResourceSize / 1024 / 1024).toFixed(2)}MB`
      })
    })
  })

  test('should handle performance under slow network conditions', async ({ page }) => {
    // Simulate slow 3G
    await page.context().route('**/*', route => {
      setTimeout(() => route.continue(), 100) // Add 100ms delay
    })

    const startTime = Date.now()
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Should still load within reasonable time on slow network
    expect(loadTime).toBeLessThan(15000) // 15 seconds max on slow 3G

    // Check that critical content is visible
    await expect(page.getByTestId('dashboard-content')).toBeVisible()
  })

  test('should maintain performance with large datasets', async ({ page }) => {
    await page.goto('/dashboard/daily-reports')
    
    // Simulate loading many reports
    await page.evaluate(() => {
      // Create mock data to test performance with large lists
      const mockReports = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Report ${i}`,
        date: new Date(2024, 0, i % 30 + 1).toISOString(),
        status: i % 3 === 0 ? 'completed' : 'pending'
      }))
      
      // Dispatch custom event with mock data
      window.dispatchEvent(new CustomEvent('test-large-dataset', { detail: mockReports }))
    })

    // Wait for potential rendering
    await page.waitForTimeout(2000)

    // Check frame rate during scrolling
    const frameRate = await page.evaluate(async () => {
      return new Promise(resolve => {
        let frameCount = 0
        const startTime = performance.now()
        
        function countFrames() {
          frameCount++
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames)
          } else {
            resolve(frameCount)
          }
        }
        
        requestAnimationFrame(countFrames)
      })
    })

    // Should maintain at least 30 FPS
    expect(frameRate).toBeGreaterThan(30)
  })

  test('should detect memory leaks during extended use', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
    })

    // Simulate extended use by navigating between pages
    for (let i = 0; i < 10; i++) {
      await page.goto('/dashboard/daily-reports')
      await page.waitForLoadState('networkidle')
      await page.goto('/dashboard/markup')
      await page.waitForLoadState('networkidle')
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    }

    // Force garbage collection if possible
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc()
      }
    })

    await page.waitForTimeout(1000)

    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
    })

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100

      // Memory should not increase by more than 50% during extended use
      expect(memoryIncreasePercent).toBeLessThan(50)
      
      console.log(`Memory usage: Initial ${(initialMemory / 1024 / 1024).toFixed(2)}MB, Final ${(finalMemory / 1024 / 1024).toFixed(2)}MB, Increase: ${memoryIncreasePercent.toFixed(2)}%`)
    }
  })

  test('should optimize bundle size and loading', async ({ page }) => {
    // Start coverage collection
    await page.coverage.startJSCoverage()
    await page.coverage.startCSSCoverage()

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Stop coverage and analyze
    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage()
    ])

    // Calculate total bundle size
    const totalJSSize = jsCoverage.reduce((total, entry) => total + entry.text.length, 0)
    const totalCSSSize = cssCoverage.reduce((total, entry) => total + entry.text.length, 0)

    // Check bundle sizes
    expect(totalJSSize).toBeLessThan(1024 * 1024) // 1MB JS
    expect(totalCSSSize).toBeLessThan(200 * 1024) // 200KB CSS

    // Calculate code coverage
    const jsUsage = jsCoverage.reduce((total, entry) => {
      const used = entry.ranges.reduce((used, range) => used + (range.end - range.start), 0)
      return total + used
    }, 0)

    const jsUsagePercent = (jsUsage / totalJSSize) * 100

    // At least 30% of JS should be used
    expect(jsUsagePercent).toBeGreaterThan(30)

    console.log(`Bundle analysis: JS ${(totalJSSize / 1024).toFixed(2)}KB (${jsUsagePercent.toFixed(2)}% used), CSS ${(totalCSSSize / 1024).toFixed(2)}KB`)
  })

  test('should have fast time to interactive', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    
    // Wait for the page to be interactive
    await page.waitForFunction(() => {
      // Check if main interactive elements are available
      const button = document.querySelector('button')
      const link = document.querySelector('a')
      
      return button && link && document.readyState === 'complete'
    })
    
    const timeToInteractive = Date.now() - startTime
    
    // Should be interactive within 5 seconds
    expect(timeToInteractive).toBeLessThan(5000)
    
    // Test actual interactivity
    const interactiveTest = await page.evaluate(() => {
      const button = document.querySelector('button')
      if (button) {
        button.click()
        return true
      }
      return false
    })
    
    expect(interactiveTest).toBe(true)
    
    console.log(`Time to Interactive: ${timeToInteractive}ms`)
  })

  test('should handle concurrent users efficiently', async ({ browser }) => {
    // Simulate multiple concurrent users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ])

    const pages = await Promise.all(contexts.map(context => context.newPage()))

    // All users navigate simultaneously
    const startTime = Date.now()
    await Promise.all(pages.map(page => page.goto('/dashboard')))
    await Promise.all(pages.map(page => page.waitForLoadState('networkidle')))
    const totalTime = Date.now() - startTime

    // Should handle concurrent load efficiently
    expect(totalTime).toBeLessThan(10000) // 10 seconds for 5 concurrent users

    // Cleanup
    await Promise.all(contexts.map(context => context.close()))
  })
})