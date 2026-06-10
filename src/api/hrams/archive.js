import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

export async function pageArchivePersons(params) {
  const res = await request.get('/hrams/archive/persons', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function listCategories(personId) {
  const res = await request.get('/hrams/archive/categories', { params: { personId } });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function getMaterialPanel(personId) {
  const res = await request.get(`/hrams/archive/${personId}/material-panel`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function listMaterials(personId, params) {
  const res = await request.get(`/hrams/archive/${personId}/materials`, { params });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function uploadMaterial(personId, formData) {
  const res = await request.post(`/hrams/archive/${personId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function updateMaterial(materialId, data) {
  const res = await request.put(`/hrams/archive/materials/${materialId}`, data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function batchDeleteMaterials(personId, materialIds) {
  const res = await request.post(`/hrams/archive/${personId}/materials/batch-delete`, materialIds);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function downloadMaterialsZip(personId, materialIds) {
  const res = await request.post(`/hrams/archive/${personId}/materials/downloadZip`, materialIds, {
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, `materials_${personId}.zip`);
}

export async function deleteMaterial(materialId) {
  const res = await request.delete(`/hrams/archive/materials/${materialId}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function deleteMaterialFile(materialId) {
  const res = await request.delete(`/hrams/archive/materials/${materialId}/file`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function previewMaterial(materialId) {
  const res = await request.get(`/hrams/archive/materials/${materialId}/preview`, {
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  const type = res.headers['content-type'] || 'application/octet-stream';
  const url = URL.createObjectURL(new Blob([res.data], { type }));
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    return Promise.reject(new Error('请允许浏览器弹窗以预览'));
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function mountBatch(personId, file) {
  const res = await request.post('/hrams/archive/mount/batch', toFormData({ personId, file }), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function mountIncrement(personId, file) {
  const res = await request.post('/hrams/archive/mount/increment', toFormData({ personId, file }), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function pageMountBatches(params) {
  const res = await request.get('/hrams/archive/mount/batches', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function listMountDetails(batchId) {
  const res = await request.get(`/hrams/archive/mount/batches/${batchId}/details`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function handleMountDetail(detailId) {
  const res = await request.put(`/hrams/archive/mount/details/${detailId}/handled`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function pageMaterialPool(params) {
  const res = await request.get('/hrams/material-pool/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function archiveFromPool(data) {
  const res = await request.post('/hrams/material-pool/archive', data);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function ignoreMaterialPool(poolId) {
  const res = await request.put(`/hrams/material-pool/${poolId}/ignore`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function deleteMaterialPool(poolId) {
  const res = await request.delete(`/hrams/material-pool/${poolId}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function listScanConfigs() {
  const res = await request.get('/hrams/scan/configs');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function saveScanConfig(data) {
  const res = await request.post('/hrams/scan/configs', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function deleteScanConfig(id) {
  const res = await request.delete(`/hrams/scan/configs/${id}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function runScanConfig(configId) {
  const res = await request.post(`/hrams/scan/run/${configId}`);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function runAllScanConfigs() {
  const res = await request.post('/hrams/scan/run-all');
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function pageScanLogs(params) {
  const res = await request.get('/hrams/scan/logs', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function exportCatalog(personId) {
  const res = await request.get(`/hrams/archive/${personId}/catalog/export`, { responseType: 'blob' });
  await checkDownloadRes(res);
  download(res.data, `catalog_${personId}.xlsx`);
}
