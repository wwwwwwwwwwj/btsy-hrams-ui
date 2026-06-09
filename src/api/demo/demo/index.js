import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 分页查询测试单
 */
export async function pageDemo(params) {
  const res = await request.get('/demo/demo/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加测试单
 */
export async function addDemo(data) {
  const res = await request.post('/demo/demo', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改测试单
 */
export async function updateDemo(data) {
  const res = await request.put('/demo/demo', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除测试单
 */
export async function removeDemo(ids) {
  const res = await request.delete('/demo/demo/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出测试单
 */
export async function exportDemo(params) {
  const res = await request({
    url: '/demo/demo/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `demo_${Date.now()}.xlsx`);
}
