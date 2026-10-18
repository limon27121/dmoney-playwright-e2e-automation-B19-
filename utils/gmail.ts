import { APIRequestContext, expect } from '@playwright/test';
import fs from 'fs';

if (fs.existsSync('.env')) process.loadEnvFile('.env');

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const TOKEN_API = 'https://oauth2.googleapis.com/token';

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

export interface GmailMessage {
  id: string;
  internalDate: string;
  snippet: string;
  payload: GmailPart & { headers: { name: string; value: string }[] };
}

export class GmailClient {
  private accessToken?: string;

  constructor(private readonly request: APIRequestContext) {}

  // Uses refresh token when configured (never expires), else the static Gmail_token (expires in ~1h)
  private async authHeaders() {
    if (!this.accessToken) {
      const { Gmail_client_id, Gmail_client_secret, Gmail_refresh_token, Gmail_token } = process.env;
      if (Gmail_client_id && Gmail_client_secret && Gmail_refresh_token) {
        const res = await this.request.post(TOKEN_API, {
          form: {
            client_id: Gmail_client_id,
            client_secret: Gmail_client_secret,
            refresh_token: Gmail_refresh_token,
            grant_type: 'refresh_token',
          },
        });
        expect(res.status(), await res.text()).toBe(200);
        this.accessToken = (await res.json()).access_token;
      } else {
        this.accessToken = Gmail_token;
      }
    }
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  // GET /messages — ids come back newest first
  async listMessages(params: Record<string, string | number> = {}): Promise<{ id: string }[]> {
    const res = await this.request.get(GMAIL_API, { headers: await this.authHeaders(), params });
    expect(res.status(), await res.text()).toBe(200);
    const { messages = [] } = await res.json();
    return messages;
  }

  // GET /messages/{messageId}
  async readMessage(messageId: string): Promise<GmailMessage> {
    const res = await this.request.get(`${GMAIL_API}/${messageId}`, { headers: await this.authHeaders() });
    expect(res.status(), await res.text()).toBe(200);
    return res.json();
  }

  async readLatestMessage(): Promise<GmailMessage> {
    const [latest] = await this.listMessages({ maxResults: 1 });
    if (!latest) throw new Error('Mailbox is empty');
    return this.readMessage(latest.id);
  }

  header(mail: GmailMessage, name: string): string | undefined {
    return mail.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
  }

  // Decoded text of every MIME part (plain + html)
  body(mail: GmailMessage): string {
    const collect = (part: GmailPart): string =>
      (part.body?.data ? Buffer.from(part.body.data, 'base64url').toString('utf-8') : '') +
      (part.parts ?? []).map(collect).join('\n');
    return collect(mail.payload);
  }

  // Polls until a mail matching `query` for `recipient`, received at/after `since` (epoch ms), yields a value via `extract`
  async waitForMail<T>(
    query: string,
    recipient: string,
    since: number,
    extract: (mail: GmailMessage) => T | null,
    timeoutMs = 180_000,
    intervalMs = 3_000
  ): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const value = await this.findMailSince(query, recipient, since, extract);
      if (value) return value;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`No new mail "${query}" for ${recipient} received within ${timeoutMs / 1000}s`);
  }

  private async findMailSince<T>(
    query: string,
    recipient: string,
    since: number,
    extract: (mail: GmailMessage) => T | null
  ): Promise<T | null> {
    // Mail timestamps have 1s precision, so compare at second level
    const sinceSecond = Math.floor(since / 1000) * 1000;
    const messages = await this.listMessages({ q: query, maxResults: 10 });
    for (const { id } of messages) {
      const mail = await this.readMessage(id);
      if (Number(mail.internalDate) < sinceSecond) return null; // newest first, so the rest are older too
      // All +alias mails share one inbox, so match the exact recipient
      if (!this.header(mail, 'to')?.toLowerCase().includes(recipient.toLowerCase())) continue;
      const value = extract(mail);
      if (value) return value;
    }
    return null;
  }

  waitForOtp(recipient: string, since: number): Promise<string> {
    return this.waitForMail('subject:"Your Login OTP"', recipient, since, (mail) => this.extractOtp(mail.snippet));
  }

  // Returns the reset token from the link in the mail body
  waitForResetToken(recipient: string, since: number): Promise<string> {
    return this.waitForMail('subject:reset', recipient, since, (mail) => this.extractResetToken(this.body(mail)));
  }

  extractOtp(snippet: string): string | null {
    return snippet.match(/\b\d{4}\b/)?.[0] ?? null;
  }

  extractResetToken(text: string): string | null {
    return text.match(/reset-password\?token=([A-Za-z0-9]+)/)?.[1] ?? null;
  }
}
