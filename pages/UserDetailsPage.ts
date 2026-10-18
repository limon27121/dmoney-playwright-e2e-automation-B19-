import { Page, Locator } from '@playwright/test';

export type AccountStatus = 'Pending' | 'Active' | 'Suspended';

export class UserDetailsPage {
  readonly page: Page;
  readonly editUserButton: Locator;
  readonly statusDropdown: Locator;
  readonly saveChangesButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editUserButton = page.getByRole('button', { name: 'Edit User' });
    this.statusDropdown = page.getByRole('combobox').filter({ hasText: /^(Pending|Active|Suspended)$/ });
    this.saveChangesButton = page.getByRole('button', { name: 'Save Changes' });
    this.successMessage = page.getByText('User updated successfully');
  }

  async changeStatus(status: AccountStatus) {
    await this.editUserButton.click();
    await this.statusDropdown.click();
    await this.page.getByRole('option', { name: status, exact: true }).click();
    await this.saveChangesButton.click();
  }
}
