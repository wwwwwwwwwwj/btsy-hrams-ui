import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 分页查询客户端
 */
export async function pageClient(params) {
  const res = await request.get('/system/client/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加客户端
 */
export async function addClient(data) {
  const res = await request.post('/system/client', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改客户端
 */
export async function updateClient(data) {
  const res = await request.put('/system/client', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除客户端
 */
export async function removeClient(ids) {
  const res = await request.delete('/system/client/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出客户端
 */
export async function exportClient(params) {
  const res = await request({
    url: '/system/client/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `client_${Date.now()}.xlsx`);
}

/**
 * 修改客户端状态
 */
export async function updateClientStatus(clientId, status) {
  const res = await request.put('/system/client/changeStatus', {
    clientId,
    status
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
