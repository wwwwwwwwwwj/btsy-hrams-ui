import request from '@/utils/request';

function unwrap(res) {
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/** UI 模式 -> 后端 batchType */
export function attachModeToBatchType(mode) {
  return mode === 'incremental' ? 'incremental_attach' : 'batch_attach';
}

export async function createManualBatch(personId) {
  const res = await request.post('/hrams/material-batches/manual', null, {
    params: { personId: String(personId) }
  });
  return unwrap(res);
}

export async function pageMaterialBatch(params) {
  const res = await request.get('/hrams/material-batches', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function getMaterialBatch(batchId) {
  const res = await request.get(`/hrams/material-batches/${batchId}`);
  return unwrap(res);
}

export async function listMaterialBatchItems(batchId) {
  const res = await request.get(`/hrams/material-batches/${batchId}/items`);
  return unwrap(res);
}

export async function scanZipMaterialBatch(batchType, personIds, zip) {
  const fd = new FormData();
  fd.append('batchType', batchType);
  personIds.forEach((id) => fd.append('personIds', String(id)));
  fd.append('zip', zip);
  const res = await request.post('/hrams/material-batches/scan/zip', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000
  });
  return unwrap(res);
}

export async function scanFolderMaterialBatch(batchType, personIds, files, relativePaths) {
  const fd = new FormData();
  fd.append('batchType', batchType);
  personIds.forEach((id) => fd.append('personIds', String(id)));
  (files || []).forEach((f) => fd.append('files', f));
  (relativePaths || []).forEach((p) => fd.append('relativePaths', p));
  const res = await request.post('/hrams/material-batches/scan/folder', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000
  });
  return unwrap(res);
}

export async function excludeMaterialBatchPaths(batchId, relativePaths) {
  const res = await request.post(`/hrams/material-batches/${batchId}/exclude`, relativePaths);
  return unwrap(res);
}

export async function rescanMaterialBatch(batchId) {
  const res = await request.post(`/hrams/material-batches/${batchId}/rescan`);
  return unwrap(res);
}

export async function confirmMaterialBatch(batchId, confirmedPersonIds, files, relativePaths) {
  const params = new URLSearchParams();
  (confirmedPersonIds || []).forEach((id) => params.append('confirmedPersonIds', String(id)));
  const hasFiles = Array.isArray(files) && files.length > 0;
  let body = null;
  const headers = {};
  if (hasFiles) {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    (relativePaths || []).forEach((p) => fd.append('relativePaths', p));
    body = fd;
    headers['Content-Type'] = 'multipart/form-data';
  }
  const res = await request.post(
    `/hrams/material-batches/${batchId}/confirm?${params.toString()}`,
    body,
    { headers, timeout: 600000 }
  );
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function cancelMaterialBatch(batchId) {
  const res = await request.delete(`/hrams/material-batches/${batchId}`);
  return unwrap(res);
}

/** @deprecated 别名：手工上传批次 */
export const createUploadBatch = createManualBatch;

export async function pageUploadBatch(params) {
  return pageMaterialBatch({ batchType: 'manual', ...params });
}

export const listBatchMaterials = listMaterialBatchItems;
