/** 材料智能录入状态（与后端 HramsMaterialIntakeStatus 一致） */
export const INTAKE_TERMINAL_STATUSES = new Set([
  'pending_confirm',
  'recognize_failed',
  'archived',
  'rejected'
]);

export const INTAKE_PROCESSING_STATUSES = new Set(['uploading', 'ocr_processing', 'ai_processing']);

export function intakeStatusLabel(status) {
  const map = {
    uploading: '上传中',
    ocr_processing: 'OCR 识别中',
    ai_processing: 'AI 分析中',
    pending_confirm: '待确认',
    recognize_failed: '识别失败',
    archived: '已归档',
    rejected: '已驳回'
  };
  return map[status] || status || '—';
}

export function intakeStatusTagType(status) {
  if (status === 'pending_confirm') return 'warning';
  if (status === 'archived') return 'success';
  if (status === 'recognize_failed' || status === 'rejected') return 'danger';
  if (INTAKE_PROCESSING_STATUSES.has(status)) return 'info';
  return 'info';
}

function parseJsonMaybe(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatDateDay(value) {
  if (!value) return '';
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/** 将后端 HramsMaterialIntakeVo 转为上传弹窗/待办表行 */
export function intakeVoToRow(row, queueItem, { uploadPersonOptions = [], flatCategories = [] } = {}) {
  if (!row) return null;
  const ai = parseJsonMaybe(row.aiRawResult) || {};
  const personIdValue = row.recommendPersonId || row.selectedPersonId || ai.personId || '';
  const categoryCodeValue = row.recommendCategoryCode || row.selectedCategoryCode || ai.categoryCode || '';
  const personOption = uploadPersonOptions.find((p) => String(p.id) === String(personIdValue));
  const cat = flatCategories.find((c) => String(c.code) === String(categoryCodeValue));
  const candidates = parseJsonMaybe(row.personCandidates);
  let personCandidateHint = '';
  if (Array.isArray(candidates) && candidates.length) {
    personCandidateHint = candidates
      .map((c) => `${c.archiveNo || ''} ${c.name || c.personName || ''}`.trim())
      .filter(Boolean)
      .join('、');
  }
  return {
    id: row.id,
    fileName: row.originalFileName || queueItem?.file?.name || '',
    status: row.status,
    statusText: intakeStatusLabel(row.status),
    recognizeMessage: row.recognizeMessage || row.ocrMessage || row.aiMessage || '',
    personCandidateHint,
    personId: personOption?.id || personIdValue,
    archiveNo: row.recommendArchiveNo || personOption?.archiveNo || ai.archiveNo || '',
    personName: row.recommendPersonName || personOption?.name || ai.personName || '',
    categoryCode: categoryCodeValue,
    categoryName: row.recommendCategoryName || cat?.name || ai.categoryName || '',
    materialName: row.recommendMaterialName || ai.materialName || '',
    formDate: formatDateDay(row.recommendFormDate || ai.formDate),
    pageNo: row.recommendPageNo ?? ai.pageNo ?? 1,
    pageCount: row.recommendPageCount ?? ai.pageCount ?? 1,
    confidence: row.recommendConfidence ?? ai.confidence ?? '',
    rawJson: row.aiRawResult || ''
  };
}

export function normalizeIntakeList(data, queue = [], ctx = {}) {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data?.records)
        ? data.records
        : data
          ? [data]
          : [];
  return source.map((row, index) => intakeVoToRow(row, queue[index], ctx)).filter(Boolean);
}

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 120;

export async function pollMaterialIntake(intakeId, getFn) {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const vo = await getFn(intakeId);
    if (INTAKE_TERMINAL_STATUSES.has(vo.status)) {
      return vo;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error('识别超时，请稍后在「待归属审核」查看');
}
