import request from '@/utils/request';

/**
 * 查询流程分类
 */
export async function listCategory(params) {
  const res = await request.get('/workflow/category/list', {
    params
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加流程分类
 */
export async function addCategory(data) {
  const res = await request.post('/workflow/category', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改流程分类
 */
export async function updateCategory(data) {
  const res = await request.put('/workflow/category', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除流程分类
 */
export async function removeCategory(ids) {
  const res = await request.delete('/workflow/category/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
