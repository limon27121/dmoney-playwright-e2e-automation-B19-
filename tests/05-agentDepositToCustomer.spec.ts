import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { CashInPage } from '../pages/CashInPage';
import { SelfStatementPage } from '../pages/SelfStatementPage';
import { UserData } from '../pages/RegisterPage';
import { loadAgent } from '../utils/agentData';

test.describe.configure({ mode: 'serial' });
// Reuses the Agent session saved by 04-agentLoginBalance.spec.ts
test.use({ storageState: 'auth.json' });

const customerPhone = '01686606902';
const openingBalance = 2000;
const depositAmount = 500;
const commissionRate = 0.025;
const commission = depositAmount * commissionRate;
const expectedBalance = openingBalance - depositAmount + commission;

test.describe('Agent deposits to Customer', () => {
  let agent: UserData;
  let trnxId: string;

  test.beforeAll(() => {
    agent = loadAgent();
  });

  test('Verify the Agent can deposit 500 Tk to an existing Customer', { tag: '@smoke' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const cashInPage = new CashInPage(page);

    await dashboard.goto();
    await dashboard.openCashIn();
    await expect(page).toHaveURL(/\/agent\/cash-in$/);

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/transaction/deposit') && res.request().method() === 'POST'
    );
    await cashInPage.cashIn(customerPhone, depositAmount);
    const response = await responsePromise;
    const body = await response.json();

    expect(response.status()).toBe(201);
    expect(body.message).toBe('Deposit successful');
    expect(body.commission).toBe(commission);
    await expect(cashInPage.successMessage).toHaveText('Deposit successful');
    await expect(page.getByText(body.trnxId)).toBeVisible();

    trnxId = body.trnxId;
  });

  test('Verify the Agent balance is updated correctly after the transaction', { tag: '@smoke' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    const responsePromise = page.waitForResponse((res) => res.url().includes(`/transaction/balance/${agent.phone}`));
    await dashboard.showBalance();
    const body = await (await responsePromise).json();

    // Balance = opening - deposit + 2.5% commission
    expect(body.balance).toBe(expectedBalance);
    await expect(dashboard.balanceAmount).toHaveText(`৳ ${expectedBalance.toFixed(2)}`);
  });

  test("Verify the Customer deposit appears in the Agent's Self Statement", { tag: '@smoke' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const statement = new SelfStatementPage(page);

    await dashboard.goto();
    await dashboard.openSelfStatement();
    await expect(page).toHaveURL(/\/agent\/self-statement$/);
    await expect(statement.transactionRow(trnxId)).toBeVisible();

    const record = await statement.getTransaction(trnxId);
    expect(record).toEqual({
      id: trnxId,
      sender: agent.phone,
      receiver: customerPhone,
      type: 'Deposit Commission',
      debit: depositAmount.toFixed(2),
      credit: commission.toFixed(2),
      balance: expectedBalance.toFixed(2),
    });
  });

  test('Verify Agent logout works successfully', { tag: '@smoke' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await dashboard.logout();
    await expect(page).toHaveURL(/\/login$/);

    // Protected page must not be reachable after logout
    await dashboard.goto();
    await expect(page).toHaveURL(/\/login$/);
  });
});
