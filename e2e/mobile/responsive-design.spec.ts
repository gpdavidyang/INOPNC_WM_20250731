import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Responsive Design Tests', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Galaxy S9+', width: 320, height: 658 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ]

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    
    // Login as worker for all tests
    await authPage.navigateToLogin()
    await authPage.loginAsWorker()
  })

  viewports.forEach(viewport => {
    test(`should display correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      
      // Test dashboard layout
      await dashboardPage.expectDashboardVisible()
      
      // Check navigation is accessible
      if (viewport.width < 768) {
        // Mobile: should have hamburger menu
        await expect(page.getByTestId('mobile-menu-button')).toBeVisible()
      } else {
        // Desktop/tablet: should have full sidebar
        await expect(page.getByTestId('sidebar')).toBeVisible()
      }
      
      // Check main content is not cut off
      const mainContent = page.getByTestId('main-content')
      await expect(mainContent).toBeVisible()
      
      // Verify no horizontal scrolling on mobile
      if (viewport.width < 768) {
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
        const bodyClientWidth = await page.evaluate(() => document.body.clientWidth)
        expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1) // Allow 1px tolerance
      }
    })
  })

  test('should have touch-friendly button sizes on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    
    // Check primary action buttons meet minimum touch target size (44x44px)
    const primaryButtons = [
      page.getByRole('button', { name: /create report|새 보고서/i }),
      page.getByRole('button', { name: /save|저장/i }),
      page.getByRole('button', { name: /submit|제출/i }),
    ]
    
    for (const button of primaryButtons) {
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox()
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44)
          expect(boundingBox.width).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })

  test('should adapt form layouts for mobile screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to daily reports form
    await dashboardPage.navigateToDailyReports()
    await page.getByRole('button', { name: /create|새로 만들기/i }).click()
    
    // Check form elements stack vertically on mobile
    const formFields = page.locator('input, textarea, select').all()
    const fieldPositions: { x: number; y: number }[] = []
    
    for (const field of await formFields) {
      if (await field.isVisible()) {
        const box = await field.boundingBox()
        if (box) {
          fieldPositions.push({ x: box.x, y: box.y })
        }
      }
    }
    
    // Verify fields are stacked (y positions increase)
    for (let i = 1; i < fieldPositions.length; i++) {
      expect(fieldPositions[i].y).toBeGreaterThan(fieldPositions[i - 1].y)
    }
  })

  test('should handle orientation changes gracefully', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 })
    await dashboardPage.expectDashboardVisible()
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 })
    
    // Verify content is still accessible
    await dashboardPage.expectDashboardVisible()
    
    // Check navigation adapts to landscape
    await expect(page.getByTestId('sidebar').or(page.getByTestId('mobile-menu-button'))).toBeVisible()
  })

  test('should optimize images for different screen densities', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 14
    
    // Check if images use appropriate sizes
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const src = await img.getAttribute('src')
      const srcset = await img.getAttribute('srcset')
      
      // Verify images have either srcset for responsive images or appropriate sizing
      if (src && !src.startsWith('data:')) {
        const isResponsive = srcset !== null || await img.getAttribute('sizes') !== null
        expect(isResponsive).toBeTruthy()
      }
    }
  })

  test('should handle long text gracefully on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }) // Smallest common mobile size
    
    await dashboardPage.navigateToDailyReports()
    
    // Check that text doesn't overflow containers
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6')
    const elementCount = await textElements.count()
    
    for (let i = 0; i < Math.min(elementCount, 10); i++) { // Check first 10 elements
      const element = textElements.nth(i)
      if (await element.isVisible()) {
        const elementBox = await element.boundingBox()
        const parentBox = await element.locator('..').boundingBox()
        
        if (elementBox && parentBox) {
          // Text should not overflow parent container horizontally
          expect(elementBox.x + elementBox.width).toBeLessThanOrEqual(parentBox.x + parentBox.width + 5) // 5px tolerance
        }
      }
    }
  })

  test('should have accessible focus indicators on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    
    // Check that focused element has visible focus indicator
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Check focus indicator styles
    const focusStyles = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      }
    })
    
    // Should have either outline or box-shadow for focus
    const hasFocusIndicator = focusStyles.outline !== 'none' || 
                             focusStyles.outlineWidth !== '0px' || 
                             focusStyles.boxShadow !== 'none'
    expect(hasFocusIndicator).toBeTruthy()
  })

  test('should display error messages clearly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to login and trigger validation error
    await page.goto('/auth/login')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check error messages are visible and readable
    const errorMessages = page.locator('[role="alert"], .error-message, .text-red-500')
    const errorCount = await errorMessages.count()
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i)
        await expect(error).toBeVisible()
        
        // Check error text is not too small
        const fontSize = await error.evaluate(el => {
          return parseInt(window.getComputedStyle(el).fontSize)
        })
        expect(fontSize).toBeGreaterThanOrEqual(14) // Minimum readable size on mobile
      }
    }
  })

  test('should handle keyboard input properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to a form
    await dashboardPage.navigateToDailyReports()
    await page.getByRole('button', { name: /create|새로 만들기/i }).click()
    
    // Test text input
    const textInput = page.getByLabel(/title|제목/i).first()
    await textInput.click()
    
    // Verify keyboard doesn't obscure the input (mobile viewport should adjust)
    const inputBox = await textInput.boundingBox()
    if (inputBox) {
      // Input should be visible in viewport
      expect(inputBox.y).toBeGreaterThanOrEqual(0)
      expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(667)
    }
    
    await textInput.fill('Test mobile input')
    await expect(textInput).toHaveValue('Test mobile input')
  })
})