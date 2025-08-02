import { Page, Locator } from '@playwright/test'

export abstract class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string) {
    await this.page.goto(path)
  }

  async waitForUrl(pattern: string | RegExp) {
    await this.page.waitForURL(pattern)
  }

  async reload() {
    await this.page.reload()
  }

  async getTitle(): Promise<string> {
    return await this.page.title()
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` })
  }

  async waitForLoadState() {
    await this.page.waitForLoadState('networkidle')
  }

  protected getByRole(role: string, options?: { name?: string | RegExp }): Locator {
    return this.page.getByRole(role as any, options)
  }

  protected getByLabel(text: string | RegExp): Locator {
    return this.page.getByLabel(text)
  }

  protected getByText(text: string | RegExp): Locator {
    return this.page.getByText(text)
  }

  protected getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  protected getByPlaceholder(text: string | RegExp): Locator {
    return this.page.getByPlaceholder(text)
  }

  protected locator(selector: string): Locator {
    return this.page.locator(selector)
  }
}