import request from '@/utils/request';
import { getToken } from '@/utils/token-util';
import { TOKEN_HEADER_NAME, CLIENT_HEADER_NAME } from '@/config/setting';

const BASE = '/hrams/checking';

/** SSE 流式调用需要用 base URL 前缀（axios 会自动加，fetch 不会） */
const fetchBase = () => (import.meta.env.VITE_API_URL || '') + BASE;

/**
 * 获取 MinIO 预签名 URL（需要 auth，通过 axios 调用）。
 * 返回的 URL 可直接用于 img/iframe，无需额外认证。
 */
export function getPresignedUrl(ossKey) {
  return request.get(`${BASE}/oss/presigned-url`, { params: { ossKey } });
}

/**
 * 通过后端代理下载文件为 Blob，创建 Object URL。
 * 使用 fetch + AbortController，支持取消请求。
 * @param {string} ossKey
 * @param {AbortSignal} [signal] 取消信号
 * @returns {string} blob URL（使用完后需 URL.revokeObjectURL 释放）
 */
export async function downloadPreviewBlob(ossKey, signal) {
  const url = `${fetchBase()}/oss/file?ossKey=${encodeURIComponent(ossKey)}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    signal
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/** fetch 用的认证 headers */
const authHeaders = () => ({
  [TOKEN_HEADER_NAME]: 'Bearer ' + (getToken() || ''),
  [CLIENT_HEADER_NAME]: import.meta.env.VITE_APP_CLIENT_ID || ''
});

/**
 * MinIO 文件列表（GET /hrams/checking/oss/list）。
 */
export function listOssFiles() {
  return request.get(`${BASE}/oss/list`);
}

/**
 * 上传文件到 MinIO（POST /hrams/checking/oss/upload）。
 * @param {File} file
 * @param {string} [archiveNo] 档案号
 * @param {string} [batchNo] 批次号
 */
export function uploadOssFile(file, archiveNo, batchNo) {
  const fd = new FormData();
  fd.append('file', file);
  if (archiveNo) fd.append('archiveNo', archiveNo);
  if (batchNo) fd.append('batchNo', batchNo);
  return request.post(`${BASE}/oss/upload`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/**
 * OCR 识别（POST /hrams/checking/oss/ocr）。
 * @param {string} ossKey
 * @returns {{ success, ossKey, fileName, ocrText, length }}
 */
export function ocrOssFile(ossKey) {
  const fd = new FormData();
  fd.append('ossKey', ossKey);
  return request.post(`${BASE}/oss/ocr`, fd);
}

/**
 * Dify SSE 流式分析（POST /hrams/checking/oss/analyze）。
 * @param {string} ocrText OCR 文本
 * @param {{ signal?: AbortSignal }} [opts]
 */
export function analyzeOcrTextStream(ocrText, opts) {
  return fetch(`${fetchBase()}/oss/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...authHeaders()
    },
    body: 'ocrText=' + encodeURIComponent(ocrText),
    signal: opts?.signal
  });
}

// ═══════════════════════════════════════════════
// 批次管理 API（/hrams/checking/batch/...）
// ═══════════════════════════════════════════════

/** 预创建空批次（上传前调用） */
export function createBatch(data) {
  return request.post(`${BASE}/batch`, data);
}

/** 添加材料到批次（OCR/Dify 完成后调用） */
export function addMaterialsToBatch(batchId, items) {
  return request.post(`${BASE}/batch/${batchId}/items`, { items });
}

/** 某人所有批次 */
export function listPersonBatches(personId) {
  return request.get(`${BASE}/person/${personId}/batches`);
}

/** 批次列表 */
export function listBatches(params) {
  return request.get(`${BASE}/batch/list`, { params });
}

/** 批次下的材料列表 */
export function listMaterials(batchId) {
  return request.get(`${BASE}/batch/${batchId}/materials`);
}

/** 确认材料归类 */
export function confirmMaterial(materialId, form) {
  return request.put(`${BASE}/material/${materialId}/confirm`, form);
}

/** 退回材料 */
export function returnMaterial(materialId, reason) {
  return request.put(`${BASE}/material/${materialId}/return`, { reason });
}

/** 删除材料 */
export function deleteMaterialApi(materialId) {
  return request.delete(`${BASE}/material/${materialId}`);
}

// ═══════════════════════════════════════════════
// 材料分类（十大类）
// ═══════════════════════════════════════════════

/** 获取完整分类树（含子类） */
export function listCategories() {
  return request.get(`/hrams/material/category/tree`);
}

/** 某人已确认材料列表（档案分类预览） */
export function listArchiveByPerson(personId) {
  return request.get(`${BASE}/person/${personId}/archive`);
}

/** 重新归类 */
export function reclassifyMaterial(materialId, form) {
  return request.put(`${BASE}/material/${materialId}/reclassify`, form);
}
