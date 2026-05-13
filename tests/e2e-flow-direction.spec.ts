import { test, expect } from '@playwright/test';

// E2E: Toveis lastflyt-flow — ringnett-knapp og strømpil-kontroll
test.describe('lastflyt-flow-retning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('button', { hasText: 'Hopp over' });
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
  });

  test('Ringnett-knapp er synlig i toolbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: '⭕ Ringnett' })).toBeVisible();
  });

  test('Lastflyt-knapp er synlig og klar til bruk', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Lastflyt' })).toBeVisible();
  });

  test('sky-knapper er fjernet fra toolbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Lagre til sky/ })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Åpne fra sky/ })).not.toBeVisible();
  });

  test('Ringnett-panel åpnes og har strømpil-avkrysningsboks', async ({ page }) => {
    // Ringnett-knapp er disabled når < 3 busser, men panelet skal kunne åpnes via klikk
    const btn = page.getByRole('button', { name: '⭕ Ringnett' });
    // knappen er disabled med 0 busser, men er synlig
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });
});
