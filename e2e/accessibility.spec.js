import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('main page accessibility @axe', () => {
    test('API key dialog can be dismissed with Escape and returns focus', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('dialog', { name: 'Setup API Key' })).toBeVisible();
        await expect(page.getByLabel('Gemini API Key')).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(page.getByRole('button', { name: 'Close API key setup' })).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(page.getByRole('button', { name: 'Save Key' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: 'Setup API Key' })).toBeHidden();
        await expect(page.locator('#mainContent')).toBeFocused();
    });

    test('has zero WCAG 2.1 A/AA violations in both themes and settings dialog', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('gemini_api_key', 'fake-test-key'));
        await page.goto('/');

        for (const theme of ['light', 'dark']) {
            if (theme === 'dark') {
                await page.getByRole('button', { name: 'Settings' }).click();
                await page.getByRole('checkbox', { name: 'Dark mode' }).check();
                await page.getByRole('button', { name: 'Close settings' }).click();
            }
            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();
            expect(results.violations, `${theme} theme WCAG violations`).toEqual([]);
        }

        await page.getByRole('button', { name: 'Settings' }).click();
        await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Dark mode' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();
        await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
        await page.getByRole('button', { name: 'Settings' }).click();
        const dialogResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
        expect(dialogResults.violations, 'settings dialog WCAG violations').toEqual([]);
    });
});
