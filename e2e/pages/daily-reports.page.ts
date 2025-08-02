import { expect, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class DailyReportsPage extends BasePage {
  readonly pageHeader: Locator
  readonly createReportButton: Locator
  readonly searchInput: Locator
  readonly filterDropdown: Locator
  readonly sortDropdown: Locator
  readonly reportsTable: Locator
  readonly pagination: Locator
  readonly exportButton: Locator

  // Report form elements
  readonly titleInput: Locator
  readonly dateInput: Locator
  readonly siteSelect: Locator
  readonly weatherSelect: Locator
  readonly workContentTextarea: Locator
  readonly materialsUsedTextarea: Locator
  readonly equipmentUsedTextarea: Locator
  readonly issuesTextarea: Locator
  readonly photosUpload: Locator
  readonly submitButton: Locator
  readonly cancelButton: Locator
  readonly saveAsDraftButton: Locator

  // Report view elements
  readonly reportTitle: Locator
  readonly reportDate: Locator
  readonly reportStatus: Locator
  readonly reportContent: Locator
  readonly editButton: Locator
  readonly deleteButton: Locator
  readonly shareButton: Locator
  readonly printButton: Locator

  // Table elements
  readonly tableRows: Locator
  readonly titleColumn: Locator
  readonly dateColumn: Locator
  readonly statusColumn: Locator
  readonly actionsColumn: Locator

  constructor(page: any) {
    super(page)
    this.pageHeader = this.getByRole('heading', { name: /daily reports/i })
    this.createReportButton = this.getByRole('button', { name: /create report|new report/i })
    this.searchInput = this.getByPlaceholder(/search reports/i)
    this.filterDropdown = this.getByTestId('filter-dropdown')
    this.sortDropdown = this.getByTestId('sort-dropdown')
    this.reportsTable = this.getByTestId('reports-table')
    this.pagination = this.getByTestId('pagination')
    this.exportButton = this.getByRole('button', { name: /export/i })

    // Form elements
    this.titleInput = this.getByLabel(/title|report title/i)
    this.dateInput = this.getByLabel(/date|work date/i)
    this.siteSelect = this.getByLabel(/site|construction site/i)
    this.weatherSelect = this.getByLabel(/weather/i)
    this.workContentTextarea = this.getByLabel(/work content|description/i)
    this.materialsUsedTextarea = this.getByLabel(/materials used/i)
    this.equipmentUsedTextarea = this.getByLabel(/equipment used/i)
    this.issuesTextarea = this.getByLabel(/issues|problems/i)
    this.photosUpload = this.getByLabel(/photos|images/i)
    this.submitButton = this.getByRole('button', { name: /submit|save/i })
    this.cancelButton = this.getByRole('button', { name: /cancel/i })
    this.saveAsDraftButton = this.getByRole('button', { name: /save as draft/i })

    // Report view elements
    this.reportTitle = this.getByTestId('report-title')
    this.reportDate = this.getByTestId('report-date')
    this.reportStatus = this.getByTestId('report-status')
    this.reportContent = this.getByTestId('report-content')
    this.editButton = this.getByRole('button', { name: /edit/i })
    this.deleteButton = this.getByRole('button', { name: /delete/i })
    this.shareButton = this.getByRole('button', { name: /share/i })
    this.printButton = this.getByRole('button', { name: /print/i })

    // Table elements
    this.tableRows = this.reportsTable.locator('tbody tr')
    this.titleColumn = this.reportsTable.locator('[data-column="title"]')
    this.dateColumn = this.reportsTable.locator('[data-column="date"]')
    this.statusColumn = this.reportsTable.locator('[data-column="status"]')
    this.actionsColumn = this.reportsTable.locator('[data-column="actions"]')
  }

  async navigateToReports() {
    await this.goto('/dashboard/daily-reports')
  }

  async navigateToCreateReport() {
    await this.createReportButton.click()
    await this.waitForUrl('**/daily-reports/create')
  }

  async navigateToReport(reportId: string) {
    await this.goto(`/dashboard/daily-reports/${reportId}`)
  }

  async createReport(reportData: {
    title: string
    date: string
    site: string
    weather: string
    workContent: string
    materialsUsed?: string
    equipmentUsed?: string
    issues?: string
  }) {
    await this.titleInput.fill(reportData.title)
    await this.dateInput.fill(reportData.date)
    await this.siteSelect.selectOption(reportData.site)
    await this.weatherSelect.selectOption(reportData.weather)
    await this.workContentTextarea.fill(reportData.workContent)
    
    if (reportData.materialsUsed) {
      await this.materialsUsedTextarea.fill(reportData.materialsUsed)
    }
    
    if (reportData.equipmentUsed) {
      await this.equipmentUsedTextarea.fill(reportData.equipmentUsed)
    }
    
    if (reportData.issues) {
      await this.issuesTextarea.fill(reportData.issues)
    }
  }

  async submitReport() {
    await this.submitButton.click()
    await this.waitForLoadState()
  }

  async saveAsDraft() {
    await this.saveAsDraftButton.click()
    await this.waitForLoadState()
  }

  async uploadPhotos(filePaths: string[]) {
    await this.photosUpload.setInputFiles(filePaths)
  }

  async searchReports(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
    await this.waitForLoadState()
  }

  async filterByStatus(status: string) {
    await this.filterDropdown.click()
    await this.page.getByRole('option', { name: status }).click()
    await this.waitForLoadState()
  }

  async sortBy(sortOption: string) {
    await this.sortDropdown.click()
    await this.page.getByRole('option', { name: sortOption }).click()
    await this.waitForLoadState()
  }

  async editReport(reportId: string) {
    await this.navigateToReport(reportId)
    await this.editButton.click()
    await this.waitForUrl('**/edit')
  }

  async deleteReport() {
    await this.deleteButton.click()
    
    // Confirm deletion
    const confirmButton = this.page.getByRole('button', { name: /confirm|delete/i })
    await confirmButton.click()
    await this.waitForLoadState()
  }

  async shareReport() {
    await this.shareButton.click()
    await expect(this.page.getByTestId('share-modal')).toBeVisible()
  }

  async printReport() {
    await this.printButton.click()
    // Note: print dialog handling would need additional setup
  }

  async exportReports() {
    await this.exportButton.click()
    await expect(this.page.getByTestId('export-modal')).toBeVisible()
  }

  async goToPage(pageNumber: number) {
    await this.pagination.getByText(pageNumber.toString()).click()
    await this.waitForLoadState()
  }

  async expectReportsPageVisible() {
    await expect(this.pageHeader).toBeVisible()
    await expect(this.createReportButton).toBeVisible()
    await expect(this.reportsTable).toBeVisible()
  }

  async expectReportFormVisible() {
    await expect(this.titleInput).toBeVisible()
    await expect(this.dateInput).toBeVisible()
    await expect(this.siteSelect).toBeVisible()
    await expect(this.workContentTextarea).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }

  async expectReportVisible(title: string) {
    await expect(this.reportTitle).toContainText(title)
    await expect(this.reportContent).toBeVisible()
  }

  async expectReportInTable(title: string) {
    await expect(this.reportsTable.getByText(title)).toBeVisible()
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectSuccessMessage(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectReportCount(count: number) {
    await expect(this.tableRows).toHaveCount(count)
  }

  async expectReportStatus(status: string) {
    await expect(this.reportStatus).toContainText(status)
  }

  async getFirstReportTitle(): Promise<string> {
    return await this.tableRows.first().locator('[data-column="title"]').textContent() || ''
  }

  async getReportCount(): Promise<number> {
    return await this.tableRows.count()
  }
}