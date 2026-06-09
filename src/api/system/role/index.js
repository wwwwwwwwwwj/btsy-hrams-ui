import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 分页查询角色
 */
export async function pageRole(params) {
  const res = await request.get('/system/role/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加角色
 */
export async function addRole(data) {
  const res = await request.post('/system/role', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改角色
 */
export async function updateRole(data) {
  const res = await request.put('/system/role', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除角色
 */
export async function removeRole(ids) {
  const res = await request.delete(`/system/role/${ids.join()}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改角色状态
 */
export async function updateRoleStatus(roleId, status) {
  const res = await request.put('/system/role/changeStatus', {
    roleId,
    status
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出角色
 */
export async function exportRole(params) {
  const res = await request({
    url: '/system/role/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `role_${Date.now()}.xlsx`);
}

/**
 * 查询角色
 */
export async function listRole(params) {
  const res = await request.get('/system/role/optionselect', {
    params
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询角色菜单
 */
export async function listRoleMenu(id) {
  if (!id) {
    const res = await request.get('/system/menu/treeselect');
    if (res.data.code === 200) {
      const result = { menus: res.data.data ?? [] };
      return result;
    }
    return Promise.reject(new Error(res.data.msg));
  }
  const res = await request.get(`/system/menu/roleMenuTreeselect/${id}`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询角色数据权限
 */
export async function listDataScope(id) {
  const res = await request.get(`/system/role/deptTree/${id}`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分配角色数据权限
 */
export async function setDataScope(data) {
  const res = await request.put('/system/role/dataScope', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询角色用户
 */
export async function listRoleUser(params) {
  const res = await request.get('/system/role/authUser/allocatedList', {
    params
  });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量取消角色用户
 */
export async function removeRoleUser(params) {
  const res = await request.put(
    '/system/role/authUser/cancelAll',
    toFormData(params)
  );
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询可选择的用户
 */
export async function listUnallocatedUser(params) {
  const res = await request.get('/system/role/authUser/unallocatedList', {
    params
  });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加角色用户
 */
export async function addRoleUser(params) {
  const res = await request.put(
    '/system/role/authUser/selectAll',
    toFormData(params)
  );
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
