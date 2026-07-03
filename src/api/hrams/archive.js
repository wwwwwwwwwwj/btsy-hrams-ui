import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';
import { openMaterialPreview } from '@/views/hrams/composables/use-material-preview';

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

export async function previewMaterialIntake(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await request.post('/hrams/material/intake/preview', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function uploadMaterialIntake(formData) {
  const res = await request.post('/hrams/material/intake/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function confirmMaterialIntake(intakeId, data) {
  const res = await request.post(`/hrams/material/intake/${intakeId}/confirm`, data);
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

export async function replaceMaterial(materialId, formData) {
  const res = await request.post(`/hrams/archive/materials/${materialId}/replace`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function updateMaterialPageNo(materialId, pageNo) {
  const res = await request.put(`/hrams/archive/materials/${materialId}/page-no`, null, {
    params: { pageNo }
  });
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

export function previewMaterial(materialId) {
  return openMaterialPreview(materialId);
}

/** 打印材料（服务端记 print 审计），图片/PDF 弹窗并叠加水印后调起打印 */
export async function printMaterial(materialId, { archiveNo, operatorName } = {}) {
  const res = await request.get(`/hrams/archive/materials/${materialId}/print`, { responseType: 'blob' });
  await checkDownloadRes(res);
  const type = res.headers['content-type'] || 'application/octet-stream';
  const no = res.headers['x-hrams-archive-no'] || archiveNo || '';
  const time = new Date().toLocaleString();
  const wm = [operatorName, time, no ? `档案编号 ${no}` : ''].filter(Boolean).join(' · ');
  const url = URL.createObjectURL(new Blob([res.data], { type }));
  const win = window.open('', '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    return Promise.reject(new Error('请允许浏览器弹窗以打印'));
  }
  const isImage = type.startsWith('image/');
  const isPdf = type.includes('pdf');
  if (isImage || isPdf) {
    const body = isImage
      ? `<div class="wrap"><img src="${url}" /><div class="wm">${wm}</div></div>`
      : `<embed src="${url}" type="application/pdf" width="100%" height="100%" /><div class="wm">${wm}</div>`;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>打印</title><style>
      @page { margin: 10mm; } html,body { height:100%; margin:0; }
      .wrap { position:relative; } img { max-width:100%; }
      .wm { position:fixed; bottom:20px; right:20px; color:rgba(80,80,80,.45); font-size:12px; max-width:60%; text-align:right; pointer-events:none; }
    </style></head><body onload="setTimeout(function(){window.print();},400)">${body}</body></html>`);
    win.document.close();
  } else {
    win.location.href = url;
    win.onload = () => setTimeout(() => win.print(), 600);
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export async function exportArchivePackage(personId) {
  const res = await request.get(`/hrams/archive/${personId}/archive/export`, { responseType: 'blob' });
  await checkDownloadRes(res);
  const name = parseFilenameFromDisposition(res.headers['content-disposition']) || `archive_${personId}.zip`;
  download(res.data, name);
}

function parseFilenameFromDisposition(disposition) {
  if (!disposition) return '';
  const m = /filename\*=utf-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
  const raw = m?.[1] || m?.[2];
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function exportCatalog(personId) {
  const res = await request.get(`/hrams/archive/${personId}/catalog/export`, { responseType: 'blob' });
  await checkDownloadRes(res);
  const name = parseFilenameFromDisposition(res.headers['content-disposition']) || `catalog_${personId}.xlsx`;
  download(res.data, name);
}
