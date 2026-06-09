import request from '@/utils/request';

/**
 * 分页查询用户文件
 */
export async function pageUserFiles(params) {
  console.log('pageUserFiles params:', params);
  const res = await request.get(
    'https://cdn.eleadmin.com/20200610/user-files.json'
  );
  if (res.data.code === 0) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询用户文件列表
 */
export async function listUserFiles(params) {
  console.log('listUserFiles params:', params);
  const res = await request.get(
    'https://cdn.eleadmin.com/20200610/user-file-types.json'
  );
  if (res.data.code === 0) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加用户文件
 */
export async function addUserFile(data) {
  console.log('addUserFile data:', data);
  const res = { data: { code: 404, message: '接口不存在' } };
  if (res.data.code === 0) {
    return res.data.message;
  }
  return Promise.reject(new Error(res.data.message));
}

/**
 * 修改用户文件
 */
export async function updateUserFile(data) {
  console.log('updateUserFile data:', data);
  const res = { data: { code: 404, message: '接口不存在' } };
  if (res.data.code === 0) {
    return res.data.message;
  }
  return Promise.reject(new Error(res.data.message));
}

/**
 * 删除用户文件
 */
export async function removeUserFile(id) {
  console.log('removeUserFile id:', id);
  const res = { data: { code: 404, message: '接口不存在' } };
  if (res.data.code === 0) {
    return res.data.message;
  }
  return Promise.reject(new Error(res.data.message));
}

/**
 * 批量删除用户文件
 */
export async function removeUserFiles(data) {
  console.log('removeUserFiles data:', data);
  const res = { data: { code: 404, message: '接口不存在' } };
  if (res.data.code === 0) {
    return res.data.message;
  }
  return Promise.reject(new Error(res.data.message));
}
