import { test, expect } from '@playwright/test';

// E2E: Bygg nett → kjør lastflyt → generer PDF
test.describe('bygg-nett-flyt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Dismiss onboarding if present
    const skipBtn = page.locator('button', { hasText: 'Hopp over' });
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
  });

  test('app laster og viser toolbar', async ({ page }) => {
    await expect(page.locator('[data-tour="toolbar-row1"]')).toBeVisible();
    await expect(page.getByText('GridMaster Edu')).toBeVisible();
  });

  test('nytt prosjekt-knapp er synlig', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Nytt' })).toBeVisible();
  });

  test('canvas er synlig', async ({ page }) => {
    await expect(page.locator('[data-tour="network-canvas"]')).toBeVisible();
  });

  test('komponentpanel er synlig', async ({ page }) => {
    await expect(page.locator('[data-tour="component-panel"]')).toBeVisible();
  });

  test('PDF-rapport knapp er synlig i toolbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: '📄 Rapport' })).toBeVisible();
  });
});
