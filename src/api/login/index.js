import request from '@/utils/request';

/**
 * 登录
 */
export async function login(data) {
  const res = await request.post(
    '/auth/login',
    {
      ...data,
      clientId: data.clientId || import.meta.env.VITE_APP_CLIENT_ID,
      grantType: data.grantType || 'password'
    },
    {
      headers: {
        isToken: false,
        isEncrypt: true,
        repeatSubmit: false
      }
    }
  );
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 获取验证码
 */
export async function getCaptcha() {
  const res = await request.get('/auth/code');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 获取租户列表
 */
export async function getTenantList(isToken) {
  const res = await request.get('/auth/tenant/list', { headers: { isToken } });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 退出登录
 */
export async function logout() {
  const apis = [request.post('/auth/logout')];
  if (import.meta.env.VITE_APP_SSE == 'true') {
    apis.push(request.get('/resource/sse/close'));
  }
  const [res] = await Promise.all(apis);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
