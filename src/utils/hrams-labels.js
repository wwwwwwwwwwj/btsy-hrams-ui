/** v2 档案完整性展示 */
export function integrityLabel(status) {
  if (!status) return '—';
  if (status === 'complete') return '完整';
  if (status === 'missing') return '缺项';
  return status;
}
