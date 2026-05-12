import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// E2E: Migrasjon v3.5 → v12 med migreringsbanner
test.describe('migrasjon v3.5', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('button', { hasText: 'Hopp over' });
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
  });

  test('åpne-knapp er tilgjengelig', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Åpne .gmx' })).toBeVisible();
  });

  test('laste inn en v3.5-prosjektfil viser migrasjonsbanner', async ({ page }) => {
    // Create a minimal v3.5 project file
    const project = {
      metadata: {
        version: '3.5',
        created: '2024-01-01T00:00:00.000Z',
        modified: '2024-01-01T00:00:00.000Z',
        student: 'Test Elev',
        school: 'Testskole',
        course: 'TEST01',
        projectName: 'Migrasjonstest',
      },
      system: { sBaseMVA: 100, fHz: 50, uBaseKV: {} },
      buses: [],
      lines: [],
      transformers: [],
      generators: [],
      compensators: [],
      protections: [],
      results: {},
      canvas: { zoom: 1, panX: 0, panY: 0 },
    };

    const tmpFile = path.join(os.tmpdir(), 'test-v35.gmx');
    fs.writeFileSync(tmpFile, JSON.stringify(project));

    const fileInput = page.locator('input[type="file"][accept=".gmx,.json"]').first();
    await fileInput.setInputFiles(tmpFile);

    // Banner should appear
    const banner = page.locator('text=migrert');
    await expect(banner).toBeVisible({ timeout: 3000 });

    fs.unlinkSync(tmpFile);
  });
});
