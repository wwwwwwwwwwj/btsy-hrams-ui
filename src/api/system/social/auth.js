import request from '@/utils/request';

/**
 * 绑定账号
 */
export async function bindAuth(source, tenantId) {
  const res = await request.get('/auth/binding/' + source, {
    params: { tenantId, domain: location.host }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 解绑账号
 */
export async function unbindAuth(authId) {
  const res = await request.delete('/auth/unlock/' + authId);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 获取授权列表
 */
export async function listAuth() {
  const res = await request.get('/system/social/list');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
