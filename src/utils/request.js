/**
 * 请求工具
 */
import axios from 'axios';
import { unref } from 'vue';
import {
  LOGIN_PATH,
  LAYOUT_PATH,
  TOKEN_HEADER_NAME,
  CLIENT_HEADER_NAME,
  ENCRYPT_HEADER_NAME,
  REPEAT_SUBMIT_INTERVAL
} from '@/config/setting';
import router from '@/router';
import { isWhiteList } from '@/router/routes';
import { getToken } from './token-util';
import { goLogin, showExpiredLogout, toURLSearch } from './common';
import cache from './cache';
import {
  generateAesKey,
  encrypt,
  encryptBase64,
  encryptWithAes,
  decrypt,
  decryptBase64,
  decryptWithAes
} from './crypto';

/**
 * 请求拦截处理
 */
export function requestInterceptor(config) {
  // 添加token到header
  const token = getToken();
  if (token && config.headers) {
    config.headers[TOKEN_HEADER_NAME] = `Bearer ${token}`;
  }

  // 添加clientid
  config.headers[CLIENT_HEADER_NAME] = import.meta.env.VITE_APP_CLIENT_ID;

  // get请求处理数组和对象类型参数
  if (config.method === 'get' && config.params) {
    config.url = toURLSearch(config.params, config.url);
    config.params = {};
  }

  // 防止数据重复提交
  if (
    config.headers?.repeatSubmit !== false &&
    (config.method === 'post' || config.method === 'put')
  ) {
    const requestObj = {
      url: config.url,
      data:
        typeof config.data === 'object'
          ? JSON.stringify(config.data)
          : config.data,
      time: new Date().getTime()
    };
    const sessionObj = cache.session.getJSON('sessionObj');
    if (sessionObj == null || sessionObj === '') {
      cache.session.setJSON('sessionObj', requestObj);
    } else {
      const s_url = sessionObj.url; // 请求地址
      const s_data = sessionObj.data; // 请求数据
      const s_time = sessionObj.time; // 请求时间
      if (
        s_data === requestObj.data &&
        requestObj.time - s_time < REPEAT_SUBMIT_INTERVAL &&
        s_url === requestObj.url
      ) {
        const message = '数据正在处理，请勿重复提交';
        console.warn(`[${s_url}]: ` + message);
        return Promise.reject(new Error(message));
      } else {
        cache.session.setJSON('sessionObj', requestObj);
      }
    }
  }

  // 请求参数加密
  if (
    import.meta.env.VITE_APP_ENCRYPT == 'true' &&
    config.headers?.isEncrypt == 'true' &&
    (config.method === 'post' || config.method === 'put')
  ) {
    const aesKey = generateAesKey();
    config.headers[ENCRYPT_HEADER_NAME] = encrypt(encryptBase64(aesKey));
    config.data =
      typeof config.data === 'object'
        ? encryptWithAes(JSON.stringify(config.data), aesKey)
        : encryptWithAes(config.data, aesKey);
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
  }

  return config;
}

/**
 * 响应拦截处理
 */
export function responseInterceptor(res) {
  if (import.meta.env.VITE_APP_ENCRYPT == 'true') {
    // 加密后的AES秘钥
    const keyStr = res.headers[ENCRYPT_HEADER_NAME];
    // 加密
    if (keyStr) {
      const data = res.data;
      // 请求体AES解密
      const base64Str = decrypt(keyStr);
      // base64解码(得到请求头的AES秘钥)
      const aesKey = decryptBase64(base64Str.toString());
      // aesKey解码data(得到的是JSON字符串)
      const decryptData = decryptWithAes(data, aesKey);
      // 将结果转为JSON
      res.data = JSON.parse(decryptData);
    }
  }
  // 登录过期处理
  if (res.data?.code === 401 || (res.data?.code === 403 && !getToken())) {
    const toRoute = res.config.toRoute;
    const { path, fullPath } = toRoute || unref(router.currentRoute);
    if (path === LOGIN_PATH || !isWhiteList(path)) {
      if (path === LOGIN_PATH || path == LAYOUT_PATH || toRoute) {
        goLogin(path == LAYOUT_PATH ? void 0 : fullPath, true);
      } else {
        showExpiredLogout(fullPath);
      }
    }
    return res.data?.msg;
  }
}

/**
 * 错误信息处理
 */
export function getErrorMessage(message) {
  if (message == 'Network Error') {
    return '后端接口连接异常';
  }
  if (message.includes('timeout')) {
    return '系统接口请求超时';
  }
  if (message.includes('Request failed with status code')) {
    return `系统接口${message.slice(-3)}异常`;
  }
  return message;
}

/** 创建axios实例 */
const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

/**
 * 添加响应拦截器
 */
service.interceptors.response.use(
  (res) => {
    const errorMessage = responseInterceptor(res);
    if (errorMessage) {
      return Promise.reject(new Error(errorMessage));
    }
    return res;
  },
  (error) => {
    console.error(error);
    return Promise.reject(new Error(getErrorMessage(error.message)));
  }
);

/**
 * 添加请求拦截器
 */
service.interceptors.request.use(
  (config) => {
    return requestInterceptor(config);
  },
  (error) => {
    console.error(error);
    return Promise.reject(new Error(getErrorMessage(error.message)));
  }
);

export default service;
