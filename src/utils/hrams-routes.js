/** V2 菜单 path（与 sys_menu 一致） */
export const HRAMS_WORKBENCH_DASHBOARD = '/workbench/dashboard';
export const HRAMS_PERSON_LIST = '/person-archive/person';
export const HRAMS_ARCHIVE_LIST = '/person-archive/archive';
export const HRAMS_ARCHIVE_ATTACH = '/person-archive/archive/attach';
export const HRAMS_MATERIAL_MAINTAIN_PATH = '/archive-material/maintain';
export const HRAMS_UTILIZE_REGISTER = '/archive-utilize/register';
export const HRAMS_UTILIZE_RECORDS = '/archive-utilize/records';
export const HRAMS_UTILIZE_STATS = '/archive-utilize/stats';
export const HRAMS_QUERY_PERSON = '/query-search/person-query';
export const HRAMS_OPS_REMIND_RULES = '/hrams-ops/remind-rules';
export const HRAMS_OPS_REMIND_RECORDS = '/hrams-ops/remind-records';

/** 旧书签兼容（仅 redirect 目标） */
export const HRAMS_LEGACY_REDIRECTS = {
  '/hrams/remind': HRAMS_OPS_REMIND_RULES,
  '/system/hrams-remind': HRAMS_OPS_REMIND_RULES
};
