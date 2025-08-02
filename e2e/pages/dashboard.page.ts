import { expect, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class DashboardPage extends BasePage {
  readonly welcomeMessage: Locator
  readonly sidebar: Locator
  readonly userMenu: Locator
  readonly profileButton: Locator
  readonly logoutButton: Locator
  readonly notificationBell: Locator
  readonly searchInput: Locator

  // Navigation links
  readonly dashboardLink: Locator
  readonly dailyReportsLink: Locator
  readonly attendanceLink: Locator
  readonly materialsLink: Locator
  readonly markupToolLink: Locator
  readonly teamManagementLink: Locator
  readonly userManagementLink: Locator
  readonly systemSettingsLink: Locator
  readonly siteOverviewLink: Locator
  readonly myTasksLink: Locator

  // Dashboard content
  readonly statsCards: Locator
  readonly recentReports: Locator
  readonly upcomingTasks: Locator
  readonly notifications: Locator

  constructor(page: any) {
    super(page)
    this.welcomeMessage = this.getByText(/welcome/i)
    this.sidebar = this.getByTestId('sidebar')
    this.userMenu = this.getByTestId('user-menu')
    this.profileButton = this.getByRole('button', { name: /profile/i })
    this.logoutButton = this.getByRole('button', { name: /logout/i })
    this.notificationBell = this.getByTestId('notification-bell')
    this.searchInput = this.getByPlaceholder(/search/i)

    // Navigation links
    this.dashboardLink = this.getByRole('link', { name: /dashboard/i })
    this.dailyReportsLink = this.getByRole('link', { name: /daily reports/i })
    this.attendanceLink = this.getByRole('link', { name: /attendance/i })
    this.materialsLink = this.getByRole('link', { name: /materials/i })
    this.markupToolLink = this.getByRole('link', { name: /도면 마킹|markup/i })
    this.teamManagementLink = this.getByRole('link', { name: /team management/i })
    this.userManagementLink = this.getByRole('link', { name: /user management/i })
    this.systemSettingsLink = this.getByRole('link', { name: /system settings/i })
    this.siteOverviewLink = this.getByRole('link', { name: /site overview/i })
    this.myTasksLink = this.getByRole('link', { name: /my tasks/i })

    // Dashboard content
    this.statsCards = this.getByTestId('stats-cards')
    this.recentReports = this.getByTestId('recent-reports')
    this.upcomingTasks = this.getByTestId('upcoming-tasks')
    this.notifications = this.getByTestId('notifications-panel')
  }

  async navigateToDashboard() {
    await this.goto('/dashboard')
  }

  async navigateToDailyReports() {
    await this.dailyReportsLink.click()
    await this.waitForUrl('**/dashboard/daily-reports')
  }

  async navigateToAttendance() {
    await this.attendanceLink.click()
    await this.waitForUrl('**/dashboard/attendance')
  }

  async navigateToMaterials() {
    await this.materialsLink.click()
    await this.waitForUrl('**/dashboard/materials')
  }

  async navigateToMarkupTool() {
    await this.markupToolLink.click()
    await this.waitForUrl('**/dashboard/markup')
  }

  async navigateToTeamManagement() {
    await this.teamManagementLink.click()
    await this.waitForUrl('**/dashboard/team')
  }

  async navigateToUserManagement() {
    await this.userManagementLink.click()
    await this.waitForUrl('**/admin/users')
  }

  async openUserMenu() {
    await this.userMenu.click()
  }

  async logout() {
    await this.openUserMenu()
    await this.logoutButton.click()
    await this.waitForUrl('**/auth/login')
  }

  async openNotifications() {
    await this.notificationBell.click()
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
  }

  async expectDashboardVisible() {
    await expect(this.welcomeMessage).toBeVisible()
    await expect(this.sidebar).toBeVisible()
  }

  async expectWorkerNavigation() {
    await expect(this.dailyReportsLink).toBeVisible()
    await expect(this.myTasksLink).toBeVisible()
    await expect(this.markupToolLink).toBeVisible()
    
    // Should not see admin/manager options
    await expect(this.userManagementLink).not.toBeVisible()
    await expect(this.systemSettingsLink).not.toBeVisible()
  }

  async expectManagerNavigation() {
    await expect(this.dailyReportsLink).toBeVisible()
    await expect(this.teamManagementLink).toBeVisible()
    await expect(this.siteOverviewLink).toBeVisible()
    await expect(this.attendanceLink).toBeVisible()
  }

  async expectAdminNavigation() {
    await expect(this.userManagementLink).toBeVisible()
    await expect(this.systemSettingsLink).toBeVisible()
    await expect(this.teamManagementLink).toBeVisible()
  }

  async expectStatsCardsVisible() {
    await expect(this.statsCards).toBeVisible()
  }

  async expectRecentReportsVisible() {
    await expect(this.recentReports).toBeVisible()
  }

  async expectUpcomingTasksVisible() {
    await expect(this.upcomingTasks).toBeVisible()
  }

  async expectNotificationCount(count: number) {
    await expect(this.notificationBell).toContainText(count.toString())
  }
}