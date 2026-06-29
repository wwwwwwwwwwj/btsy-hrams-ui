import request from '@/utils/request';

function buildFormData({ mode, personIds, confirmedPersonIds, files }) {
  const fd = new FormData();
  fd.append('mode', mode);
  personIds.forEach((id) => fd.append('personIds', id));
  (confirmedPersonIds || []).forEach((id) => fd.append('confirmedPersonIds', id));
  files.forEach((file) => {
    fd.append('files', file);
    fd.append('relativePaths', file.webkitRelativePath || file.name);
  });
  return fd;
}

export async function scanAttach(data) {
  const res = await request.post('/hrams/archive/attach/scan', buildFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function confirmAttach(data) {
  const res = await request.post('/hrams/archive/attach/confirm', buildFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
