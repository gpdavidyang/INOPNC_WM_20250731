import { test, expect, devices } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'
import { MarkupToolPage } from '../pages/markup-tool.page'

test.describe('Cross-Browser Compatibility Tests', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage
  let markupPage: MarkupToolPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    markupPage = new MarkupToolPage(page)
    
    // Login for all tests
    await authPage.navigateToLogin()
    await authPage.loginAsWorker()
  })

  test.describe('CSS Grid and Flexbox Support', () => {
    test('should display grid layouts correctly across browsers', async ({ page }) => {
      await dashboardPage.expectDashboardVisible()
      
      // Check grid container support
      const gridSupport = await page.evaluate(() => {
        const testDiv = document.createElement('div')
        testDiv.style.display = 'grid'
        document.body.appendChild(testDiv)
        
        const computedStyle = window.getComputedStyle(testDiv)
        const hasGridSupport = computedStyle.display === 'grid'
        
        document.body.removeChild(testDiv)
        return hasGridSupport
      })
      
      expect(gridSupport).toBe(true)
      
      // Verify grid layouts render correctly
      const gridContainers = page.locator('[style*="display: grid"], .grid')
      const gridCount = await gridContainers.count()
      
      for (let i = 0; i < gridCount; i++) {
        const container = gridContainers.nth(i)
        if (await container.isVisible()) {
          const boundingBox = await container.boundingBox()
          expect(boundingBox?.width).toBeGreaterThan(0)
          expect(boundingBox?.height).toBeGreaterThan(0)
        }
      }
    })

    test('should handle flexbox layouts consistently', async ({ page }) => {
      await dashboardPage.expectDashboardVisible()
      
      // Check flexbox support
      const flexSupport = await page.evaluate(() => {
        const testDiv = document.createElement('div')
        testDiv.style.display = 'flex'
        document.body.appendChild(testDiv)
        
        const computedStyle = window.getComputedStyle(testDiv)
        const hasFlexSupport = computedStyle.display === 'flex'
        
        document.body.removeChild(testDiv)
        return hasFlexSupport
      })
      
      expect(flexSupport).toBe(true)
      
      // Test flex containers
      const flexContainers = page.locator('[style*="display: flex"], .flex')
      const flexCount = await flexContainers.count()
      
      for (let i = 0; i < Math.min(flexCount, 5); i++) {
        const container = flexContainers.nth(i)
        if (await container.isVisible()) {
          const flexProperties = await container.evaluate(el => {
            const style = window.getComputedStyle(el)
            return {
              display: style.display,
              flexDirection: style.flexDirection,
              alignItems: style.alignItems,
              justifyContent: style.justifyContent
            }
          })
          
          expect(flexProperties.display).toBe('flex')
        }
      }
    })
  })

  test.describe('JavaScript API Compatibility', () => {
    test('should support modern JavaScript features', async ({ page }) => {
      await page.goto('/dashboard')
      
      const jsSupport = await page.evaluate(() => {
        const features = {
          // ES6+ Features
          arrow_functions: (() => true)(),
          template_literals: `test${1}` === 'test1',
          destructuring: (() => { const [a] = [1]; return a === 1 })(),
          spread_operator: [...[1, 2]].length === 2,
          async_await: typeof (async () => {}) === 'function',
          
          // Web APIs
          fetch: typeof fetch === 'function',
          promises: typeof Promise === 'function',
          intersection_observer: typeof IntersectionObserver === 'function',
          web_workers: typeof Worker === 'function',
          local_storage: typeof localStorage === 'object',
          session_storage: typeof sessionStorage === 'object',
          
          // Canvas API
          canvas: (() => {
            const canvas = document.createElement('canvas')
            return canvas.getContext && canvas.getContext('2d')
          })(),
          
          // File API
          file_reader: typeof FileReader === 'function',
          
          // Geolocation API
          geolocation: 'geolocation' in navigator,
          
          // Touch Events
          touch_events: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        }
        
        return features
      })
      
      // Core modern features should be supported
      expect(jsSupport.arrow_functions).toBe(true)
      expect(jsSupport.template_literals).toBe(true)
      expect(jsSupport.fetch).toBe(true)
      expect(jsSupport.promises).toBe(true)
      expect(jsSupport.local_storage).toBe(true)
      expect(jsSupport.canvas).toBeTruthy()
      expect(jsSupport.file_reader).toBe(true)
    })

    test('should handle Canvas API consistently', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Test Canvas API support
      const canvasSupport = await page.evaluate(() => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) return { supported: false }
        
        // Test basic drawing operations
        ctx.fillStyle = 'red'
        ctx.fillRect(10, 10, 50, 50)
        
        ctx.strokeStyle = 'blue'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(100, 100)
        ctx.stroke()
        
        // Test text rendering
        ctx.fillStyle = 'black'
        ctx.font = '16px Arial'
        ctx.fillText('Test', 10, 30)
        
        // Get image data to verify drawing
        const imageData = ctx.getImageData(0, 0, 100, 100)
        
        return {
          supported: true,
          hasPixelData: imageData.data.length > 0,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height
        }
      })
      
      expect(canvasSupport.supported).toBe(true)
      expect(canvasSupport.hasPixelData).toBe(true)
    })

    test('should support File API for uploads', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      const fileApiSupport = await page.evaluate(() => {
        return {
          fileReader: typeof FileReader === 'function',
          fileList: typeof FileList === 'function',
          file: typeof File === 'function',
          blob: typeof Blob === 'function',
          formData: typeof FormData === 'function',
          dragAndDrop: 'ondrop' in document.createElement('div')
        }
      })
      
      expect(fileApiSupport.fileReader).toBe(true)
      expect(fileApiSupport.file).toBe(true)
      expect(fileApiSupport.blob).toBe(true)
      expect(fileApiSupport.formData).toBe(true)
    })
  })

  test.describe('CSS Features and Styling', () => {
    test('should support CSS custom properties (variables)', async ({ page }) => {
      await page.goto('/dashboard')
      
      const cssSupport = await page.evaluate(() => {
        // Test CSS custom property support
        const testDiv = document.createElement('div')
        testDiv.style.setProperty('--test-color', 'red')
        testDiv.style.color = 'var(--test-color)'
        document.body.appendChild(testDiv)
        
        const computedColor = window.getComputedStyle(testDiv).color
        document.body.removeChild(testDiv)
        
        return {
          customProperties: computedColor === 'red' || computedColor === 'rgb(255, 0, 0)',
          calc: CSS.supports('width', 'calc(100% - 20px)'),
          gradients: CSS.supports('background', 'linear-gradient(red, blue)'),
          transforms: CSS.supports('transform', 'rotate(45deg)'),
          transitions: CSS.supports('transition', 'all 0.3s ease')
        }
      })
      
      expect(cssSupport.customProperties).toBe(true)
      expect(cssSupport.calc).toBe(true)
      expect(cssSupport.transforms).toBe(true)
      expect(cssSupport.transitions).toBe(true)
    })

    test('should render fonts consistently', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test font rendering
      const fontRendering = await page.evaluate(() => {
        const testSpan = document.createElement('span')
        testSpan.textContent = '한글 English 123'
        testSpan.style.fontFamily = 'system-ui, -apple-system, sans-serif'
        testSpan.style.fontSize = '16px'
        document.body.appendChild(testSpan)
        
        const computedStyle = window.getComputedStyle(testSpan)
        const metrics = {
          fontFamily: computedStyle.fontFamily,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          lineHeight: computedStyle.lineHeight,
          textRendering: computedStyle.textRendering || 'auto'
        }
        
        document.body.removeChild(testSpan)
        return metrics
      })
      
      expect(fontRendering.fontSize).toBe('16px')
      expect(fontRendering.fontFamily).toBeTruthy()
    })

    test('should handle responsive design breakpoints', async ({ page }) => {
      const breakpoints = [
        { width: 320, height: 568, name: 'Mobile Small' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1024, height: 768, name: 'Desktop Small' },
        { width: 1920, height: 1080, name: 'Desktop Large' }
      ]
      
      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
        await page.goto('/dashboard')
        
        // Test responsive behavior
        const layoutInfo = await page.evaluate(() => {
          const body = document.body
          const sidebar = document.querySelector('[data-testid="sidebar"]')
          const mainContent = document.querySelector('[data-testid="main-content"]')
          
          return {
            bodyWidth: body.clientWidth,
            bodyHeight: body.clientHeight,
            hasSidebar: !!sidebar && window.getComputedStyle(sidebar).display !== 'none',
            mainContentWidth: mainContent ? mainContent.clientWidth : 0,
            hasHorizontalScroll: body.scrollWidth > body.clientWidth
          }
        })
        
        expect(layoutInfo.bodyWidth).toBe(breakpoint.width)
        expect(layoutInfo.hasHorizontalScroll).toBe(false) // No horizontal scroll
        
        if (breakpoint.width < 768) {
          // Mobile: sidebar should be hidden or overlaid
          // Main content should take full width
          expect(layoutInfo.mainContentWidth).toBeGreaterThan(breakpoint.width * 0.8)
        }
      }
    })
  })

  test.describe('Form and Input Compatibility', () => {
    test('should handle form inputs consistently', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await page.getByRole('button', { name: /create|새로 만들기/i }).click()
      
      // Test different input types
      const inputTests = await page.evaluate(() => {
        const inputTypes = ['text', 'email', 'tel', 'date', 'time', 'number']
        const results: any = {}
        
        inputTypes.forEach(type => {
          const input = document.createElement('input')
          input.type = type
          results[type] = input.type === type // Browser supports this input type
        })
        
        return results
      })
      
      expect(inputTests.text).toBe(true)
      expect(inputTests.email).toBe(true)
      expect(inputTests.date).toBe(true)
      expect(inputTests.number).toBe(true)
    })

    test('should validate forms consistently', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await page.getByRole('button', { name: /create|새로 만들기/i }).click()
      
      // Test form validation
      const titleInput = page.getByLabel(/title|제목/i).first()
      if (await titleInput.isVisible()) {
        await titleInput.fill('')
        
        // Try to submit form
        const submitButton = page.getByRole('button', { name: /submit|제출/i })
        if (await submitButton.isVisible()) {
          await submitButton.click()
          
          // Should show validation error
          const hasValidationError = await page.evaluate(() => {
            return document.querySelector(':invalid') !== null ||
                   document.querySelector('.error') !== null ||
                   document.querySelector('[aria-invalid="true"]') !== null
          })
          
          expect(hasValidationError).toBe(true)
        }
      }
    })
  })

  test.describe('Media and File Handling', () => {
    test('should support image formats consistently', async ({ page }) => {
      await page.goto('/dashboard')
      
      const imageSupport = await page.evaluate(async () => {
        const formats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        const results: any = {}
        
        for (const format of formats) {
          const img = new Image()
          const supported = await new Promise((resolve) => {
            img.onload = () => resolve(true)
            img.onerror = () => resolve(false)
            img.src = `data:${format};base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`
          })
          results[format] = supported
        }
        
        return results
      })
      
      expect(imageSupport['image/jpeg']).toBe(true)
      expect(imageSupport['image/png']).toBe(true)
      expect(imageSupport['image/gif']).toBe(true)
    })

    test('should handle file upload consistently', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Test file input support
      const fileInputSupport = await page.evaluate(() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.accept = 'image/*'
        
        return {
          supportsFiles: input.type === 'file',
          supportsMultiple: input.hasAttribute('multiple'),
          supportsAccept: input.hasAttribute('accept'),
          dragAndDrop: 'ondrop' in input
        }
      })
      
      expect(fileInputSupport.supportsFiles).toBe(true)
      expect(fileInputSupport.supportsMultiple).toBe(true)
      expect(fileInputSupport.supportsAccept).toBe(true)
    })
  })

  test.describe('Network and Storage', () => {
    test('should support localStorage consistently', async ({ page }) => {
      await page.goto('/dashboard')
      
      const storageSupport = await page.evaluate(() => {
        try {
          // Test localStorage
          localStorage.setItem('test', 'value')
          const retrieved = localStorage.getItem('test')
          localStorage.removeItem('test')
          
          // Test sessionStorage
          sessionStorage.setItem('test', 'value')
          const sessionRetrieved = sessionStorage.getItem('test')
          sessionStorage.removeItem('test')
          
          return {
            localStorage: retrieved === 'value',
            sessionStorage: sessionRetrieved === 'value',
            quota: 'storage' in navigator && 'estimate' in navigator.storage
          }
        } catch {
          return { localStorage: false, sessionStorage: false, quota: false }
        }
      })
      
      expect(storageSupport.localStorage).toBe(true)
      expect(storageSupport.sessionStorage).toBe(true)
    })

    test('should handle fetch API consistently', async ({ page }) => {
      await page.goto('/dashboard')
      
      const networkSupport = await page.evaluate(async () => {
        try {
          // Test basic fetch
          const response = await fetch('/api/health', { 
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          })
          
          return {
            fetchSupported: typeof fetch === 'function',
            responseOk: response.ok,
            headersSupported: response.headers instanceof Headers,
            jsonSupported: typeof response.json === 'function'
          }
        } catch (error) {
          return {
            fetchSupported: typeof fetch === 'function',
            error: error.message
          }
        }
      })
      
      expect(networkSupport.fetchSupported).toBe(true)
    })
  })

  test.describe('Performance Features', () => {
    test('should support performance APIs', async ({ page }) => {
      await page.goto('/dashboard')
      
      const performanceSupport = await page.evaluate(() => {
        return {
          performance: typeof performance === 'object',
          performanceNow: typeof performance.now === 'function',
          performanceObserver: typeof PerformanceObserver === 'function',
          intersectionObserver: typeof IntersectionObserver === 'function',
          mutationObserver: typeof MutationObserver === 'function',
          requestAnimationFrame: typeof requestAnimationFrame === 'function',
          requestIdleCallback: typeof requestIdleCallback === 'function'
        }
      })
      
      expect(performanceSupport.performance).toBe(true)
      expect(performanceSupport.performanceNow).toBe(true)
      expect(performanceSupport.requestAnimationFrame).toBe(true)
    })

    test('should measure page load performance', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time across all browsers
      expect(loadTime).toBeLessThan(10000) // 10 seconds max
      
      // Test performance timing API
      const performanceData = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          }
        }
        
        return null
      })
      
      if (performanceData) {
        expect(performanceData.domContentLoaded).toBeGreaterThan(0)
        expect(performanceData.loadComplete).toBeGreaterThan(0)
      }
    })
  })
})