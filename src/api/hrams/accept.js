import request from '@/utils/request';
import { checkDownloadRes, download } from '@/utils/common';

export async function pageAcceptance(params) {
  const res = await request.get('/hrams/acceptance/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function pendingAcceptance() {
  const res = await request.get('/hrams/acceptance/pending');
  if (res.data.code === 200) {
    return res.data.data || [];
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function getAcceptance(id) {
  const res = await request.get(`/hrams/acceptance/${id}`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function createAcceptance(personIds, sourceType = 'increment') {
  const res = await request.post('/hrams/acceptance', { personIds, sourceType });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function saveAcceptanceItems(id, items) {
  const res = await request.put(`/hrams/acceptance/${id}/items`, items);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function submitAcceptance(id) {
  const res = await request.put(`/hrams/acceptance/${id}/submit`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function voidAcceptance(id, reason) {
  const res = await request.put(`/hrams/acceptance/${id}/void`, null, { params: { reason } });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function exportAcceptance(id) {
  const res = await request.get(`/hrams/acceptance/${id}/export`, { responseType: 'blob' });
  await checkDownloadRes(res);
  download(res.data, `验收登记表C.1-${id}.xlsx`);
}
