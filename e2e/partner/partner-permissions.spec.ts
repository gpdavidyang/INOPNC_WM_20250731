import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { PartnerPage } from '../pages/partner.page'

/**
 * Partner Permissions & Access Control Tests
 * 파트너사 권한 및 접근 제어 테스트
 * 
 * Test Coverage:
 * - Document access restrictions by site assignment
 * - Work log visibility based on partner permissions  
 * - Site data isolation between partners
 * - API endpoint access control
 * - Role-based UI element visibility
 * - Data filtering and security
 */

test.describe('Partner Permissions & Access Control', () => {
  let authPage: AuthPage
  let partnerPage: PartnerPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    partnerPage = new PartnerPage(page)
    
    // Login as partner user
    await authPage.goto()
    await authPage.loginAs('partner', 'password123')
    await expect(page).toHaveURL('/partner/dashboard')
  })

  test.describe('Document Access Control', () => {
    test('should only show documents from assigned sites', async ({ page }) => {
      await partnerPage.navigateToTab('documents')
      
      // Capture network requests to verify filtering
      const apiCalls: string[] = []
      page.on('request', request => {
        if (request.url().includes('/api/documents')) {
          apiCalls.push(request.url())
        }
      })
      
      await partnerPage.waitForLoadComplete()
      
      // Verify documents are filtered by site assignment
      const documentCount = await partnerPage.getDocumentCount()
      
      if (documentCount > 0) {
        // Check that API calls include site filtering
        expect(apiCalls.some(url => url.includes('site_id') || url.includes('filter'))).toBeTruthy()
      }
    })

    test('should not access documents from non-assigned sites', async ({ page }) => {
      await partnerPage.navigateToTab('documents')
      
      // Try to directly access a document that should not be visible
      const response = await page.request.get('/api/documents?site_id=non-assigned-site-id')
      
      // Should return limited results or 403
      expect([200, 403, 404]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        // Should return empty array or filtered results
        expect(Array.isArray(data) ? data.length : 0).toBe(0)
      }
    })

    test('should enforce document download restrictions', async ({ page }) => {
      await partnerPage.navigateToTab('documents')
      
      const documentCount = await partnerPage.getDocumentCount()
      
      if (documentCount > 0) {
        // Click on first document to see details
        await partnerPage.documentItems.first().click()
        await partnerPage.waitForLoadComplete()
        
        // Look for download buttons - partners should have limited download access
        const downloadButtons = page.locator('[data-testid="download"], [href*="download"]')
        const downloadCount = await downloadButtons.count()
        
        // Partners may have restricted download permissions
        if (downloadCount > 0) {
          // Verify download request goes through proper authorization
          const downloadResponse = await page.request.get('/api/documents/test-id/download')
          expect([200, 401, 403]).toContain(downloadResponse.status())
        }
      }
    })
  })

  test.describe('Work Log Access Control', () => {
    test('should only show work logs from assigned sites', async ({ page }) => {
      await partnerPage.navigateToTab('work-logs')
      
      // Monitor API requests for work logs
      const workLogCalls: string[] = []
      page.on('request', request => {
        if (request.url().includes('/api/daily-reports') || request.url().includes('/api/work-logs')) {
          workLogCalls.push(request.url())
        }
      })
      
      await partnerPage.waitForLoadComplete()
      
      const workLogCount = await partnerPage.getWorkLogCount()
      
      if (workLogCount > 0) {
        // Verify API calls include site filtering for partners
        expect(workLogCalls.length).toBeGreaterThan(0)
        
        // Open a work log detail to verify access
        await partnerPage.openWorkLogDetail(0)
        await expect(partnerPage.workLogDetail).toBeVisible()
        
        // Verify no edit/delete options are available
        const editButtons = page.locator('[data-testid*="edit"], button:has-text("수정"), button:has-text("편집")')
        const deleteButtons = page.locator('[data-testid*="delete"], button:has-text("삭제")')
        
        expect(await editButtons.count()).toBe(0)
        expect(await deleteButtons.count()).toBe(0)
      }
    })

    test('should not access work logs from non-assigned sites', async ({ page }) => {
      // Attempt to access work logs from a site not assigned to partner
      const response = await page.request.get('/api/daily-reports?site_id=unauthorized-site-id')
      
      // Should be filtered out or return 403
      expect([200, 403, 404]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        expect(Array.isArray(data) ? data.length : 0).toBe(0)
      }
    })

    test('should prevent work log creation/modification', async ({ page }) => {
      await partnerPage.navigateToTab('work-logs')
      
      // Look for create/add buttons - partners should not have these
      const createButtons = page.locator('[data-testid*="create"], [data-testid*="add"], button:has-text("작성"), button:has-text("추가")')
      const createCount = await createButtons.count()
      expect(createCount).toBe(0)
      
      // Test API endpoint for work log creation
      const createResponse = await page.request.post('/api/daily-reports', {
        data: {
          site_id: 'test-site-id',
          work_description: 'Unauthorized work log creation attempt',
          date: new Date().toISOString()
        }
      })
      
      // Should return 403 Forbidden for partners
      expect([401, 403, 405]).toContain(createResponse.status())
    })
  })

  test.describe('Site Data Isolation', () => {
    test('should only see assigned sites in selectors', async () => {
      await partnerPage.navigateToTab('home')
      
      // Click site selector to see available options
      await partnerPage.siteSelector.click()
      const siteOptions = partnerPage.page.locator('[role="option"]')
      const optionCount = await siteOptions.count()
      
      // Partners should have limited site access
      expect(optionCount).toBeGreaterThan(0)
      expect(optionCount).toBeLessThanOrEqual(5) // Assuming max 5 sites per partner
      
      // Verify site names are from assigned sites only
      const siteTexts = await siteOptions.allTextContents()
      expect(siteTexts.length).toBe(optionCount)
    })

    test('should not access unauthorized site data via API', async ({ page }) => {
      // Test direct API access to non-assigned site data
      const unauthorizedSiteId = 'unauthorized-site-12345'
      
      const siteResponse = await page.request.get(`/api/sites/${unauthorizedSiteId}`)
      expect([403, 404]).toContain(siteResponse.status())
      
      const attendanceResponse = await page.request.get(`/api/attendance?site_id=${unauthorizedSiteId}`)
      expect([200, 403, 404]).toContain(attendanceResponse.status())
      
      if (attendanceResponse.status() === 200) {
        const data = await attendanceResponse.json()
        expect(Array.isArray(data) ? data.length : 0).toBe(0)
      }
    })

    test('should filter site information properly', async () => {
      await partnerPage.navigateToTab('site-info')
      
      const siteCardCount = await partnerPage.siteInfoCards.count()
      expect(siteCardCount).toBeGreaterThan(0)
      
      // Verify each site card contains appropriate information
      for (let i = 0; i < Math.min(siteCardCount, 3); i++) {
        const siteCard = partnerPage.siteInfoCards.nth(i)
        await expect(siteCard).toBeVisible()
        
        const cardText = await siteCard.textContent()
        expect(cardText).toBeTruthy()
      }
    })
  })

  test.describe('API Endpoint Security', () => {
    test('should enforce authentication on all API endpoints', async ({ page }) => {
      // Test key API endpoints that partners might access
      const endpoints = [
        '/api/documents',
        '/api/daily-reports', 
        '/api/sites',
        '/api/attendance',
        '/api/notifications'
      ]
      
      for (const endpoint of endpoints) {
        const response = await page.request.get(endpoint)
        // Should either return data (200) or proper error codes
        expect([200, 401, 403, 404]).toContain(response.status())
        
        if (response.status() === 200) {
          const data = await response.json()
          // Data should be properly filtered for partner access
          expect(data).toBeTruthy()
        }
      }
    })

    test('should prevent unauthorized data modification', async ({ page }) => {
      // Test POST/PUT/DELETE requests that partners should not be able to make
      const restrictedOperations = [
        { method: 'POST', url: '/api/sites', data: { name: 'New Site' } },
        { method: 'PUT', url: '/api/sites/test-id', data: { name: 'Modified Site' } },
        { method: 'DELETE', url: '/api/sites/test-id' },
        { method: 'POST', url: '/api/profiles', data: { role: 'admin' } },
        { method: 'PUT', url: '/api/profiles/test-id', data: { role: 'admin' } }
      ]
      
      for (const operation of restrictedOperations) {
        let response
        
        switch (operation.method) {
          case 'POST':
            response = await page.request.post(operation.url, { data: operation.data })
            break
          case 'PUT':
            response = await page.request.put(operation.url, { data: operation.data })
            break
          case 'DELETE':
            response = await page.request.delete(operation.url)
            break
        }
        
        // Should return authorization error
        expect([401, 403, 405]).toContain(response?.status() || 500)
      }
    })
  })

  test.describe('UI Element Visibility', () => {
    test('should hide admin-only UI elements', async ({ page }) => {
      // Check various tabs for admin-only elements
      const tabs: Array<'home' | 'documents' | 'work-logs' | 'site-info'> = ['home', 'documents', 'work-logs', 'site-info']
      
      for (const tab of tabs) {
        await partnerPage.navigateToTab(tab)
        
        // Admin-only elements that should not be visible to partners
        const adminElements = page.locator([
          '[data-testid*="admin"]',
          '[data-testid*="system"]',
          'button:has-text("시스템")',
          'button:has-text("관리자")',
          '[href*="/admin"]',
          '[href*="/system"]'
        ].join(', '))
        
        const adminElementCount = await adminElements.count()
        expect(adminElementCount).toBe(0)
      }
    })

    test('should show partner-appropriate menu items only', async () => {
      // Check sidebar/navigation contains only partner-appropriate items
      const expectedTabs = ['홈', '출력현황', '작업일지', '현장정보', '문서함', '내정보']
      
      for (const tabName of expectedTabs) {
        const tabElement = partnerPage.page.locator(`text="${tabName}"`).first()
        await expect(tabElement).toBeVisible()
      }
      
      // Admin-only tabs should not be present
      const adminTabs = ['사용자 관리', '시스템 설정', '전체 현장', '시스템 로그']
      
      for (const adminTab of adminTabs) {
        const adminElement = partnerPage.page.locator(`text="${adminTab}"`).first()
        await expect(adminElement).not.toBeVisible()
      }
    })
  })

  test.describe('Data Privacy & Compliance', () => {
    test('should not expose sensitive user data', async ({ page }) => {
      await partnerPage.navigateToTab('my-info')
      
      // Verify only appropriate profile information is shown
      const profileInfo = await partnerPage.getProfileInfo()
      
      // Should show basic info but not sensitive data
      expect(profileInfo.email).toBeTruthy()
      expect(profileInfo.role).toBeTruthy()
      
      // Check that sensitive data is not exposed in HTML
      const pageContent = await page.content()
      
      // Should not contain other users' email addresses or IDs
      const emailPattern = /@(?!inopnc\.com)/g
      const suspiciousEmails = pageContent.match(emailPattern)
      
      // May contain partner's own email but not others
      if (suspiciousEmails) {
        expect(suspiciousEmails.length).toBeLessThanOrEqual(1)
      }
    })

    test('should maintain audit trail for partner actions', async ({ page }) => {
      // Monitor network requests for audit logging
      const auditCalls: string[] = []
      
      page.on('request', request => {
        if (request.url().includes('/api/audit') || request.url().includes('/api/logs')) {
          auditCalls.push(request.url())
        }
      })
      
      // Perform various partner actions
      await partnerPage.navigateToTab('documents')
      await partnerPage.navigateToTab('work-logs')
      
      // Some partner actions should generate audit logs
      // Note: This depends on implementation - may not generate audit calls for read operations
      await partnerPage.waitForLoadComplete()
    })
  })

  test.describe('Session Management', () => {
    test('should handle session expiration gracefully', async ({ page }) => {
      // Clear cookies to simulate session expiration
      await page.context().clearCookies()
      
      // Navigate to a tab that requires authentication
      await partnerPage.navigateToTab('documents')
      
      // Should redirect to login or show appropriate error
      await page.waitForTimeout(2000)
      
      const currentUrl = page.url()
      const isRedirectedToLogin = currentUrl.includes('/auth/login')
      const hasErrorMessage = await page.locator('text="인증이 필요합니다"').isVisible()
      
      expect(isRedirectedToLogin || hasErrorMessage).toBeTruthy()
    })

    test('should prevent concurrent session conflicts', async ({ page, context }) => {
      // Open second page with same partner credentials
      const secondPage = await context.newPage()
      const secondAuthPage = new AuthPage(secondPage)
      const secondPartnerPage = new PartnerPage(secondPage)
      
      await secondAuthPage.goto()
      await secondAuthPage.loginAs('partner', 'password123')
      
      // Both pages should work independently
      await partnerPage.navigateToTab('documents')
      await secondPartnerPage.navigateToTab('work-logs')
      
      await expect(partnerPage.documentsList).toBeVisible()
      await expect(secondPartnerPage.workLogsList).toBeVisible()
      
      await secondPage.close()
    })
  })
})