import request from '@/utils/request';

export async function listRemindRules() {
  const res = await request.get('/hrams/remind/rules');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function saveRemindRule(data) {
  const res = await request.post('/hrams/remind/rules', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function listRemindRecords() {
  const res = await request.get('/hrams/remind/records');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function scanRemind() {
  const res = await request.post('/hrams/remind/scan');
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
