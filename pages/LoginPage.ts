import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly identifierInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly loginErrorMessage: Locator;
  readonly otpSentMessage: Locator;
  readonly otpInput: Locator;
  readonly verifyOtpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.identifierInput = page.getByPlaceholder('Enter email or phone number');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: /Login/ });
    this.forgotPasswordLink = page.getByText('Forgot password?');
    this.loginErrorMessage = page.getByText('Login failed. Please input correct email/phone number or password.');
    this.otpSentMessage = page.getByText('OTP sent to your registered email address');
    this.otpInput = page.getByPlaceholder('• • • •');
    this.verifyOtpButton = page.getByRole('button', { name: /Verify OTP/ });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(identifier: string, password: string) {
    await this.identifierInput.fill(identifier);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async verifyOtp(otp: string) {
    await this.otpInput.fill(otp);
    await this.verifyOtpButton.click();
  }
}
