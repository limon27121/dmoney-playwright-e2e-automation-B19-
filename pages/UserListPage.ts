import { Page, Locator } from '@playwright/test';

export class UserListPage {
  readonly page: Page;
  readonly searchTypeDropdown: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchTypeDropdown = page.getByRole('combobox').first();
    this.searchInput = page.getByPlaceholder('e.g., user@example.com');
    this.searchButton = page.getByRole('button', { name: 'Search' });
  }

  async goto() {
    await this.page.goto('/admin/users');
  }

  async searchByEmail(email: string) {
    await this.searchTypeDropdown.click();
    await this.page.getByRole('option', { name: 'Search by Email' }).click();
    await this.searchInput.fill(email);
    await this.searchButton.click();
  }

  userRow(email: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: email });
  }

  statusCell(email: string): Locator {
    return this.userRow(email).locator('td').nth(6);
  }

  async viewUser(email: string) {
    await this.userRow(email).getByRole('button', { name: 'View' }).click();
    await this.page.waitForURL(/\/admin\/users\/\d+$/);
  }
}
