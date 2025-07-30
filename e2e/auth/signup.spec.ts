import { test, expect } from '@playwright/test'

test.describe('Authentication - Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
  })

  test('should display signup form with all required fields', async ({ page }) => {
    // Check form elements
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    await expect(page.getByLabel(/role/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page.getByText(/valid email/i)).toBeVisible()
  })

  test('should validate password requirements', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('123') // Too short
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page.getByText(/password must be at least/i)).toBeVisible()
  })

  test('should create new user account successfully', async ({ page }) => {
    const timestamp = Date.now()
    const email = `testuser${timestamp}@inopnc.com`

    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill('password123')
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/phone/i).fill('+1234567890')
    await page.getByLabel(/role/i).selectOption('worker')
    await page.getByRole('button', { name: /sign up/i }).click()

    // Should redirect to dashboard after successful signup
    await page.waitForURL('**/dashboard/**', { timeout: 10000 })
    await expect(page.getByText(/welcome/i)).toBeVisible()
  })

  test('should handle duplicate email gracefully', async ({ page }) => {
    await page.getByLabel(/email/i).fill('worker@inopnc.com') // Existing user
    await page.getByLabel(/password/i).fill('password123')
    await page.getByLabel(/full name/i).fill('Duplicate User')
    await page.getByLabel(/phone/i).fill('+1234567890')
    await page.getByLabel(/role/i).selectOption('worker')
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page.getByText(/already registered/i)).toBeVisible()
  })

  test('should auto-assign organization based on email domain', async ({ page }) => {
    const timestamp = Date.now()
    const email = `newworker${timestamp}@inopnc.com`

    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill('password123')
    await page.getByLabel(/full name/i).fill('INOPNC Worker')
    await page.getByLabel(/phone/i).fill('+1234567890')
    await page.getByLabel(/role/i).selectOption('worker')
    await page.getByRole('button', { name: /sign up/i }).click()

    // Wait for redirect and profile creation
    await page.waitForURL('**/dashboard/**', { timeout: 10000 })

    // Navigate to profile page
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('link', { name: /profile/i }).click()

    // Verify organization assignment
    await expect(page.getByText(/organization.*inopnc/i)).toBeVisible()
  })
})

test.describe('Profile Management', () => {
  test('should sync profile data correctly after signup', async ({ page }) => {
    const timestamp = Date.now()
    const email = `profiletest${timestamp}@inopnc.com`
    const fullName = 'Profile Test User'
    const phone = '+1987654321'

    // Sign up
    await page.goto('/auth/signup')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill('password123')
    await page.getByLabel(/full name/i).fill(fullName)
    await page.getByLabel(/phone/i).fill(phone)
    await page.getByLabel(/role/i).selectOption('worker')
    await page.getByRole('button', { name: /sign up/i }).click()

    // Wait for dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 10000 })

    // Check profile data in UI
    await expect(page.getByText(new RegExp(fullName, 'i'))).toBeVisible()
    
    // Navigate to profile settings
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('link', { name: /profile/i }).click()

    // Verify all profile fields
    await expect(page.getByLabel(/email/i)).toHaveValue(email)
    await expect(page.getByLabel(/full name/i)).toHaveValue(fullName)
    await expect(page.getByLabel(/phone/i)).toHaveValue(phone)
    await expect(page.getByText(/role.*worker/i)).toBeVisible()
  })

  test('should update profile information', async ({ page }) => {
    // Login first
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard/**')

    // Navigate to profile
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('link', { name: /profile/i }).click()

    // Update profile
    const newPhone = '+1555555555'
    await page.getByLabel(/phone/i).clear()
    await page.getByLabel(/phone/i).fill(newPhone)
    await page.getByRole('button', { name: /save/i }).click()

    // Verify update success
    await expect(page.getByText(/profile updated/i)).toBeVisible()
    
    // Reload and verify persistence
    await page.reload()
    await expect(page.getByLabel(/phone/i)).toHaveValue(newPhone)
  })
})

test.describe('Password Reset Flow', () => {
  test('should request password reset', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('link', { name: /forgot password/i }).click()

    // Should be on reset password page
    await expect(page).toHaveURL(/.*auth\/reset-password/)
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()

    // Request reset
    await page.getByLabel(/email/i).fill('worker@inopnc.com')
    await page.getByRole('button', { name: /send reset link/i }).click()

    // Should show success message
    await expect(page.getByText(/check your email/i)).toBeVisible()
  })

  test('should handle invalid email for reset', async ({ page }) => {
    await page.goto('/auth/reset-password')
    
    await page.getByLabel(/email/i).fill('nonexistent@example.com')
    await page.getByRole('button', { name: /send reset link/i }).click()

    // Should show error (or success to prevent user enumeration)
    await expect(page.getByText(/if.*account.*exists/i)).toBeVisible()
  })
})