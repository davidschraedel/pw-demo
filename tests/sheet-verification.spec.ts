import { test, expect } from '@playwright/test';
import { GoogleSheetsClient } from '../pages/GoogleSheetsClient';

test.describe('Phase 2: Standalone Sheet Verification', () => {
  const googleSheetUrl = process.env.googleSheetUrl;

  test.beforeEach(() => {
    test.skip(!googleSheetUrl, 'googleSheetUrl is not set; skipping live sheet verification.');
  });

  test('fetch and parse sheet headers with cache busting', async ({ request }) => {
    const sheetsClient = new GoogleSheetsClient(request, googleSheetUrl!);
    const { headers, rows } = await sheetsClient.fetchRows();

    console.log('\n--- Parsed Google Sheet Headers ---');
    headers.forEach((h, idx) => console.log(`  [${idx}] ${h}`));
    console.log(`Current row count in sheet: ${rows.length}\n`);

    // Verify key headers match expected form column questions
    expect(headers).toContain('Timestamp');
    expect(headers).toContain('What is your full name?');
    expect(headers).toContain('Provide a brief description of your automation project.');
    expect(headers).toContain('Select your primary programming language.');
    expect(headers).toContain('Which testing tools do you currently use?');
    expect(headers).toContain('Select your experience level with automation.');
    expect(headers).toContain('Select the target test execution date.');
    expect(headers).toContain('Select the preferred execution time.');
    expect(headers).toContain('Rate the ease of form automation from 1 to 5.');
    expect(headers).toContain('Rate the overall stability of your test suite.');
    expect(headers).toContain('Evaluate the following test environments. [Development]');
    expect(headers).toContain('Select applicable browser support per environment. [Desktop]');
  });

  test('demonstrate polling helper against sheet responses', async ({ request }) => {
    const sheetsClient = new GoogleSheetsClient(request, googleSheetUrl!);

    // Poll the sheet to confirm the response fetching and polling mechanism runs reliably
    await expect.poll(async () => {
      const { rows } = await sheetsClient.fetchRows();
      return Array.isArray(rows);
    }, {
      message: 'Expected sheet fetch to return an array of rows',
      timeout: 10_000,
      intervals: [1_000, 2_000],
    }).toBe(true);

    const { rows } = await sheetsClient.fetchRows();
    expect(rows.length).toBeGreaterThan(0);
    console.log(`Verified: Sheet contains ${rows.length} existing row(s). Most recent entry by: "${rows[rows.length - 1]['What is your full name?']}"`);
  });
});
