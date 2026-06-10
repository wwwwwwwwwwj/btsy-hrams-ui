import request from '@/utils/request';
import { checkDownloadRes, download, toFormData } from '@/utils/common';

export async function pageBorrow(params) {
  const res = await request.get('/hrams/borrow/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function lookupBorrowPerson(archiveNo) {
  const res = await request.get('/hrams/borrow/lookup', { params: { archiveNo } });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function registerBorrow(data) {
  const res = await request.post('/hrams/borrow', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function registerBorrowForm(formData) {
  const res = await request.post('/hrams/borrow/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function returnBorrow(id, returnTime) {
  const res = await request.put(`/hrams/borrow/${id}/return`, null, { params: { returnTime } });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function previewBorrowAttachment(borrowId) {
  const res = await request.get(`/hrams/borrow/${borrowId}/attachment/preview`, { responseType: 'blob' });
  const type = res.headers['content-type'] || 'application/octet-stream';
  const url = URL.createObjectURL(new Blob([res.data], { type }));
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function exportBorrowStatistics(granularity = 'month') {
  const res = await request.get('/hrams/borrow/statistics/export', {
    params: { granularity },
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, 'borrow-statistics.xlsx');
}

export async function borrowStatistics(granularity = 'month') {
  const res = await request.get('/hrams/borrow/statistics', { params: { granularity } });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
