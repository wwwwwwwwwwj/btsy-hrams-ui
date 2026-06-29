export const REMIND_TYPE_LABELS = {
  contract: '合同到期',
  retire: '退休提醒',
  borrow: '借阅到期'
};

export function remindTypeLabel(type) {
  return REMIND_TYPE_LABELS[type] || type;
}
