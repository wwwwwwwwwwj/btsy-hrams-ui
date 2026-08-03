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
  const list = await searchBorrowPersons({ archiveNo });
  return list?.[0] || null;
}

export async function searchBorrowPersons(params = {}) {
  const res = await request.get('/hrams/borrow/lookup', { params });
  if (res.data.code === 200) {
    const data = res.data.data;
    return Array.isArray(data) ? data : (data ? [data] : []);
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

export async function deleteBorrow(id) {
  const res = await request.delete(`/hrams/borrow/${id}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function previewBorrowAttachment(borrowId, attachFileName) {
  const res = await request.get(`/hrams/borrow/${borrowId}/attachment/preview`, {
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  const type = resolveBorrowAttachType(res, attachFileName);
  const fileName =
    parseBorrowAttachFilename(res) ||
    attachFileName ||
    (type.includes('pdf') ? `borrow_${borrowId}.pdf` : `borrow_${borrowId}`);
  // PDF / 图片直接预览；其他类型按原文件名下载，避免无扩展名乱码
  if (/^image\//i.test(type) || /pdf/i.test(type)) {
    const url = URL.createObjectURL(new Blob([res.data], { type }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  download(res.data, fileName, type);
}

function resolveBorrowAttachType(res, attachFileName) {
  const headerType = String(res.headers?.['content-type'] || '').split(';')[0].trim();
  if (headerType && headerType !== 'application/octet-stream') {
    return headerType;
  }
  if (res.data?.type && res.data.type !== 'application/octet-stream') {
    return res.data.type;
  }
  const name = String(
    parseBorrowAttachFilename(res) || attachFileName || ''
  ).toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.bmp')) return 'image/bmp';
  if (name.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

function parseBorrowAttachFilename(res) {
  const encoded = res.headers?.['download-filename'];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  const disposition = res.headers?.['content-disposition'] || '';
  const m = /filename\*=utf-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
  const raw = m?.[1] || m?.[2];
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
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
