/** 从 18 位身份证号解析出生日期、性别（字典值：男/女） */
export function parseIdCardInfo(idCard) {
  const v = String(idCard ?? '').trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(v)) {
    return null;
  }
  const y = Number(v.slice(6, 10));
  const m = Number(v.slice(10, 12));
  const d = Number(v.slice(12, 14));
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  const gender = Number(v.charAt(16)) % 2 === 1 ? '男' : '女';
  return { birthDate: `${y}-${mm}-${dd}`, gender };
}
