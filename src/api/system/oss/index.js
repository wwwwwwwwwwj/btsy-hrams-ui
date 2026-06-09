import request from '@/utils/request';
import { download, checkDownloadRes, transformParams } from '@/utils/common';

/**
 * 分页查询文件
 */
export async function pageOss(params) {
  const res = await request.get('/resource/oss/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除文件
 */
export async function removeOss(ids) {
  const res = await request.delete('/resource/oss/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 下载文件
 */
export async function downloadOss(ossId) {
  const res = await request.get('/resource/oss/download/' + ossId, {
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  const fileName = res.headers['download-filename'];
  download(res.data, fileName ? decodeURIComponent(fileName) : '');
}

/**
 * 上传文件
 * @param file 文件
 * @param config 请求配置
 * @param fileName 文件名称
 */
export async function uploadOss(file, config, fileName, params) {
  const formData = new FormData();
  formData.append('file', file, fileName);
  transformParams(params).forEach((d) => {
    formData.append(d[0], d[1]);
  });
  const res = await request.post('/resource/oss/upload', formData, {
    ...(config || {}),
    headers: {
      repeatSubmit: false,
      ...(config?.headers || {})
    }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询文件根据id
 */
export async function listOssById(ossId) {
  const res = await request.get('/resource/oss/listByIds/' + ossId);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
