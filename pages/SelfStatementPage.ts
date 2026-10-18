import { Page, Locator } from '@playwright/test';

export interface StatementTable {
  headers: string[];
  rows: string[][];
}

export class SelfStatementPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly summary: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText(/Transaction History/);
    this.summary = page.getByText(/^Showing \d+ of \d+ total transaction/);
    this.tableHeaders = page.locator('thead th');
    this.tableRows = page.locator('tbody tr');
    this.nextPageButton = page.getByRole('button', { name: 'Go to next page' });
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
    const [id, sender, receiver, type, debit, credit, balance] = (await cells.allInnerTexts()).map((t) => t.trim());
    return { id, sender, receiver, type, debit, credit, balance };
  }

  async totalTransactions(): Promise<number> {
    const text = await this.summary.innerText();
    return Number(text.match(/of (\d+) total/)?.[1]);
  }

  // Reads every row across all pages
  async extractTable(): Promise<StatementTable> {
    await this.tableRows.first().waitFor();
    const headers = (await this.tableHeaders.allInnerTexts()).map((h) => h.trim());
    const rows: string[][] = [];

    while (true) {
      for (const row of await this.tableRows.all()) {
        rows.push((await row.locator('td').allInnerTexts()).map((c) => c.trim()));
      }
      if (!(await this.nextPageButton.isVisible()) || (await this.nextPageButton.isDisabled())) break;
      // Wait until the next page replaces the current rows
      const firstRow = await this.tableRows.first().textContent();
      await this.nextPageButton.click();
      await this.page.waitForFunction((prev) => document.querySelector('tbody tr')?.textContent !== prev, firstRow);
    }
    return { headers, rows };
  }
}
