/**
 * 与 script/sql/hrams_mysql.sql 平铺菜单 path 一致
 */
export const HRAMS_MENU_ROUTES = [
  { title: '数据看板', path: '/dashboard', component: 'hrams/dashboard/index' },
  { title: '人员管理', path: '/person', component: 'hrams/person/index' },
  { title: '字段配置', path: '/person-archive-group/field-config', component: 'hrams/person/field-config/index' },
  { title: '档案管理', path: '/archive', component: 'hrams/archive/index' },
  { title: '材料管理', path: '/archive-material', component: 'hrams/material/index' },
  { title: '目录管理', path: '/system/hrams-catalog', component: 'hrams/material/category/index' },
  { title: '档案利用', path: '/archive-utilize', component: 'hrams/utilize/index' },
  { title: '综合查询', path: '/person-query', component: 'hrams/query/index' },
  { title: '全文检索', path: '/query-search-group/fulltext', component: 'hrams/query/fulltext/index' },
  { title: '智能问答', path: '/query-search-group/qa', component: 'hrams/query/qa/index' },
  { title: '索引管理', path: '/query-search-group/reindex', component: 'hrams/query/reindex/index' },
  { title: '提醒规则', path: '/hrams-ops-group/remind-rules', component: 'hrams/remind/rules/index' },
  { title: '提醒记录', path: '/hrams-ops-group/remind-records', component: 'hrams/remind/records/index' },
  { title: '数据备份', path: '/hrams-ops-group/backup', component: 'hrams/backup/index' },
  { title: '操作日志', path: '/hrams-ops-group/access-log', component: 'hrams/access-log/index' },
  { title: '材料挂接', path: '/archive/attach?mode=batch', component: 'hrams/archive/attach/index' }
];
