import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

export async function pagePerson(params) {
  const res = await request.get('/hrams/person/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function listPersonFieldDefs() {
  const res = await request.get('/hrams/person/field-defs');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function addPersonFieldDef(data) {
  const res = await request.post('/hrams/person/field-defs', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function getPerson(id) {
  const res = await request.get(`/hrams/person/${id}`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function addPerson(data) {
  const res = await request.post('/hrams/person', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function updatePerson(data) {
  const res = await request.put('/hrams/person', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function removePerson(ids) {
  const res = await request.delete('/hrams/person/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function exportPerson(params) {
  const res = await request({
    url: '/hrams/person/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `person_${Date.now()}.xlsx`);
}

export async function importPerson(file) {
  const res = await request.post('/hrams/person/importData', toFormData({ file }), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
