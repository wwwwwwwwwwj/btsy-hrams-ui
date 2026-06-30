/** 从字典缓存项解析显示名（兼容 dictValue/dictLabel 与 value/label） */
export function dictLabel(dictList, code) {
  if (code == null || code === '') {
    return '—';
  }
  const d = (dictList || []).find((x) => (x.dictValue ?? x.value) === code);
  return d?.dictLabel ?? d?.label ?? code;
}
