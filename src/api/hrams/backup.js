import request from '@/utils/request';

export async function listBackups() {
  const res = await request.get('/hrams/backup/list');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function createBackup() {
  const res = await request.post('/hrams/backup');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function restoreBackup(jobId, confirmToken, mode = 'merge') {
  const res = await request.post(`/hrams/backup/${jobId}/restore`, { confirmToken, mode });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
