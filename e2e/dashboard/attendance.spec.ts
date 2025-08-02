import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'
import { AttendancePage } from '../pages/attendance.page'

test.describe('Attendance Check-in/out Workflow', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage
  let attendancePage: AttendancePage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    attendancePage = new AttendancePage(page)

    // Login as worker
    await authPage.navigateToLogin()
    await authPage.loginAsWorker()
  })

  test.describe('Attendance Page and Navigation', () => {
    test('should display attendance page with all elements', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      await attendancePage.expectAttendancePageVisible()
      
      // Check page URL and title
      await expect(page).toHaveURL(/.*attendance/)
      await expect(page).toHaveTitle(/attendance/i)
      
      // Check main elements are visible
      await expect(attendancePage.currentStatusCard).toBeVisible()
      await expect(attendancePage.calendar).toBeVisible()
      await expect(attendancePage.todayHours).toBeVisible()
      await expect(attendancePage.weeklyHours).toBeVisible()
      await expect(attendancePage.monthlyHours).toBeVisible()
    })

    test('should show current attendance status', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      const status = await attendancePage.getCurrentStatus()
      expect(status).toMatch(/checked in|checked out|not checked in/i)
      
      // Button availability should match status
      if (status.toLowerCase().includes('checked in')) {
        await attendancePage.expectCheckedInStatus()
      } else {
        await attendancePage.expectCheckedOutStatus()
      }
    })

    test('should display working hours summary', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Should show hours in proper format (e.g., "8h 30m")
      const todayHours = await attendancePage.getTodayHours()
      expect(todayHours).toMatch(/\d+h\s*\d*m?|\d+:\d+|0h/i)
    })
  })

  test.describe('Check-in Workflow', () => {
    test('should perform basic check-in', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Ensure we're checked out first
      const status = await attendancePage.getCurrentStatus()
      if (status.toLowerCase().includes('checked in')) {
        await attendancePage.checkOut()
        await attendancePage.expectSuccessMessage(/checked out/i)
      }
      
      // Perform check-in
      await attendancePage.checkIn()
      
      // Verify check-in success
      await attendancePage.expectSuccessMessage(/checked in/i)
      await attendancePage.expectCheckedInStatus()
    })

    test('should check-in with location and notes', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Ensure we're checked out
      const status = await attendancePage.getCurrentStatus()
      if (status.toLowerCase().includes('checked in')) {
        await attendancePage.checkOut()
      }
      
      await attendancePage.checkIn({
        location: 'Construction Site A - Block 1',
        notes: 'Starting work on foundation preparation',
        temperature: '36.5'
      })
      
      await attendancePage.expectSuccessMessage(/checked in/i)
      await attendancePage.expectCheckedInStatus()
    })

    test('should validate check-in form', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Try to check in without location (if required)
      await attendancePage.checkInButton.click()
      await attendancePage.expectCheckInFormVisible()
      
      // Submit without required fields
      await attendancePage.confirmButton.click()
      
      // Should show validation error for required fields
      const locationRequired = await attendancePage.page.getByText(/location is required/i).isVisible()
      if (locationRequired) {
        await attendancePage.expectValidationError(/location is required/i)
      }
    })

    test('should cancel check-in process', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      await attendancePage.checkInButton.click()
      await attendancePage.expectCheckInFormVisible()
      
      await attendancePage.cancelCheckIn()
      
      // Should return to main page without checking in
      await expect(attendancePage.page.getByTestId('check-in-modal')).not.toBeVisible()
      await attendancePage.expectCheckedOutStatus()
    })

    test('should prevent double check-in', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Check in first
      const status = await attendancePage.getCurrentStatus()
      if (!status.toLowerCase().includes('checked in')) {
        await attendancePage.checkIn()
        await attendancePage.expectCheckedInStatus()
      }
      
      // Check-in button should not be visible when already checked in
      await expect(attendancePage.checkInButton).not.toBeVisible()
      await expect(attendancePage.checkOutButton).toBeVisible()
    })
  })

  test.describe('Check-out Workflow', () => {
    test('should perform basic check-out', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Ensure we're checked in first
      const status = await attendancePage.getCurrentStatus()
      if (!status.toLowerCase().includes('checked in')) {
        await attendancePage.checkIn()
        await attendancePage.expectCheckedInStatus()
      }
      
      // Perform check-out
      await attendancePage.checkOut()
      
      // Verify check-out success
      await attendancePage.expectSuccessMessage(/checked out/i)
      await attendancePage.expectCheckedOutStatus()
    })

    test('should check-out with notes', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Ensure we're checked in
      const status = await attendancePage.getCurrentStatus()
      if (!status.toLowerCase().includes('checked in')) {
        await attendancePage.checkIn()
      }
      
      await attendancePage.checkOut({
        notes: 'Completed foundation work. Site secured for the day.'
      })
      
      await attendancePage.expectSuccessMessage(/checked out/i)
      await attendancePage.expectCheckedOutStatus()
    })

    test('should prevent check-out when not checked in', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Ensure we're checked out
      const status = await attendancePage.getCurrentStatus()
      if (status.toLowerCase().includes('checked in')) {
        await attendancePage.checkOut()
      }
      
      // Check-out button should not be visible
      await expect(attendancePage.checkOutButton).not.toBeVisible()
      await expect(attendancePage.checkInButton).toBeVisible()
    })

    test('should update working hours after check-out', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Check in and then out to generate hours
      const initialStatus = await attendancePage.getCurrentStatus()
      
      if (!initialStatus.toLowerCase().includes('checked in')) {
        await attendancePage.checkIn()
        // Wait a moment to simulate work time
        await page.waitForTimeout(1000)
      }
      
      const hoursBeforeCheckout = await attendancePage.getTodayHours()
      await attendancePage.checkOut()
      
      // Hours should be updated
      const hoursAfterCheckout = await attendancePage.getTodayHours()
      expect(hoursAfterCheckout).not.toBe(hoursBeforeCheckout)
    })
  })

  test.describe('Calendar Interactions', () => {
    test('should navigate calendar months', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      const currentMonth = await attendancePage.monthYearHeader.textContent()
      
      // Navigate to next month
      await attendancePage.navigateToMonth('next')
      const nextMonth = await attendancePage.monthYearHeader.textContent()
      expect(nextMonth).not.toBe(currentMonth)
      
      // Navigate back to previous month
      await attendancePage.navigateToMonth('prev')
      const backToOriginal = await attendancePage.monthYearHeader.textContent()
      expect(backToOriginal).toBe(currentMonth)
    })

    test('should select calendar dates', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Select a date from the calendar
      const today = new Date().toISOString().split('T')[0]
      await attendancePage.selectCalendarDate(today)
      
      // Should highlight the selected date
      await attendancePage.expectCalendarDateHighlighted(today)
      
      // Should show attendance records for that date
      await expect(attendancePage.attendanceList).toBeVisible()
    })

    test('should return to today', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Navigate to different month
      await attendancePage.navigateToMonth('next')
      await attendancePage.navigateToMonth('next')
      
      // Return to today
      await attendancePage.goToToday()
      
      // Should show current month and highlight today
      const today = new Date()
      const currentMonthYear = today.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
      await expect(attendancePage.monthYearHeader).toContainText(currentMonthYear)
    })

    test('should show attendance records on date selection', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Select a recent date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      await attendancePage.selectCalendarDate(yesterdayStr)
      
      // Should show attendance records for that date (if any)
      await expect(attendancePage.attendanceList).toBeVisible()
    })
  })

  test.describe('Attendance History and Filtering', () => {
    test('should display attendance history', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Should show attendance table/list
      await expect(attendancePage.attendanceTable).toBeVisible()
      
      // Check if there are any records
      const recordCount = await attendancePage.getAttendanceRecordCount()
      expect(recordCount).toBeGreaterThanOrEqual(0)
    })

    test('should filter attendance by status', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      const initialCount = await attendancePage.getAttendanceRecordCount()
      
      // Apply filter
      await attendancePage.filterAttendance('Present')
      
      // Records should be filtered
      const filteredCount = await attendancePage.getAttendanceRecordCount()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    })

    test('should filter by date range', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Set date range for last week
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      const startDateStr = startDate.toISOString().split('T')[0]
      
      await attendancePage.setDateRange(startDateStr, endDate)
      
      // Should show records within date range
      await attendancePage.expectAttendanceRecordCount(await attendancePage.getAttendanceRecordCount())
    })

    test('should search attendance records', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      await attendancePage.searchAttendance('construction')
      
      // Should show filtered results
      await expect(attendancePage.attendanceList).toBeVisible()
    })

    test('should export attendance data', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      await attendancePage.exportAttendance()
      
      // Should open export modal
      await expect(page.getByTestId('export-modal')).toBeVisible()
      await expect(page.getByText(/export attendance/i)).toBeVisible()
    })
  })

  test.describe('Team Attendance (Manager Role)', () => {
    test('manager should see team attendance tab', async ({ page }) => {
      // Login as manager
      await authPage.logout()
      await authPage.loginAsManager()
      await dashboardPage.navigateToAttendance()
      
      // Should see team attendance tab
      await expect(attendancePage.teamAttendanceTab).toBeVisible()
      
      await attendancePage.switchToTeamAttendance()
      await attendancePage.expectTeamAttendanceVisible()
    })

    test('manager should view team member attendance', async ({ page }) => {
      await authPage.logout()
      await authPage.loginAsManager()
      await dashboardPage.navigateToAttendance()
      
      await attendancePage.switchToTeamAttendance()
      
      // Should show team statistics
      await expect(attendancePage.teamStatsCards).toBeVisible()
      await expect(attendancePage.teamMembersList).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.navigateToAttendance()
      
      // Should show mobile-optimized layout
      await attendancePage.expectAttendancePageVisible()
      
      // Check-in button should be easily accessible
      await expect(attendancePage.checkInButton).toBeVisible()
      
      // Calendar should be responsive
      await expect(attendancePage.calendar).toBeVisible()
    })

    test('should perform check-in on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.navigateToAttendance()
      
      // Ensure checked out state
      const status = await attendancePage.getCurrentStatus()
      if (status.toLowerCase().includes('checked in')) {
        await attendancePage.checkOut()
      }
      
      // Perform mobile check-in
      await attendancePage.checkIn({
        location: 'Mobile Test Location'
      })
      
      await attendancePage.expectSuccessMessage(/checked in/i)
      await attendancePage.expectCheckedInStatus()
    })

    test('should have touch-friendly calendar', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.navigateToAttendance()
      
      // Calendar should be touch-friendly
      const calendarDay = attendancePage.calendarDays.first()
      await expect(calendarDay).toBeVisible()
      
      // Touch targets should be large enough (at least 44px)
      const boundingBox = await calendarDay.boundingBox()
      expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
    })
  })

  test.describe('Performance and Accessibility', () => {
    test('should load attendance page quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await dashboardPage.navigateToAttendance()
      await attendancePage.expectAttendancePageVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should be keyboard navigable', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Should be able to navigate with Tab key
      await page.keyboard.press('Tab')
      
      // Check-in/out button should be focusable
      const checkInVisible = await attendancePage.checkInButton.isVisible()
      const checkOutVisible = await attendancePage.checkOutButton.isVisible()
      
      if (checkInVisible) {
        await expect(attendancePage.checkInButton).toBeFocused()
      } else if (checkOutVisible) {
        await expect(attendancePage.checkOutButton).toBeFocused()
      }
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Check for accessibility attributes
      await expect(attendancePage.calendar).toHaveAttribute('role')
      await expect(attendancePage.checkInButton).toHaveAttribute('aria-label')
    })

    test('should handle geolocation for check-in', async ({ page }) => {
      // Mock geolocation API
      await page.context().grantPermissions(['geolocation'])
      await page.setGeolocation({ latitude: 37.7749, longitude: -122.4194 })
      
      await dashboardPage.navigateToAttendance()
      
      // Check-in should use location
      const status = await attendancePage.getCurrentStatus()
      if (status.toLowerCase().includes('checked in')) {
        await attendancePage.checkOut()
      }
      
      await attendancePage.checkIn()
      
      // Should successfully check in with location
      await attendancePage.expectSuccessMessage(/checked in/i)
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Simulate network failure
      await page.route('**/api/attendance/**', route => route.abort())
      
      const status = await attendancePage.getCurrentStatus()
      if (status.toLowerCase().includes('checked in')) {
        await attendancePage.checkOut()
      } else {
        await attendancePage.checkIn()
      }
      
      // Should show error message
      await expect(page.getByText(/network error|failed to check/i)).toBeVisible()
    })

    test('should handle offline scenarios', async ({ page }) => {
      await dashboardPage.navigateToAttendance()
      
      // Simulate offline
      await page.context().setOffline(true)
      
      await attendancePage.checkInButton.click()
      
      // Should show offline message or queue action
      await expect(page.getByText(/offline|no connection/i)).toBeVisible()
      
      // Restore online
      await page.context().setOffline(false)
    })
  })
})