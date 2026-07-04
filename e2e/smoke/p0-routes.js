import { HRAMS_MENU_ROUTES } from './hrams-menu-routes.js';

const P0_PATHS = {
  'TC-DASH-001': '/dashboard',
  'TC-PERSON-001': '/person',
  'TC-ARCH-001': '/archive',
  'TC-MAT-001': '/archive-material-maintain',
  'TC-UTIL-001': '/archive-utilize',
  'TC-QUERY-001': '/person-query',
  'TC-BATCH-001': '/archive-material',
  'TC-FT-001': '/query-search-group/fulltext',
  'TC-ATT-003': '/archive/attach?mode=batch' // 挂接：ZIP + POST /hrams/material-batches/scan/zip 轮询 GET /{batchId}
};

/** P0 冒烟与 docs/v2/HRAMS-V2-测试用例.csv 用例编号对应 */
export const P0_SMOKE_ROUTES = Object.entries(P0_PATHS).map(([caseId, path]) => {
  const row = HRAMS_MENU_ROUTES.find((r) => r.path === path);
  return { caseId, title: row?.title || caseId, path };
});
