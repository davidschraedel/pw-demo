import { test, expect, Page } from '@playwright/test';
import { fetchSheetRows, FormResponseRow } from './helpers/sheets';

function getQuestion(page: Page, title: string) {
  return page.locator('[role="listitem"]').filter({
    has: page.locator('[role="heading"]', { hasText: title }),
  });
}

test.describe('Phase 3: End-to-End Google Form to Sheets Automation', () => {
  const formUrl = process.env.formUrl;
  const sheetUrl = process.env.googleSheetUrl;

  test.beforeEach(() => {
    expect(formUrl, 'formUrl must be defined in .env').toBeTruthy();
    expect(sheetUrl, 'googleSheetUrl must be defined in .env').toBeTruthy();
  });

  test('submits full form and verifies recorded responses in Google Sheets', async ({ page, request }) => {
    const runId = Date.now();
    const payload = {
      fullName: `Playwright_${runId}`,
      description: `Automated E2E submission test run #${runId}.`,
      primaryLanguage: 'TypeScript',
      testingTools: ['Playwright', 'Jest'],
      experienceLevel: 'Advanced',
      targetDate: '2026-11-15',
      expectedSheetDate: '11/15/2026',
      timeHour: '09',
      timeMinute: '30',
      timeAmPm: 'AM',
      expectedSheetTime: '9:30:00 AM',
      easeRating: '5',
      stabilityRating: '4',
      envDev: 'Good',
      envStaging: 'Excellent',
      envProd: 'Fair',
      browserDesktop: ['Chrome', 'Firefox'],
      browserMobile: ['Safari'],
      browserTablet: ['Edge'],
    };

    // 1. Navigate to Google Form
    await test.step('Navigate to form', async () => {
      await page.goto(formUrl!, { waitUntil: 'domcontentloaded' });
    });

    // 2. Fill text fields
    await test.step('Fill "What is your full name?"', async () => {
      const question = getQuestion(page, 'What is your full name?');
      await question.locator('input[type="text"]').fill(payload.fullName);
    });

    await test.step('Fill "Provide a brief description of your automation project."', async () => {
      const question = getQuestion(page, 'Provide a brief description of your automation project.');
      await question.locator('textarea').fill(payload.description);
    });

    // 3. Select radio option
    await test.step(`Select primary language (${payload.primaryLanguage})`, async () => {
      const question = getQuestion(page, 'Select your primary programming language.');
      await question.getByRole('radio', { name: payload.primaryLanguage }).click();
    });

    // 4. Check multiple tools
    await test.step('Check testing tools', async () => {
      const question = getQuestion(page, 'Which testing tools do you currently use?');
      for (const tool of payload.testingTools) {
        await question.getByRole('checkbox', { name: tool }).click();
      }
    });

    // 5. Select dropdown option
    await test.step(`Select experience level (${payload.experienceLevel})`, async () => {
      const question = getQuestion(page, 'Select your experience level with automation.');
      const dropdown = question.locator('[role="listbox"]');
      await dropdown.scrollIntoViewIfNeeded();
      await dropdown.click();
      await page.waitForTimeout(400);

      // In Google Forms, the opened options are rendered in the floating menu (.OA0qNb)
      const option = page.locator(`.OA0qNb [data-value="${payload.experienceLevel}"]`);
      await option.scrollIntoViewIfNeeded();
      await option.click();
      await page.waitForTimeout(300);
    });

    // 6. Select date
    await test.step('Fill target execution date', async () => {
      const question = getQuestion(page, 'Select the target test execution date.');
      await question.locator('input[type="date"]').fill(payload.targetDate);
    });

    // 7. Select time
    await test.step('Fill execution time', async () => {
      const question = getQuestion(page, 'Select the preferred execution time.');
      await question.getByLabel('Hour').fill(payload.timeHour);
      await question.getByLabel('Minute').fill(payload.timeMinute);

      const ampmDropdown = question.locator('[role="listbox"]');
      if (await ampmDropdown.isVisible()) {
        await ampmDropdown.click();
        const amOption = page.locator('[role="option"]').filter({ hasText: payload.timeAmPm }).first();
        if (await amOption.isVisible()) {
          await amOption.click();
        }
      }
    });

    // 8. Linear rating scales
    await test.step('Rate ease and stability scales', async () => {
      const easeQuestion = getQuestion(page, 'Rate the ease of form automation from 1 to 5.');
      await easeQuestion.getByRole('radio', { name: payload.easeRating }).click();

      const stabilityQuestion = getQuestion(page, 'Rate the overall stability of your test suite.');
      await stabilityQuestion.getByRole('radio', { name: payload.stabilityRating }).click();
    });

    // 9. Matrix Grids
    await test.step('Evaluate test environments grid', async () => {
      const question = getQuestion(page, 'Evaluate the following test environments.');
      await question.locator(`[role="radio"][aria-label="${payload.envDev}, response for Development"]`).click();
      await question.locator(`[role="radio"][aria-label="${payload.envStaging}, response for Staging"]`).click();
      await question.locator(`[role="radio"][aria-label="${payload.envProd}, response for Production"]`).click();
    });

    await test.step('Select browser support grid', async () => {
      const question = getQuestion(page, 'Select applicable browser support per environment.');
      for (const b of payload.browserDesktop) {
        await question.locator(`[role="checkbox"][aria-label="${b}, response for Desktop"]`).click();
      }
      for (const b of payload.browserMobile) {
        await question.locator(`[role="checkbox"][aria-label="${b}, response for Mobile"]`).click();
      }
      for (const b of payload.browserTablet) {
        await question.locator(`[role="checkbox"][aria-label="${b}, response for Tablet"]`).click();
      }
    });

    // 10. Record submission window & click submit
    const submissionStartTime = Date.now();

    await test.step('Click Submit button', async () => {
      await page.getByRole('button', { name: 'Submit' }).click();
    });

    // 11. Assert confirmation screen
    await test.step('Verify confirmation screen', async () => {
      await expect(page.getByText(/Your response has been recorded/i)).toBeVisible({ timeout: 15_000 });
    });

    // 12. Poll Google Sheets for the unique submission ID
    let matchedRow: FormResponseRow | undefined;

    await test.step('Poll Google Sheet for recorded row', async () => {
      await expect.poll(async () => {
        const { rows } = await fetchSheetRows(request, sheetUrl!);
        matchedRow = rows.find(r => r['What is your full name?'] === payload.fullName);
        return !!matchedRow;
      }, {
        message: `Expected row with name "${payload.fullName}" in Google Sheets within polling timeout`,
        timeout: 20_000,
        intervals: [1_000, 2_000, 3_000],
      }).toBe(true);
    });

    // 13. Validate server-side timestamp falls within test window
    await test.step('Validate submission timestamp window', async () => {
      expect(matchedRow, 'Matched row must exist').toBeDefined();
      const recordedTimestampStr = matchedRow!.Timestamp;
      const recordedDate = new Date(recordedTimestampStr);
      const recordedTime = recordedDate.getTime();

      // Ensure timestamp parses cleanly and is within +/- 5 minutes of local submission start
      expect(Number.isNaN(recordedTime), `Timestamp "${recordedTimestampStr}" should be a valid date`).toBe(false);
      const diffMinutes = Math.abs(recordedTime - submissionStartTime) / (1000 * 60);
      expect.soft(diffMinutes, `Timestamp ${recordedTimestampStr} is within 5 minutes of submission`).toBeLessThanOrEqual(5);
    });

    // 14. Assert all column values with soft expectations
    await test.step('Assert all recorded column values match payload', async () => {
      const row = matchedRow!;

      expect.soft(row['Provide a brief description of your automation project.']).toBe(payload.description);
      expect.soft(row['Select your primary programming language.']).toBe(payload.primaryLanguage);

      for (const tool of payload.testingTools) {
        expect.soft(row['Which testing tools do you currently use?']).toContain(tool);
      }

      expect.soft(row['Select your experience level with automation.']).toBe(payload.experienceLevel);
      expect.soft(row['Select the target test execution date.']).toBe(payload.expectedSheetDate);
      expect.soft(row['Select the preferred execution time.']).toBe(payload.expectedSheetTime);
      expect.soft(row['Rate the ease of form automation from 1 to 5.']).toBe(payload.easeRating);
      expect.soft(row['Rate the overall stability of your test suite.']).toBe(payload.stabilityRating);

      expect.soft(row['Evaluate the following test environments. [Development]']).toBe(payload.envDev);
      expect.soft(row['Evaluate the following test environments. [Staging]']).toBe(payload.envStaging);
      expect.soft(row['Evaluate the following test environments. [Production]']).toBe(payload.envProd);

      for (const b of payload.browserDesktop) {
        expect.soft(row['Select applicable browser support per environment. [Desktop]']).toContain(b);
      }
      for (const b of payload.browserMobile) {
        expect.soft(row['Select applicable browser support per environment. [Mobile]']).toContain(b);
      }
      for (const b of payload.browserTablet) {
        expect.soft(row['Select applicable browser support per environment. [Tablet]']).toContain(b);
      }
    });
  });
});
