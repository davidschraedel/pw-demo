import { test, expect } from '@playwright/test';
import { GoogleFormPage, FormPayload } from '../pages/GoogleFormPage';
import { GoogleSheetsClient } from '../pages/GoogleSheetsClient';

/**
 * Normalizes time strings (e.g., "09", "30", "AM" -> "9:30:00 AM")
 * matching Google Sheets server-side time rendering.
 */
function formatExpectedSheetTime(hour: string, minute: string, ampm = 'AM'): string {
  const parsedHour = parseInt(hour, 10);
  return `${parsedHour}:${minute}:00 ${ampm}`;
}

test.describe('End-to-End Google Form to Sheets Automation', () => {
  const formUrl = process.env.formUrl;
  const sheetUrl = process.env.googleSheetUrl;

  test.beforeEach(() => {
    expect(formUrl, 'formUrl must be defined in .env').toBeTruthy();
    expect(sheetUrl, 'googleSheetUrl must be defined in .env').toBeTruthy();
  });

  test('submits full form and verifies recorded responses in Google Sheets', async ({ page, request }) => {
    const runId = Date.now();
    const payload: FormPayload = {
      fullName: `Playwright_${runId}`,
      description: `Automated POM E2E regression test run #${runId}.`,
      primaryLanguage: 'TypeScript',
      testingTools: ['Playwright', 'Jest'],
      experienceLevel: 'Advanced',
      targetDate: '2026-11-15',
      timeHour: '09',
      timeMinute: '30',
      timeAmPm: 'AM',
      easeRating: '5',
      stabilityRating: '4',
      envDev: 'Good',
      envStaging: 'Excellent',
      envProd: 'Fair',
      browserDesktop: ['Chrome', 'Firefox'],
      browserMobile: ['Safari'],
      browserTablet: ['Edge'],
    };

    const formPage = new GoogleFormPage(page);
    const sheetsClient = new GoogleSheetsClient(request, sheetUrl!);

    // 1. Navigate and fill form
    await formPage.goto(formUrl!);
    await formPage.fillForm(payload);

    // 2. Submit form and record start time for timestamp validation
    const submissionStartTime = Date.now();
    await formPage.submit();
    await formPage.verifyConfirmationScreen();

    // 3. Poll Google Sheets for recorded row by unique run ID
    const matchedRow = await test.step('Poll Google Sheet for recorded row', async () => {
      return await sheetsClient.pollForRow('What is your full name?', payload.fullName);
    });

    // 4. Validate server-side timestamp window
    await test.step('Validate submission timestamp window', async () => {
      const recordedTimestampStr = matchedRow.Timestamp;
      const recordedDate = new Date(recordedTimestampStr);
      const recordedTime = recordedDate.getTime();

      expect(Number.isNaN(recordedTime), `Timestamp "${recordedTimestampStr}" should be a valid date`).toBe(false);
      const diffMinutes = Math.abs(recordedTime - submissionStartTime) / (1000 * 60);
      expect.soft(diffMinutes, `Timestamp ${recordedTimestampStr} is within 5 minutes of submission`).toBeLessThanOrEqual(5);
    });

    // 5. Assert all column values with soft expectations
    await test.step('Assert all recorded column values match payload', async () => {
      expect.soft(matchedRow['Provide a brief description of your automation project.']).toBe(payload.description);
      expect.soft(matchedRow['Select your primary programming language.']).toBe(payload.primaryLanguage);

      for (const tool of payload.testingTools) {
        expect.soft(matchedRow['Which testing tools do you currently use?']).toContain(tool);
      }

      expect.soft(matchedRow['Select your experience level with automation.']).toBe(payload.experienceLevel);

      // Compare dates using parsed Date representations to normalize locale differences (MM/DD/YYYY vs YYYY-MM-DD)
      const sheetDateStr = matchedRow['Select the target test execution date.'];
      const parsedSheetDate = new Date(sheetDateStr);
      const parsedPayloadDate = new Date(payload.targetDate.replace(/-/g, '/'));
      expect.soft(
        parsedSheetDate.toDateString(),
        `Date "${sheetDateStr}" matches expected payload date "${payload.targetDate}"`
      ).toBe(parsedPayloadDate.toDateString());

      // Normalize expected time format
      const expectedTimeStr = formatExpectedSheetTime(payload.timeHour, payload.timeMinute, payload.timeAmPm);
      expect.soft(matchedRow['Select the preferred execution time.']).toBe(expectedTimeStr);

      expect.soft(matchedRow['Rate the ease of form automation from 1 to 5.']).toBe(payload.easeRating);
      expect.soft(matchedRow['Rate the overall stability of your test suite.']).toBe(payload.stabilityRating);

      expect.soft(matchedRow['Evaluate the following test environments. [Development]']).toBe(payload.envDev);
      expect.soft(matchedRow['Evaluate the following test environments. [Staging]']).toBe(payload.envStaging);
      expect.soft(matchedRow['Evaluate the following test environments. [Production]']).toBe(payload.envProd);

      for (const b of payload.browserDesktop) {
        expect.soft(matchedRow['Select applicable browser support per environment. [Desktop]']).toContain(b);
      }
      for (const b of payload.browserMobile) {
        expect.soft(matchedRow['Select applicable browser support per environment. [Mobile]']).toContain(b);
      }
      for (const b of payload.browserTablet) {
        expect.soft(matchedRow['Select applicable browser support per environment. [Tablet]']).toContain(b);
      }
    });
  });
});
