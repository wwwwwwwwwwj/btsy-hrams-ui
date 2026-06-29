import { test, expect } from '@playwright/test';
import { HRAMS_MENU_ROUTES } from './hrams-menu-routes.js';
import { loginViaUi } from './login-helper.js';

test.describe.configure({ mode: 'serial' });

test.describe('HRAMS 全菜单页面可达', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginViaUi(page);
    await page.context().storageState({ path: 'e2e/.auth/hrams-user.json' });
    await page.close();
  });

  test.use({ storageState: 'e2e/.auth/hrams-user.json' });

  for (const item of HRAMS_MENU_ROUTES) {
    test(item.title, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(item.path);
      await expect(page.locator('.ele-admin-layout, .ele-page').first()).toBeVisible({ timeout: 15_000 });

      const fatal = errors.filter(
        (t) =>
          !/favicon|Failed to load resource|404.*\.(png|ico)/i.test(t) &&
          !/ResizeObserver/i.test(t)
      );
      expect(fatal, `页面脚本错误: ${fatal.join('; ')}`).toEqual([]);
    });
  }
});
