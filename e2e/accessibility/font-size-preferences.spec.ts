import { test, expect } from '@playwright/test'

test.describe('Font Size Preferences', () => {
  test('should default to small font size on first login', async ({ page }) => {
    // Clear localStorage to simulate first-time user
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    
    // Navigate to login
    await page.goto('/auth/login')
    
    // Login
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Check that large-font-mode class is NOT applied to document
    const hasLargeFont = await page.evaluate(() => {
      return document.documentElement.classList.contains('large-font-mode')
    })
    expect(hasLargeFont).toBe(false)
    
    // Check localStorage value
    const fontSetting = await page.evaluate(() => {
      return localStorage.getItem('inopnc-font-size')
    })
    
    // Should be null (default) or 'normal'
    expect(fontSetting === null || fontSetting === 'normal').toBe(true)
  })

  test('should persist font size setting across page navigation', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Toggle to large font
    const fontToggle = page.getByRole('button', { name: /글씨/ })
    if (await fontToggle.isVisible()) {
      await fontToggle.click()
      
      // Verify large font is applied
      const hasLargeFont = await page.evaluate(() => {
        return document.documentElement.classList.contains('large-font-mode')
      })
      expect(hasLargeFont).toBe(true)
      
      // Navigate to another page
      await page.goto('/dashboard/attendance')
      
      // Font setting should persist
      const stillHasLargeFont = await page.evaluate(() => {
        return document.documentElement.classList.contains('large-font-mode')
      })
      expect(stillHasLargeFont).toBe(true)
      
      // Check localStorage
      const fontSetting = await page.evaluate(() => {
        return localStorage.getItem('inopnc-font-size')
      })
      expect(fontSetting).toBe('large')
    }
  })

  test('should reset to default small font after logout and login', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Set to large font
    const fontToggle = page.getByRole('button', { name: /글씨/ })
    if (await fontToggle.isVisible()) {
      await fontToggle.click()
    }
    
    // Logout (this clears localStorage)
    const profileDropdown = page.getByRole('button', { name: /프로필/ })
    if (await profileDropdown.isVisible()) {
      await profileDropdown.click()
      await page.getByText('로그아웃').click()
    } else {
      // Alternative logout method
      await page.goto('/auth/login')
    }
    
    await page.waitForURL('/auth/login')
    
    // Login again
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Should be back to small font (default)
    const hasLargeFont = await page.evaluate(() => {
      return document.documentElement.classList.contains('large-font-mode')
    })
    expect(hasLargeFont).toBe(false)
  })

  test('should apply font size classes correctly', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'worker@inopnc.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Check that text elements have appropriate classes for small font
    const headingElements = page.locator('h1, h2, h3')
    const headingCount = await headingElements.count()
    
    if (headingCount > 0) {
      const firstHeading = headingElements.first()
      const classes = await firstHeading.getAttribute('class')
      
      // Should not have large font classes like text-4xl, text-5xl, etc.
      expect(classes).not.toContain('text-4xl')
      expect(classes).not.toContain('text-5xl')
      expect(classes).not.toContain('text-6xl')
    }
    
    // Test font toggle if available
    const fontToggle = page.getByRole('button', { name: /글씨/ })
    if (await fontToggle.isVisible()) {
      await fontToggle.click()
      
      // After toggle, document should have large-font-mode class
      const hasLargeFont = await page.evaluate(() => {
        return document.documentElement.classList.contains('large-font-mode')
      })
      expect(hasLargeFont).toBe(true)
    }
  })
})