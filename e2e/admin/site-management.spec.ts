import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { AdminPage } from '../pages/admin.page'

test.describe('Admin Site Management', () => {
  let authPage: AuthPage
  let adminPage: AdminPage

  const testSite = {
    name: 'E2E Test Construction Site',
    address: '123 Test Street, Test City, TC 12345',
    description: 'Test site for E2E automation testing',
    manager: 'manager@inopnc.com',
    active: true
  }

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    adminPage = new AdminPage(page)

    // Login as admin
    await authPage.navigateToLogin()
    await authPage.loginAsAdmin()
  })

  test.describe('Site Management Page and Navigation', () => {
    test('should display site management page with all elements', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      await adminPage.expectSiteManagementVisible()
      
      // Check page URL and title
      await expect(page).toHaveURL(/.*admin\/sites/)
      await expect(page).toHaveTitle(/site management/i)
      
      // Check main elements
      await expect(adminPage.addSiteButton).toBeVisible()
      await expect(adminPage.sitesTable).toBeVisible()
      await expect(adminPage.siteSearchInput).toBeVisible()
      await expect(adminPage.siteFilterDropdown).toBeVisible()
    })

    test('should show site statistics and overview', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Should show site count and status overview
      const siteCount = await adminPage.getSiteCount()
      expect(siteCount).toBeGreaterThanOrEqual(0)
      
      // Check for summary cards if available
      const statsCards = page.getByTestId('site-stats-cards')
      if (await statsCards.isVisible()) {
        await expect(statsCards).toBeVisible()
      }
    })

    test('should display sites in table format', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Check table structure
      await expect(adminPage.sitesTable).toBeVisible()
      
      // Should have proper table headers
      const headers = adminPage.sitesTable.locator('thead th')
      await expect(headers).toContainText(['Name', 'Address', 'Manager', 'Status'])
    })
  })

  test.describe('Site Creation and Management', () => {
    test('should create a new site successfully', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      const initialSiteCount = await adminPage.getSiteCount()
      
      await adminPage.createSite(testSite)
      
      // Should show success message
      await adminPage.expectSuccessMessage(/site created|site added/i)
      
      // Should redirect back to site list
      await expect(page).toHaveURL(/.*admin\/sites/)
      
      // Site should appear in table
      await adminPage.expectSiteInTable(testSite.name)
      
      // Site count should increase
      const newSiteCount = await adminPage.getSiteCount()
      expect(newSiteCount).toBe(initialSiteCount + 1)
    })

    test('should validate required fields when creating site', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Click add site button
      await adminPage.addSiteButton.click()
      await adminPage.expectSiteFormVisible()
      
      // Try to save without required fields
      await adminPage.saveSiteButton.click()
      
      // Should show validation errors
      await adminPage.expectValidationError(/site name is required/i)
      await adminPage.expectValidationError(/address is required/i)
    })

    test('should validate site name uniqueness', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create first site
      await adminPage.createSite({
        ...testSite,
        name: 'Unique Site Name'
      })
      
      // Try to create second site with same name
      await adminPage.createSite({
        ...testSite,
        name: 'Unique Site Name',
        address: 'Different Address'
      })
      
      // Should show duplicate name error
      await adminPage.expectValidationError(/site name already exists|duplicate site name/i)
    })

    test('should validate address format', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      await adminPage.addSiteButton.click()
      await adminPage.expectSiteFormVisible()
      
      // Enter minimal address
      await adminPage.siteNameInput.fill('Test Site')
      await adminPage.siteAddressInput.fill('x') // Too short
      
      await adminPage.saveSiteButton.click()
      
      // Should show address validation error
      await adminPage.expectValidationError(/address.*too short|invalid address/i)
    })

    test('should handle manager assignment', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      await adminPage.addSiteButton.click()
      await adminPage.expectSiteFormVisible()
      
      // Check manager dropdown options
      await adminPage.siteManagerSelect.click()
      
      // Should show available managers
      await expect(page.getByRole('option', { name: /manager@inopnc.com/i })).toBeVisible()
      
      // Select manager
      await adminPage.siteManagerSelect.selectOption('manager@inopnc.com')
      
      // Fill other required fields
      await adminPage.siteNameInput.fill('Manager Test Site')
      await adminPage.siteAddressInput.fill('Manager Test Address')
      
      await adminPage.saveSiteButton.click()
      
      // Should create site with assigned manager
      await adminPage.expectSuccessMessage(/site created/i)
    })

    test('should cancel site creation', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      const initialSiteCount = await adminPage.getSiteCount()
      
      await adminPage.addSiteButton.click()
      await adminPage.expectSiteFormVisible()
      
      // Fill some data
      await adminPage.siteNameInput.fill('Cancelled Site')
      await adminPage.siteAddressInput.fill('Cancelled Address')
      
      // Cancel
      await adminPage.cancelSiteButton.click()
      
      // Should return to site list without creating site
      await expect(page).toHaveURL(/.*admin\/sites/)
      
      const finalSiteCount = await adminPage.getSiteCount()
      expect(finalSiteCount).toBe(initialSiteCount)
    })
  })

  test.describe('Site Editing and Updates', () => {
    test('should edit existing site successfully', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // First create a site to edit
      await adminPage.createSite({
        ...testSite,
        name: 'Edit Test Site'
      })
      
      // Edit the site
      await adminPage.editSite('Edit Test Site', {
        name: 'Updated Test Site',
        address: 'Updated Address 456',
        description: 'Updated description for testing'
      })
      
      // Should show success message
      await adminPage.expectSuccessMessage(/site updated/i)
      
      // Updated information should be visible
      await expect(adminPage.sitesTable.getByText('Updated Test Site')).toBeVisible()
      await expect(adminPage.sitesTable.getByText('Updated Address 456')).toBeVisible()
    })

    test('should change site manager', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create site with one manager
      await adminPage.createSite({
        ...testSite,
        name: 'Manager Change Test',
        manager: 'manager@inopnc.com'
      })
      
      // Change manager
      await adminPage.editSite('Manager Change Test', {
        manager: 'admin@inopnc.com'
      })
      
      await adminPage.expectSuccessMessage(/site updated/i)
      
      // New manager should be visible in table
      const siteRow = adminPage.sitesTable.getByText('Manager Change Test').locator('..').locator('..')
      await expect(siteRow.getByText('admin@inopnc.com')).toBeVisible()
    })

    test('should toggle site active status', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create active site
      await adminPage.createSite({
        ...testSite,
        name: 'Status Toggle Test',
        active: true
      })
      
      // Edit to deactivate
      await adminPage.editSite('Status Toggle Test', {
        active: false
      })
      
      await adminPage.expectSuccessMessage(/site updated/i)
      
      // Status should be updated in table
      const siteRow = adminPage.sitesTable.getByText('Status Toggle Test').locator('..').locator('..')
      await expect(siteRow.getByText(/inactive|disabled/i)).toBeVisible()
    })

    test('should validate updates properly', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create site first
      await adminPage.createSite({
        ...testSite,
        name: 'Validation Test Site'
      })
      
      // Try to edit with invalid data
      await adminPage.searchSites('Validation Test Site')
      const siteRow = adminPage.sitesTable.getByText('Validation Test Site').locator('..').locator('..')
      const editButton = siteRow.getByRole('button', { name: /edit/i })
      await editButton.click()
      
      // Clear required field
      await adminPage.siteNameInput.fill('')
      await adminPage.saveSiteButton.click()
      
      // Should show validation error
      await adminPage.expectValidationError(/site name is required/i)
    })
  })

  test.describe('Site Deletion and Deactivation', () => {
    test('should delete site with confirmation', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create site to delete
      await adminPage.createSite({
        ...testSite,
        name: 'Delete Test Site'
      })
      
      const initialCount = await adminPage.getSiteCount()
      
      // Delete site
      await adminPage.deleteSite('Delete Test Site')
      
      // Should show success message
      await adminPage.expectSuccessMessage(/site deleted/i)
      
      // Site should be removed from table
      await expect(adminPage.sitesTable.getByText('Delete Test Site')).not.toBeVisible()
      
      // Site count should decrease
      const newCount = await adminPage.getSiteCount()
      expect(newCount).toBe(initialCount - 1)
    })

    test('should show confirmation dialog before deletion', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Ensure at least one site exists
      const siteCount = await adminPage.getSiteCount()
      if (siteCount === 0) {
        await adminPage.createSite({
          ...testSite,
          name: 'Confirm Delete Test'
        })
      }
      
      // Start deletion process
      const firstSiteRow = adminPage.sitesTable.locator('tbody tr').first()
      const deleteButton = firstSiteRow.getByRole('button', { name: /delete/i })
      await deleteButton.click()
      
      // Should show confirmation dialog
      await adminPage.expectConfirmDialog()
      await expect(page.getByText(/are you sure|confirm deletion/i)).toBeVisible()
      
      // Cancel deletion
      await adminPage.cancelButton.click()
      
      // Site should still be in table
      const finalCount = await adminPage.getSiteCount()
      expect(finalCount).toBeGreaterThan(0)
    })

    test('should prevent deletion of sites with active workers', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Mock scenario where site has active workers
      await page.route('**/api/admin/sites/**/delete', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Cannot delete site with active workers'
          })
        })
      })
      
      // Try to delete a site
      const firstSiteRow = adminPage.sitesTable.locator('tbody tr').first()
      const deleteButton = firstSiteRow.getByRole('button', { name: /delete/i })
      await deleteButton.click()
      
      await adminPage.confirmButton.click()
      
      // Should show error message
      await adminPage.expectValidationError(/cannot delete.*active workers/i)
    })

    test('should offer deactivation as alternative to deletion', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create site with dependencies
      await adminPage.createSite({
        ...testSite,
        name: 'Deactivation Test Site'
      })
      
      // Mock deletion failure
      await page.route('**/api/admin/sites/**/delete', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Site has active workers. Consider deactivating instead.',
            canDeactivate: true
          })
        })
      })
      
      await adminPage.deleteSite('Deactivation Test Site')
      
      // Should offer deactivation option
      await expect(page.getByText(/consider deactivating/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /deactivate instead/i })).toBeVisible()
    })
  })

  test.describe('Site Search and Filtering', () => {
    test('should search sites by name', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      const searchQuery = 'Site 1'
      await adminPage.searchSites(searchQuery)
      
      // Should show filtered results
      await expect(adminPage.sitesTable.getByText(searchQuery)).toBeVisible()
      
      // Search results should be relevant
      const visibleRows = await adminPage.sitesTable.locator('tbody tr').count()
      expect(visibleRows).toBeGreaterThanOrEqual(1)
    })

    test('should search sites by address', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      const searchQuery = 'Street'
      await adminPage.searchSites(searchQuery)
      
      // Should show sites with matching addresses
      await expect(page.getByText(/search results/i)).toBeVisible()
    })

    test('should filter sites by status', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      const initialCount = await adminPage.getSiteCount()
      
      await adminPage.filterSites('active')
      
      // Should show only active sites
      const filteredCount = await adminPage.getSiteCount()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
      
      // All visible sites should be active
      const statusColumn = adminPage.sitesTable.locator('[data-column="status"]')
      if (await statusColumn.first().isVisible()) {
        await expect(statusColumn.first()).toContainText(/active|enabled/i)
      }
    })

    test('should filter sites by manager', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      await adminPage.filterSites('manager@inopnc.com')
      
      // Should show sites managed by specific manager
      const managerColumn = adminPage.sitesTable.locator('[data-column="manager"]')
      if (await managerColumn.first().isVisible()) {
        await expect(managerColumn.first()).toContainText('manager@inopnc.com')
      }
    })

    test('should clear search and show all sites', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Apply search first
      await adminPage.searchSites('Test')
      const searchedCount = await adminPage.getSiteCount()
      
      // Clear search
      await adminPage.siteSearchInput.fill('')
      await adminPage.siteSearchInput.press('Enter')
      
      // Should show all sites again
      const allSitesCount = await adminPage.getSiteCount()
      expect(allSitesCount).toBeGreaterThanOrEqual(searchedCount)
    })
  })

  test.describe('Site Analytics and Reporting', () => {
    test('should display site performance metrics', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Click on a site to view details
      const firstSiteRow = adminPage.sitesTable.locator('tbody tr').first()
      const viewButton = firstSiteRow.getByRole('button', { name: /view|details/i })
      
      if (await viewButton.isVisible()) {
        await viewButton.click()
        
        // Should show site details modal
        await expect(adminPage.siteDetailModal).toBeVisible()
        
        // Should show metrics
        await expect(page.getByText(/total workers/i)).toBeVisible()
        await expect(page.getByText(/active reports/i)).toBeVisible()
        await expect(page.getByText(/completion rate/i)).toBeVisible()
      }
    })

    test('should export site data', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      await adminPage.exportSites()
      
      // Should open export modal
      await expect(page.getByTestId('export-modal')).toBeVisible()
      await expect(page.getByText(/export sites/i)).toBeVisible()
      
      // Select format and export
      await page.getByRole('radio', { name: /excel/i }).click()
      await page.getByRole('button', { name: /export/i }).click()
      
      // Should show export success
      await expect(page.getByText(/export started|download will begin/i)).toBeVisible()
    })

    test('should show site activity timeline', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // View site details
      const firstSiteRow = adminPage.sitesTable.locator('tbody tr').first()
      const viewButton = firstSiteRow.getByRole('button', { name: /view|details/i })
      
      if (await viewButton.isVisible()) {
        await viewButton.click()
        
        // Should show activity timeline
        const timelineTab = page.getByRole('tab', { name: /activity|timeline/i })
        if (await timelineTab.isVisible()) {
          await timelineTab.click()
          
          await expect(page.getByTestId('site-timeline')).toBeVisible()
          await expect(page.getByText(/recent activity/i)).toBeVisible()
        }
      }
    })
  })

  test.describe('Site Assignment and Permissions', () => {
    test('should assign workers to site', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create or find a site
      await adminPage.createSite({
        ...testSite,
        name: 'Worker Assignment Test'
      })
      
      // Edit site to assign workers
      await adminPage.editSite('Worker Assignment Test', {})
      
      // Should see worker assignment section
      const workerAssignmentSection = page.getByTestId('worker-assignment')
      if (await workerAssignmentSection.isVisible()) {
        await expect(workerAssignmentSection).toBeVisible()
        
        // Should be able to add workers
        const addWorkerButton = page.getByRole('button', { name: /add worker/i })
        if (await addWorkerButton.isVisible()) {
          await addWorkerButton.click()
          
          // Should show worker selection
          await expect(page.getByTestId('worker-selection-modal')).toBeVisible()
        }
      }
    })

    test('should validate manager permissions for site', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create site with specific manager
      await adminPage.createSite({
        ...testSite,
        name: 'Manager Permission Test',
        manager: 'manager@inopnc.com'
      })
      
      // Manager should have appropriate permissions
      const siteRow = adminPage.sitesTable.getByText('Manager Permission Test').locator('..').locator('..')
      await expect(siteRow.getByText('manager@inopnc.com')).toBeVisible()
      
      // Should see manager contact info or permissions
      const viewButton = siteRow.getByRole('button', { name: /view/i })
      if (await viewButton.isVisible()) {
        await viewButton.click()
        
        await expect(page.getByText(/site manager permissions/i)).toBeVisible()
      }
    })

    test('should handle site ownership transfer', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create site with one manager
      await adminPage.createSite({
        ...testSite,
        name: 'Ownership Transfer Test',
        manager: 'manager@inopnc.com'
      })
      
      // Transfer to different manager
      await adminPage.editSite('Ownership Transfer Test', {
        manager: 'admin@inopnc.com'
      })
      
      // Should show transfer confirmation
      await expect(page.getByText(/transfer ownership|change manager/i)).toBeVisible()
      
      const confirmTransferButton = page.getByRole('button', { name: /confirm transfer/i })
      if (await confirmTransferButton.isVisible()) {
        await confirmTransferButton.click()
        
        await adminPage.expectSuccessMessage(/ownership transferred/i)
      }
    })
  })

  test.describe('Mobile Responsiveness and Performance', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await adminPage.navigateToSiteManagement()
      await adminPage.expectSiteManagementVisible()
      
      // Mobile table should be responsive
      await expect(adminPage.sitesTable).toBeVisible()
      
      // Add site button should be accessible
      await expect(adminPage.addSiteButton).toBeVisible()
      
      // Search should work on mobile
      await adminPage.searchSites('Site')
      await expect(page.getByText(/search results/i)).toBeVisible()
    })

    test('should load site management quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await adminPage.navigateToSiteManagement()
      await adminPage.expectSiteManagementVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should handle large numbers of sites efficiently', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Should have pagination or virtual scrolling for many sites
      const pagination = adminPage.pagination
      if (await pagination.isVisible()) {
        // Test pagination
        const pageInfo = page.getByText(/page \d+ of \d+/i)
        await expect(pageInfo).toBeVisible()
        
        const nextButton = pagination.getByRole('button', { name: /next/i })
        if (await nextButton.isEnabled()) {
          await nextButton.click()
          await expect(page.getByText(/page 2/i)).toBeVisible()
        }
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Should be able to navigate with Tab
      await page.keyboard.press('Tab')
      await expect(adminPage.addSiteButton).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(adminPage.siteSearchInput).toBeFocused()
    })

    test('should handle network errors gracefully', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Simulate network failure
      await page.route('**/api/admin/sites', route => route.abort())
      
      await adminPage.createSite({
        ...testSite,
        name: 'Network Error Test'
      })
      
      // Should show network error
      await expect(page.getByText(/network error|failed to create/i)).toBeVisible()
    })
  })

  test.describe('Data Validation and Security', () => {
    test('should sanitize input data', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Try to create site with XSS attempt
      await adminPage.createSite({
        ...testSite,
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert("xss")>'
      })
      
      // Should sanitize or reject malicious input
      await expect(adminPage.sitesTable.getByText('<script>')).not.toBeVisible()
      await expect(adminPage.sitesTable.getByText('<img')).not.toBeVisible()
    })

    test('should validate site data integrity', async ({ page }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create site with valid data
      await adminPage.createSite({
        ...testSite,
        name: 'Integrity Test Site'
      })
      
      // Verify all data was saved correctly
      const siteRow = adminPage.sitesTable.getByText('Integrity Test Site').locator('..').locator('..')
      await expect(siteRow.getByText(testSite.address)).toBeVisible()
      
      if (testSite.manager) {
        await expect(siteRow.getByText(testSite.manager)).toBeVisible()
      }
    })

    test('should handle concurrent site modifications', async ({ page, context }) => {
      await adminPage.navigateToSiteManagement()
      
      // Create site to edit
      await adminPage.createSite({
        ...testSite,
        name: 'Concurrent Test Site'
      })
      
      // Open site edit in two tabs
      const newPage = await context.newPage()
      const newAdminPage = new AdminPage(newPage)
      await newAdminPage.goto('/admin/sites')
      
      // Start editing in both tabs
      await adminPage.editSite('Concurrent Test Site', {
        name: 'First Edit'
      })
      
      // Second edit should detect conflict
      await newAdminPage.editSite('Concurrent Test Site', {
        name: 'Second Edit'
      })
      
      // Should handle conflict appropriately
      await expect(newPage.getByText(/conflict|updated by another user/i)).toBeVisible()
      
      await newPage.close()
    })
  })
})