import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 查询字典数据
 */
export async function listDictDataByType(type) {
  const res = await request.get(`/system/dict/data/type/${type ?? ''}`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询字典数据
 */
export async function pageDictData(params) {
  const res = await request.get('/system/dict/data/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加字典数据
 */
export async function addDictData(data) {
  const res = await request.post('/system/dict/data', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改字典数据
 */
export async function updateDictData(data) {
  const res = await request.put('/system/dict/data', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除字典数据
 */
export async function removeDictData(ids) {
  const res = await request.delete(`/system/dict/data/${ids.join()}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出字典数据
 */
export async function exportDictData(params) {
  const res = await request({
    url: '/system/dict/data/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `dict_data_${Date.now()}.xlsx`);
}
