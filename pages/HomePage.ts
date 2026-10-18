import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly signUpButton: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signUpButton = page.getByRole('link', { name: 'Sign Up', exact: true }).first();
    this.loginButton = page.getByRole('link', { name: 'Login', exact: true }).first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickSignUp() {
    await this.signUpButton.click();
  }

  async clickLogin() {
    await this.loginButton.click();
  }
}
