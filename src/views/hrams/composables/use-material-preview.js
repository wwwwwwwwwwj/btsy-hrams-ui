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
    const type = res.headers['content-type'] || 'application/octet-stream';
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
