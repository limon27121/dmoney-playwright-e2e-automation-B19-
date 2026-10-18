import { Page, Locator } from '@playwright/test';

export class ResetPasswordPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetPasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('Set New Password');
    this.newPasswordInput = page.locator('input[type="password"]').nth(0);
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.resetPasswordButton = page.getByRole('button', { name: /Reset Password/ });
  }

  async goto(token: string) {
    await this.page.goto(`/reset-password?token=${token}`);
  }

  async resetPassword(newPassword: string) {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.resetPasswordButton.click();
  }
}
