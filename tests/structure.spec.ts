import { test, expect } from '@playwright/test';

test.describe('login', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('succeeds with valid creds', async ({ page }) => {
        await page.getByLabel('Email').fill('user@test.com');
        await page.getByLabel('Password').fill('secret');
        await page.getByRole('button', { name: 'Log in' }).click();
        await expect(page).toHaveURL('/dashboard');
    });

    test('shows error with bad password', async ({ page }) => {
        await page.getByLabel('Password').fill('wrong');
        await page.getByRole('button', { name: 'Log in' }).click();
        await expect(page.getByRole('alert')).toContainText('Invalid');
    });
});