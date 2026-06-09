import request from '@/utils/request';

/**
 * 查询部门
 */
export async function listDept(params) {
  const res = await request.get('/system/dept/list', { params });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加部门
 */
export async function addDept(data) {
  const res = await request.post('/system/dept', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改部门
 */
export async function updateDept(data) {
  const res = await request.put('/system/dept', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除部门
 */
export async function removeDept(ids) {
  const res = await request.delete(`/system/dept/${ids.join()}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
