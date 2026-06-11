import request from '@/utils/request';

export async function listCategoryConfig() {
  const res = await request.get('/hrams/material/category/config');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function saveCategoryConfig(items) {
  const res = await request.put('/hrams/material/category/config', items);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
