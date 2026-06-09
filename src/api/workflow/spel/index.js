import request from '@/utils/request';

/**
 * 分页查询流程spel表达式定义
 */
export async function pageSpel(params) {
  const res = await request.get('/workflow/spel/list', {
    params
  });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加流程spel表达式定义
 */
export async function addSpel(data) {
  const res = await request.post('/workflow/spel', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改流程spel表达式定义
 */
export async function updateSpel(data) {
  const res = await request.put('/workflow/spel', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除流程spel表达式定义
 */
export async function removeSpel(ids) {
  const res = await request.delete('/workflow/spel/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
