import { reactive } from 'vue';
import { EleMessage } from 'ele-admin-plus';
import request from '@/utils/request';
import { checkDownloadRes } from '@/utils/common';

const state = reactive({
  imageVisible: false,
  imageUrls: [],
  pdfVisible: false,
  pdfUrl: '',
  loading: false,
  title: '材料预览'
});

let objectUrl = null;

function resolvePreviewType(res) {
  const headerType = res.headers?.['content-type'];
  if (headerType && headerType !== 'application/octet-stream') {
    return headerType;
  }
  if (res.data?.type && res.data.type !== 'application/octet-stream') {
    return res.data.type;
  }
  const disposition = res.headers?.['content-disposition'] || '';
  const lower = disposition.toLowerCase();
  if (/\.pdf(?:\"|;|$)/.test(lower)) return 'application/pdf';
  if (/\.png(?:\"|;|$)/.test(lower)) return 'image/png';
  if (/\.jpe?g(?:\"|;|$)/.test(lower)) return 'image/jpeg';
  if (/\.bmp(?:\"|;|$)/.test(lower)) return 'image/bmp';
  return 'application/octet-stream';
}

function revokeObjectUrl() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

export function closeMaterialPreview() {
  state.imageVisible = false;
  state.pdfVisible = false;
  state.imageUrls = [];
  state.pdfUrl = '';
  revokeObjectUrl();
}

export async function openMaterialPreview(materialId) {
  if (materialId == null || materialId === '') {
    return;
  }
  closeMaterialPreview();
  state.loading = true;
  try {
    const res = await request.get(`/hrams/archive/materials/${materialId}/preview`, {
      responseType: 'blob'
    });
    await checkDownloadRes(res);
    const type = resolvePreviewType(res);
    objectUrl = URL.createObjectURL(new Blob([res.data], { type }));
    if (/^image\//i.test(type)) {
      state.imageUrls = [objectUrl];
      state.imageVisible = true;
      return;
    }
    if (/pdf/i.test(type)) {
      state.pdfUrl = objectUrl;
      state.pdfVisible = true;
      return;
    }
    revokeObjectUrl();
    EleMessage.error({ message: '该文件类型请下载后查看', plain: true });
  } catch (e) {
    EleMessage.error({ message: e.message, plain: true });
  } finally {
    state.loading = false;
  }
}

export function useMaterialPreview() {
  return { state, openMaterialPreview, closeMaterialPreview };
}
