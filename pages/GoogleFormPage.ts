import { Page, Locator, expect, test } from '@playwright/test';

export interface FormPayload {
  fullName: string;
  description: string;
  primaryLanguage: string;
  testingTools: string[];
  experienceLevel: string;
  targetDate: string; // YYYY-MM-DD
  timeHour: string;
  timeMinute: string;
  timeAmPm?: 'AM' | 'PM';
  easeRating: string;
  stabilityRating: string;
  envDev: string;
  envStaging: string;
  envProd: string;
  browserDesktop: string[];
  browserMobile: string[];
  browserTablet: string[];
}

export class GoogleFormPage {
  constructor(public readonly page: Page) {}

  /**
   * Navigates to the Google Form URL.
   */
  public async goto(formUrl: string): Promise<void> {
    await this.page.goto(formUrl);
    await this.page.getByRole('heading', { level: 1 }).waitFor();
  }

  /**
   * Scopes to a specific question card by its heading text.
   */
  public getQuestionCard(title: string): Locator {
    return this.page.locator('[role="listitem"]').filter({
      has: this.page.locator('[role="heading"]', { hasText: title }),
    });
  }

  public async fillFullName(name: string): Promise<void> {
    await test.step('Fill "What is your full name?"', async () => {
      const question = this.getQuestionCard('What is your full name?');
      await question.locator('input[type="text"]').fill(name);
    });
  }

  public async fillProjectDescription(description: string): Promise<void> {
    await test.step('Fill "Provide a brief description of your automation project."', async () => {
      const question = this.getQuestionCard('Provide a brief description of your automation project.');
      await question.locator('textarea').fill(description);
    });
  }

  public async selectPrimaryLanguage(language: string): Promise<void> {
    await test.step(`Select primary language (${language})`, async () => {
      const question = this.getQuestionCard('Select your primary programming language.');
      await question.getByRole('radio', { name: language }).click();
    });
  }

  public async selectTestingTools(tools: string[]): Promise<void> {
    await test.step(`Select testing tools (${tools.join(', ')})`, async () => {
      const question = this.getQuestionCard('Which testing tools do you currently use?');
      for (const tool of tools) {
        await question.getByRole('checkbox', { name: tool }).click();
      }
    });
  }

  public async selectExperienceLevel(level: string): Promise<void> {
    await test.step(`Select experience level (${level})`, async () => {
      const question = this.getQuestionCard('Select your experience level with automation.');
      const dropdown = question.locator('[role="listbox"]');
      await dropdown.scrollIntoViewIfNeeded();
      await dropdown.click();
      await this.page.waitForTimeout(400);

      // In Google Forms, opened options render in the floating menu container (.OA0qNb)
      const option = this.page.locator(`.OA0qNb [data-value="${level}"]`);
      await option.scrollIntoViewIfNeeded();
      await option.click();
      await this.page.waitForTimeout(300);
    });
  }

  public async fillTargetDate(dateStr: string): Promise<void> {
    await test.step(`Fill target date (${dateStr})`, async () => {
      const question = this.getQuestionCard('Select the target test execution date.');
      await question.locator('input[type="date"]').fill(dateStr);
    });
  }

  public async fillExecutionTime(hour: string, minute: string, ampm: 'AM' | 'PM' = 'AM'): Promise<void> {
    await test.step(`Fill execution time (${hour}:${minute} ${ampm})`, async () => {
      const question = this.getQuestionCard('Select the preferred execution time.');
      await question.getByLabel('Hour').fill(hour);
      await question.getByLabel('Minute').fill(minute);

      const ampmDropdown = question.locator('[role="listbox"]');
      if (await ampmDropdown.isVisible()) {
        await ampmDropdown.click();
        const amOption = this.page.locator('[role="option"]').filter({ hasText: ampm }).first();
        if (await amOption.isVisible()) {
          await amOption.click();
        }
      }
    });
  }

  public async rateEaseOfAutomation(rating: string): Promise<void> {
    await test.step(`Rate ease of form automation as "${rating}"`, async () => {
      const question = this.getQuestionCard('Rate the ease of form automation from 1 to 5.');
      await question.getByRole('radio', { name: rating }).click();
    });
  }

  public async rateSuiteStability(rating: string): Promise<void> {
    await test.step(`Rate suite stability as "${rating}"`, async () => {
      const question = this.getQuestionCard('Rate the overall stability of your test suite.');
      await question.getByRole('radio', { name: rating }).click();
    });
  }

  public async evaluateEnvironments(ratings: { dev: string; staging: string; prod: string }): Promise<void> {
    await test.step('Evaluate test environments grid', async () => {
      const question = this.getQuestionCard('Evaluate the following test environments.');
      await question.locator(`[role="radio"][aria-label="${ratings.dev}, response for Development"]`).click();
      await question.locator(`[role="radio"][aria-label="${ratings.staging}, response for Staging"]`).click();
      await question.locator(`[role="radio"][aria-label="${ratings.prod}, response for Production"]`).click();
    });
  }

  public async selectBrowserSupportGrid(grid: { desktop: string[]; mobile: string[]; tablet: string[] }): Promise<void> {
    await test.step('Select browser support grid', async () => {
      const question = this.getQuestionCard('Select applicable browser support per environment.');
      for (const b of grid.desktop) {
        await question.locator(`[role="checkbox"][aria-label="${b}, response for Desktop"]`).click();
      }
      for (const b of grid.mobile) {
        await question.locator(`[role="checkbox"][aria-label="${b}, response for Mobile"]`).click();
      }
      for (const b of grid.tablet) {
        await question.locator(`[role="checkbox"][aria-label="${b}, response for Tablet"]`).click();
      }
    });
  }

  /**
   * Fills all fields on the Google Form according to the given payload.
   */
  public async fillForm(payload: FormPayload): Promise<void> {
    await this.fillFullName(payload.fullName);
    await this.fillProjectDescription(payload.description);
    await this.selectPrimaryLanguage(payload.primaryLanguage);
    await this.selectTestingTools(payload.testingTools);
    await this.selectExperienceLevel(payload.experienceLevel);
    await this.fillTargetDate(payload.targetDate);
    await this.fillExecutionTime(payload.timeHour, payload.timeMinute, payload.timeAmPm ?? 'AM');
    await this.rateEaseOfAutomation(payload.easeRating);
    await this.rateSuiteStability(payload.stabilityRating);
    await this.evaluateEnvironments({
      dev: payload.envDev,
      staging: payload.envStaging,
      prod: payload.envProd,
    });
    await this.selectBrowserSupportGrid({
      desktop: payload.browserDesktop,
      mobile: payload.browserMobile,
      tablet: payload.browserTablet,
    });
  }

  /**
   * Clicks the Submit button.
   */
  public async submit(): Promise<void> {
    await test.step('Click Submit button', async () => {
      await this.page.getByRole('button', { name: 'Submit' }).click();
    });
  }

  /**
   * Asserts the Google Form confirmation screen is visible.
   */
  public async verifyConfirmationScreen(timeout = 15_000): Promise<void> {
    await test.step('Verify confirmation screen', async () => {
      await expect(this.page.getByText(/Your response has been recorded/i)).toBeVisible({ timeout });
    });
  }
}
