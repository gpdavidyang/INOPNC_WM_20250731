import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright'

test.describe('WCAG 2.1 AA Compliance Tests', () => {
  const pages = [
    { name: 'Login Page', url: '/auth/login' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Daily Reports List', url: '/dashboard/daily-reports' },
    { name: 'Daily Reports Create', url: '/dashboard/daily-reports/create' },
    { name: 'Markup Tool', url: '/dashboard/markup' },
    { name: 'Site Information', url: '/dashboard/site-info' },
    { name: 'Attendance', url: '/dashboard/attendance' },
  ]

  test.beforeEach(async ({ page }) => {
    // Inject axe-core for accessibility testing
    await injectAxe(page)
  })

  pages.forEach(({ name, url }) => {
    test(`should meet WCAG 2.1 AA standards for ${name}`, async ({ page }) => {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      
      // Run accessibility audit
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
      })
    })
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard')
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    const headingLevels: number[] = []
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName)
      const level = parseInt(tagName.charAt(1))
      headingLevels.push(level)
    }
    
    // Check heading hierarchy
    for (let i = 1; i < headingLevels.length; i++) {
      const prevLevel = headingLevels[i - 1]
      const currentLevel = headingLevels[i]
      
      // Heading levels should not skip (e.g., h1 -> h3)
      if (currentLevel > prevLevel) {
        expect(currentLevel - prevLevel).toBeLessThanOrEqual(1)
      }
    }
    
    // Should have exactly one h1
    const h1Count = headingLevels.filter(level => level === 1).length
    expect(h1Count).toBe(1)
  })

  test('should have accessible form labels and descriptions', async ({ page }) => {
    await page.goto('/dashboard/daily-reports/create')
    
    // Check all form inputs have labels
    const inputs = page.locator('input, textarea, select')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const inputType = await input.getAttribute('type')
      
      // Skip hidden inputs
      if (inputType === 'hidden') continue
      
      // Check for label association
      const labelId = await input.getAttribute('aria-labelledby')
      const ariaLabel = await input.getAttribute('aria-label')
      const associatedLabel = page.locator(`label[for="${await input.getAttribute('id')}"]`)
      
      const hasLabel = labelId || ariaLabel || (await associatedLabel.count() > 0)
      expect(hasLabel).toBeTruthy()
      
      // Check for required field indicators
      const isRequired = await input.getAttribute('required') !== null
      if (isRequired) {
        const ariaRequired = await input.getAttribute('aria-required')
        expect(ariaRequired).toBe('true')
      }
    }
  })

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Start keyboard navigation
    await page.keyboard.press('Tab')
    
    // Collect all focusable elements
    const focusableElements = []
    let attempts = 0
    const maxAttempts = 50
    
    while (attempts < maxAttempts) {
      const focusedElement = page.locator(':focus')
      const elementExists = await focusedElement.count() > 0
      
      if (elementExists) {
        const tagName = await focusedElement.evaluate(el => el.tagName)
        const role = await focusedElement.getAttribute('role')
        const tabIndex = await focusedElement.getAttribute('tabindex')
        
        focusableElements.push({ tagName, role, tabIndex })
        
        // Check focus indicator is visible
        const focusStyles = await focusedElement.evaluate(el => {
          const styles = window.getComputedStyle(el)
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          }
        })
        
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' || 
          focusStyles.outlineWidth !== '0px' || 
          focusStyles.boxShadow !== 'none'
        
        expect(hasFocusIndicator).toBeTruthy()
      }
      
      await page.keyboard.press('Tab')
      attempts++
    }
    
    // Should have found focusable elements
    expect(focusableElements.length).toBeGreaterThan(0)
  })

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for landmarks
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').count()
    expect(landmarks).toBeGreaterThan(0)
    
    // Check for skip links
    const skipLinks = page.locator('a[href^="#"]').filter({ hasText: /skip/i })
    const skipLinkCount = await skipLinks.count()
    expect(skipLinkCount).toBeGreaterThan(0)
    
    // Test skip link functionality
    if (skipLinkCount > 0) {
      const firstSkipLink = skipLinks.first()
      await firstSkipLink.focus()
      await firstSkipLink.press('Enter')
      
      const targetHref = await firstSkipLink.getAttribute('href')
      const targetElement = page.locator(targetHref!)
      
      // Target should exist and be focusable
      await expect(targetElement).toBeVisible()
    }
  })

  test('should have proper color contrast ratios', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Run specific color contrast checks
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
    
    // Additional manual color contrast checks for Korean text
    const textElements = page.locator('p, span, button, a, h1, h2, h3, h4, h5, h6')
    const sampleSize = Math.min(await textElements.count(), 20) // Test first 20 elements
    
    for (let i = 0; i < sampleSize; i++) {
      const element = textElements.nth(i)
      if (await element.isVisible()) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          }
        })
        
        // Log for manual verification if needed
        console.log(`Element ${i}: color=${styles.color}, bg=${styles.backgroundColor}, fontSize=${styles.fontSize}`)
      }
    }
  })

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ forcedColors: 'active' })
    await page.goto('/dashboard')
    
    // Check that elements are still visible and functional
    await expect(page.getByTestId('dashboard-content')).toBeVisible()
    
    // Test navigation in high contrast mode
    const navLinks = page.locator('nav a, [role="navigation"] a')
    const linkCount = await navLinks.count()
    
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = navLinks.nth(i)
      await expect(link).toBeVisible()
    }
  })

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard')
    
    // Check that animations are disabled or reduced
    const animatedElements = page.locator('[class*="animate"], [style*="animation"], [style*="transition"]')
    const animatedCount = await animatedElements.count()
    
    for (let i = 0; i < Math.min(animatedCount, 10); i++) {
      const element = animatedElements.nth(i)
      if (await element.isVisible()) {
        const animationDuration = await element.evaluate(el => {
          const styles = window.getComputedStyle(el)
          return styles.animationDuration
        })
        
        // Animations should be disabled or very short
        expect(animationDuration).toMatch(/0s|0\.01s/)
      }
    }
  })

  test('should have accessible error messages and notifications', async ({ page }) => {
    // Test form validation errors
    await page.goto('/auth/login')
    
    // Submit form without filling fields
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for accessible error messages
    const errorElements = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"], .error')
    const errorCount = await errorElements.count()
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const error = errorElements.nth(i)
        
        // Error should be visible and have text
        await expect(error).toBeVisible()
        const errorText = await error.textContent()
        expect(errorText?.trim()).toBeTruthy()
        
        // Check ARIA attributes
        const ariaLive = await error.getAttribute('aria-live')
        const role = await error.getAttribute('role')
        
        expect(ariaLive || role).toBeTruthy()
      }
    }
  })

  test('should have accessible tables with proper headers', async ({ page }) => {
    await page.goto('/dashboard/daily-reports')
    
    const tables = page.locator('table, [role="table"]')
    const tableCount = await tables.count()
    
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i)
      
      // Check for table headers
      const headers = table.locator('th, [role="columnheader"]')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)
      
      // Check header scope attributes
      for (let j = 0; j < headerCount; j++) {
        const header = headers.nth(j)
        const scope = await header.getAttribute('scope')
        const role = await header.getAttribute('role')
        
        // Should have proper scope or role
        expect(scope || role).toBeTruthy()
      }
      
      // Check for table caption or accessible name
      const caption = table.locator('caption')
      const ariaLabel = await table.getAttribute('aria-label')
      const ariaLabelledBy = await table.getAttribute('aria-labelledby')
      
      const hasAccessibleName = 
        (await caption.count() > 0) || 
        ariaLabel || 
        ariaLabelledBy
      
      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('should have accessible modal dialogs', async ({ page }) => {
    await page.goto('/dashboard/markup')
    
    // Try to open a modal (if available)
    const modalTrigger = page.locator('button').filter({ hasText: /새|new|create|open/i }).first()
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click()
      
      // Check for modal dialog
      const modal = page.locator('[role="dialog"], [role="alertdialog"], .modal')
      
      if (await modal.count() > 0) {
        // Check modal accessibility
        const ariaModal = await modal.getAttribute('aria-modal')
        const ariaLabelledBy = await modal.getAttribute('aria-labelledby')
        const ariaLabel = await modal.getAttribute('aria-label')
        
        expect(ariaModal).toBe('true')
        expect(ariaLabelledBy || ariaLabel).toBeTruthy()
        
        // Check focus management
        const focusedElement = page.locator(':focus')
        const isWithinModal = await focusedElement.evaluate((el, modalElement) => {
          return modalElement.contains(el)
        }, await modal.elementHandle())
        
        expect(isWithinModal).toBeTruthy()
        
        // Test escape key
        await page.keyboard.press('Escape')
        
        // Modal should close
        await expect(modal).not.toBeVisible()
      }
    }
  })

  test('should have accessible Korean language content', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check language attributes
    const html = page.locator('html')
    const lang = await html.getAttribute('lang')
    expect(lang).toMatch(/ko|kr|ko-KR/)
    
    // Check for Korean text elements
    const koreanTextPattern = /[가-힣]/
    const textElements = page.locator('*:has-text("")')
    
    let foundKoreanText = false
    const elementCount = await textElements.count()
    
    for (let i = 0; i < Math.min(elementCount, 50); i++) {
      const element = textElements.nth(i)
      const text = await element.textContent()
      
      if (text && koreanTextPattern.test(text)) {
        foundKoreanText = true
        
        // Check if Korean text has proper spacing and formatting
        const hasProperSpacing = !text.includes('  ') // No double spaces
        expect(hasProperSpacing).toBeTruthy()
        
        break
      }
    }
    
    expect(foundKoreanText).toBeTruthy()
  })

  test('should be accessible on touch devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // Check touch target sizes
    const interactiveElements = page.locator('button, a, input, [role="button"], [tabindex="0"]')
    const elementCount = await interactiveElements.count()
    
    for (let i = 0; i < Math.min(elementCount, 20); i++) {
      const element = interactiveElements.nth(i)
      
      if (await element.isVisible()) {
        const boundingBox = await element.boundingBox()
        
        if (boundingBox) {
          // Touch targets should be at least 44x44px
          expect(boundingBox.width).toBeGreaterThanOrEqual(44)
          expect(boundingBox.height).toBeGreaterThanOrEqual(44)
        }
      }
    }
    
    // Check spacing between touch targets
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 1) {
      const firstButton = await buttons.nth(0).boundingBox()
      const secondButton = await buttons.nth(1).boundingBox()
      
      if (firstButton && secondButton) {
        const distance = Math.sqrt(
          Math.pow(secondButton.x - firstButton.x, 2) + 
          Math.pow(secondButton.y - firstButton.y, 2)
        )
        
        // Touch targets should have adequate spacing
        expect(distance).toBeGreaterThan(8) // 8px minimum spacing
      }
    }
  })
})