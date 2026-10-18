import { Page, Locator } from '@playwright/test';

export class CashInPage {
  readonly page: Page;
  readonly customerPhoneInput: Locator;
  readonly amountInput: Locator;
  readonly cashInButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.customerPhoneInput = page.locator('input[name="customer"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.cashInButton = page.getByRole('button', { name: /Cash In/ });
    this.successMessage = page.getByText(/deposit to Agent successful/i);
  }

  async goto() {
    await this.page.goto('/agent/cash-in');
  }

  async cashIn(phone: string, amount: number) {
    await this.customerPhoneInput.fill(phone);
    await this.amountInput.fill(String(amount));
    await this.cashInButton.click();
  }
}
