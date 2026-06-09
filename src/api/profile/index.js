import request from '@/utils/request';

/**
 * 获取登录用户详细信息
 */
export async function getUserProfile() {
  const res = await request.get('/system/user/profile');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改登录用户信息
 */
export async function updateUserProfile(data) {
  const res = await request.put('/system/user/profile', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改登录用户头像
 */
export async function uploadAvatar(file, name) {
  const formData = new FormData();
  formData.append('avatarfile', file, name ?? 'avatar.png');
  const res = await request.post('/system/user/profile/avatar', formData);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
