import { test, expect } from '@playwright/test';
import { GmailClient } from '../utils/gmail';

test('Read latest email via Gmail API', async ({ request }) => {
  const gmail = new GmailClient(request);

  // List (newest first) -> read the top message by id
  const mail = await gmail.readLatestMessage();

  const from = gmail.header(mail, 'from');
  const subject = gmail.header(mail, 'subject');
  console.log(`From: ${from}\nSubject: ${subject}\nSnippet: ${mail.snippet}`);

  expect(mail.id).toBeTruthy();
  expect(subject).toBeTruthy();
});
