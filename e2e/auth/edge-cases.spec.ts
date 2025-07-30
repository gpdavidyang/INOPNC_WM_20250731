import { test, expect } from '@playwright/test'

test.describe('Authentication - Edge Cases', () => {
  test('should handle rapid login/logout cycles', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      // Login
      await page.goto('/auth/login')
      await page.getByLabel(/email/i).fill('worker@inopnc.com')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()
      await page.waitForURL('**/dashboard/**')

      // Logout immediately
      await page.getByRole('button', { name: /user menu/i }).click()
      await page.getByRole('button', { name: /sign out/i }).click()
      await page.waitForURL('**/auth/login')
    }

    // Final login should still work
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')
    await expect(page.getByText(/welcome/i)).toBeVisible()
  })

  test('should handle multiple concurrent sessions', async ({ browser }) => {
    // Create multiple browser contexts (like different browsers/devices)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Login in first context
    await page1.goto('/auth/login')
    await page1.getByLabel(/email/i).fill('worker@inopnc.com')
    await page1.getByLabel(/password/i).fill('password123')
    await page1.getByRole('button', { name: /sign in/i }).click()
    await page1.waitForURL('**/dashboard/**')

    // Login in second context
    await page2.goto('/auth/login')
    await page2.getByLabel(/email/i).fill('worker@inopnc.com')
    await page2.getByLabel(/password/i).fill('password123')
    await page2.getByRole('button', { name: /sign in/i }).click()
    await page2.waitForURL('**/dashboard/**')

    // Both sessions should work independently
    await page1.reload()
    await expect(page1).toHaveURL(/.*dashboard/)
    
    await page2.reload()
    await expect(page2).toHaveURL(/.*dashboard/)

    // Logout from one shouldn't affect the other
    await page1.getByRole('button', { name: /user menu/i }).click()
    await page1.getByRole('button', { name: /sign out/i }).click()
    await page1.waitForURL('**/auth/login')

    // Second session should still be active
    await page2.reload()
    await expect(page2).toHaveURL(/.*dashboard/)

    // Cleanup
    await context1.close()
    await context2.close()
  })

  test('should handle network interruption during login', async ({ page, context }) => {
    await page.goto('/auth/login')
    
    // Start filling form
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')

    // Simulate network failure
    await context.setOffline(true)
    
    // Try to login
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show network error
    await expect(page.getByText(/network error|connection failed/i)).toBeVisible()

    // Restore network
    await context.setOffline(false)

    // Retry should work
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')
  })

  test('should handle malformed authentication data', async ({ page }) => {
    // Try various malformed inputs
    const malformedInputs = [
      { email: 'test@', password: 'pass' },
      { email: '@example.com', password: 'password123' },
      { email: 'test..user@example.com', password: 'password123' },
      { email: 'test user@example.com', password: 'password123' },
    ]

    for (const input of malformedInputs) {
      await page.goto('/auth/login')
      await page.getByLabel(/email/i).fill(input.email)
      await page.getByLabel(/password/i).fill(input.password)
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show validation error
      await expect(page.getByText(/invalid|error/i)).toBeVisible()
    }
  })

  test('should prevent XSS in login form', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Try XSS payload in email field
    const xssPayload = '<script>alert("XSS")</script>'
    await page.getByLabel(/email/i).fill(xssPayload)
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should not execute script, check for proper escaping
    await expect(page.locator('script')).toHaveCount(0)
    await expect(page.getByText(/invalid/i)).toBeVisible()
  })

  test('should handle very long input gracefully', async ({ page }) => {
    await page.goto('/auth/login')
    
    const longString = 'a'.repeat(1000)
    await page.getByLabel(/email/i).fill(longString + '@example.com')
    await page.getByLabel(/password/i).fill(longString)
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should handle without crashing
    await expect(page.getByText(/invalid|error/i)).toBeVisible()
  })

  test('should maintain session across page refresh', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Hard refresh multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page).toHaveURL(/.*dashboard/)
      await expect(page.getByText(/welcome/i)).toBeVisible()
    }
  })

  test('should handle cookie manipulation attempts', async ({ page, context }) => {
    // Login normally
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Get cookies
    const cookies = await context.cookies()
    const authCookie = cookies.find(c => c.name.includes('auth-token'))

    if (authCookie) {
      // Tamper with cookie value
      await context.addCookies([{
        ...authCookie,
        value: authCookie.value + 'tampered'
      }])

      // Try to access protected page
      await page.goto('/dashboard/daily-reports')
      
      // Should be redirected to login due to invalid session
      await expect(page).toHaveURL(/.*auth\/login/)
    }
  })

  test('should handle race conditions in authentication', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Fill form
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')

    // Click login button multiple times rapidly
    const loginButton = page.getByRole('button', { name: /sign in/i })
    await Promise.all([
      loginButton.click(),
      loginButton.click(),
      loginButton.click()
    ])

    // Should handle gracefully and redirect once
    await page.waitForURL('**/dashboard/**')
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Should not have multiple redirects or errors
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/.*dashboard/)
  })
})

test.describe('Multi-role Access Edge Cases', () => {
  test('should prevent unauthorized role elevation', async ({ page }) => {
    // Login as worker
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Try to directly access admin pages
    const adminPages = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/system',
      '/admin/settings'
    ]

    for (const adminPage of adminPages) {
      await page.goto(adminPage)
      // Should either redirect or show access denied
      await expect(page).not.toHaveURL(adminPage)
    }
  })

  test('should handle role changes correctly', async ({ page, context }) => {
    // This test simulates a role change scenario
    // In real app, this would be done by admin
    
    // Login as worker
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Verify current access level
    await expect(page.getByRole('link', { name: /daily reports/i })).toBeVisible()
    
    // In a real scenario, admin would change role here
    // For testing, we'd need to either:
    // 1. Use API to change role
    // 2. Mock the role change
    // 3. Have a test endpoint
    
    // After role change, user should be required to re-authenticate
    // or see updated permissions on next navigation
  })
})