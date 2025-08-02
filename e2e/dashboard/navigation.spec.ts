import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Dashboard Navigation and Layout', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
  })

  test.describe('Worker Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should display worker dashboard with appropriate navigation', async ({ page }) => {
      await dashboardPage.expectDashboardVisible()
      await dashboardPage.expectWorkerNavigation()
      
      // Verify page title
      await expect(page).toHaveTitle(/dashboard/i)
      
      // Check main dashboard elements
      await dashboardPage.expectStatsCardsVisible()
      await dashboardPage.expectRecentReportsVisible()
    })

    test('should navigate to daily reports section', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      await expect(page).toHaveURL(/.*dashboard\/daily-reports/)
      await expect(page.getByRole('heading', { name: /daily reports/i })).toBeVisible()
    })

    test('should navigate to attendance section', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      await expect(page).toHaveURL(/.*dashboard\/attendance/)
      await expect(page.getByRole('heading', { name: /attendance/i })).toBeVisible()
    })

    test('should navigate to markup tool', async ({ page }) => {
      await dashboardPage.navigateToMarkupTool()
      
      await expect(page).toHaveURL(/.*dashboard\/markup/)
      await expect(page.getByRole('heading', { name: /도면 마킹|markup tool/i })).toBeVisible()
    })

    test('should not have access to admin sections', async ({ page }) => {
      // Try to navigate directly to admin pages
      await page.goto('/admin/users')
      
      // Should be redirected back to dashboard or show access denied
      await expect(page).toHaveURL(/.*dashboard/)
    })
  })

  test.describe('Site Manager Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsManager()
    })

    test('should display manager dashboard with management options', async ({ page }) => {
      await dashboardPage.expectDashboardVisible()
      await dashboardPage.expectManagerNavigation()
      
      // Check manager-specific elements
      await expect(page.getByText(/site manager/i)).toBeVisible()
    })

    test('should navigate to team management', async ({ page }) => {
      await dashboardPage.navigateToTeamManagement()
      
      await expect(page).toHaveURL(/.*dashboard\/team/)
      await expect(page.getByRole('heading', { name: /team management/i })).toBeVisible()
    })

    test('should access all worker features plus management', async ({ page }) => {
      // Should have all worker features
      await expect(dashboardPage.dailyReportsLink).toBeVisible()
      await expect(dashboardPage.attendanceLink).toBeVisible()
      
      // Plus management features
      await expect(dashboardPage.teamManagementLink).toBeVisible()
      await expect(dashboardPage.siteOverviewLink).toBeVisible()
    })
  })

  test.describe('Admin Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsAdmin()
    })

    test('should redirect to admin dashboard', async ({ page }) => {
      await expect(page).toHaveURL(/.*admin\/dashboard/)
      await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible()
    })

    test('should have access to all admin features', async ({ page }) => {
      await dashboardPage.expectAdminNavigation()
      
      // Test navigation to user management
      await dashboardPage.navigateToUserManagement()
      await expect(page).toHaveURL(/.*admin\/users/)
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible()
    })

    test('should access system-wide data', async ({ page }) => {
      // Should see organization-wide statistics
      await expect(page.getByText(/total users/i)).toBeVisible()
      await expect(page.getByText(/active sites/i)).toBeVisible()
      await expect(page.getByText(/system status/i)).toBeVisible()
    })
  })

  test.describe('User Menu and Profile', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should open and close user menu', async ({ page }) => {
      await dashboardPage.openUserMenu()
      
      await expect(dashboardPage.profileButton).toBeVisible()
      await expect(dashboardPage.logoutButton).toBeVisible()
      
      // Click outside to close
      await page.click('body')
      await expect(dashboardPage.profileButton).not.toBeVisible()
    })

    test('should navigate to profile page', async ({ page }) => {
      await dashboardPage.openUserMenu()
      await dashboardPage.profileButton.click()
      
      await expect(page).toHaveURL(/.*profile/)
      await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible()
    })

    test('should logout successfully', async ({ page }) => {
      await dashboardPage.logout()
      
      await expect(page).toHaveURL(/.*auth\/login/)
      await expect(page.getByText(/signed out/i)).toBeVisible()
    })
  })

  test.describe('Responsive Navigation', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      
      // Should show mobile navigation
      const mobileMenuButton = page.getByTestId('mobile-menu-button')
      await expect(mobileMenuButton).toBeVisible()
      
      // Open mobile menu
      await mobileMenuButton.click()
      await expect(dashboardPage.sidebar).toBeVisible()
      
      // Navigate to a section
      await dashboardPage.navigateToDailyReports()
      await expect(page).toHaveURL(/.*daily-reports/)
      
      // Menu should close after navigation
      await expect(dashboardPage.sidebar).not.toBeVisible()
    })

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      
      await dashboardPage.expectDashboardVisible()
      
      // Should show appropriate layout for tablet
      await expect(dashboardPage.sidebar).toBeVisible()
    })
  })

  test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should perform global search', async ({ page }) => {
      const searchQuery = 'daily report'
      await dashboardPage.search(searchQuery)
      
      // Should show search results
      await expect(page.getByTestId('search-results')).toBeVisible()
      await expect(page.getByText(/search results for/i)).toContainText(searchQuery)
    })

    test('should handle empty search gracefully', async ({ page }) => {
      await dashboardPage.search('')
      
      // Should not perform search or show message
      await expect(page.getByText(/enter search term/i)).toBeVisible()
    })
  })

  test.describe('Notifications', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
    })

    test('should display notification indicator', async ({ page }) => {
      await expect(dashboardPage.notificationBell).toBeVisible()
    })

    test('should open notifications panel', async ({ page }) => {
      await dashboardPage.openNotifications()
      
      await expect(page.getByTestId('notifications-panel')).toBeVisible()
      await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible()
    })

    test('should show notification count', async ({ page }) => {
      // This would typically be mocked or require test data
      const notificationCount = await dashboardPage.notificationBell.textContent()
      expect(notificationCount).toMatch(/\d+/)
    })
  })

  test.describe('Page Performance', () => {
    test('should load dashboard quickly', async ({ page }) => {
      await authPage.navigateToLogin()
      
      const startTime = Date.now()
      await authPage.loginAsWorker()
      await dashboardPage.expectDashboardVisible()
      const loadTime = Date.now() - startTime
      
      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle navigation without flickering', async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      
      // Navigate between sections quickly
      await dashboardPage.navigateToDailyReports()
      await expect(page.getByRole('heading', { name: /daily reports/i })).toBeVisible()
      
      await dashboardPage.navigateToAttendance()
      await expect(page.getByRole('heading', { name: /attendance/i })).toBeVisible()
      
      await dashboardPage.navigateToDashboard()
      await dashboardPage.expectDashboardVisible()
    })
  })

  test.describe('Browser Compatibility', () => {
    test('should maintain session across tabs', async ({ page, context }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      
      // Open new tab
      const newPage = await context.newPage()
      const newDashboard = new DashboardPage(newPage)
      await newDashboard.navigateToDashboard()
      
      // Should be authenticated in new tab
      await newDashboard.expectDashboardVisible()
      
      await newPage.close()
    })

    test('should handle browser back/forward buttons', async ({ page }) => {
      await authPage.navigateToLogin()
      await authPage.loginAsWorker()
      
      // Navigate to daily reports
      await dashboardPage.navigateToDailyReports()
      await expect(page).toHaveURL(/.*daily-reports/)
      
      // Go back
      await page.goBack()
      await expect(page).toHaveURL(/.*dashboard/)
      
      // Go forward
      await page.goForward()
      await expect(page).toHaveURL(/.*daily-reports/)
    })
  })
})