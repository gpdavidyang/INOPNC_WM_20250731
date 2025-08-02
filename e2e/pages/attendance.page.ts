import { expect, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class AttendancePage extends BasePage {
  readonly pageHeader: Locator
  readonly checkInButton: Locator
  readonly checkOutButton: Locator
  readonly currentStatusCard: Locator
  readonly todayHours: Locator
  readonly weeklyHours: Locator
  readonly monthlyHours: Locator

  // Calendar elements
  readonly calendar: Locator
  readonly prevMonthButton: Locator
  readonly nextMonthButton: Locator
  readonly monthYearHeader: Locator
  readonly calendarDays: Locator
  readonly todayButton: Locator

  // Check-in/out form elements
  readonly locationInput: Locator
  readonly notesTextarea: Locator
  readonly photoUpload: Locator
  readonly temperatureInput: Locator
  readonly confirmButton: Locator
  readonly cancelButton: Locator

  // Attendance list elements
  readonly attendanceList: Locator
  readonly filterDropdown: Locator
  readonly dateRangePicker: Locator
  readonly exportButton: Locator
  readonly searchInput: Locator

  // Team attendance (for managers)
  readonly teamAttendanceTab: Locator
  readonly teamMembersList: Locator
  readonly teamStatsCards: Locator

  // Attendance records table
  readonly attendanceTable: Locator
  readonly tableRows: Locator
  readonly dateColumn: Locator
  readonly checkInColumn: Locator
  readonly checkOutColumn: Locator
  readonly hoursColumn: Locator
  readonly statusColumn: Locator

  constructor(page: any) {
    super(page)
    this.pageHeader = this.getByRole('heading', { name: /attendance/i })
    this.checkInButton = this.getByRole('button', { name: /check in/i })
    this.checkOutButton = this.getByRole('button', { name: /check out/i })
    this.currentStatusCard = this.getByTestId('current-status-card')
    this.todayHours = this.getByTestId('today-hours')
    this.weeklyHours = this.getByTestId('weekly-hours')
    this.monthlyHours = this.getByTestId('monthly-hours')

    // Calendar
    this.calendar = this.getByTestId('attendance-calendar')
    this.prevMonthButton = this.getByRole('button', { name: /previous month/i })
    this.nextMonthButton = this.getByRole('button', { name: /next month/i })
    this.monthYearHeader = this.getByTestId('month-year-header')
    this.calendarDays = this.calendar.locator('[data-date]')
    this.todayButton = this.getByRole('button', { name: /today/i })

    // Form elements
    this.locationInput = this.getByLabel(/location/i)
    this.notesTextarea = this.getByLabel(/notes|comments/i)
    this.photoUpload = this.getByLabel(/photo|image/i)
    this.temperatureInput = this.getByLabel(/temperature/i)
    this.confirmButton = this.getByRole('button', { name: /confirm/i })
    this.cancelButton = this.getByRole('button', { name: /cancel/i })

    // List elements
    this.attendanceList = this.getByTestId('attendance-list')
    this.filterDropdown = this.getByTestId('attendance-filter')
    this.dateRangePicker = this.getByTestId('date-range-picker')
    this.exportButton = this.getByRole('button', { name: /export/i })
    this.searchInput = this.getByPlaceholder(/search attendance/i)

    // Team attendance
    this.teamAttendanceTab = this.getByRole('tab', { name: /team attendance/i })
    this.teamMembersList = this.getByTestId('team-members-list')
    this.teamStatsCards = this.getByTestId('team-stats-cards')

    // Table
    this.attendanceTable = this.getByTestId('attendance-table')
    this.tableRows = this.attendanceTable.locator('tbody tr')
    this.dateColumn = this.attendanceTable.locator('[data-column="date"]')
    this.checkInColumn = this.attendanceTable.locator('[data-column="check-in"]')
    this.checkOutColumn = this.attendanceTable.locator('[data-column="check-out"]')
    this.hoursColumn = this.attendanceTable.locator('[data-column="hours"]')
    this.statusColumn = this.attendanceTable.locator('[data-column="status"]')
  }

  async navigateToAttendance() {
    await this.goto('/dashboard/attendance')
  }

  async checkIn(options?: {
    location?: string
    notes?: string
    temperature?: string
    photoPath?: string
  }) {
    await this.checkInButton.click()
    
    if (options?.location) {
      await this.locationInput.fill(options.location)
    }
    
    if (options?.notes) {
      await this.notesTextarea.fill(options.notes)
    }
    
    if (options?.temperature) {
      await this.temperatureInput.fill(options.temperature)
    }
    
    if (options?.photoPath) {
      await this.photoUpload.setInputFiles(options.photoPath)
    }
    
    await this.confirmButton.click()
    await this.waitForLoadState()
  }

  async checkOut(options?: {
    notes?: string
    photoPath?: string
  }) {
    await this.checkOutButton.click()
    
    if (options?.notes) {
      await this.notesTextarea.fill(options.notes)
    }
    
    if (options?.photoPath) {
      await this.photoUpload.setInputFiles(options.photoPath)
    }
    
    await this.confirmButton.click()
    await this.waitForLoadState()
  }

  async cancelCheckIn() {
    await this.cancelButton.click()
  }

  async selectCalendarDate(date: string) {
    await this.calendarDays.locator(`[data-date="${date}"]`).click()
    await this.waitForLoadState()
  }

  async navigateToMonth(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      await this.prevMonthButton.click()
    } else {
      await this.nextMonthButton.click()
    }
    await this.waitForLoadState()
  }

  async goToToday() {
    await this.todayButton.click()
    await this.waitForLoadState()
  }

  async filterAttendance(filter: string) {
    await this.filterDropdown.click()
    await this.page.getByRole('option', { name: filter }).click()
    await this.waitForLoadState()
  }

  async setDateRange(startDate: string, endDate: string) {
    await this.dateRangePicker.click()
    
    // Select start date
    await this.page.getByTestId('start-date-input').fill(startDate)
    
    // Select end date
    await this.page.getByTestId('end-date-input').fill(endDate)
    
    await this.page.getByRole('button', { name: /apply/i }).click()
    await this.waitForLoadState()
  }

  async searchAttendance(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
    await this.waitForLoadState()
  }

  async exportAttendance() {
    await this.exportButton.click()
    await expect(this.page.getByTestId('export-modal')).toBeVisible()
  }

  async switchToTeamAttendance() {
    await this.teamAttendanceTab.click()
    await this.waitForLoadState()
  }

  async expectAttendancePageVisible() {
    await expect(this.pageHeader).toBeVisible()
    await expect(this.currentStatusCard).toBeVisible()
    await expect(this.calendar).toBeVisible()
  }

  async expectCheckedInStatus() {
    await expect(this.currentStatusCard).toContainText(/checked in/i)
    await expect(this.checkOutButton).toBeVisible()
    await expect(this.checkInButton).not.toBeVisible()
  }

  async expectCheckedOutStatus() {
    await expect(this.currentStatusCard).toContainText(/checked out|not checked in/i)
    await expect(this.checkInButton).toBeVisible()
    await expect(this.checkOutButton).not.toBeVisible()
  }

  async expectCheckInFormVisible() {
    await expect(this.page.getByTestId('check-in-modal')).toBeVisible()
    await expect(this.locationInput).toBeVisible()
    await expect(this.confirmButton).toBeVisible()
  }

  async expectCheckOutFormVisible() {
    await expect(this.page.getByTestId('check-out-modal')).toBeVisible()
    await expect(this.confirmButton).toBeVisible()
  }

  async expectSuccessMessage(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectCalendarDateHighlighted(date: string) {
    const dateElement = this.calendarDays.locator(`[data-date="${date}"]`)
    await expect(dateElement).toHaveClass(/highlighted|selected/)
  }

  async expectWorkingHours(hours: string) {
    await expect(this.todayHours).toContainText(hours)
  }

  async expectAttendanceRecordCount(count: number) {
    await expect(this.tableRows).toHaveCount(count)
  }

  async expectTeamAttendanceVisible() {
    await expect(this.teamMembersList).toBeVisible()
    await expect(this.teamStatsCards).toBeVisible()
  }

  async getCurrentStatus(): Promise<string> {
    return await this.currentStatusCard.textContent() || ''
  }

  async getTodayHours(): Promise<string> {
    return await this.todayHours.textContent() || ''
  }

  async getAttendanceRecordCount(): Promise<number> {
    return await this.tableRows.count()
  }
}