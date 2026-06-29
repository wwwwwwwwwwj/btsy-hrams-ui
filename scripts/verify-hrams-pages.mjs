#!/usr/bin/env node
/**
 * 校验 HRAMS 菜单组件文件存在，并执行生产构建（捕获 import 路径等低级错误）
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const routesPath = join(root, 'e2e/smoke/hrams-menu-routes.js');
const { HRAMS_MENU_ROUTES } = await import(routesPath);

const missing = [];
const seen = new Set();
for (const item of HRAMS_MENU_ROUTES) {
  if (seen.has(item.component)) {
    continue;
  }
  seen.add(item.component);
  const rel = join('src/views', `${item.component}.vue`);
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    missing.push({ component: item.component, expected: rel });
  }
}

if (missing.length) {
  console.error('缺少菜单页面文件:');
  for (const m of missing) {
    console.error(`  - ${m.component} -> ${m.expected}`);
  }
  process.exit(1);
}

console.log(`HRAMS 菜单组件 ${seen.size} 个文件齐全，开始 vite build...`);
execSync('npm run build', { cwd: root, stdio: 'inherit', env: process.env });
console.log('verify:hrams 通过');
