import request from '@/utils/request';

export async function uploadAttachZip({ mode, personIds, zip }) {
  const fd = new FormData();
  fd.append('mode', mode);
  personIds.forEach((id) => fd.append('personIds', id));
  fd.append('zip', zip);
  const res = await request.post('/hrams/archive/attach/scan/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function getAttachScanStatus(batchId) {
  const res = await request.get(`/hrams/archive/attach/scan/${batchId}/status`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function getAttachScanPreview(batchId) {
  const res = await request.get(`/hrams/archive/attach/scan/${batchId}/preview`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function excludeAttachPaths(batchId, relativePaths) {
  const res = await request.post(`/hrams/archive/attach/scan/${batchId}/exclude`, relativePaths);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function rescanAttachBatch(batchId) {
  const res = await request.post(`/hrams/archive/attach/scan/${batchId}/rescan`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function confirmAttachBatch({ batchId, confirmedPersonIds }) {
  const params = new URLSearchParams();
  params.append('batchId', String(batchId));
  (confirmedPersonIds || []).forEach((id) => params.append('confirmedPersonIds', String(id)));
  const res = await request.post(`/hrams/archive/attach/confirm?${params.toString()}`, null, {
    timeout: 600000
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
