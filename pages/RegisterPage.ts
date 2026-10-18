import { Page, Locator } from '@playwright/test';

export interface UserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  nid: string;
  role: 'Customer' | 'Agent' | 'Merchant';
}

export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly phoneInput: Locator;
  readonly nidInput: Locator;
  readonly roleDropdown: Locator;
  readonly createAccountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.phoneInput = page.locator('input[name="phone_number"]');
    this.nidInput = page.locator('input[name="nid"]');
    this.roleDropdown = page.getByRole('combobox');
    this.createAccountButton = page.getByRole('button', { name: /Create Account/ });
  }

  async goto() {
    await this.page.goto('/register');
  }

  async selectRole(role: UserData['role']) {
    await this.roleDropdown.click();
    await this.page.getByRole('option', { name: role }).click();
  }

  async register(user: UserData) {
    await this.nameInput.fill(user.name);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.phoneInput.fill(user.phone);
    await this.nidInput.fill(user.nid);
    await this.selectRole(user.role);
    await this.createAccountButton.click();
  }
}
