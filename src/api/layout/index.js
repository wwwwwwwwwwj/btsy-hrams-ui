import request from '@/utils/request';

/**
 * 获取登录用户信息
 * @param toRoute 路由守卫中要进入的路由
 */
export async function getUserInfo(toRoute) {
  const res = await request.get('/system/user/getInfo', { toRoute });
  if (res.data.code === 200 && res.data.data) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 获取登录用户菜单
 * @param toRoute 路由守卫中要进入的路由
 */
export async function getUserMenu(toRoute) {
  const res = await request.get('/system/menu/getRouters', { toRoute });
  if (res.data.code === 200 && res.data.data) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改登录用户密码
 */
export async function updatePassword(data) {
  const res = await request.put('/system/user/profile/updatePwd', data, {
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
