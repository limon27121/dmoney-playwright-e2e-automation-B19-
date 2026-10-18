import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly dashboardTitle: Locator;
  readonly userListLink: Locator;
  readonly cashInLink: Locator;
  readonly selfStatementLink: Locator;
  readonly loggedInUser: Locator;
  readonly profileMenu: Locator;
  readonly logoutMenuItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardTitle = page.locator('header').getByText(/Dashboard$/);
    this.userListLink = page.getByRole('link', { name: 'User List' }).first();
    this.cashInLink = page.getByRole('link', { name: 'Cash In' }).first();
    this.selfStatementLink = page.getByRole('link', { name: 'Self Statement' }).first();
    this.loggedInUser = page.locator('header p').nth(1);
    this.profileMenu = page.locator('header .MuiAvatar-root').first();
    this.logoutMenuItem = page.getByRole('menuitem', { name: /Logout/ });
  }

  async goto() {
    await this.page.goto('/profile');
  }

  async openUserList() {
    await this.userListLink.click();
  }

  async openCashIn() {
    await this.cashInLink.click();
  }

  async openSelfStatement() {
    await this.selfStatementLink.click();
  }

  async logout() {
    await this.profileMenu.click();
    await this.logoutMenuItem.click();
  }
}
