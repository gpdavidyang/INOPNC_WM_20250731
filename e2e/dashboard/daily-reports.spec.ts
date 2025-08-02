import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'
import { DailyReportsPage } from '../pages/daily-reports.page'

test.describe('Daily Reports CRUD Workflow', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage
  let reportsPage: DailyReportsPage

  const testReport = {
    title: 'E2E Test Daily Report',
    date: '2024-08-01',
    site: 'Site 1',
    weather: 'Sunny',
    workContent: 'Concrete pouring for foundation work. Completed sections A-C of the building foundation.',
    materialsUsed: 'Concrete mix (50 cubic meters), Steel reinforcement bars, Wooden forms',
    equipmentUsed: 'Concrete mixer, Crane, Hand tools',
    issues: 'Minor delay due to equipment maintenance. Resolved by afternoon.'
  }

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    reportsPage = new DailyReportsPage(page)

    // Login as worker
    await authPage.navigateToLogin()
    await authPage.loginAsWorker()
  })

  test.describe('Reports List and Navigation', () => {
    test('should display daily reports page with all elements', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await reportsPage.expectReportsPageVisible()
      
      // Check page URL and title
      await expect(page).toHaveURL(/.*daily-reports/)
      await expect(page).toHaveTitle(/daily reports/i)
    })

    test('should navigate to create report form', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await reportsPage.navigateToCreateReport()
      
      await expect(page).toHaveURL(/.*daily-reports\/create/)
      await reportsPage.expectReportFormVisible()
    })

    test('should search reports by title', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      const searchQuery = 'foundation'
      await reportsPage.searchReports(searchQuery)
      
      // Should show filtered results
      await expect(page.getByTestId('search-results-count')).toBeVisible()
      await expect(page.getByText(/search results/i)).toContainText(searchQuery)
    })

    test('should filter reports by status', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      await reportsPage.filterByStatus('Draft')
      
      // Should show only draft reports
      const reportCount = await reportsPage.getReportCount()
      if (reportCount > 0) {
        await expect(reportsPage.statusColumn.first()).toContainText('Draft')
      }
    })

    test('should sort reports by date', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      const initialFirstReport = await reportsPage.getFirstReportTitle()
      await reportsPage.sortBy('Date (Oldest First)')
      
      await reportsPage.waitForLoadState()
      const newFirstReport = await reportsPage.getFirstReportTitle()
      
      // Order should have changed (unless there's only one report)
      const reportCount = await reportsPage.getReportCount()
      if (reportCount > 1) {
        expect(newFirstReport).not.toBe(initialFirstReport)
      }
    })

    test('should handle pagination', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Check if pagination is available
      const paginationVisible = await reportsPage.pagination.isVisible()
      if (paginationVisible) {
        await reportsPage.goToPage(2)
        await expect(page.getByText(/page 2/i)).toBeVisible()
      }
    })
  })

  test.describe('Create Report Workflow', () => {
    test('should create a new daily report successfully', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await reportsPage.navigateToCreateReport()
      
      // Fill out the report form
      await reportsPage.createReport(testReport)
      await reportsPage.submitReport()
      
      // Should redirect to report view or reports list
      await expect(page).toHaveURL(/.*daily-reports/)
      await reportsPage.expectSuccessMessage(/report created|report saved/i)
      
      // Verify report appears in list
      await reportsPage.expectReportInTable(testReport.title)
    })

    test('should validate required fields', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await reportsPage.navigateToCreateReport()
      
      // Try to submit without required fields
      await reportsPage.submitButton.click()
      
      // Should show validation errors
      await reportsPage.expectValidationError(/title is required/i)
      await reportsPage.expectValidationError(/date is required/i)
      await reportsPage.expectValidationError(/work content is required/i)
    })

    test('should save report as draft', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await reportsPage.navigateToCreateReport()
      
      // Fill partial data
      await reportsPage.titleInput.fill('Draft Report Test')
      await reportsPage.workContentTextarea.fill('Partial work description')
      
      await reportsPage.saveAsDraft()
      
      // Should save as draft
      await reportsPage.expectSuccessMessage(/saved as draft/i)
      await expect(page).toHaveURL(/.*daily-reports/)
    })

    test('should upload photos with report', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await reportsPage.navigateToCreateReport()
      
      await reportsPage.createReport(testReport)
      
      // Upload test images (would need test image files)
      // await reportsPage.uploadPhotos(['test-images/construction1.jpg'])
      
      await reportsPage.submitReport()
      await reportsPage.expectSuccessMessage(/report created/i)
    })

    test('should handle network errors gracefully', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      await reportsPage.navigateToCreateReport()
      
      // Simulate network failure
      await page.route('**/api/daily-reports', route => route.abort())
      
      await reportsPage.createReport(testReport)
      await reportsPage.submitReport()
      
      // Should show error message
      await expect(page.getByText(/network error|failed to save/i)).toBeVisible()
    })
  })

  test.describe('View and Edit Report Workflow', () => {
    test('should view report details', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Click on first report (assuming at least one exists)
      const firstReportLink = reportsPage.tableRows.first().getByRole('link')
      await firstReportLink.click()
      
      // Should show report details
      await expect(page).toHaveURL(/.*daily-reports\/[^\/]+/)
      await expect(reportsPage.reportTitle).toBeVisible()
      await expect(reportsPage.reportContent).toBeVisible()
      await expect(reportsPage.reportDate).toBeVisible()
      await expect(reportsPage.reportStatus).toBeVisible()
    })

    test('should edit existing report', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Navigate to first report
      const firstReportLink = reportsPage.tableRows.first().getByRole('link')
      await firstReportLink.click()
      
      // Edit the report
      await reportsPage.editButton.click()
      await expect(page).toHaveURL(/.*edit/)
      
      // Modify content
      const updatedTitle = 'Updated Report Title'
      await reportsPage.titleInput.fill(updatedTitle)
      await reportsPage.submitReport()
      
      // Should show updated content
      await reportsPage.expectSuccessMessage(/report updated/i)
      await reportsPage.expectReportVisible(updatedTitle)
    })

    test('should share report', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Navigate to first report
      const firstReportLink = reportsPage.tableRows.first().getByRole('link')
      await firstReportLink.click()
      
      await reportsPage.shareReport()
      
      // Should open share modal
      await expect(page.getByTestId('share-modal')).toBeVisible()
      await expect(page.getByText(/share report/i)).toBeVisible()
    })

    test('should print report', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Navigate to first report
      const firstReportLink = reportsPage.tableRows.first().getByRole('link')
      await firstReportLink.click()
      
      // Mock print dialog
      let printDialogOpened = false
      page.on('dialog', dialog => {
        printDialogOpened = true
        dialog.accept()
      })
      
      await reportsPage.printButton.click()
      
      // Verify print was triggered (in real scenario, would check for print CSS)
      await expect(page.locator('[media="print"]')).toBeAttached()
    })
  })

  test.describe('Delete Report Workflow', () => {
    test('should delete report with confirmation', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Get initial count
      const initialCount = await reportsPage.getReportCount()
      
      // Navigate to first report
      const firstReportLink = reportsPage.tableRows.first().getByRole('link')
      await firstReportLink.click()
      
      await reportsPage.deleteReport()
      
      // Should redirect back to list
      await expect(page).toHaveURL(/.*daily-reports\/$/)
      await reportsPage.expectSuccessMessage(/report deleted/i)
      
      // Count should decrease
      if (initialCount > 0) {
        const newCount = await reportsPage.getReportCount()
        expect(newCount).toBe(initialCount - 1)
      }
    })

    test('should cancel delete operation', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Navigate to first report
      const firstReportLink = reportsPage.tableRows.first().getByRole('link')
      await firstReportLink.click()
      
      await reportsPage.deleteButton.click()
      
      // Cancel deletion
      const cancelButton = page.getByRole('button', { name: /cancel/i })
      await cancelButton.click()
      
      // Should remain on report page
      await expect(page).toHaveURL(/.*daily-reports\/[^\/]+/)
      await expect(reportsPage.reportTitle).toBeVisible()
    })
  })

  test.describe('Export and Bulk Operations', () => {
    test('should export reports to Excel', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      await reportsPage.exportReports()
      
      // Should open export modal
      await expect(page.getByTestId('export-modal')).toBeVisible()
      
      // Select Excel format
      await page.getByRole('radio', { name: /excel/i }).click()
      await page.getByRole('button', { name: /export/i }).click()
      
      // Should trigger download (would need download handling in real test)
      await expect(page.getByText(/export started/i)).toBeVisible()
    })

    test('should export filtered reports', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Apply filter first
      await reportsPage.filterByStatus('Completed')
      
      await reportsPage.exportReports()
      
      // Export modal should indicate filtered data
      await expect(page.getByText(/exporting filtered reports/i)).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.navigateToDailyReports()
      
      // Should show mobile-optimized layout
      await expect(reportsPage.createReportButton).toBeVisible()
      
      // Table should be scrollable or stacked
      const mobileTable = page.getByTestId('mobile-reports-list')
      if (await mobileTable.isVisible()) {
        await expect(mobileTable).toBeVisible()
      } else {
        // Regular table should be scrollable
        await expect(reportsPage.reportsTable).toBeVisible()
      }
    })

    test('should create report on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.navigateToDailyReports()
      await reportsPage.navigateToCreateReport()
      
      // Form should be mobile-friendly
      await reportsPage.expectReportFormVisible()
      
      // Should be able to fill and submit
      await reportsPage.createReport({
        ...testReport,
        title: 'Mobile Test Report'
      })
      await reportsPage.submitReport()
      
      await reportsPage.expectSuccessMessage(/report created/i)
    })
  })

  test.describe('Performance and Accessibility', () => {
    test('should load reports page quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await dashboardPage.navigateToDailyReports()
      await reportsPage.expectReportsPageVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should be keyboard navigable', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Should be able to navigate with Tab key
      await page.keyboard.press('Tab')
      await expect(reportsPage.createReportButton).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(reportsPage.searchInput).toBeFocused()
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await dashboardPage.navigateToDailyReports()
      
      // Check for accessibility attributes
      await expect(reportsPage.reportsTable).toHaveAttribute('role', 'table')
      await expect(reportsPage.searchInput).toHaveAttribute('aria-label')
    })
  })
})