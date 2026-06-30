/**
 * 与 script/sql/hrams_mysql.sql 菜单 path 一致（V2）
 * 调阅登记/记录/统计共用 hrams/utilize/index，通过 query.tab 区分
 */
export const HRAMS_MENU_ROUTES = [
  { title: '统计看板', path: '/workbench/dashboard', component: 'hrams/dashboard/index' },
  { title: '人员管理', path: '/person-archive/person', component: 'hrams/person/index' },
  { title: '字段配置', path: '/person-archive/field-config', component: 'hrams/person/field-config/index' },
  { title: '档案管理', path: '/person-archive/archive', component: 'hrams/archive/index' },
  { title: '材料维护', path: '/archive-material/maintain', component: 'hrams/archive/material/index' },
  { title: '上传批次', path: '/archive-material/batch', component: 'hrams/material/batch/index' },
  { title: '目录管理', path: '/system/hrams-catalog', component: 'hrams/material/category/index' },
  { title: '调阅登记', path: '/archive-utilize/register?tab=register', component: 'hrams/utilize/index' },
  { title: '调阅记录', path: '/archive-utilize/records?tab=records', component: 'hrams/utilize/index' },
  { title: '调阅统计', path: '/archive-utilize/stats?tab=stats', component: 'hrams/utilize/index' },
  { title: '综合查询', path: '/query-search/person-query', component: 'hrams/query/index' },
  { title: '全文检索', path: '/query-search/fulltext', component: 'hrams/query/fulltext/index' },
  { title: '智能问答', path: '/query-search/qa', component: 'hrams/query/qa/index' },
  { title: '索引管理', path: '/query-search/reindex', component: 'hrams/query/reindex/index' },
  { title: '提醒规则', path: '/hrams-ops/remind-rules', component: 'hrams/remind/rules/index' },
  { title: '提醒记录', path: '/hrams-ops/remind-records', component: 'hrams/remind/records/index' },
  { title: '数据备份', path: '/hrams-ops/backup', component: 'hrams/backup/index' },
  { title: '操作日志', path: '/hrams-ops/access-log', component: 'hrams/access-log/index' },
  { title: '材料挂接', path: '/person-archive/archive/attach?mode=batch', component: 'hrams/archive/attach/index' }
];
