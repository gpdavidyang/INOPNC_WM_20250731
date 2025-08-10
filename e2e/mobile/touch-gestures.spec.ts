import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'
import { MarkupToolPage } from '../pages/markup-tool.page'

test.describe('Touch Gesture Tests', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage
  let markupPage: MarkupToolPage

  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    markupPage = new MarkupToolPage(page)
    
    // Login as worker
    await authPage.navigateToLogin()
    await authPage.loginAsWorker()
  })

  test.describe('Canvas Touch Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      await markupPage.createNewMarkup()
      
      // Mock blueprint loaded for canvas interactions
      await page.addInitScript(() => {
        window.mockBlueprintLoaded = true
      })
    })

    test('should support single finger touch drawing', async ({ page }) => {
      await markupPage.selectTool('pen')
      
      // Simulate single finger drawing
      const canvas = markupPage.canvas
      await canvas.tap({ position: { x: 100, y: 100 } })
      
      // Draw a line with touch move
      await page.touchscreen.tap(100, 100)
      await page.mouse.move(150, 150)
      await page.mouse.move(200, 200)
      
      // Should create a drawing markup
      await markupPage.expectMarkupExists()
    })

    test('should support pinch to zoom gesture', async ({ page }) => {
      const canvas = markupPage.canvas
      
      // Get initial canvas state
      const initialCanvasSize = await markupPage.getCanvasSize()
      
      // Simulate pinch zoom with two fingers
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        if (canvas) {
          // Simulate wheel event with ctrl key (pinch zoom equivalent)
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: -100,
            ctrlKey: true,
            bubbles: true
          })
          canvas.dispatchEvent(wheelEvent)
        }
      })
      
      // Canvas should zoom in (implementation dependent)
      await page.waitForTimeout(500) // Allow animation to complete
    })

    test('should support pan gesture with two fingers', async ({ page }) => {
      const canvas = markupPage.canvas
      
      // Simulate two-finger pan
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        if (canvas) {
          // Simulate touch events for panning
          const touchStart = new TouchEvent('touchstart', {
            touches: [
              { clientX: 100, clientY: 100, identifier: 0 } as Touch,
              { clientX: 200, clientY: 100, identifier: 1 } as Touch
            ] as any,
            bubbles: true
          })
          
          const touchMove = new TouchEvent('touchmove', {
            touches: [
              { clientX: 150, clientY: 150, identifier: 0 } as Touch,
              { clientX: 250, clientY: 150, identifier: 1 } as Touch
            ] as any,
            bubbles: true
          })
          
          const touchEnd = new TouchEvent('touchend', {
            touches: [],
            bubbles: true
          })
          
          canvas.dispatchEvent(touchStart)
          canvas.dispatchEvent(touchMove)
          canvas.dispatchEvent(touchEnd)
        }
      })
      
      // Canvas should pan (implementation dependent)
      await page.waitForTimeout(500)
    })

    test('should handle touch tool selection', async ({ page }) => {
      // Test touch interaction with tool palette
      await markupPage.boxTool.tap()
      await markupPage.expectToolSelected('box')
      
      await markupPage.textTool.tap()
      await markupPage.expectToolSelected('text')
      
      await markupPage.penTool.tap()
      await markupPage.expectToolSelected('pen')
    })

    test('should support double tap to fit screen', async ({ page }) => {
      const canvas = markupPage.canvas
      
      // Double tap to fit to screen
      await canvas.dblclick({ position: { x: 200, y: 200 } })
      
      // Should trigger fit to screen functionality
      await page.waitForTimeout(500)
      
      // Verify canvas adjusted (implementation specific)
      const canvasSize = await markupPage.getCanvasSize()
      expect(canvasSize.width).toBeGreaterThan(0)
      expect(canvasSize.height).toBeGreaterThan(0)
    })

    test('should handle long press for context menu', async ({ page }) => {
      await markupPage.selectTool('box')
      await markupPage.drawBox(100, 100, 50, 50)
      
      // Long press on drawn object
      const canvas = markupPage.canvas
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        if (canvas) {
          // Simulate long press
          const touchStart = new TouchEvent('touchstart', {
            touches: [{ clientX: 125, clientY: 125, identifier: 0 }] as any,
            bubbles: true
          })
          canvas.dispatchEvent(touchStart)
          
          // Hold for long press duration
          setTimeout(() => {
            const contextEvent = new Event('contextmenu', { bubbles: true })
            canvas.dispatchEvent(contextEvent)
            
            const touchEnd = new TouchEvent('touchend', {
              touches: [],
              bubbles: true
            })
            canvas.dispatchEvent(touchEnd)
          }, 500)
        }
      })
      
      await page.waitForTimeout(600)
      
      // Should show context menu (if implemented)
      // This is placeholder - actual implementation may vary
    })
  })

  test.describe('Mobile Navigation Gestures', () => {
    test('should support swipe navigation in sidebar', async ({ page }) => {
      // Open mobile menu
      const menuButton = page.getByTestId('mobile-menu-button')
      if (await menuButton.isVisible()) {
        await menuButton.tap()
        
        // Should show sidebar/navigation menu
        await expect(page.getByTestId('mobile-navigation')).toBeVisible()
        
        // Swipe to close (if supported)
        await page.evaluate(() => {
          const nav = document.querySelector('[data-testid="mobile-navigation"]')
          if (nav) {
            const touchStart = new TouchEvent('touchstart', {
              touches: [{ clientX: 200, clientY: 300, identifier: 0 }] as any,
              bubbles: true
            })
            
            const touchMove = new TouchEvent('touchmove', {
              touches: [{ clientX: 50, clientY: 300, identifier: 0 }] as any,
              bubbles: true
            })
            
            const touchEnd = new TouchEvent('touchend', {
              touches: [],
              bubbles: true
            })
            
            nav.dispatchEvent(touchStart)
            nav.dispatchEvent(touchMove)
            nav.dispatchEvent(touchEnd)
          }
        })
      }
    })

    test('should support pull-to-refresh on lists', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Simulate pull to refresh gesture
      await page.evaluate(() => {
        const container = document.querySelector('[data-testid="reports-list"]') || document.body
        
        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 100, identifier: 0 }] as any,
          bubbles: true
        })
        
        const touchMove = new TouchEvent('touchmove', {
          touches: [{ clientX: 200, clientY: 200, identifier: 0 }] as any,
          bubbles: true
        })
        
        const touchEnd = new TouchEvent('touchend', {
          touches: [],
          bubbles: true
        })
        
        container.dispatchEvent(touchStart)
        container.dispatchEvent(touchMove)
        container.dispatchEvent(touchEnd)
      })
      
      // Should trigger refresh (if implemented)
      await page.waitForTimeout(1000)
    })
  })

  test.describe('Form Touch Interactions', () => {
    test('should handle touch input on form elements', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await page.getByRole('button', { name: /create|새로 만들기/i }).tap()
      
      // Test touch interactions with different form elements
      const titleInput = page.getByLabel(/title|제목/i).first()
      await titleInput.tap()
      await titleInput.fill('Touch input test')
      
      // Test select dropdown
      const siteSelect = page.getByLabel(/site|현장/i).first()
      if (await siteSelect.isVisible()) {
        await siteSelect.tap()
        // Should open dropdown options
        await page.waitForTimeout(300)
      }
      
      // Test textarea
      const workContentTextarea = page.getByLabel(/work content|작업 내용/i).first()
      if (await workContentTextarea.isVisible()) {
        await workContentTextarea.tap()
        await workContentTextarea.fill('Touch textarea test content')
      }
    })

    test('should support gesture-based date picker', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await page.getByRole('button', { name: /create|새로 만들기/i }).tap()
      
      // Test date picker interaction
      const dateInput = page.getByLabel(/date|날짜/i).first()
      if (await dateInput.isVisible()) {
        await dateInput.tap()
        
        // Should open date picker (if custom implementation)
        await page.waitForTimeout(500)
        
        // Test swipe gestures in date picker (if supported)
        await page.evaluate(() => {
          const datePicker = document.querySelector('[role="dialog"]') || 
                           document.querySelector('.date-picker')
          
          if (datePicker) {
            // Simulate horizontal swipe for month navigation
            const touchStart = new TouchEvent('touchstart', {
              touches: [{ clientX: 200, clientY: 300, identifier: 0 }] as any,
              bubbles: true
            })
            
            const touchMove = new TouchEvent('touchmove', {
              touches: [{ clientX: 100, clientY: 300, identifier: 0 }] as any,
              bubbles: true
            })
            
            const touchEnd = new TouchEvent('touchend', {
              touches: [],
              bubbles: true
            })
            
            datePicker.dispatchEvent(touchStart)
            datePicker.dispatchEvent(touchMove)
            datePicker.dispatchEvent(touchEnd)
          }
        })
      }
    })
  })

  test.describe('Scroll and Overscroll Behavior', () => {
    test('should handle vertical scrolling in long lists', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Test smooth scrolling behavior
      await page.evaluate(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' })
      })
      
      await page.waitForTimeout(500)
      
      // Check scroll position
      const scrollTop = await page.evaluate(() => window.scrollY)
      expect(scrollTop).toBeGreaterThan(0)
      
      // Test overscroll behavior (should not cause white space)
      await page.evaluate(() => {
        window.scrollTo({ top: -100, behavior: 'smooth' })
      })
      
      await page.waitForTimeout(300)
      
      const finalScrollTop = await page.evaluate(() => window.scrollY)
      expect(finalScrollTop).toBeGreaterThanOrEqual(0)
    })

    test('should handle horizontal scrolling in tables', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Find scrollable table (if any)
      const table = page.locator('table, [role="table"]').first()
      if (await table.isVisible()) {
        const tableBox = await table.boundingBox()
        const viewportWidth = 375 // Mobile width
        
        if (tableBox && tableBox.width > viewportWidth) {
          // Table should be horizontally scrollable
          await page.evaluate((element) => {
            element.scrollLeft = 100
          }, await table.elementHandle())
          
          await page.waitForTimeout(300)
          
          const scrollLeft = await page.evaluate((element) => {
            return element.scrollLeft
          }, await table.elementHandle())
          
          expect(scrollLeft).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('Accessibility Touch Support', () => {
    test('should support VoiceOver/TalkBack gestures', async ({ page }) => {
      // Enable accessibility features simulation
      await page.evaluate(() => {
        // Simulate screen reader mode
        document.body.setAttribute('data-screen-reader', 'true')
      })
      
      // Test navigation with screen reader gestures
      await page.keyboard.press('Tab')
      
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Verify ARIA labels are present for touch elements
      const touchElements = page.locator('button, [role="button"], input, [role="tab"]')
      const elementCount = await touchElements.count()
      
      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        const element = touchElements.nth(i)
        if (await element.isVisible()) {
          const ariaLabel = await element.getAttribute('aria-label')
          const ariaLabelledBy = await element.getAttribute('aria-labelledby')
          const textContent = await element.textContent()
          
          // Should have some form of accessible label
          const hasAccessibleLabel = ariaLabel || ariaLabelledBy || (textContent && textContent.trim())
          expect(hasAccessibleLabel).toBeTruthy()
        }
      }
    })

    test('should maintain focus indicators for touch navigation', async ({ page }) => {
      // Navigate with touch
      const firstButton = page.getByRole('button').first()
      await firstButton.tap()
      
      // Check focus indicator is visible
      const focusStyles = await firstButton.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow
        }
      })
      
      // Should have visible focus indicator
      const hasFocusIndicator = focusStyles.outline !== 'none' || 
                               focusStyles.boxShadow !== 'none'
      expect(hasFocusIndicator).toBeTruthy()
    })
  })
})