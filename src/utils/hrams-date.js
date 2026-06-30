/** 日期字段只展示到日（兼容接口 yyyy-MM-dd HH:mm:ss） */
export function formatDateDay(val) {
  if (val == null || val === '') return '';
  const s = String(val);
  return s.length >= 10 ? s.slice(0, 10) : s;
}
