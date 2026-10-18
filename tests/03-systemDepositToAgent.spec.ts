import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CashInPage } from '../pages/CashInPage';
import { SelfStatementPage } from '../pages/SelfStatementPage';
import { UserData } from '../pages/RegisterPage';
import { loadAgent } from '../utils/agentData';

test.describe.configure({ mode: 'serial' });

const system = { email: 'system@dmoney.com', password: '1234' };
const depositAmount = 2000;
const authFile = 'auth.json';

test.describe('System deposits to Agent', () => {
  let agent: UserData;
  let trnxId: string;

  // Agent is registered and activated by specs 01 and 02
  test.beforeAll(() => {
    agent = loadAgent();
  });

  test.describe('Login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Verify System login is successful', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboard = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(system.email, system.password);
      await expect(page).toHaveURL(/\/profile$/);
      await expect(dashboard.loggedInUser).toHaveText('SYSTEM');

      await page.context().storageState({ path: authFile });
    });
  });

  test.describe('Authenticated as System', () => {
    test.use({ storageState: authFile });

    test('Verify System can deposit 2000 Tk to the Agent', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      const cashInPage = new CashInPage(page);

      await dashboard.goto();
      await dashboard.openCashIn();
      await expect(page).toHaveURL(/\/agent\/cash-in$/);

      const responsePromise = page.waitForResponse(
        (res) => res.url().includes('/transaction/deposit') && res.request().method() === 'POST'
      );
      await cashInPage.cashIn(agent.phone, depositAmount);
      const response = await responsePromise;
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(body).toMatchObject({ amount: depositAmount, agentBalance: depositAmount });
      await expect(cashInPage.successMessage).toBeVisible();
      await expect(page.getByText(body.trnxId)).toBeVisible();

      trnxId = body.trnxId;
    });

    test('Verify the System deposit creates the correct transaction record', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      const statement = new SelfStatementPage(page);

      await dashboard.goto();
      await dashboard.openSelfStatement();
      await expect(statement.heading).toBeVisible();
      await expect(statement.transactionRow(trnxId)).toBeVisible();

      const record = await statement.getTransaction(trnxId);
      expect(record).toEqual({
        id: trnxId,
        sender: 'SYSTEM',
        receiver: agent.phone,
        type: 'System Deposit to Agent',
        debit: depositAmount.toFixed(2),
        credit: '-',
      });
    });

    test('Log out from the System account', async ({ page }) => {
      const dashboard = new DashboardPage(page);

      await dashboard.goto();
      await dashboard.logout();
      await expect(page).toHaveURL(/\/login$/);
    });
  });
});
