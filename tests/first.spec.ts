import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
    await page.goto('https://playwright.dev');
    await expect(page).toHaveTitle(/Playwright/);

    await expect(page.getByRole('button', { name: 'Sign in' })).toBeDefined()
    await expect(page.getByLabel('Email')).toBeDefined()
    await expect(page.getByPlaceholder('Search...')).toBeDefined()
    await expect(page.getByText('Welcome back')).toBeDefined()
    await expect(page.getByTestId('submit-btn')).toBeDefined()
    await expect(page.locator('css=.card >> text=Pricing')).toBeDefined()

    await page.getByLabel('Email').fill('me@test.com');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('checkbox').check();
    await page.getByLabel('Country').selectOption('US');
    await page.keyboard.press('Enter');
    await page.getByText('Menu').hover();
    await page.setInputFiles('input[type=file]', 'photo.png');

    await expect(page.getByRole('heading')).toHaveText('Dashboard');
    await expect(page.getByTestId('cart')).toHaveCount(3);
    await expect(page.getByRole('button')).toBeEnabled();
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Error')).toBeHidden();
})

