import request from '@/utils/request';

export async function getDashboardSummary() {
  const res = await request.get('/hrams/dashboard/summary');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function getDashboardReminds(limit = 20) {
  const res = await request.get('/hrams/dashboard/reminds', { params: { limit } });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
