import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 分页查询租户
 */
export async function pageTenant(params) {
  const res = await request.get('/system/tenant/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加租户
 */
export async function addTenant(data) {
  const res = await request.post('/system/tenant', data, {
    headers: {
      isEncrypt: true,
      repeatSubmit: false
    }
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改租户
 */
export async function updateTenant(data) {
  const res = await request.put('/system/tenant', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除租户
 */
export async function removeTenant(ids) {
  const res = await request.delete('/system/tenant/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出租户
 */
export async function exportTenant(params) {
  const res = await request({
    url: '/system/tenant/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `tenantPackage_${Date.now()}.xlsx`);
}

/**
 * 修改租户状态
 */
export async function updateTenantStatus(id, tenantId, status) {
  const res = await request.put('/system/tenant/changeStatus', {
    id,
    tenantId,
    status
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 同步租户字典
 */
export async function syncTenantDict() {
  const res = await request.get('/system/tenant/syncTenantDict');
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 同步租户套餐
 */
export async function syncTenantPackage(params) {
  const res = await request.get('/system/tenant/syncTenantPackage', { params });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 动态切换租户
 */
export async function dynamicTenant(tenantId) {
  const res = await request.get('/system/tenant/dynamic/' + tenantId);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 清除动态租户
 */
export async function dynamicClear() {
  const res = await request.get('/system/tenant/dynamic/clear');
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
