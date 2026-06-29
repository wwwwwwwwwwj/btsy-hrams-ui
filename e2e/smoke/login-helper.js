import { execSync } from 'node:child_process';

const REDIS_PASSWORD = process.env.HRAMS_E2E_REDIS_PASSWORD || 'Btsy@123';
const REDIS_PORT = process.env.HRAMS_E2E_REDIS_PORT || '6379';

function fetchCaptchaFromRedis(uuid) {
  const key = `global:captcha_codes:${uuid}`;
  const raw = execSync(
    `redis-cli -p ${REDIS_PORT} -a '${REDIS_PASSWORD}' --no-auth-warning GET '${key}'`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  return String(raw).replace(/"/g, '').trim();
}

/**
 * UI 登录：点击验证码刷新，使 Vue form.uuid 与 Redis 答案一致；密码用页面默认 admin123。
 */
export async function loginViaUi(page) {
  const user = process.env.HRAMS_E2E_USER || 'admin';

  const tenantResPromise = page
    .waitForResponse(
      (res) => res.url().includes('/auth/tenant/list') && res.status() === 200,
      { timeout: 20_000 }
    )
    .catch(() => null);

  await page.goto('/login');
  await tenantResPromise;

  await page.getByPlaceholder('请输入登录账号').fill(user);
  if (process.env.HRAMS_E2E_PASSWORD) {
    await page.getByPlaceholder('请输入登录密码').fill(process.env.HRAMS_E2E_PASSWORD);
  }

  const codeRefresh = page.waitForResponse(
    (res) => res.url().includes('/auth/code') && res.status() === 200
  );
  await page.locator('.login-captcha').click();
  const codeRes = await codeRefresh;
  const body = await codeRes.json();

  if (body.data?.captchaEnabled !== false && body.data?.uuid) {
    const captchaCode = fetchCaptchaFromRedis(body.data.uuid);
    await page.getByPlaceholder('请输入验证码').fill(captchaCode);
  }

  await page.getByRole('button', { name: '登录' }).click();

  const loginRes = await page.waitForResponse(
    (res) => res.url().includes('/auth/login') && res.status() === 200,
    { timeout: 20_000 }
  );
  const loginBody = await loginRes.json();
  if (loginBody.code !== 200) {
    throw new Error(`登录失败: ${loginBody.msg || JSON.stringify(loginBody)}`);
  }

  await page.waitForFunction(
    () => localStorage.getItem('token') || sessionStorage.getItem('token'),
    { timeout: 15_000 }
  );
}
