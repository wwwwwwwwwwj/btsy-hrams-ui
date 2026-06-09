import request from '@/utils/request';

/**
 * 查询测试树
 */
export async function listTree(params) {
  const res = await request.get('/demo/tree/list', { params });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加测试树
 */
export async function addTree(data) {
  const res = await request.post('/demo/tree', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改测试树
 */
export async function updateTree(data) {
  const res = await request.put('/demo/tree', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除测试树
 */
export async function removeTree(ids) {
  const res = await request.delete('/demo/tree/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
