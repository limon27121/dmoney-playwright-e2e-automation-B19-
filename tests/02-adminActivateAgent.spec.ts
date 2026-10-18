import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UserListPage } from '../pages/UserListPage';
import { UserDetailsPage } from '../pages/UserDetailsPage';
import { UserData } from '../pages/RegisterPage';
import { CreateUserPage } from '../pages/CreateUserPage';
import { loadAgent } from '../utils/agentData';
import { generateCustomer, saveCustomer } from '../utils/customerData';

test.describe.configure({ mode: 'serial' });

const admin = { email: 'admin@dmoney.com', password: '1234' };
const authFile = 'auth.json';

test.describe('Admin activates Agent', () => {
  let agent: UserData;

  // Agent is registered by 01-agentRegistration.spec.ts
  test.beforeAll(() => {
    agent = loadAgent();
  });

  test.describe('Login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Verify Admin login is successful', { tag: '@smoke' }, async ({ page }) => {
      const home = new HomePage(page);
      const loginPage = new LoginPage(page);
      const dashboard = new DashboardPage(page);

      await home.goto();
      await home.clickLogin();
      await expect(page).toHaveURL(/\/login$/);

      await loginPage.login(admin.email, admin.password);
      await expect(page).toHaveURL(/\/profile$/);
      await expect(dashboard.dashboardTitle).toHaveText('Admin Dashboard');

      await page.context().storageState({ path: authFile });
    });
  });

  test.describe('Authenticated as Admin', () => {
    test.use({ storageState: authFile });

    test('Verify the newly created Agent appears in the Admin user list', { tag: '@smoke' }, async ({ page }) => {
      const dashboard = new DashboardPage(page);
      const userList = new UserListPage(page);

      await dashboard.goto();
      await dashboard.openUserList();
      await expect(page).toHaveURL(/\/admin\/users$/);

      await userList.searchByEmail(agent.email);
      await expect(userList.userRow(agent.email)).toBeVisible();
      await expect(userList.userRow(agent.email)).toContainText(agent.name);
      await expect(userList.userRow(agent.email)).toContainText('Agent');
    });

    test('Verify the newly created Agent is initially inactive', { tag: '@smoke' }, async ({ page }) => {
      const userList = new UserListPage(page);
      const userDetails = new UserDetailsPage(page);

      await userList.goto();
      await userList.searchByEmail(agent.email);
      await expect(userList.statusCell(agent.email)).toHaveText(/PENDING/i);

      await userList.viewUser(agent.email);
      await expect(userDetails.statusDropdown).toHaveText('Pending');
    });

    test('Verify Admin can activate the Agent', { tag: '@smoke' }, async ({ page }) => {
      const userList = new UserListPage(page);
      const userDetails = new UserDetailsPage(page);

      await userList.goto();
      await userList.searchByEmail(agent.email);
      await userList.viewUser(agent.email);

      await userDetails.changeStatus('Active');
      await expect(userDetails.successMessage).toBeVisible();
      await expect(userDetails.statusDropdown).toHaveText('Active');
    });

    test('Verify the Agent remains active after page reload', { tag: '@smoke' }, async ({ page }) => {
      const userList = new UserListPage(page);
      const userDetails = new UserDetailsPage(page);

      await userList.goto();
      await userList.searchByEmail(agent.email);
      await userList.viewUser(agent.email);

      await page.reload();
      await expect(userDetails.statusDropdown).toHaveText('Active');

      await userList.goto();
      await userList.searchByEmail(agent.email);
      await expect(userList.statusCell(agent.email)).toHaveText(/ACTIVE/i);
    });

    // Customer used by 05-agentDepositToCustomer.spec.ts and 07-agentSelfStatementCsv.spec.ts
    test('Verify Admin can create and activate a new Customer', { tag: '@smoke' }, async ({ page }) => {
      const createUser = new CreateUserPage(page);
      const userList = new UserListPage(page);
      const userDetails = new UserDetailsPage(page);
      const customer = generateCustomer();

      await createUser.goto();
      const responsePromise = page.waitForResponse(
        (res) => res.url().includes('/user/create') && res.request().method() === 'POST'
      );
      await createUser.createUser(customer);
      const response = await responsePromise;
      expect(response.status()).toBe(201);
      await expect(createUser.successMessage).toBeVisible();
      saveCustomer(customer);

      await userList.goto();
      await userList.searchByEmail(customer.email);
      await expect(userList.userRow(customer.email)).toContainText('Customer');
      await userList.viewUser(customer.email);

      await userDetails.changeStatus('Active');
      await expect(userDetails.successMessage).toBeVisible();
      await expect(userDetails.statusDropdown).toHaveText('Active');
    });

    test('Log out from the Admin account', { tag: '@smoke' }, async ({ page }) => {
      const dashboard = new DashboardPage(page);

      await dashboard.goto();
      await dashboard.logout();
      await expect(page).toHaveURL(/\/login$/);
      
    });
  });
});
