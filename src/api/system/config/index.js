import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 分页查询配置
 */
export async function pageConfig(params) {
  const res = await request.get('/system/config/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加配置
 */
export async function addConfig(data) {
  const res = await request.post('/system/config', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改配置
 */
export async function updateConfig(data) {
  const res = await request.put('/system/config', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除配置
 */
export async function removeConfig(ids) {
  const res = await request.delete(`/system/config/${ids.join()}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出配置
 */
export async function exportConfig(params) {
  const res = await request({
    url: '/system/config/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `config_${Date.now()}.xlsx`);
}

/**
 * 刷新缓存配置
 */
export async function refreshConfig() {
  const res = await request.delete('/system/config/refreshCache');
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改配置值
 */
export async function updateConfigByKey(configKey, configValue) {
  const data = { configKey, configValue };
  const res = await request.put('/system/config/updateByKey', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询配置值
 */
export async function getConfigKey(configKey) {
  const res = await request.get('/system/config/configKey/' + configKey);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
