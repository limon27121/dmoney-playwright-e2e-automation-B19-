import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UserData } from '../pages/RegisterPage';
import { loadAgent, updateAgentPassword } from '../utils/agentData';
import { GmailClient } from '../utils/gmail';

test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

const authFile = 'auth.json';

test.describe('Agent password reset', () => {
  let agent: UserData;
  let oldPassword: string;
  let newPassword: string;

  test.beforeAll(() => {
    agent = loadAgent();
    oldPassword = agent.password;
    // Random 4-digit password, always different from the old one
    do newPassword = String(Math.floor(1000 + Math.random() * 9000));
    while (newPassword === oldPassword);
  });

  test('Verify Agent password reset works successfully', { tag: '@smoke' }, async ({ page, request }) => {
    test.setTimeout(240_000); // Reset mail can arrive late

    const loginPage = new LoginPage(page);
    const forgotPasswordPage = new ForgotPasswordPage(page);
    const resetPasswordPage = new ResetPasswordPage(page);
    const gmail = new GmailClient(request);

    await loginPage.goto();
    await loginPage.forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    // Mark time before requesting so older reset mails are never picked up
    const requestedAt = Date.now();
    await forgotPasswordPage.requestResetLink(agent.email);
    await expect(forgotPasswordPage.successMessage).toBeVisible();

    const resetToken = await gmail.waitForResetToken(agent.email, requestedAt);
    await resetPasswordPage.goto(resetToken);
    await expect(resetPasswordPage.heading).toBeVisible();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/user/reset-password') && res.request().method() === 'POST'
    );
    await resetPasswordPage.resetPassword(newPassword);
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    expect((await response.json()).message).toContain('Password has been reset successfully');
    await expect(page).toHaveURL(/\/login$/);

    updateAgentPassword(agent.email, newPassword);
  });

  test('Verify login with the old password fails after password reset', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/user/login') && res.request().method() === 'POST'
    );
    await loginPage.login(agent.email, oldPassword);
    const response = await responsePromise;

    expect(response.status()).toBe(401);
    expect((await response.json()).message).toBe('Password incorrect');
    await expect(loginPage.loginErrorMessage).toBeVisible();
    await expect(loginPage.otpInput).toBeHidden();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Verify login with the new password succeeds', { tag: '@smoke' }, async ({ page, request }) => {
    test.setTimeout(240_000); // OTP mail can arrive late

    const loginPage = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    const gmail = new GmailClient(request);

    await loginPage.goto();
    const otpRequestedAt = Date.now();
    await loginPage.login(agent.email, newPassword);
    await expect(loginPage.otpSentMessage).toBeVisible();

    const otp = await gmail.waitForOtp(agent.email, otpRequestedAt);
    await loginPage.verifyOtp(otp);
    await expect(page).toHaveURL(/\/profile$/);
    await expect(dashboard.dashboardTitle).toHaveText('Agent Dashboard');

    await page.context().storageState({ path: authFile });
  });
});
