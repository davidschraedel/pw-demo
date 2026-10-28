import { test, expect, Page } from '@playwright/test';

// Helper to isolate the specific question card by its title
function getQuestion(page: Page, title: string) {
  return page.locator('[role="listitem"]').filter({
    has: page.locator('[role="heading"]', { hasText: title }),
  });
}

test.describe('Phase 1: Field Probes', () => {
  const formUrl = process.env.formUrl;

  test.beforeEach(async ({ page }) => {
    // Navigate and wait for the form's main heading element rather than networkidle
    await page.goto(formUrl!);
    await page.getByRole('heading', { level: 1 }).waitFor();
  });

  test('probe: short text input', async ({ page }) => {
    await test.step('Fill "What is your full name?"', async () => {
      const question = getQuestion(page, 'What is your full name?');
      const input = question.locator('input[type="text"]');
      await input.fill('Alex Automation');
      await expect(input).toHaveValue('Alex Automation');
    });
  });

  test('probe: paragraph textarea', async ({ page }) => {
    await test.step('Fill "Provide a brief description of your automation project."', async () => {
      const question = getQuestion(page, 'Provide a brief description of your automation project.');
      const textarea = question.locator('textarea');
      const testDescription = 'Testing end-to-end Google Form automation with Playwright.';
      await textarea.fill(testDescription);
      await expect(textarea).toHaveValue(testDescription);
    });
  });

  test('probe: radio buttons', async ({ page }) => {
    await test.step('Select "TypeScript" for primary programming language', async () => {
      const question = getQuestion(page, 'Select your primary programming language.');
      const radio = question.getByRole('radio', { name: 'TypeScript' });
      await radio.click();
      await expect(radio).toBeChecked();
    });
  });

  test('probe: checkboxes', async ({ page }) => {
    await test.step('Check multiple testing tools ("Playwright" and "Jest")', async () => {
      const question = getQuestion(page, 'Which testing tools do you currently use?');
      const playwrightCheck = question.getByRole('checkbox', { name: 'Playwright' });
      const jestCheck = question.getByRole('checkbox', { name: 'Jest' });

      // Google Forms checkboxes toggle via click event
      await playwrightCheck.click();
      await jestCheck.click();

      await expect(playwrightCheck).toBeChecked();
      await expect(jestCheck).toBeChecked();
    });
  });

  test('probe: dropdown select', async ({ page }) => {
    await test.step('Select "Advanced" experience level from listbox dropdown', async () => {
      const question = getQuestion(page, 'Select your experience level with automation.');
      const dropdown = question.locator('[role="listbox"]');

      // Click to open the custom dropdown menu
      await dropdown.click();

      // Note on dropdown locator:
      // Google Forms renders a material ripple effect overlay (.kRoyt.MbhUzd) directly above
      // each option div. Clicking the inner <span> target bypasses the ripple interceptor
      // and triggers the custom selection listener without timing out on animations.
      const option = question.getByRole('option', { name: 'Advanced' });
      await option.waitFor({ state: 'visible' });
      await option.locator('span').click();

      // Assert the Advanced option is selected
      await expect(question.getByRole('option', { name: 'Advanced' })).toHaveAttribute('aria-selected', 'true');
    });
  });

  test('probe: date picker', async ({ page }) => {
    await test.step('Fill target execution date', async () => {
      const question = getQuestion(page, 'Select the target test execution date.');
      const dateInput = question.locator('input[type="date"]');
      await dateInput.fill('2026-11-15');
      await expect(dateInput).toHaveValue('2026-11-15');
    });
  });

  test('probe: time picker', async ({ page }) => {
    await test.step('Fill execution time (Hour, Minute, and AM/PM)', async () => {
      const question = getQuestion(page, 'Select the preferred execution time.');
      const hourInput = question.getByLabel('Hour');
      const minuteInput = question.getByLabel('Minute');

      await hourInput.fill('09');
      await minuteInput.fill('45');

      await expect(hourInput).toHaveValue('09');
      await expect(minuteInput).toHaveValue('45');

      // Select AM/PM if present
      const ampmDropdown = question.locator('[role="listbox"]');
      if (await ampmDropdown.isVisible()) {
        await ampmDropdown.click();
        const amOption = page.locator('[role="option"]').filter({ hasText: 'AM' }).first();
        if (await amOption.isVisible()) {
          await amOption.click();
          await expect(ampmDropdown).toContainText('AM');
        }
      }
    });
  });

  test('probe: linear rating scales', async ({ page }) => {
    await test.step('Rate ease of form automation as "5"', async () => {
      const easeQuestion = getQuestion(page, 'Rate the ease of form automation from 1 to 5.');
      const rating5 = easeQuestion.getByRole('radio', { name: '5' });
      await rating5.click();
      await expect(rating5).toBeChecked();
    });

    await test.step('Rate stability as "4"', async () => {
      const stabilityQuestion = getQuestion(page, 'Rate the overall stability of your test suite.');
      const rating4 = stabilityQuestion.getByRole('radio', { name: '4' });
      await rating4.click();
      await expect(rating4).toBeChecked();
    });
  });

  test('probe: multiple-choice grid', async ({ page }) => {
    await test.step('Evaluate test environments per row', async () => {
      const question = getQuestion(page, 'Evaluate the following test environments.');

      const devGood = question.locator('[role="radio"][aria-label="Good, response for Development"]');
      const stagingExcellent = question.locator('[role="radio"][aria-label="Excellent, response for Staging"]');
      const prodFair = question.locator('[role="radio"][aria-label="Fair, response for Production"]');

      await devGood.click();
      await stagingExcellent.click();
      await prodFair.click();

      await expect(devGood).toBeChecked();
      await expect(stagingExcellent).toBeChecked();
      await expect(prodFair).toBeChecked();
    });
  });

  test('probe: checkbox grid', async ({ page }) => {
    await test.step('Select browser support per environment', async () => {
      const question = getQuestion(page, 'Select applicable browser support per environment.');

      const desktopChrome = question.locator('[role="checkbox"][aria-label="Chrome, response for Desktop"]');
      const desktopFirefox = question.locator('[role="checkbox"][aria-label="Firefox, response for Desktop"]');
      const mobileSafari = question.locator('[role="checkbox"][aria-label="Safari, response for Mobile"]');

      // Click the checkboxes directly without force: true to ensure genuine actionability
      await desktopChrome.click();
      await desktopFirefox.click();
      await mobileSafari.click();

      await expect(desktopChrome).toBeChecked();
      await expect(desktopFirefox).toBeChecked();
      await expect(mobileSafari).toBeChecked();
    });
  });
});
