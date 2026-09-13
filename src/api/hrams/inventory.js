import request from '@/utils/request';

export async function pageInventory(params) {
  const res = await request.get('/hrams/inventory/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function inventorySummary() {
  const res = await request.get('/hrams/inventory/summary');
  if (res.data.code === 200) {
    return res.data.data || {};
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function scanInventory() {
  const res = await request.post('/hrams/inventory/scan');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
