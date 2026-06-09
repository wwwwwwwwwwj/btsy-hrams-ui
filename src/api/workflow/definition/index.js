import request from '@/utils/request';
import { download, checkDownloadRes } from '@/utils/common';

/**
 * 查询流程定义
 */
export async function listDefinition(params) {
  const res = await request.get('/workflow/definition/list', {
    params
  });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询未发布的流程定义
 */
export async function listUnPublish(params) {
  const res = await request.get('/workflow/definition/unPublishList', {
    params
  });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加流程定义
 */
export async function addDefinition(data) {
  const res = await request.post('/workflow/definition', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改流程定义
 */
export async function updateDefinition(data) {
  const res = await request.put('/workflow/definition', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除流程定义
 */
export async function removeDefinition(ids) {
  const res = await request.delete('/workflow/definition/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改流程定义状态
 */
export async function updateDefinitionStatus(definitionId, active) {
  const res = await request.put('/workflow/definition/active/' + definitionId, {
    active
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出流程定义
 */
export async function exportDefinition(definitionId, fileName) {
  const res = await request({
    url: '/workflow/definition/exportDef/' + definitionId,
    method: 'POST',
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `${fileName}.json`);
}

/**
 * 复制流程定义
 */
export async function copyDefinition(definitionId) {
  const res = await request.post('/workflow/definition/copy/' + definitionId);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 发布流程定义
 */
export async function publishDefinition(definitionId) {
  const res = await request.put('/workflow/definition/publish/' + definitionId);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 部署流程定义
 */
export async function importDef(category, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  const res = await request.post('/workflow/definition/importDef', formData, {
    headers: { repeatSubmit: false }
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
