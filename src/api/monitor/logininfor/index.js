import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 分页查询登录日志
 */
export async function pageLogininfor(params) {
  const res = await request.get('/monitor/logininfor/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出登录日志
 */
export async function exportLogininfor(params) {
  const res = await request({
    url: '/monitor/logininfor/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `logininfor_${Date.now()}.xlsx`);
}

/**
 * 批量删除登录日志
 */
export async function removeLogininfor(ids) {
  const res = await request.delete(`/monitor/logininfor/${ids.join()}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 清空登录日志
 */
export async function clearLogininfor() {
  const res = await request.delete('/monitor/logininfor/clean');
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 解锁登录日志
 */
export async function unlockLogininfor(userName) {
  const res = await request.get(`/monitor/logininfor/unlock/${userName}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
