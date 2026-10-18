import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UserData } from '../pages/RegisterPage';
import { loadAgent } from '../utils/agentData';
import { GmailClient } from '../utils/gmail';

test.describe.configure({ mode: 'serial' });

const expectedBalance = 2000;
const authFile = 'auth.json';

test.describe('Agent login and balance', () => {
  let agent: UserData;

  // Agent is registered, activated and funded by specs 01-03
  test.beforeAll(() => {
    agent = loadAgent();
  });

  test.describe('Login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Verify the Agent can log in after activation', { tag: '@smoke' }, async ({ page, request }) => {
      test.setTimeout(240_000); // OTP mail can arrive late

      const loginPage = new LoginPage(page);
      const dashboard = new DashboardPage(page);
      const gmail = new GmailClient(request);

      await loginPage.goto();
      // Mark time before requesting OTP so older OTP mails are never picked up
      const otpRequestedAt = Date.now();
      await loginPage.login(agent.email, agent.password);
      await expect(loginPage.otpSentMessage).toBeVisible();

      const otp = await gmail.waitForOtp(agent.email, otpRequestedAt);
      expect(otp).toMatch(/^\d{4}$/);

      await loginPage.verifyOtp(otp);
      await expect(page).toHaveURL(/\/profile$/);
      await expect(dashboard.dashboardTitle).toHaveText('Agent Dashboard');

      await page.context().storageState({ path: authFile });
    });
  });

  test.describe('Authenticated as Agent', () => {
    test.use({ storageState: authFile });

    test('Verify the Agent balance is exactly 2000 Tk', { tag: '@smoke' }, async ({ page }) => {
      const dashboard = new DashboardPage(page);

      await dashboard.goto();
      const responsePromise = page.waitForResponse((res) => res.url().includes(`/transaction/balance/${agent.phone}`));
      await dashboard.showBalance();
      const body = await (await responsePromise).json();

      expect(body.balance).toBe(expectedBalance);
      await expect(dashboard.balanceAmount).toHaveText(`৳ ${expectedBalance.toFixed(2)}`);
    });
  });
});
