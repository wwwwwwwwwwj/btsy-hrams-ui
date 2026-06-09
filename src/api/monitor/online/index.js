import request from '@/utils/request';

/**
 * 分页查询在线用户
 */
export async function pageOnline(params) {
  const res = await request.get('/monitor/online/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 强退在线用户
 */
export async function kickoutOnline(id) {
  const res = await request.delete(`/monitor/online/${id}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询登录用户的在线设备
 */
export async function listUserDevice() {
  const res = await request.get('/monitor/online');
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 下线登录用户的在线设备
 */
export async function kickoutDevice(id) {
  const res = await request.delete(`/monitor/online/myself/${id}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
