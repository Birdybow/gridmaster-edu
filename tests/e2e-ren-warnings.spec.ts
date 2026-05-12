import { test, expect } from '@playwright/test';

// E2E: REN-advarselspanel åpnes og viser innhold
test.describe('REN-advarslerpanel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('button', { hasText: 'Hopp over' });
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
  });

  test('REN-knapp er synlig i toolbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: '⚠ REN' })).toBeVisible();
  });

  test('klikk på REN åpner advarselspanelet', async ({ page }) => {
    await page.getByRole('button', { name: '⚠ REN' }).click();
    await expect(page.locator('[data-tour="warning-panel"]')).toBeVisible();
  });

  test('nytt tomt nett → ingen REN-avvik', async ({ page }) => {
    await page.getByRole('button', { name: '⚠ REN' }).click();
    await expect(page.getByText('Ingen REN-avvik funnet')).toBeVisible();
  });

  test('hjelpeside åpnes via Hjelp-knapp', async ({ page }) => {
    await page.getByRole('button', { name: '? Hjelp' }).click();
    await expect(page.getByText('Hjelp — GridMaster Edu')).toBeVisible();
  });
});
