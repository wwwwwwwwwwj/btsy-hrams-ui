import request from '@/utils/request';

/**
 * 分页查询文件配置
 */
export async function pageOssConfig(params) {
  const res = await request.get('/resource/oss/config/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加文件配置
 */
export async function addOssConfig(data) {
  const res = await request.post('/resource/oss/config', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改文件配置
 */
export async function updateOssConfig(data) {
  const res = await request.put('/resource/oss/config', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除文件配置
 */
export async function removeOssConfig(ids) {
  const res = await request.delete('/resource/oss/config/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改文件配置状态
 */
export async function updateOssConfigStatus(data) {
  const res = await request.put('/resource/oss/config/changeStatus', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
