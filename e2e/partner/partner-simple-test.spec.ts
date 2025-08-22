import { test, expect } from '@playwright/test'

test('Partner login page should be accessible', async ({ page }) => {
  await page.goto('http://localhost:3001/auth/login')
  
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  const loginButton = page.locator('button[type="submit"]')
  
  await expect(emailInput).toBeVisible()
  await expect(passwordInput).toBeVisible()
  await expect(loginButton).toBeVisible()
})

test('Partner should be able to login', async ({ page }) => {
  await page.goto('http://localhost:3001/auth/login')
  
  await page.fill('input[type="email"]', 'partner@inopnc.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Wait for redirect to partner dashboard
  await page.waitForURL('**/partner/dashboard**', { timeout: 10000 })
  
  // Verify we're on the partner dashboard
  await expect(page).toHaveURL(/\/partner\/dashboard/)
})