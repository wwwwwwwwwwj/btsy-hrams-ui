/** 平铺主菜单 path（与 sys_menu 一致） */
export const HRAMS_WORKBENCH_DASHBOARD = '/dashboard';
export const HRAMS_PERSON_LIST = '/person';
export const HRAMS_ARCHIVE_LIST = '/archive';
export const HRAMS_ARCHIVE_ATTACH = '/archive/attach';
export const HRAMS_MATERIAL_MAINTAIN_PATH = '/archive-material';
export const HRAMS_UTILIZE_REGISTER = '/archive-utilize';
export const HRAMS_QUERY_PERSON = '/person-query';

/** 侧栏隐藏入口（挂在 *-group 目录下） */
export const HRAMS_FIELD_CONFIG = '/person-archive-group/field-config';
export const HRAMS_MATERIAL_BATCH = '/archive-material-group/batch';
export const HRAMS_QUERY_FULLTEXT = '/query-search-group/fulltext';
export const HRAMS_QUERY_QA = '/query-search-group/qa';
export const HRAMS_QUERY_REINDEX = '/query-search-group/reindex';
export const HRAMS_OPS_REMIND_RULES = '/hrams-ops-group/remind-rules';
export const HRAMS_OPS_REMIND_RECORDS = '/hrams-ops-group/remind-records';
export const HRAMS_OPS_BACKUP = '/hrams-ops-group/backup';
export const HRAMS_OPS_ACCESS_LOG = '/hrams-ops-group/access-log';
export const HRAMS_CATALOG = '/system/hrams-catalog';

/** 已合并或隐藏的调阅子菜单（仅书签兼容） */
export const HRAMS_UTILIZE_RECORDS = '/archive-utilize-group/records';
export const HRAMS_UTILIZE_STATS = '/archive-utilize-group/stats';

/** 旧 V2 分组 path → 平铺 path */
export const HRAMS_LEGACY_REDIRECTS = {
  '/workbench/dashboard': HRAMS_WORKBENCH_DASHBOARD,
  '/person-archive/person': HRAMS_PERSON_LIST,
  '/person-archive/archive': HRAMS_ARCHIVE_LIST,
  '/person-archive/archive/attach': HRAMS_ARCHIVE_ATTACH,
  '/person-archive/field-config': HRAMS_FIELD_CONFIG,
  '/archive-material/maintain': HRAMS_MATERIAL_MAINTAIN_PATH,
  '/archive-material/batch': HRAMS_MATERIAL_BATCH,
  '/archive-utilize/register': HRAMS_UTILIZE_REGISTER,
  '/archive-utilize/records': HRAMS_UTILIZE_REGISTER,
  '/archive-utilize/stats': HRAMS_WORKBENCH_DASHBOARD,
  '/archive-utilize-group/records': HRAMS_UTILIZE_REGISTER,
  '/archive-utilize-group/stats': HRAMS_WORKBENCH_DASHBOARD,
  '/query-search/person-query': HRAMS_QUERY_PERSON,
  '/query-search/fulltext': HRAMS_QUERY_FULLTEXT,
  '/query-search/qa': HRAMS_QUERY_QA,
  '/query-search/reindex': HRAMS_QUERY_REINDEX,
  '/hrams-ops/remind-rules': HRAMS_OPS_REMIND_RULES,
  '/hrams-ops/remind-records': HRAMS_OPS_REMIND_RECORDS,
  '/hrams-ops/backup': HRAMS_OPS_BACKUP,
  '/hrams-ops/access-log': HRAMS_OPS_ACCESS_LOG,
  '/hrams/remind': HRAMS_OPS_REMIND_RULES,
  '/system/hrams-remind': HRAMS_OPS_REMIND_RULES,
  '/hrams/person': HRAMS_PERSON_LIST,
  '/hrams/archive': HRAMS_ARCHIVE_LIST,
  '/hrams/archive/material': HRAMS_MATERIAL_MAINTAIN_PATH,
  '/hrams/query': HRAMS_QUERY_PERSON,
  '/hrams/utilize': HRAMS_UTILIZE_REGISTER,
  '/hrams/dashboard': HRAMS_WORKBENCH_DASHBOARD,
  '/hrams/backup': HRAMS_OPS_BACKUP,
  '/system/hrams-backup': HRAMS_OPS_BACKUP,
  '/system/hrams-access-log': HRAMS_OPS_ACCESS_LOG,
  '/material': HRAMS_ARCHIVE_LIST,
  '/query': HRAMS_QUERY_PERSON,
  '/utilize': HRAMS_UTILIZE_REGISTER,
  '/archive-material/category': HRAMS_CATALOG
};
