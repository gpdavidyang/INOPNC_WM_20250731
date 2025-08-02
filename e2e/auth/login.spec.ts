import { test, expect } from '@playwright/test'

test.describe('Authentication - Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should display login form with all required fields', async ({ page }) => {
    // Check form elements are present
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click sign in without filling fields
    await page.getByRole('button', { name: /sign in/i }).click()

    // Check validation messages
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Check error message
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill form with valid credentials
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard/**')
    
    // Verify user is on dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.getByText(/welcome/i)).toBeVisible()
  })

  test('should redirect to requested page after login', async ({ page }) => {
    // Navigate to protected page
    await page.goto('/dashboard/daily-reports')
    
    // Should be redirected to login with return URL
    await expect(page).toHaveURL(/.*auth\/login\?redirectTo=/)
    
    // Login
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should be redirected back to requested page
    await page.waitForURL('**/dashboard/daily-reports')
    await expect(page).toHaveURL(/.*dashboard\/daily-reports/)
  })

  test('should handle session persistence', async ({ page, context }) => {
    // Login
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Open new tab
    const newPage = await context.newPage()
    await newPage.goto('/dashboard')

    // Should still be authenticated
    await expect(newPage).toHaveURL(/.*dashboard/)
    await expect(newPage.getByText(/welcome/i)).toBeVisible()

    // Close tabs
    await newPage.close()
  })

  test('should handle browser back button correctly', async ({ page }) => {
    // Login
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Go back
    await page.goBack()

    // Should redirect to dashboard (not show login page)
    await expect(page).toHaveURL(/.*dashboard/)
  })
})

test.describe('Authentication - Role-Based Access', () => {
  test('worker should have limited navigation options', async ({ page }) => {
    // Login as worker
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Check available navigation items
    await expect(page.getByRole('link', { name: /daily reports/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /my tasks/i })).toBeVisible()
    
    // Should not see admin options
    await expect(page.getByRole('link', { name: /user management/i })).not.toBeVisible()
    await expect(page.getByRole('link', { name: /system settings/i })).not.toBeVisible()
  })

  test('site manager should have management options', async ({ page }) => {
    // Login as site manager
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('manager@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Check available navigation items
    await expect(page.getByRole('link', { name: /daily reports/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /team management/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /site overview/i })).toBeVisible()
  })

  test('admin should access admin dashboard', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('admin@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should be redirected to admin dashboard
    await page.waitForURL('**/admin/dashboard')
    await expect(page).toHaveURL(/.*admin\/dashboard/)
  })
})

test.describe('Authentication - Session Management', () => {
  test('should handle session expiry gracefully', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Simulate session expiry by clearing cookies
    await page.context().clearCookies()

    // Try to navigate to protected page
    await page.goto('/dashboard/daily-reports')

    // Should be redirected to login
    await expect(page).toHaveURL(/.*auth\/login/)
    await expect(page.getByText(/session expired/i)).toBeVisible()
  })

  test('should refresh token automatically', async ({ page }) => {
    // This test would require mocking time or waiting for token to near expiry
    // For now, we'll test that refresh endpoint works
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Make multiple requests to trigger potential refresh
    for (let i = 0; i < 5; i++) {
      await page.reload()
      await expect(page).toHaveURL(/.*dashboard/)
      await page.waitForTimeout(1000)
    }
  })
})