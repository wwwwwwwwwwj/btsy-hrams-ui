import { test, expect } from '@playwright/test';
import { P0_SMOKE_ROUTES } from './p0-routes.js';
import { loginViaUi } from './login-helper.js';

test.describe('HRAMS P0 菜单冒烟', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page);
  });

  for (const item of P0_SMOKE_ROUTES) {
    test(`${item.caseId} ${item.title}`, async ({ page }) => {
      await page.goto(item.path);
      await expect(page.locator('.ele-admin-layout, .ele-page, .hrams-v2-page').first()).toBeVisible();
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(10);
    });
  }
});
