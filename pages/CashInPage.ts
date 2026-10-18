import { Page, Locator } from '@playwright/test';

export class CashInPage {
  readonly page: Page;
  readonly customerPhoneInput: Locator;
  readonly amountInput: Locator;
  readonly cashInButton: Locator;
  readonly successMessage: Locator;
  readonly currentBalance: Locator;

  constructor(page: Page) {
    this.page = page;
    this.customerPhoneInput = page.locator('input[name="customer"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.cashInButton = page.getByRole('button', { name: /Cash In/ });
    // "SYSTEM deposit to Agent successful" or "Deposit successful"
    this.successMessage = page.getByText(/deposit.*successful/i);
    this.currentBalance = page.getByText('CURRENT BALANCE').locator('xpath=following-sibling::*[1]');
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
