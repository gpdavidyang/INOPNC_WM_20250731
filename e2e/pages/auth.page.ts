import { expect, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class AuthPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly signInButton: Locator
  readonly signUpButton: Locator
  readonly signUpLink: Locator
  readonly forgotPasswordLink: Locator
  readonly errorMessage: Locator
  readonly successMessage: Locator

  constructor(page: any) {
    super(page)
    this.emailInput = this.getByLabel(/email/i)
    this.passwordInput = this.getByLabel(/password/i)
    this.signInButton = this.getByRole('button', { name: /sign in/i })
    this.signUpButton = this.getByRole('button', { name: /sign up/i })
    this.signUpLink = this.getByRole('link', { name: /sign up/i })
    this.forgotPasswordLink = this.getByRole('link', { name: /forgot password/i })
    this.errorMessage = this.getByTestId('error-message')
    this.successMessage = this.getByTestId('success-message')
  }

  async navigateToLogin() {
    await this.goto('/auth/login')
  }

  async navigateToSignup() {
    await this.goto('/auth/signup')
  }

  async navigateToResetPassword() {
    await this.goto('/auth/reset-password')
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async clickSignIn() {
    await this.signInButton.click()
  }

  async clickSignUp() {
    await this.signUpButton.click()
  }

  async login(email: string, password: string) {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.clickSignIn()
  }

  async loginAsWorker() {
    await this.login('worker@inopnc.com', 'password123')
    await this.waitForUrl('**/dashboard/**')
  }

  async loginAsManager() {
    await this.login('manager@inopnc.com', 'password123')
    await this.waitForUrl('**/dashboard/**')
  }

  async loginAsAdmin() {
    await this.login('admin@inopnc.com', 'password123')
    await this.waitForUrl('**/admin/dashboard')
  }

  async loginAsCustomer() {
    await this.login('customer@inopnc.com', 'password123')
    await this.waitForUrl('**/dashboard/**')
  }

  async expectLoginFormVisible() {
    await expect(this.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.signInButton).toBeVisible()
  }

  async expectSignupFormVisible() {
    await expect(this.getByRole('heading', { name: /sign up/i })).toBeVisible()
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.signUpButton).toBeVisible()
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectErrorMessage(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectSuccessMessage(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }
}