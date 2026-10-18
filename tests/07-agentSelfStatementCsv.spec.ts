import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { DashboardPage } from '../pages/DashboardPage';
import { SelfStatementPage } from '../pages/SelfStatementPage';
import { UserData } from '../pages/RegisterPage';
import { loadAgent } from '../utils/agentData';
import { readCsv, todayStamp, writeCsv } from '../utils/csv';

test.describe.configure({ mode: 'serial' });
// Reuses the Agent session saved by 06-agentPasswordReset.spec.ts
test.use({ storageState: 'auth.json' });

const customerPhone = '01686606902';
const expectedHeaders = ['Transaction ID', 'Sender Account', 'Receiver Account', 'Type', 'Debit', 'Credit', 'Balance', 'Date'];
const csvFile = path.join(__dirname, '..', `self_statement_${todayStamp()}.csv`);

test.describe('Agent Self Statement', () => {
  let agent: UserData;

  test.beforeAll(() => {
    agent = loadAgent();
  });

  test('Verify the Self Statement contains the expected transaction data', { tag: '@smoke' }, async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const statement = new SelfStatementPage(page);

    await dashboard.goto();
    await dashboard.openSelfStatement();
    await expect(page).toHaveURL(/\/agent\/self-statement$/);

    const { headers, rows } = await statement.extractTable();
    expect(headers).toEqual(expectedHeaders);
    expect(rows).toHaveLength(await statement.totalTransactions());

    const records = rows.map(([id, sender, receiver, type, debit, credit, balance]) => ({
      id, sender, receiver, type, debit, credit, balance,
    }));
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sender: 'SYSTEM', receiver: agent.phone, type: 'Top-up from SYSTEM',
          debit: '-', credit: '2000.00', balance: '2000.00',
        }),
        expect.objectContaining({
          sender: agent.phone, receiver: customerPhone, type: 'Deposit Commission',
          debit: '500.00', credit: '12.50', balance: '1512.50',
        }),
      ])
    );
    records.forEach((r) => expect(r.id).toMatch(/^TXN[A-Z0-9]+$/));
  });

  test('Verify the Self Statement data is successfully saved into the required CSV file', { tag: '@smoke' }, async ({ page }) => {
    const statement = new SelfStatementPage(page);

    await statement.goto();
    const { headers, rows } = await statement.extractTable();

    writeCsv(csvFile, headers, rows);

    expect(path.basename(csvFile)).toMatch(/^self_statement_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(fs.existsSync(csvFile)).toBe(true);
    // File content must match the table exactly
    expect(readCsv(csvFile)).toEqual([headers, ...rows]);

    await test.info().attach(path.basename(csvFile), { path: csvFile, contentType: 'text/csv' });
  });
});
