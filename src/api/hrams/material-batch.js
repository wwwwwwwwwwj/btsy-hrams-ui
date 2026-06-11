import request from '@/utils/request';

export async function pageUploadBatch(params) {
  const res = await request.get('/hrams/material/batch/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function listBatchMaterials(batchId) {
  const res = await request.get(`/hrams/material/batch/${batchId}/materials`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
