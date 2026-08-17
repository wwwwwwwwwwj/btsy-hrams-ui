/** 日期字段只展示到日（兼容接口 yyyy-MM-dd HH:mm:ss） */
export function formatDateDay(val) {
  if (val == null || val === '') return '';
  const s = String(val);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

const pad = (n) => String(n).padStart(2, '0');

/** 按浏览器本地时区格式化日期时间，避免 toISOString 转成 UTC 后少 8 小时 */
export function formatLocalDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 按浏览器本地时区格式化日期 */
export function formatLocalDate(date = new Date()) {
  return formatLocalDateTime(date).slice(0, 10);
}
