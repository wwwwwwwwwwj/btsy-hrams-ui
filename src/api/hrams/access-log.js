import request from '@/utils/request';
import { checkDownloadRes, download } from '@/utils/common';

export async function pageAccessLog(params) {
  const res = await request.get('/hrams/access-log/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function exportAccessLog(params) {
  const res = await request.get('/hrams/access-log/export', { params, responseType: 'blob' });
  await checkDownloadRes(res);
  download(res.data, '操作日志.xlsx');
}
