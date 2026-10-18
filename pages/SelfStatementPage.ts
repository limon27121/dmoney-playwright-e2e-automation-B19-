import { Page, Locator } from '@playwright/test';

export class SelfStatementPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText(/Transaction History/);
  }

  async goto() {
    await this.page.goto('/agent/self-statement');
  }

  transactionRow(trnxId: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: trnxId });
  }

  // Columns: Transaction ID, Sender, Receiver, Type, Debit, Credit, Balance, Date
  async getTransaction(trnxId: string) {
    const cells = this.transactionRow(trnxId).locator('td');
    const [id, sender, receiver, type, debit, credit] = (await cells.allInnerTexts()).map((t) => t.trim());
    return { id, sender, receiver, type, debit, credit };
  }
}
