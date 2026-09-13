import request from '@/utils/request';

export async function searchTransferPersons(params = {}) {
  const res = await request.get('/hrams/transfer/lookup', { params });
  if (res.data.code === 200) {
    const data = res.data.data;
    return Array.isArray(data) ? data : (data ? [data] : []);
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function pageTransfer(params) {
  const res = await request.get('/hrams/transfer/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function createOutbound(data) {
  const res = await request.post('/hrams/transfer/outbound', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function submitTransfer(id) {
  const res = await request.put(`/hrams/transfer/${id}/submit`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function approveTransfer(id, pass, message) {
  const res = await request.put(`/hrams/transfer/${id}/approve`, null, { params: { pass, message } });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function inventoryTransfer(id) {
  const res = await request.put(`/hrams/transfer/${id}/inventory`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function sealTransfer(id, remark) {
  const res = await request.put(`/hrams/transfer/${id}/seal`, null, { params: { remark } });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function sendTransfer(id, trackingNo) {
  const res = await request.put(`/hrams/transfer/${id}/send`, null, { params: { trackingNo } });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function receiveTransfer(id, file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await request.post(`/hrams/transfer/${id}/receive`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function returnTransfer(id, reason) {
  const res = await request.put(`/hrams/transfer/${id}/return`, null, { params: { reason } });
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function cancelTransfer(id) {
  const res = await request.put(`/hrams/transfer/${id}/cancel`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function registerInbound(data) {
  const res = await request.post('/hrams/transfer/inbound', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function checkInbound(id) {
  const res = await request.put(`/hrams/transfer/${id}/inbound-check`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function archiveInbound(id) {
  const res = await request.put(`/hrams/transfer/${id}/inbound-archive`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}
