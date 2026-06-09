import request from '@/utils/request';

/**
 * 分页查询待办
 */
export async function pageTaskWait(params) {
  const res = await request.get('/workflow/task/pageByTaskWait', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询已办
 */
export async function pageTaskFinish(params) {
  const res = await request.get('/workflow/task/pageByTaskFinish', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询抄送
 */
export async function pageTaskCopy(params) {
  const res = await request.get('/workflow/task/pageByTaskCopy', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 获取当前任务
 */
export async function getTask(taskId) {
  const res = await request.get('/workflow/task/getTask/' + taskId);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 启动流程
 */
export async function startWorkFlow(data) {
  const res = await request.post('/workflow/task/startWorkFlow', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 终止任务
 */
export async function terminationTask(data) {
  const res = await request.post('/workflow/task/terminationTask', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 办理流程
 */
export async function completeTask(data) {
  const res = await request.post('/workflow/task/completeTask', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询当前租户所有待办
 */
export async function pageAllTaskWait(params) {
  const res = await request.get('/workflow/task/pageByAllTaskWait', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询当前租户所有已办
 */
export async function pageAllTaskFinish(params) {
  const res = await request.get('/workflow/task/pageByAllTaskFinish', {
    params
  });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 任务操作
 * @param operation 操作类型, 委派 delegateTask、转办 transferTask、加签 addSignature、减签 reductionSignature
 */
export async function operationTask(data, operation) {
  const res = await request.post(
    '/workflow/task/taskOperation/' + operation,
    data
  );
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询当前任务办理人
 */
export async function listCurrentTaskAllUser(taskId) {
  const res = await request.get('/workflow/task/currentTaskAllUser/' + taskId);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改任务办理人
 */
export async function updateAssignee(taskIdList, userId) {
  const res = await request.put(
    '/workflow/task/updateAssignee/' + userId,
    taskIdList
  );
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询可驳回的任务节点
 */
export async function getBackTaskNode(definitionId, nodeCode) {
  const res = await request.get(
    `/workflow/task/getBackTaskNode/${definitionId}/${nodeCode}`
  );
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 任务驳回
 */
export async function backProcess(data) {
  const res = await request.post('/workflow/task/backProcess/', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 获取下一节点
 */
export async function getNextNodeList(data) {
  const res = await request.post('/workflow/task/getNextNodeList', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 催办任务
 */
export async function urgeTask(data) {
  const res = await request.post('/workflow/task/urgeTask', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
