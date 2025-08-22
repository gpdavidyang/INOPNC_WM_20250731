import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page Object Model for Partner Dashboard
 * 파트너사 대시보드 테스트를 위한 페이지 객체 모델
 */
export class PartnerPage extends BasePage {
  // Navigation Elements
  readonly sidebarMenuButton: Locator
  readonly sidebar: Locator
  readonly bottomNavigation: Locator
  
  // Sidebar Navigation Items
  readonly homeTab: Locator
  readonly printStatusTab: Locator
  readonly workLogsTab: Locator
  readonly siteInfoTab: Locator
  readonly documentsTab: Locator
  readonly myInfoTab: Locator
  
  // Bottom Navigation Items (Mobile)
  readonly bottomHomeTab: Locator
  readonly bottomPrintStatusTab: Locator
  readonly bottomWorkLogsTab: Locator
  readonly bottomDocumentsTab: Locator
  readonly bottomMyInfoTab: Locator
  
  // Home Tab Elements
  readonly welcomeMessage: Locator
  readonly quickMenuGrid: Locator
  readonly siteSelector: Locator
  readonly todaysSiteInfo: Locator
  
  // Documents Tab Elements
  readonly documentsList: Locator
  readonly documentSearchInput: Locator
  readonly documentFilters: Locator
  readonly documentItems: Locator
  
  // Work Logs Tab Elements
  readonly workLogsList: Locator
  readonly workLogSearchInput: Locator
  readonly workLogItems: Locator
  readonly workLogDetail: Locator
  
  // Site Info Tab Elements
  readonly siteInfoCards: Locator
  readonly siteDetailsPanel: Locator
  readonly managerContactInfo: Locator
  
  // My Info Tab Elements
  readonly profileInfo: Locator
  readonly userNameDisplay: Locator
  readonly userEmailDisplay: Locator
  readonly userRoleDisplay: Locator
  readonly organizationInfo: Locator
  
  constructor(page: Page) {
    super(page)
    
    // Navigation Elements
    this.sidebarMenuButton = page.getByRole('button', { name: '메뉴' })
    this.sidebar = page.locator('[data-testid="partner-sidebar"]')
    this.bottomNavigation = page.locator('[data-testid="partner-bottom-nav"]')
    
    // Sidebar Navigation
    this.homeTab = page.getByRole('link', { name: '홈' }).or(page.getByText('홈')).first()
    this.printStatusTab = page.getByRole('link', { name: '출력현황' }).or(page.getByText('출력현황')).first()
    this.workLogsTab = page.getByRole('link', { name: '작업일지' }).or(page.getByText('작업일지')).first()
    this.siteInfoTab = page.getByRole('link', { name: '현장정보' }).or(page.getByText('현장정보')).first()
    this.documentsTab = page.getByRole('link', { name: '문서함' }).or(page.getByText('문서함')).first()
    this.myInfoTab = page.getByRole('link', { name: '내정보' }).or(page.getByText('내정보')).first()
    
    // Bottom Navigation
    this.bottomHomeTab = page.locator('[data-testid="bottom-nav-home"]')
    this.bottomPrintStatusTab = page.locator('[data-testid="bottom-nav-print-status"]')
    this.bottomWorkLogsTab = page.locator('[data-testid="bottom-nav-work-logs"]')
    this.bottomDocumentsTab = page.locator('[data-testid="bottom-nav-documents"]')
    this.bottomMyInfoTab = page.locator('[data-testid="bottom-nav-my-info"]')
    
    // Home Tab Elements
    this.welcomeMessage = page.locator('[data-testid="partner-welcome"]')
    this.quickMenuGrid = page.locator('[data-testid="quick-menu-grid"]')
    this.siteSelector = page.locator('[data-testid="site-selector"]')
    this.todaysSiteInfo = page.locator('[data-testid="todays-site-info"]')
    
    // Documents Tab Elements
    this.documentsList = page.locator('[data-testid="documents-list"]')
    this.documentSearchInput = page.locator('[data-testid="document-search"]')
    this.documentFilters = page.locator('[data-testid="document-filters"]')
    this.documentItems = page.locator('[data-testid="document-item"]')
    
    // Work Logs Tab Elements
    this.workLogsList = page.locator('[data-testid="work-logs-list"]')
    this.workLogSearchInput = page.locator('[data-testid="work-log-search"]')
    this.workLogItems = page.locator('[data-testid="work-log-item"]')
    this.workLogDetail = page.locator('[data-testid="work-log-detail"]')
    
    // Site Info Tab Elements
    this.siteInfoCards = page.locator('[data-testid="site-info-cards"]')
    this.siteDetailsPanel = page.locator('[data-testid="site-details"]')
    this.managerContactInfo = page.locator('[data-testid="manager-contact"]')
    
    // My Info Tab Elements
    this.profileInfo = page.locator('[data-testid="profile-info"]')
    this.userNameDisplay = page.locator('[data-testid="user-name"]')
    this.userEmailDisplay = page.locator('[data-testid="user-email"]')
    this.userRoleDisplay = page.locator('[data-testid="user-role"]')
    this.organizationInfo = page.locator('[data-testid="organization-info"]')
  }

  async navigateToPartnerDashboard() {
    await this.page.goto('/partner/dashboard')
    await this.waitForLoadComplete()
  }

  async openSidebar() {
    if (await this.isMobileViewport()) {
      await this.sidebarMenuButton.click()
      await this.sidebar.waitFor({ state: 'visible' })
    }
  }

  async closeSidebar() {
    if (await this.isMobileViewport()) {
      await this.page.keyboard.press('Escape')
      await this.sidebar.waitFor({ state: 'hidden' })
    }
  }

  async navigateToTab(tabName: 'home' | 'print-status' | 'work-logs' | 'site-info' | 'documents' | 'my-info') {
    const isMobile = await this.isMobileViewport()
    
    if (isMobile) {
      // Use bottom navigation on mobile
      switch (tabName) {
        case 'home':
          await this.bottomHomeTab.click()
          break
        case 'print-status':
          await this.bottomPrintStatusTab.click()
          break
        case 'work-logs':
          await this.bottomWorkLogsTab.click()
          break
        case 'documents':
          await this.bottomDocumentsTab.click()
          break
        case 'my-info':
          await this.bottomMyInfoTab.click()
          break
      }
    } else {
      // Use sidebar navigation on desktop
      switch (tabName) {
        case 'home':
          await this.homeTab.click()
          break
        case 'print-status':
          await this.printStatusTab.click()
          break
        case 'work-logs':
          await this.workLogsTab.click()
          break
        case 'site-info':
          await this.siteInfoTab.click()
          break
        case 'documents':
          await this.documentsTab.click()
          break
        case 'my-info':
          await this.myInfoTab.click()
          break
      }
    }
    
    await this.waitForLoadComplete()
  }

  async searchDocuments(searchTerm: string) {
    await this.documentSearchInput.waitFor({ state: 'visible' })
    await this.documentSearchInput.fill(searchTerm)
    await this.documentSearchInput.press('Enter')
    await this.waitForLoadComplete()
  }

  async searchWorkLogs(searchTerm: string) {
    await this.workLogSearchInput.waitFor({ state: 'visible' })
    await this.workLogSearchInput.fill(searchTerm)
    await this.workLogSearchInput.press('Enter')
    await this.waitForLoadComplete()
  }

  async selectSite(siteName: string) {
    await this.siteSelector.click()
    await this.page.getByRole('option', { name: siteName }).click()
    await this.waitForLoadComplete()
  }

  async getDocumentCount(): Promise<number> {
    await this.documentItems.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    return await this.documentItems.count()
  }

  async getWorkLogCount(): Promise<number> {
    await this.workLogItems.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    return await this.workLogItems.count()
  }

  async openWorkLogDetail(index: number = 0) {
    const workLogItem = this.workLogItems.nth(index)
    await workLogItem.click()
    await this.workLogDetail.waitFor({ state: 'visible' })
  }

  async getProfileInfo() {
    await this.profileInfo.waitFor({ state: 'visible' })
    
    const name = await this.userNameDisplay.textContent()
    const email = await this.userEmailDisplay.textContent()
    const role = await this.userRoleDisplay.textContent()
    
    return { name, email, role }
  }

  async verifyPartnerPermissions() {
    // Verify that partner users can only see their assigned sites
    const siteOptions = await this.siteSelector.locator('option').count()
    expect(siteOptions).toBeGreaterThan(0)
    
    // Verify role display shows customer_manager role
    const roleText = await this.userRoleDisplay.textContent()
    expect(roleText).toContain('파트너')
  }

  async verifyReadOnlyAccess() {
    // Partners should have read-only access - verify no edit/delete buttons exist
    const editButtons = this.page.locator('[data-testid*="edit"], [data-testid*="delete"]')
    const editButtonCount = await editButtons.count()
    expect(editButtonCount).toBe(0)
  }

  async verifyResponsiveLayout() {
    const isMobile = await this.isMobileViewport()
    
    if (isMobile) {
      // Verify bottom navigation is visible
      await expect(this.bottomNavigation).toBeVisible()
      
      // Verify sidebar is hidden by default
      await expect(this.sidebar).toBeHidden()
    } else {
      // Verify sidebar is visible on desktop
      await expect(this.sidebar).toBeVisible()
      
      // Verify bottom navigation is hidden on desktop
      await expect(this.bottomNavigation).toBeHidden()
    }
  }
}