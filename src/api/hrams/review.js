import request from '@/utils/request';
import { checkDownloadRes, download } from '@/utils/common';

export async function pageReview(params) {
  const res = await request.get('/hrams/special-review/list', { params });
  if (res.data.code === 200) return res.data;
  return Promise.reject(new Error(res.data.msg));
}

export async function reviewStats() {
  const res = await request.get('/hrams/special-review/stats');
  if (res.data.code === 200) return res.data.data || {};
  return Promise.reject(new Error(res.data.msg));
}

export async function previewReviewMaterial(reviewId, materialId) {
  const res = await request.get(
    `/hrams/special-review/${reviewId}/materials/${materialId}/preview`,
    {
      responseType: 'blob'
    }
  );
  await checkDownloadRes(res);
  return res;
}

export async function getReview(id) {
  const res = await request.get(`/hrams/special-review/${id}`);
  if (res.data.code === 200) return res.data.data;
  return Promise.reject(new Error(res.data.msg));
}

export async function createReview(data) {
  const res = await request.post('/hrams/special-review', data);
  if (res.data.code === 200) return res.data.data;
  return Promise.reject(new Error(res.data.msg));
}

export async function saveReview(data) {
  const res = await request.put('/hrams/special-review', data);
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function syncReviewSnapshot(id) {
  const res = await request.post(`/hrams/special-review/${id}/sync-snapshot`);
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function submitReview(id, opinion) {
  const res = await request.post(`/hrams/special-review/${id}/submit`, null, {
    params: { opinion }
  });
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function submitReviewRectify(id) {
  const res = await request.post(`/hrams/special-review/${id}/submit-rectify`);
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function verifyReviewRectify(id, passed, message) {
  const res = await request.post(
    `/hrams/special-review/${id}/verify-rectify`,
    null,
    {
      params: { passed, message }
    }
  );
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function certifyReview(id, data) {
  const res = await request.post(
    `/hrams/special-review/${id}/certify`,
    data || {}
  );
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function archiveReview(id, file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await request.post(`/hrams/special-review/${id}/archive`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function suspendReview(id, reason) {
  const res = await request.post(`/hrams/special-review/${id}/suspend`, null, {
    params: { reason }
  });
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function submitIssueRectify(id, issueId, rectifyDesc, ossId) {
  const res = await request.post(
    `/hrams/special-review/${id}/issues/${issueId}/rectify`,
    null,
    {
      params: { rectifyDesc, ossId }
    }
  );
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function rectifyReview(id) {
  const res = await request.post(`/hrams/special-review/${id}/rectify`);
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function resumeReviewDraft(id) {
  const res = await request.post(`/hrams/special-review/${id}/resume-draft`);
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function rebindReviewEvidence(id, evidenceId, materialId) {
  const res = await request.post(
    `/hrams/special-review/${id}/evidences/${evidenceId}/rebind`,
    null,
    {
      params: { materialId }
    }
  );
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function closeReviewIssue(id, issueId, handleOpinion) {
  const res = await request.post(
    `/hrams/special-review/${id}/issues/${issueId}/close`,
    null,
    {
      params: { handleOpinion }
    }
  );
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function approveReview(id, passed, message) {
  const res = await request.put(`/hrams/special-review/${id}/approve`, null, {
    params: { passed, message }
  });
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function cancelReview(id) {
  const res = await request.put(`/hrams/special-review/${id}/cancel`);
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

function filenameFromRes(res, fallback) {
  const raw = res.headers?.['download-filename'];
  if (!raw) return fallback;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function exportReview(id, kind = 'draft') {
  const res = await request.get(`/hrams/special-review/${id}/export`, {
    params: { kind },
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, filenameFromRes(res, `审核情况登记表-${id}.docx`));
}

export async function exportAppointmentBlank(id) {
  const res = await request.get(
    `/hrams/special-review/${id}/appointment-blank`,
    { responseType: 'blob' }
  );
  await checkDownloadRes(res);
  download(
    res.data,
    filenameFromRes(res, `专项审核任免审批表空白件-${id}.docx`)
  );
}

export async function uploadReviewSigned(id, file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await request.post(`/hrams/special-review/${id}/signed`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function writebackPreview(id) {
  const res = await request.get(
    `/hrams/special-review/${id}/writeback-preview`
  );
  if (res.data.code === 200) return res.data.data || [];
  return Promise.reject(new Error(res.data.msg));
}

export async function writebackReview(id, fields) {
  const res = await request.post(
    `/hrams/special-review/${id}/writeback`,
    fields
  );
  if (res.data.code === 200) return res.data.msg;
  return Promise.reject(new Error(res.data.msg));
}

export async function searchReviewPersons(params = {}) {
  const res = await request.get('/hrams/special-review/lookup', { params });
  if (res.data.code === 200) {
    const data = res.data.data;
    return Array.isArray(data) ? data : data ? [data] : [];
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function pageReviewBatch(params) {
  const res = await request.get('/hrams/special-review/batch/list', { params });
  if (res.data.code === 200) return res.data;
  return Promise.reject(new Error(res.data.msg));
}

export async function createReviewBatch(data) {
  const res = await request.post('/hrams/special-review/batch', data);
  if (res.data.code === 200) return res.data.data;
  return Promise.reject(new Error(res.data.msg));
}

export async function getReviewBatch(id) {
  const res = await request.get(`/hrams/special-review/batch/${id}`);
  if (res.data.code === 200) return res.data.data;
  return Promise.reject(new Error(res.data.msg));
}

export async function generateReviewBatch(id) {
  const res = await request.post(`/hrams/special-review/batch/${id}/generate`);
  if (res.data.code === 200) return res.data.data;
  return Promise.reject(new Error(res.data.msg));
}
