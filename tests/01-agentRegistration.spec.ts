import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { RegisterPage } from '../pages/RegisterPage';
import { generateAgent, saveAgent } from '../utils/agentData';

test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

const agent = generateAgent();

test.describe('Agent Registration', () => {
  test('Navigate to Sign Up page from home', { tag: '@smoke' }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.clickSignUp();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('Verify Agent registration is successful', { tag: '@smoke' }, async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/user/register') && res.request().method() === 'POST'
    );
    await registerPage.register(agent);
    const response = await responsePromise;
    const body = await response.json();

    expect(response.status()).toBe(201);
    expect(body.message).toContain('Registration successful');
    expect(body.user).toMatchObject({ email: agent.email, role: 'Agent', status: 'pending' });
    await expect(page).toHaveURL(/\/login$/);

    saveAgent(agent);
  });
});
