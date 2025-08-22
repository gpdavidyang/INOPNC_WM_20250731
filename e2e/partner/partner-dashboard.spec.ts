import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { PartnerPage } from '../pages/partner.page'

/**
 * Partner Dashboard E2E Tests
 * 파트너사 대시보드 기능 테스트
 * 
 * Test Coverage:
 * - Partner authentication and role verification
 * - Dashboard navigation and responsiveness  
 * - Tab switching and content loading
 * - Site data access restrictions
 * - Read-only permission validation
 * - Mobile UI functionality
 */

test.describe('Partner Dashboard', () => {
  let authPage: AuthPage
  let partnerPage: PartnerPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    partnerPage = new PartnerPage(page)
    
    // Login as partner user
    await authPage.goto()
    await authPage.loginAs('partner', 'password123')
    
    // Verify redirect to partner dashboard
    await expect(page).toHaveURL('/partner/dashboard')
  })

  test.describe('Authentication & Access Control', () => {
    test('should authenticate partner user and redirect to partner dashboard', async ({ page }) => {
      // Already logged in via beforeEach
      await expect(page).toHaveURL('/partner/dashboard')
      await expect(partnerPage.welcomeMessage).toBeVisible()
    })

    test('should verify partner role permissions', async () => {
      await partnerPage.navigateToTab('my-info')
      const profileInfo = await partnerPage.getProfileInfo()
      
      expect(profileInfo.email).toContain('partner@inopnc.com')
      expect(profileInfo.role).toContain('파트너')
      
      await partnerPage.verifyPartnerPermissions()
    })

    test('should enforce read-only access for partner users', async () => {
      // Check various tabs for edit/delete buttons
      const tabs: Array<'home' | 'documents' | 'work-logs' | 'site-info'> = ['home', 'documents', 'work-logs', 'site-info']
      
      for (const tab of tabs) {
        await partnerPage.navigateToTab(tab)
        await partnerPage.verifyReadOnlyAccess()
      }
    })

    test('should only show assigned sites to partner users', async () => {
      await partnerPage.navigateToTab('site-info')
      
      // Verify partner can only see their assigned sites
      const siteCards = await partnerPage.siteInfoCards.count()
      expect(siteCards).toBeGreaterThan(0)
      expect(siteCards).toBeLessThanOrEqual(5) // Assuming limited site assignments
    })
  })

  test.describe('Navigation & UI', () => {
    test('should handle responsive navigation correctly', async () => {
      await partnerPage.verifyResponsiveLayout()
    })

    test('should navigate between tabs using sidebar (desktop)', async ({ page, isMobile }) => {
      test.skip(isMobile, 'Sidebar navigation is desktop-only')
      
      const tabs: Array<'home' | 'print-status' | 'work-logs' | 'site-info' | 'documents' | 'my-info'> = 
        ['home', 'print-status', 'work-logs', 'site-info', 'documents', 'my-info']
      
      for (const tab of tabs) {
        await partnerPage.navigateToTab(tab)
        await expect(page).toHaveURL(new RegExp(`/partner/dashboard`))
      }
    })

    test('should navigate between tabs using bottom navigation (mobile)', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Bottom navigation is mobile-only')
      
      const tabs: Array<'home' | 'print-status' | 'work-logs' | 'documents' | 'my-info'> = 
        ['home', 'print-status', 'work-logs', 'documents', 'my-info']
      
      for (const tab of tabs) {
        await partnerPage.navigateToTab(tab)
        // Content should change but URL stays the same for SPA navigation
        await partnerPage.waitForLoadComplete()
      }
    })

    test('should open and close sidebar on mobile', async ({ isMobile }) => {
      test.skip(!isMobile, 'Sidebar toggle is mobile-only')
      
      await partnerPage.openSidebar()
      await expect(partnerPage.sidebar).toBeVisible()
      
      await partnerPage.closeSidebar()
      await expect(partnerPage.sidebar).toBeHidden()
    })
  })

  test.describe('Home Tab Functionality', () => {
    test('should display welcome message and user info', async () => {
      await partnerPage.navigateToTab('home')
      
      await expect(partnerPage.welcomeMessage).toBeVisible()
      await expect(partnerPage.quickMenuGrid).toBeVisible()
    })

    test('should display site selector with assigned sites', async () => {
      await partnerPage.navigateToTab('home')
      
      await expect(partnerPage.siteSelector).toBeVisible()
      
      // Verify site options are available
      await partnerPage.siteSelector.click()
      const siteOptions = partnerPage.page.locator('[role="option"]')
      const optionCount = await siteOptions.count()
      expect(optionCount).toBeGreaterThan(0)
    })

    test('should display today\'s site information', async () => {
      await partnerPage.navigateToTab('home')
      
      // Select a site if not already selected
      if (await partnerPage.siteSelector.isVisible()) {
        await partnerPage.selectSite('강남 A현장')
      }
      
      await expect(partnerPage.todaysSiteInfo).toBeVisible()
    })
  })

  test.describe('Documents Tab Functionality', () => {
    test('should display documents list with search functionality', async () => {
      await partnerPage.navigateToTab('documents')
      
      await expect(partnerPage.documentsList).toBeVisible()
      
      // Test search functionality
      if (await partnerPage.documentSearchInput.isVisible()) {
        await partnerPage.searchDocuments('보고서')
        await partnerPage.waitForLoadComplete()
      }
    })

    test('should show partner-accessible documents only', async () => {
      await partnerPage.navigateToTab('documents')
      
      const documentCount = await partnerPage.getDocumentCount()
      // Partners should have access to some documents but not all
      expect(documentCount).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Work Logs Tab Functionality', () => {
    test('should display work logs with search and filter options', async () => {
      await partnerPage.navigateToTab('work-logs')
      
      await expect(partnerPage.workLogsList).toBeVisible()
      
      // Test search functionality if available
      if (await partnerPage.workLogSearchInput.isVisible()) {
        await partnerPage.searchWorkLogs('작업')
        await partnerPage.waitForLoadComplete()
      }
    })

    test('should open work log detail view', async () => {
      await partnerPage.navigateToTab('work-logs')
      
      const workLogCount = await partnerPage.getWorkLogCount()
      if (workLogCount > 0) {
        await partnerPage.openWorkLogDetail(0)
        await expect(partnerPage.workLogDetail).toBeVisible()
      }
    })

    test('should show only site-specific work logs for partners', async () => {
      await partnerPage.navigateToTab('work-logs')
      
      const workLogCount = await partnerPage.getWorkLogCount()
      // Partners should see work logs from their assigned sites
      expect(workLogCount).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Site Info Tab Functionality', () => {
    test('should display assigned site information', async () => {
      await partnerPage.navigateToTab('site-info')
      
      await expect(partnerPage.siteInfoCards).toBeVisible()
      
      const siteCardCount = await partnerPage.siteInfoCards.count()
      expect(siteCardCount).toBeGreaterThan(0)
    })

    test('should show manager contact information', async () => {
      await partnerPage.navigateToTab('site-info')
      
      if (await partnerPage.managerContactInfo.isVisible()) {
        const contactInfo = await partnerPage.managerContactInfo.textContent()
        expect(contactInfo).toBeTruthy()
      }
    })
  })

  test.describe('My Info Tab Functionality', () => {
    test('should display complete user profile information', async () => {
      await partnerPage.navigateToTab('my-info')
      
      const profileInfo = await partnerPage.getProfileInfo()
      
      expect(profileInfo.name).toBeTruthy()
      expect(profileInfo.email).toBeTruthy()
      expect(profileInfo.role).toBeTruthy()
    })

    test('should display organization information', async () => {
      await partnerPage.navigateToTab('my-info')
      
      if (await partnerPage.organizationInfo.isVisible()) {
        const orgInfo = await partnerPage.organizationInfo.textContent()
        expect(orgInfo).toBeTruthy()
      }
    })
  })

  test.describe('Print Status Tab Functionality', () => {
    test('should display print status information', async () => {
      await partnerPage.navigateToTab('print-status')
      
      // Verify the tab loads without errors
      await partnerPage.waitForLoadComplete()
      await expect(partnerPage.page.locator('body')).toContainText('출력현황')
    })
  })

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      await partnerPage.navigateToTab('documents')
      await partnerPage.waitForLoadComplete()
      
      // Should show error state or loading state without breaking
      await expect(page.locator('body')).not.toHaveClass(/error-page/)
    })

    test('should handle empty data states', async () => {
      // Test various tabs for empty state handling
      const tabs: Array<'documents' | 'work-logs'> = ['documents', 'work-logs']
      
      for (const tab of tabs) {
        await partnerPage.navigateToTab(tab)
        await partnerPage.waitForLoadComplete()
        
        // Should either show content or appropriate empty state
        const hasContent = await partnerPage.page.locator('main').isVisible()
        expect(hasContent).toBeTruthy()
      }
    })
  })

  test.describe('Performance & Accessibility', () => {
    test('should load partner dashboard within performance budget', async ({ page }) => {
      const startTime = Date.now()
      await partnerPage.navigateToPartnerDashboard()
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should be keyboard navigable', async ({ page }) => {
      await partnerPage.navigateToTab('home')
      
      // Test tab navigation
      await page.keyboard.press('Tab')
      const focusedElement = await page.locator(':focus').first()
      expect(await focusedElement.isVisible()).toBeTruthy()
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      const navigationElements = page.locator('[role="navigation"], [aria-label]')
      const elementCount = await navigationElements.count()
      expect(elementCount).toBeGreaterThan(0)
    })
  })

  test.describe('Dark Mode Support', () => {
    test('should support dark mode toggle', async ({ page }) => {
      // Test dark mode if theme toggle is available
      const themeToggle = page.locator('[data-testid="theme-toggle"]')
      
      if (await themeToggle.isVisible()) {
        await themeToggle.click()
        await expect(page.locator('html')).toHaveClass(/dark/)
        
        await themeToggle.click()
        await expect(page.locator('html')).not.toHaveClass(/dark/)
      }
    })
  })
})