import request from '@/utils/request';

/**
 * 查询流程审批信息
 */
export async function getInstanceTask(businessId) {
  const res = await request.get(
    `/workflow/instance/flowHisTaskList/${businessId}?t${Math.random()}`
  );
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询我发起的
 */
export async function pageInstanceMy(params) {
  const res = await request.get('/workflow/instance/pageByCurrent', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除流程实例
 */
export async function removeInstance(ids) {
  const res = await request.delete(
    '/workflow/instance/deleteByInstanceIds/' + ids.join()
  );
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 撤销流程
 */
export async function cancelProcessApply(data) {
  const res = await request.put('/workflow/instance/cancelProcessApply', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询运行中实例
 */
export async function pageInstanceRunning(params) {
  const res = await request.get('/workflow/instance/pageByRunning', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询已完成实例
 */
export async function pageInstanceFinish(params) {
  const res = await request.get('/workflow/instance/pageByFinish', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 作废流程
 */
export async function invalidInstance(data) {
  const res = await request.post('/workflow/instance/invalid', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询流程变量
 */
export async function getInstanceVariable(instanceId) {
  const res = await request.get(
    `/workflow/instance/instanceVariable/${instanceId}`
  );
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
