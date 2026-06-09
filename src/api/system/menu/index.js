import request from '@/utils/request';
import { getRuoYiIcon } from '@/utils/menu-util';

/**
 * 查询菜单
 */
export async function listMenu(params) {
  const res = await request.get('/system/menu/list', { params });
  if (res.data.code === 200) {
    // 若依默认菜单图标名称处理
    return res.data.data.map((d) => {
      return { ...d, icon: getRuoYiIcon(d.icon) };
    });
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加菜单
 */
export async function addMenu(data) {
  const res = await request.post('/system/menu', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改菜单
 */
export async function updateMenu(data) {
  const res = await request.put('/system/menu', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除菜单
 */
export async function removeMenu(ids) {
  const res = await request.delete(`/system/menu/${ids.join()}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
