const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
const PROVINCE_CODES = new Set([
  '11', '12', '13', '14', '15', '21', '22', '23',
  '31', '32', '33', '34', '35', '36', '37',
  '41', '42', '43', '44', '45', '46',
  '50', '51', '52', '53', '54',
  '61', '62', '63', '64', '65', '71', '81', '82'
]);

/** 严格校验并解析 18 位身份证号 */
export function parseIdCardInfo(idCard) {
  const v = String(idCard ?? '').trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(v)) {
    return null;
  }
  if (!PROVINCE_CODES.has(v.slice(0, 2))) {
    return null;
  }
  const y = Number(v.slice(6, 10));
  const m = Number(v.slice(10, 12));
  const d = Number(v.slice(12, 14));
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  const checksum = v
    .slice(0, 17)
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * WEIGHTS[index], 0);
  if (CHECK_CODES[checksum % 11] !== v.charAt(17)) {
    return null;
  }
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  const gender = Number(v.charAt(16)) % 2 === 1 ? '男' : '女';
  return { idCard: v, birthDate: `${y}-${mm}-${dd}`, gender };
}
