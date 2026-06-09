import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 分页查询租户套餐
 */
export async function pageTenantPackage(params) {
  const res = await request.get('/system/tenant/package/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加租户套餐
 */
export async function addTenantPackage(data) {
  const res = await request.post('/system/tenant/package', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改租户套餐
 */
export async function updateTenantPackage(data) {
  const res = await request.put('/system/tenant/package', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除租户套餐
 */
export async function removeTenantPackage(ids) {
  const res = await request.delete('/system/tenant/package/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出租户套餐
 */
export async function exportTenantPackage(params) {
  const res = await request({
    url: '/system/tenant/package/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `tenantPackage_${Date.now()}.xlsx`);
}

/**
 * 修改租户套餐状态
 */
export async function updateTenantPackageStatus(packageId, status) {
  const res = await request.put('/system/tenant/package/changeStatus', {
    packageId,
    status
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询租户套餐菜单
 */
export async function listTenantPackageMenu(id) {
  if (!id) {
    const res = await request.get('/system/menu/treeselect');
    if (res.data.code === 200) {
      const result = { menus: res.data.data ?? [] };
      return result;
    }
    return Promise.reject(new Error(res.data.msg));
  }
  const res = await request.get(
    '/system/menu/tenantPackageMenuTreeselect/' + id
  );
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询租户套餐
 */
export async function listTenantPackage() {
  const res = await request.get('/system/tenant/package/selectList');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
