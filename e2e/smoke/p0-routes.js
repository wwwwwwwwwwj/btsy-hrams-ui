import { HRAMS_MENU_ROUTES } from './hrams-menu-routes.js';

const P0_PATHS = {
  'TC-DASH-001': '/workbench/dashboard',
  'TC-PERSON-001': '/person-archive/person',
  'TC-ARCH-001': '/person-archive/archive',
  'TC-MAT-001': '/archive-material/maintain',
  'TC-UTIL-001': '/archive-utilize/register?tab=register',
  'TC-QUERY-001': '/query-search/person-query',
  'TC-BATCH-001': '/archive-material/batch',
  'TC-FT-001': '/query-search/fulltext',
  'TC-ATT-003': '/person-archive/archive/attach?mode=batch'
};

/** P0 冒烟与 docs/v2/HRAMS-V2-测试用例.csv 用例编号对应 */
export const P0_SMOKE_ROUTES = Object.entries(P0_PATHS).map(([caseId, path]) => {
  const row = HRAMS_MENU_ROUTES.find((r) => r.path === path);
  return { caseId, title: row?.title || caseId, path };
});
