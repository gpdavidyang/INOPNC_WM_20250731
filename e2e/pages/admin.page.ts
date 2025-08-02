import { expect, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class AdminPage extends BasePage {
  readonly pageHeader: Locator
  readonly sidebar: Locator
  readonly mainContent: Locator

  // Navigation
  readonly dashboardLink: Locator
  readonly userManagementLink: Locator
  readonly siteManagementLink: Locator
  readonly organizationLink: Locator
  readonly systemSettingsLink: Locator
  readonly reportsLink: Locator

  // User Management
  readonly addUserButton: Locator
  readonly usersTable: Locator
  readonly userSearchInput: Locator
  readonly userFilterDropdown: Locator
  readonly exportUsersButton: Locator
  readonly bulkActionsDropdown: Locator

  // User form elements
  readonly userForm: Locator
  readonly userEmailInput: Locator
  readonly userNameInput: Locator
  readonly userRoleSelect: Locator
  readonly userSiteSelect: Locator
  readonly userOrganizationSelect: Locator
  readonly userActiveToggle: Locator
  readonly saveUserButton: Locator
  readonly cancelUserButton: Locator

  // Site Management
  readonly addSiteButton: Locator
  readonly sitesTable: Locator
  readonly siteSearchInput: Locator
  readonly siteFilterDropdown: Locator
  readonly exportSitesButton: Locator

  // Site form elements
  readonly siteForm: Locator
  readonly siteNameInput: Locator
  readonly siteAddressInput: Locator
  readonly siteDescriptionTextarea: Locator
  readonly siteManagerSelect: Locator
  readonly siteActiveToggle: Locator
  readonly saveSiteButton: Locator
  readonly cancelSiteButton: Locator

  // System Stats
  readonly statsCards: Locator
  readonly totalUsersCard: Locator
  readonly activeSitesCard: Locator
  readonly systemStatusCard: Locator
  readonly recentActivityCard: Locator

  // Table elements
  readonly tableRows: Locator
  readonly tableHeaders: Locator
  readonly editButtons: Locator
  readonly deleteButtons: Locator
  readonly viewButtons: Locator
  readonly pagination: Locator

  // Modals
  readonly confirmDialog: Locator
  readonly confirmButton: Locator
  readonly cancelButton: Locator
  readonly userDetailModal: Locator
  readonly siteDetailModal: Locator

  constructor(page: any) {
    super(page)
    this.pageHeader = this.getByRole('heading', { name: /admin dashboard/i })
    this.sidebar = this.getByTestId('admin-sidebar')
    this.mainContent = this.getByTestId('admin-main-content')

    // Navigation
    this.dashboardLink = this.getByRole('link', { name: /dashboard/i })
    this.userManagementLink = this.getByRole('link', { name: /user management/i })
    this.siteManagementLink = this.getByRole('link', { name: /site management/i })
    this.organizationLink = this.getByRole('link', { name: /organization/i })
    this.systemSettingsLink = this.getByRole('link', { name: /system settings/i })
    this.reportsLink = this.getByRole('link', { name: /reports/i })

    // User Management
    this.addUserButton = this.getByRole('button', { name: /add user|create user/i })
    this.usersTable = this.getByTestId('users-table')
    this.userSearchInput = this.getByPlaceholder(/search users/i)
    this.userFilterDropdown = this.getByTestId('user-filter-dropdown')
    this.exportUsersButton = this.getByRole('button', { name: /export users/i })
    this.bulkActionsDropdown = this.getByTestId('bulk-actions-dropdown')

    // User form
    this.userForm = this.getByTestId('user-form')
    this.userEmailInput = this.getByLabel(/email/i)
    this.userNameInput = this.getByLabel(/name|full name/i)
    this.userRoleSelect = this.getByLabel(/role/i)
    this.userSiteSelect = this.getByLabel(/site|assigned site/i)
    this.userOrganizationSelect = this.getByLabel(/organization/i)
    this.userActiveToggle = this.getByLabel(/active|enabled/i)
    this.saveUserButton = this.getByRole('button', { name: /save user|create user/i })
    this.cancelUserButton = this.getByRole('button', { name: /cancel/i })

    // Site Management
    this.addSiteButton = this.getByRole('button', { name: /add site|create site/i })
    this.sitesTable = this.getByTestId('sites-table')
    this.siteSearchInput = this.getByPlaceholder(/search sites/i)
    this.siteFilterDropdown = this.getByTestId('site-filter-dropdown')
    this.exportSitesButton = this.getByRole('button', { name: /export sites/i })

    // Site form
    this.siteForm = this.getByTestId('site-form')
    this.siteNameInput = this.getByLabel(/site name|name/i)
    this.siteAddressInput = this.getByLabel(/address|location/i)
    this.siteDescriptionTextarea = this.getByLabel(/description/i)
    this.siteManagerSelect = this.getByLabel(/site manager|manager/i)
    this.siteActiveToggle = this.getByLabel(/active|enabled/i)
    this.saveSiteButton = this.getByRole('button', { name: /save site|create site/i })
    this.cancelSiteButton = this.getByRole('button', { name: /cancel/i })

    // Stats
    this.statsCards = this.getByTestId('admin-stats-cards')
    this.totalUsersCard = this.getByTestId('total-users-card')
    this.activeSitesCard = this.getByTestId('active-sites-card')
    this.systemStatusCard = this.getByTestId('system-status-card')
    this.recentActivityCard = this.getByTestId('recent-activity-card')

    // Table elements
    this.tableRows = this.locator('tbody tr')
    this.tableHeaders = this.locator('thead th')
    this.editButtons = this.getByRole('button', { name: /edit/i })
    this.deleteButtons = this.getByRole('button', { name: /delete/i })
    this.viewButtons = this.getByRole('button', { name: /view/i })
    this.pagination = this.getByTestId('pagination')

    // Modals
    this.confirmDialog = this.getByTestId('confirm-dialog')
    this.confirmButton = this.getByRole('button', { name: /confirm/i })
    this.cancelButton = this.getByRole('button', { name: /cancel/i })
    this.userDetailModal = this.getByTestId('user-detail-modal')
    this.siteDetailModal = this.getByTestId('site-detail-modal')
  }

  async navigateToAdminDashboard() {
    await this.goto('/admin/dashboard')
  }

  async navigateToUserManagement() {
    await this.userManagementLink.click()
    await this.waitForUrl('**/admin/users')
  }

  async navigateToSiteManagement() {
    await this.siteManagementLink.click()
    await this.waitForUrl('**/admin/sites')
  }

  async navigateToSystemSettings() {
    await this.systemSettingsLink.click()
    await this.waitForUrl('**/admin/settings')
  }

  // User Management Methods
  async createUser(userData: {
    email: string
    name: string
    role: string
    site?: string
    organization?: string
    active?: boolean
  }) {
    await this.addUserButton.click()
    await expect(this.userForm).toBeVisible()

    await this.userEmailInput.fill(userData.email)
    await this.userNameInput.fill(userData.name)
    await this.userRoleSelect.selectOption(userData.role)

    if (userData.site) {
      await this.userSiteSelect.selectOption(userData.site)
    }

    if (userData.organization) {
      await this.userOrganizationSelect.selectOption(userData.organization)
    }

    if (userData.active !== undefined) {
      const isChecked = await this.userActiveToggle.isChecked()
      if (isChecked !== userData.active) {
        await this.userActiveToggle.click()
      }
    }

    await this.saveUserButton.click()
    await this.waitForLoadState()
  }

  async editUser(userEmail: string, updateData: Partial<{
    name: string
    role: string
    site: string
    active: boolean
  }>) {
    await this.searchUsers(userEmail)
    
    const userRow = this.usersTable.getByText(userEmail).locator('..').locator('..')
    const editButton = userRow.getByRole('button', { name: /edit/i })
    await editButton.click()

    await expect(this.userForm).toBeVisible()

    if (updateData.name) {
      await this.userNameInput.fill(updateData.name)
    }

    if (updateData.role) {
      await this.userRoleSelect.selectOption(updateData.role)
    }

    if (updateData.site) {
      await this.userSiteSelect.selectOption(updateData.site)
    }

    if (updateData.active !== undefined) {
      const isChecked = await this.userActiveToggle.isChecked()
      if (isChecked !== updateData.active) {
        await this.userActiveToggle.click()
      }
    }

    await this.saveUserButton.click()
    await this.waitForLoadState()
  }

  async deleteUser(userEmail: string) {
    await this.searchUsers(userEmail)
    
    const userRow = this.usersTable.getByText(userEmail).locator('..').locator('..')
    const deleteButton = userRow.getByRole('button', { name: /delete/i })
    await deleteButton.click()

    await expect(this.confirmDialog).toBeVisible()
    await this.confirmButton.click()
    await this.waitForLoadState()
  }

  async searchUsers(query: string) {
    await this.userSearchInput.fill(query)
    await this.userSearchInput.press('Enter')
    await this.waitForLoadState()
  }

  async filterUsers(filter: string) {
    await this.userFilterDropdown.click()
    await this.page.getByRole('option', { name: filter }).click()
    await this.waitForLoadState()
  }

  async exportUsers() {
    await this.exportUsersButton.click()
    await expect(this.page.getByTestId('export-modal')).toBeVisible()
  }

  // Site Management Methods
  async createSite(siteData: {
    name: string
    address: string
    description?: string
    manager?: string
    active?: boolean
  }) {
    await this.addSiteButton.click()
    await expect(this.siteForm).toBeVisible()

    await this.siteNameInput.fill(siteData.name)
    await this.siteAddressInput.fill(siteData.address)

    if (siteData.description) {
      await this.siteDescriptionTextarea.fill(siteData.description)
    }

    if (siteData.manager) {
      await this.siteManagerSelect.selectOption(siteData.manager)
    }

    if (siteData.active !== undefined) {
      const isChecked = await this.siteActiveToggle.isChecked()
      if (isChecked !== siteData.active) {
        await this.siteActiveToggle.click()
      }
    }

    await this.saveSiteButton.click()
    await this.waitForLoadState()
  }

  async editSite(siteName: string, updateData: Partial<{
    name: string
    address: string
    description: string
    manager: string
    active: boolean
  }>) {
    await this.searchSites(siteName)
    
    const siteRow = this.sitesTable.getByText(siteName).locator('..').locator('..')
    const editButton = siteRow.getByRole('button', { name: /edit/i })
    await editButton.click()

    await expect(this.siteForm).toBeVisible()

    if (updateData.name) {
      await this.siteNameInput.fill(updateData.name)
    }

    if (updateData.address) {
      await this.siteAddressInput.fill(updateData.address)
    }

    if (updateData.description) {
      await this.siteDescriptionTextarea.fill(updateData.description)
    }

    if (updateData.manager) {
      await this.siteManagerSelect.selectOption(updateData.manager)
    }

    if (updateData.active !== undefined) {
      const isChecked = await this.siteActiveToggle.isChecked()
      if (isChecked !== updateData.active) {
        await this.siteActiveToggle.click()
      }
    }

    await this.saveSiteButton.click()
    await this.waitForLoadState()
  }

  async deleteSite(siteName: string) {
    await this.searchSites(siteName)
    
    const siteRow = this.sitesTable.getByText(siteName).locator('..').locator('..')
    const deleteButton = siteRow.getByRole('button', { name: /delete/i })
    await deleteButton.click()

    await expect(this.confirmDialog).toBeVisible()
    await this.confirmButton.click()
    await this.waitForLoadState()
  }

  async searchSites(query: string) {
    await this.siteSearchInput.fill(query)
    await this.siteSearchInput.press('Enter')
    await this.waitForLoadState()
  }

  async filterSites(filter: string) {
    await this.siteFilterDropdown.click()
    await this.page.getByRole('option', { name: filter }).click()
    await this.waitForLoadState()
  }

  async exportSites() {
    await this.exportSitesButton.click()
    await expect(this.page.getByTestId('export-modal')).toBeVisible()
  }

  // Expectations
  async expectAdminDashboardVisible() {
    await expect(this.pageHeader).toBeVisible()
    await expect(this.sidebar).toBeVisible()
    await expect(this.statsCards).toBeVisible()
  }

  async expectUserManagementVisible() {
    await expect(this.usersTable).toBeVisible()
    await expect(this.addUserButton).toBeVisible()
    await expect(this.userSearchInput).toBeVisible()
  }

  async expectSiteManagementVisible() {
    await expect(this.sitesTable).toBeVisible()
    await expect(this.addSiteButton).toBeVisible()
    await expect(this.siteSearchInput).toBeVisible()
  }

  async expectUserFormVisible() {
    await expect(this.userForm).toBeVisible()
    await expect(this.userEmailInput).toBeVisible()
    await expect(this.userNameInput).toBeVisible()
    await expect(this.userRoleSelect).toBeVisible()
  }

  async expectSiteFormVisible() {
    await expect(this.siteForm).toBeVisible()
    await expect(this.siteNameInput).toBeVisible()
    await expect(this.siteAddressInput).toBeVisible()
  }

  async expectUserInTable(email: string) {
    await expect(this.usersTable.getByText(email)).toBeVisible()
  }

  async expectSiteInTable(name: string) {
    await expect(this.sitesTable.getByText(name)).toBeVisible()
  }

  async expectSuccessMessage(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectConfirmDialog() {
    await expect(this.confirmDialog).toBeVisible()
    await expect(this.confirmButton).toBeVisible()
    await expect(this.cancelButton).toBeVisible()
  }

  async getUserCount(): Promise<number> {
    return await this.usersTable.locator('tbody tr').count()
  }

  async getSiteCount(): Promise<number> {
    return await this.sitesTable.locator('tbody tr').count()
  }

  async getTotalUsersFromCard(): Promise<string> {
    return await this.totalUsersCard.textContent() || '0'
  }

  async getActiveSitesFromCard(): Promise<string> {
    return await this.activeSitesCard.textContent() || '0'
  }
}