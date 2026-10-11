import { expect, test } from '@playwright/test';

const quizResponse = {
    candidates: [{
        content: {
            parts: [{
                text: JSON.stringify([{
                    topic: 'Regression',
                    question: 'What does a positive slope indicate?',
                    options: {
                        A: 'Y tends to rise as X rises',
                        B: 'X has no variation',
                        C: 'The intercept is zero',
                        D: 'All points lie on the line'
                    },
                    correctAnswer: 'A',
                    explanation: 'A positive slope means predicted Y increases with X.'
                }])
            }]
        }
    }]
};

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('gemini_api_key', 'fake-test-key'));
    await page.route('https://generativelanguage.googleapis.com/**', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(quizResponse) });
    });
});

test('generates a quiz and reveals its answer explanation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Quiz Generator' }).first().click();
    await page.getByRole('textbox').fill('Linear regression estimates numeric outcomes from explanatory variables.');
    await page.getByLabel('Quiz difficulty').selectOption('hard');
    await page.getByLabel('Number of questions').selectOption('3');
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.getByText('What does a positive slope indicate?')).toBeVisible();
    await page.getByRole('button', { name: 'Show answers' }).click();
    await expect(page.getByText(/A positive slope means predicted Y increases with X/)).toBeVisible();
});

test('shows rate-limit recovery and Retry on HTTP 429', async ({ page }) => {
    await page.route('https://generativelanguage.googleapis.com/**', route =>
        route.fulfill({ status: 429, contentType: 'application/json', body: '{}' }));
    await page.goto('/');
    await page.getByRole('textbox').fill('Linear regression estimates numeric outcomes from explanatory variables.');
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('too many requests');
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
