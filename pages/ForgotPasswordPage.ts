import { Page, Locator } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;
  readonly identifierInput: Locator;
  readonly sendResetLinkButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.identifierInput = page.getByPlaceholder('e.g. user@gmail.com or 01xxxxxxxxx');
    this.sendResetLinkButton = page.getByRole('button', { name: /Send Reset Link/ });
    this.successMessage = page.getByText('A password reset link has been sent to your registered Gmail address.');
  }

  async requestResetLink(identifier: string) {
    await this.identifierInput.fill(identifier);
    await this.sendResetLinkButton.click();
  }
}
