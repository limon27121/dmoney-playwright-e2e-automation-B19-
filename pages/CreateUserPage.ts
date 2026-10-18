import { Page, Locator } from '@playwright/test';
import { UserData } from './RegisterPage';

export class CreateUserPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly phoneInput: Locator;
  readonly nidInput: Locator;
  readonly roleDropdown: Locator;
  readonly createUserButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.phoneInput = page.locator('input[name="phone_number"]');
    this.nidInput = page.locator('input[name="nid"]');
    this.roleDropdown = page.getByRole('combobox');
    this.createUserButton = page.getByRole('button', { name: 'Create User' });
    this.successMessage = page.getByText('User created', { exact: true });
  }

  async goto() {
    await this.page.goto('/admin/users/create');
  }

  async createUser(user: UserData) {
    await this.nameInput.fill(user.name);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.phoneInput.fill(user.phone);
    await this.nidInput.fill(user.nid);
    await this.roleDropdown.click();
    await this.page.getByRole('option', { name: user.role, exact: true }).click();
    await this.createUserButton.click();
  }
}
