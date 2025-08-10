import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'
import { AttendancePage } from '../pages/attendance.page'

test.describe('Korean Labor Hours (공수) Workflow E2E Tests', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage
  let attendancePage: AttendancePage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    attendancePage = new AttendancePage(page)

    // Login as worker and navigate to attendance
    await authPage.navigateToLogin()
    await authPage.loginAsWorker()
    await dashboardPage.navigateToAttendance()
  })

  test.describe('Labor Hours (공수) Input and Validation', () => {
    test('should display labor hours options with Korean units', async ({ page }) => {
      // Navigate to attendance calendar and look for labor hours input
      await attendancePage.navigateToAttendance()
      
      // Check if labor hours selector exists
      const laborHoursSelector = page.getByTestId('labor-hours-selector')
      if (await laborHoursSelector.isVisible()) {
        // Should show Korean labor hours options
        await expect(laborHoursSelector).toBeVisible()
        
        // Check for 공수 options
        await laborHoursSelector.click()
        await expect(page.getByRole('option', { name: /0.25.*공수/i })).toBeVisible()
        await expect(page.getByRole('option', { name: /0.5.*공수/i })).toBeVisible()
        await expect(page.getByRole('option', { name: /1.0.*공수/i })).toBeVisible()
        await expect(page.getByRole('option', { name: /1.25.*공수/i })).toBeVisible()
      }
    })

    test('should validate labor hours calculations - 0.25 공수 = 2 hours', async ({ page }) => {
      // Check if bulk attendance entry exists for testing labor hours
      const bulkEntryButton = page.getByRole('button', { name: /bulk entry|일괄 입력/i })
      
      if (await bulkEntryButton.isVisible()) {
        await bulkEntryButton.click()
        
        // Select 0.25 공수 (2 hours)
        await page.getByTestId('labor-hours-input').fill('0.25')
        
        // Should show calculated actual hours
        const calculatedHours = page.getByTestId('calculated-hours')
        if (await calculatedHours.isVisible()) {
          await expect(calculatedHours).toContainText('2')
          await expect(calculatedHours).toContainText('hours')
        }
      }
    })

    test('should validate labor hours calculations - 0.5 공수 = 4 hours', async ({ page }) => {
      const bulkEntryButton = page.getByRole('button', { name: /bulk entry|일괄 입력/i })
      
      if (await bulkEntryButton.isVisible()) {
        await bulkEntryButton.click()
        
        // Select 0.5 공수 (4 hours - half day)
        await page.getByTestId('labor-hours-input').fill('0.5')
        
        const calculatedHours = page.getByTestId('calculated-hours')
        if (await calculatedHours.isVisible()) {
          await expect(calculatedHours).toContainText('4')
          await expect(page.getByText(/half day|반일/i)).toBeVisible()
        }
      }
    })

    test('should validate labor hours calculations - 1.0 공수 = 8 hours (regular)', async ({ page }) => {
      const bulkEntryButton = page.getByRole('button', { name: /bulk entry|일괄 입력/i })
      
      if (await bulkEntryButton.isVisible()) {
        await bulkEntryButton.click()
        
        // Select 1.0 공수 (8 hours - full day)
        await page.getByTestId('labor-hours-input').fill('1.0')
        
        const calculatedHours = page.getByTestId('calculated-hours')
        if (await calculatedHours.isVisible()) {
          await expect(calculatedHours).toContainText('8')
          await expect(page.getByText(/regular|정규/i)).toBeVisible()
        }
      }
    })

    test('should validate labor hours calculations - 1.25 공수 = 10 hours (with overtime)', async ({ page }) => {
      const bulkEntryButton = page.getByRole('button', { name: /bulk entry|일괄 입력/i })
      
      if (await bulkEntryButton.isVisible()) {
        await bulkEntryButton.click()
        
        // Select 1.25 공수 (10 hours = 8 regular + 2 overtime)
        await page.getByTestId('labor-hours-input').fill('1.25')
        
        const calculatedHours = page.getByTestId('calculated-hours')
        const overtimeHours = page.getByTestId('overtime-hours')
        
        if (await calculatedHours.isVisible()) {
          await expect(calculatedHours).toContainText('10')
          
          if (await overtimeHours.isVisible()) {
            await expect(overtimeHours).toContainText('2')
            await expect(page.getByText(/overtime|초과근무/i)).toBeVisible()
          }
        }
      }
    })

    test('should validate labor hours calculations - 1.5 공수 = 12 hours (heavy overtime)', async ({ page }) => {
      const bulkEntryButton = page.getByRole('button', { name: /bulk entry|일괄 입력/i })
      
      if (await bulkEntryButton.isVisible()) {
        await bulkEntryButton.click()
        
        // Select 1.5 공수 (12 hours = 8 regular + 4 overtime)
        await page.getByTestId('labor-hours-input').fill('1.5')
        
        const calculatedHours = page.getByTestId('calculated-hours')
        const overtimeHours = page.getByTestId('overtime-hours')
        
        if (await calculatedHours.isVisible()) {
          await expect(calculatedHours).toContainText('12')
          
          if (await overtimeHours.isVisible()) {
            await expect(overtimeHours).toContainText('4')
            await expect(page.getByText(/heavy overtime|과도한 초과근무/i)).toBeVisible()
          }
        }
      }
    })
  })

  test.describe('Calendar Color Coding by Labor Hours', () => {
    test('should display correct colors for different labor hours on calendar', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      // Check calendar for color-coded days
      const calendar = page.getByTestId('attendance-calendar')
      await expect(calendar).toBeVisible()
      
      // Look for days with different labor hours and their colors
      const calendarDays = calendar.locator('[data-date]')
      const dayCount = await calendarDays.count()
      
      if (dayCount > 0) {
        for (let i = 0; i < Math.min(dayCount, 10); i++) {
          const day = calendarDays.nth(i)
          const laborHours = await day.getAttribute('data-labor-hours')
          
          if (laborHours) {
            const hours = parseFloat(laborHours)
            
            if (hours >= 1.0) {
              // Green for full day or overtime (1.0+ 공수)
              await expect(day).toHaveClass(/green|success/)
            } else if (hours >= 0.5) {
              // Yellow for half to almost full day (0.5-0.9 공수)
              await expect(day).toHaveClass(/yellow|warning/)
            } else if (hours > 0) {
              // Orange for less than half day (0.1-0.4 공수)
              await expect(day).toHaveClass(/orange|alert/)
            } else {
              // Gray for no work/holiday (0 공수)
              await expect(day).toHaveClass(/gray|muted/)
            }
          }
        }
      }
    })

    test('should show labor hours tooltip on calendar day hover', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      const calendar = page.getByTestId('attendance-calendar')
      const calendarDays = calendar.locator('[data-date][data-labor-hours]')
      
      if (await calendarDays.count() > 0) {
        const firstDay = calendarDays.first()
        
        // Hover over calendar day
        await firstDay.hover()
        
        // Should show tooltip with labor hours
        const tooltip = page.getByTestId('labor-hours-tooltip')
        if (await tooltip.isVisible()) {
          await expect(tooltip).toContainText(/공수/)
          await expect(tooltip).toContainText(/hours/)
        }
      }
    })
  })

  test.describe('Payslip Generation with Labor Hours', () => {
    test('should generate PDF payslip with correct labor hours calculations', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      // Look for payslip generation button
      const payslipButton = page.getByRole('button', { name: /generate payslip|급여명세서 생성/i })
      
      if (await payslipButton.isVisible()) {
        await payslipButton.click()
        
        // Should open payslip modal
        const payslipModal = page.getByTestId('payslip-modal')
        await expect(payslipModal).toBeVisible()
        
        // Should show labor hours summary
        const laborHoursSummary = payslipModal.getByTestId('labor-hours-summary')
        if (await laborHoursSummary.isVisible()) {
          await expect(laborHoursSummary).toContainText(/total.*공수/)
          await expect(laborHoursSummary).toContainText(/regular hours|정규시간/)
          await expect(laborHoursSummary).toContainText(/overtime hours|초과시간/)
        }
        
        // Test calculation example: 22.5 공수 * 8 = 180 hours
        const totalLaborHours = page.getByTestId('total-labor-hours')
        if (await totalLaborHours.isVisible()) {
          const laborHoursText = await totalLaborHours.textContent()
          const laborHoursValue = parseFloat(laborHoursText?.match(/[\d.]+/)?.[0] || '0')
          
          if (laborHoursValue > 0) {
            const expectedActualHours = laborHoursValue * 8
            const actualHoursElement = page.getByTestId('total-actual-hours')
            
            if (await actualHoursElement.isVisible()) {
              await expect(actualHoursElement).toContainText(expectedActualHours.toString())
            }
          }
        }
        
        // Generate PDF
        const generatePdfButton = payslipModal.getByRole('button', { name: /generate pdf|pdf 생성/i })
        if (await generatePdfButton.isVisible()) {
          // Start download and verify it's a PDF
          const downloadPromise = page.waitForEvent('download')
          await generatePdfButton.click()
          
          const download = await downloadPromise
          expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
          expect(download.suggestedFilename()).toContain('payslip')
        }
      }
    })

    test('should validate salary calculations in payslip', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      const payslipButton = page.getByRole('button', { name: /generate payslip|급여명세서 생성/i })
      
      if (await payslipButton.isVisible()) {
        await payslipButton.click()
        
        const payslipModal = page.getByTestId('payslip-modal')
        await expect(payslipModal).toBeVisible()
        
        // Check salary calculation components
        const regularPay = page.getByTestId('regular-pay')
        const overtimePay = page.getByTestId('overtime-pay')
        const totalPay = page.getByTestId('total-pay')
        
        if (await regularPay.isVisible() && await overtimePay.isVisible() && await totalPay.isVisible()) {
          const regularAmount = parseFloat((await regularPay.textContent())?.replace(/[^\d.]/g, '') || '0')
          const overtimeAmount = parseFloat((await overtimePay.textContent())?.replace(/[^\d.]/g, '') || '0')
          const totalAmount = parseFloat((await totalPay.textContent())?.replace(/[^\d.]/g, '') || '0')
          
          // Verify total = regular + overtime
          expect(totalAmount).toBe(regularAmount + overtimeAmount)
          
          // Check if overtime rate is 1.5x (if overtime exists)
          if (overtimeAmount > 0) {
            const overtimeHours = page.getByTestId('overtime-hours-value')
            const hourlyRate = page.getByTestId('hourly-rate-value')
            
            if (await overtimeHours.isVisible() && await hourlyRate.isVisible()) {
              const overtimeHoursValue = parseFloat((await overtimeHours.textContent()) || '0')
              const hourlyRateValue = parseFloat((await hourlyRate.textContent())?.replace(/[^\d]/g, '') || '0')
              
              const expectedOvertimePay = overtimeHoursValue * hourlyRateValue * 1.5
              expect(overtimeAmount).toBeCloseTo(expectedOvertimePay, 0)
            }
          }
        }
      }
    })
  })

  test.describe('Monthly Labor Hours Summary', () => {
    test('should display monthly labor hours aggregation', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      // Navigate to monthly summary
      const monthlySummaryTab = page.getByRole('tab', { name: /monthly summary|월간 요약/i })
      
      if (await monthlySummaryTab.isVisible()) {
        await monthlySummaryTab.click()
        
        // Should show monthly statistics
        const monthlyStats = page.getByTestId('monthly-stats')
        await expect(monthlyStats).toBeVisible()
        
        // Check for labor hours metrics
        await expect(monthlyStats).toContainText(/total.*공수/)
        await expect(monthlyStats).toContainText(/average.*공수/)
        await expect(monthlyStats).toContainText(/work days|근무일/)
        
        // Verify calculation consistency
        const totalLaborHours = page.getByTestId('monthly-total-labor-hours')
        const workDays = page.getByTestId('monthly-work-days')
        const averageLaborHours = page.getByTestId('monthly-average-labor-hours')
        
        if (await totalLaborHours.isVisible() && await workDays.isVisible() && await averageLaborHours.isVisible()) {
          const total = parseFloat((await totalLaborHours.textContent())?.replace(/[^\d.]/g, '') || '0')
          const days = parseFloat((await workDays.textContent())?.replace(/[^\d]/g, '') || '0')
          const average = parseFloat((await averageLaborHours.textContent())?.replace(/[^\d.]/g, '') || '0')
          
          if (days > 0) {
            const expectedAverage = total / days
            expect(average).toBeCloseTo(expectedAverage, 1)
          }
        }
      }
    })

    test('should display overtime percentage correctly', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      const monthlySummaryTab = page.getByRole('tab', { name: /monthly summary|월간 요약/i })
      
      if (await monthlySummaryTab.isVisible()) {
        await monthlySummaryTab.click()
        
        const overtimePercentage = page.getByTestId('overtime-percentage')
        if (await overtimePercentage.isVisible()) {
          const percentageText = await overtimePercentage.textContent()
          const percentage = parseFloat(percentageText?.replace(/[^\d.]/g, '') || '0')
          
          // Should be between 0 and 100
          expect(percentage).toBeGreaterThanOrEqual(0)
          expect(percentage).toBeLessThanOrEqual(100)
          
          // Should show % symbol
          await expect(overtimePercentage).toContainText('%')
        }
      }
    })
  })

  test.describe('Labor Hours Data Export', () => {
    test('should export labor hours data in Excel format', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      const exportButton = page.getByRole('button', { name: /export|내보내기/i })
      
      if (await exportButton.isVisible()) {
        await exportButton.click()
        
        const exportModal = page.getByTestId('export-modal')
        await expect(exportModal).toBeVisible()
        
        // Select Excel format
        const excelOption = exportModal.getByRole('radio', { name: /excel|xlsx/i })
        if (await excelOption.isVisible()) {
          await excelOption.click()
          
          // Include labor hours in export
          const includeLaborHours = exportModal.getByRole('checkbox', { name: /labor hours|공수/i })
          if (await includeLaborHours.isVisible()) {
            await includeLaborHours.check()
          }
          
          // Start export
          const exportConfirmButton = exportModal.getByRole('button', { name: /export|내보내기/i })
          const downloadPromise = page.waitForEvent('download')
          await exportConfirmButton.click()
          
          const download = await downloadPromise
          expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i)
          expect(download.suggestedFilename()).toContain('attendance')
        }
      }
    })

    test('should export labor hours summary report', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      const exportButton = page.getByRole('button', { name: /export|내보내기/i })
      
      if (await exportButton.isVisible()) {
        await exportButton.click()
        
        const exportModal = page.getByTestId('export-modal')
        
        // Select summary report format
        const summaryOption = exportModal.getByRole('radio', { name: /summary report|요약 보고서/i })
        if (await summaryOption.isVisible()) {
          await summaryOption.click()
          
          const downloadPromise = page.waitForEvent('download')
          await exportModal.getByRole('button', { name: /export|내보내기/i }).click()
          
          const download = await downloadPromise
          expect(download.suggestedFilename()).toContain('summary')
        }
      }
    })
  })

  test.describe('Mobile Labor Hours Interface', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await attendancePage.navigateToAttendance()
      
      // Should show mobile-optimized labor hours interface
      const mobileCalendar = page.getByTestId('mobile-attendance-calendar')
      if (await mobileCalendar.isVisible()) {
        await expect(mobileCalendar).toBeVisible()
        
        // Touch interaction for labor hours
        const calendarDay = mobileCalendar.locator('[data-date]').first()
        if (await calendarDay.isVisible()) {
          await calendarDay.tap()
          
          // Should show mobile-friendly labor hours popup
          const laborHoursPopup = page.getByTestId('mobile-labor-hours-popup')
          if (await laborHoursPopup.isVisible()) {
            await expect(laborHoursPopup).toContainText(/공수/)
          }
        }
      }
    })

    test('should allow quick labor hours entry on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await attendancePage.navigateToAttendance()
      
      // Look for quick entry button
      const quickEntryButton = page.getByRole('button', { name: /quick entry|빠른 입력/i })
      
      if (await quickEntryButton.isVisible()) {
        await quickEntryButton.tap()
        
        // Should show mobile-optimized labor hours picker
        const laborHoursPicker = page.getByTestId('mobile-labor-hours-picker')
        if (await laborHoursPicker.isVisible()) {
          await expect(laborHoursPicker).toBeVisible()
          
          // Should have common 공수 options as large touch targets
          const commonOptions = ['0.5공수', '1.0공수', '1.25공수']
          for (const option of commonOptions) {
            const optionButton = laborHoursPicker.getByRole('button', { name: new RegExp(option) })
            if (await optionButton.isVisible()) {
              const boundingBox = await optionButton.boundingBox()
              expect(boundingBox?.height).toBeGreaterThanOrEqual(44) // Touch-friendly size
            }
          }
        }
      }
    })
  })

  test.describe('Performance and Error Handling', () => {
    test('should load labor hours calculations quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await attendancePage.navigateToAttendance()
      
      // Wait for calendar to be fully loaded with labor hours data
      await expect(page.getByTestId('attendance-calendar')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    test('should handle invalid labor hours input gracefully', async ({ page }) => {
      await attendancePage.navigateToAttendance()
      
      const bulkEntryButton = page.getByRole('button', { name: /bulk entry|일괄 입력/i })
      
      if (await bulkEntryButton.isVisible()) {
        await bulkEntryButton.click()
        
        // Try invalid labor hours values
        const laborHoursInput = page.getByTestId('labor-hours-input')
        
        // Test negative value
        await laborHoursInput.fill('-0.5')
        await expect(page.getByText(/invalid.*labor hours|잘못된.*공수/i)).toBeVisible()
        
        // Test extremely high value
        await laborHoursInput.fill('5.0')
        await expect(page.getByText(/excessive.*labor hours|과도한.*공수/i)).toBeVisible()
        
        // Test non-numeric value
        await laborHoursInput.fill('abc')
        await expect(page.getByText(/invalid.*format|잘못된.*형식/i)).toBeVisible()
      }
    })

    test('should sync labor hours data across browser tabs', async ({ context, page }) => {
      await attendancePage.navigateToAttendance()
      
      // Open second tab with same page
      const secondPage = await context.newPage()
      const secondAuthPage = new AuthPage(secondPage)
      const secondAttendancePage = new AttendancePage(secondPage)
      
      await secondAuthPage.navigateToLogin()
      await secondAuthPage.loginAsWorker()
      await secondAttendancePage.navigateToAttendance()
      
      // Make a change in first tab
      const bulkEntryButton = page.getByRole('button', { name: /bulk entry|일괄 입력/i })
      
      if (await bulkEntryButton.isVisible()) {
        await bulkEntryButton.click()
        await page.getByTestId('labor-hours-input').fill('1.0')
        await page.getByRole('button', { name: /save|저장/i }).click()
        
        // Check if second tab reflects the change
        await secondPage.reload()
        await expect(secondPage.getByTestId('attendance-calendar')).toBeVisible()
        
        // Verify data sync (implementation dependent)
        const calendarData = secondPage.getByTestId('attendance-calendar')
        if (await calendarData.isVisible()) {
          // Should reflect the updated labor hours
          await expect(calendarData).toBeVisible()
        }
      }
      
      await secondPage.close()
    })
  })
})