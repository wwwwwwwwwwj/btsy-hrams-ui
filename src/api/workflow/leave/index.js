import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 查询请假详情
 */
export async function getLeave(id) {
  const res = await request.get('/workflow/leave/' + id);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加请假
 */
export async function addLeave(data) {
  const res = await request.post('/workflow/leave', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改请假
 */
export async function updateLeave(data) {
  const res = await request.put('/workflow/leave', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 提交请假并发起流程
 */
export async function submitAndFlowStart(data) {
  const res = await request.post('/workflow/leave/submitAndFlowStart', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 分页查询请假
 */
export async function pageLeave(params) {
  const res = await request.get('/workflow/leave/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 批量删除请假
 */
export async function removeLeave(ids) {
  const res = await request.delete('/workflow/leave/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出请假
 */
export async function exportLeave(params) {
  const res = await request({
    url: '/workflow/leave/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `leave_${Date.now()}.xlsx`);
}
