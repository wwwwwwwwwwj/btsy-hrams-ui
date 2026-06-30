import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { EleMessage } from 'ele-admin-plus';
import {
  getMaterialPanel,
  listMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  deleteMaterialFile,
  previewMaterial,
  batchDeleteMaterials,
  downloadMaterialsZip,
  replaceMaterial,
  updateMaterialPageNo,
  previewMaterialIntake
} from '@/api/hrams/archive';
import { HRAMS_MATERIAL_MAINTAIN_PATH } from '@/utils/hrams-routes';
import request from '@/utils/request';
import { checkDownloadRes, download } from '@/utils/common';
import { usePageTab } from '@/utils/use-page-tab';
import { setPageTitle } from '@/utils/page-title-util';

export function useMaterialMaintain() {
  const route = useRoute();
  const router = useRouter();
  const { setPageTabTitle, activeMenu } = usePageTab();

  const personId = ref(route.query.personId ? String(route.query.personId) : '');
  const archiveNo = ref(route.query.archiveNo || '');
  const personName = ref(route.query.name || '');
  const readOnly = computed(() => route.query.view === 'archive');

  const pageDesc = computed(() => {
    if (!personId.value) {
      return '选择干部，维护卷内目录与材料文件';
    }
    const who = [archiveNo.value, personName.value].filter(Boolean).join(' ');
    if (readOnly.value) {
      return who ? `档案查阅（仅预览、下载）· ${who}` : '档案查阅（仅预览、下载）';
    }
    return who ? `当前干部 · ${who}` : '维护卷内目录与上传材料';
  });

  const PAGE_TITLE = '材料维护';

  const syncLayoutTitle = () => {
    if (route.path !== HRAMS_MATERIAL_MAINTAIN_PATH) {
      return;
    }
    activeMenu(HRAMS_MATERIAL_MAINTAIN_PATH);
    setPageTabTitle(PAGE_TITLE);
    setPageTitle(PAGE_TITLE);
    const leaf = route.matched[route.matched.length - 1];
    if (leaf?.meta) {
      leaf.meta.title = PAGE_TITLE;
    }
  };

  const panel = ref({ categories: [], totalFiles: 0, totalPages: 0 });
  const categoryCode = ref('1');
  const materials = ref([]);
  const keyword = ref('');
  const selections = ref([]);
  const uploadVisible = ref(false);
  const editVisible = ref(false);
  const pageNoVisible = ref(false);
  const replaceVisible = ref(false);
  const uploadForm = ref({ categoryCode: '1', pageNo: 1, materialName: '', pageCount: 1, formDate: '', file: null });
  const editForm = ref({});
  const pageNoForm = ref({ id: null, pageNo: 1 });
  const replaceForm = ref({ id: null, file: null });
  const highlightMaterialId = ref(null);
  const flatCategories = computed(() => {
    const list = [];
    const walk = (nodes) => (nodes || []).forEach((n) => { list.push(n); if (n.children?.length) walk(n.children); });
    walk(panel.value.categories);
    return list;
  });

  const sortMode = ref('pageNo');
  const editorVisible = ref(false);
  const editorFile = ref(null);
  const editorTarget = ref('upload');
  const activeBatchId = ref(null);
  const activeBatchNo = ref('');
  const intakePreview = ref({});
  const intakeLoading = ref(false);
  const pendingUploadFiles = ref([]);
  const uploadSubmitting = ref(false);

  const fileNameStem = (name) => (name ? String(name).replace(/\.[^.]+$/, '') : '');

  const nextPendingKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const addToPending = (file, materialName) => {
    if (!file) return;
    pendingUploadFiles.value.push({
      key: nextPendingKey(),
      file,
      materialName: materialName || fileNameStem(file.name) || ''
    });
  };

  const removePendingUpload = (key) => {
    pendingUploadFiles.value = pendingUploadFiles.value.filter((p) => p.key !== key);
  };

  const clearPendingUpload = () => {
    pendingUploadFiles.value = [];
  };

  const closeUploadDialog = () => {
    uploadVisible.value = false;
    activeBatchId.value = null;
    activeBatchNo.value = '';
    clearPendingUpload();
  };

  const sortedMaterials = computed(() => {
    const list = [...materials.value];
    if (sortMode.value === 'createTime') {
      list.sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')));
    } else {
      list.sort((a, b) => (a.pageNo || 0) - (b.pageNo || 0));
    }
    return list;
  });
  const selectedUploaded = computed(() => selections.value.filter((r) => r.fileStatus === 'uploaded'));
  const hasSelectedUploaded = computed(() => selectedUploaded.value.length > 0);
  const hasSelection = computed(() => selections.value.length > 0);

  const rowClass = ({ row }) => {
    const classes = [];
    if (row.fileStatus !== 'uploaded') classes.push('is-disabled');
    if (highlightMaterialId.value && row.id === highlightMaterialId.value) classes.push('is-highlight');
    return classes.join(' ');
  };
  const rowSelectable = (row) => row.fileStatus === 'uploaded';

  const selectPerson = (row) => {
    router.replace({
      path: HRAMS_MATERIAL_MAINTAIN_PATH,
      query: { personId: row.id, archiveNo: row.archiveNo, name: row.name }
    });
  };

  const clearPerson = () => {
    router.replace({ path: HRAMS_MATERIAL_MAINTAIN_PATH });
  };

  watch(
    () => route.query,
    (q) => {
      personId.value = q.personId ? String(q.personId) : '';
      archiveNo.value = q.archiveNo || '';
      personName.value = q.name || '';
      if (personId.value) load();
    }
  );

  watch(
    () => route.fullPath,
    () => {
      if (route.path !== HRAMS_MATERIAL_MAINTAIN_PATH) {
        return;
      }
      nextTick(syncLayoutTitle);
    },
    { immediate: true }
  );

  const loadPanel = async () => {
    if (!personId.value) return;
    panel.value = await getMaterialPanel(personId.value);
    if (!flatCategories.value.find((c) => c.code === categoryCode.value) && flatCategories.value.length) {
      categoryCode.value = flatCategories.value[0].code;
    }
  };

  const loadMaterials = async () => {
    if (!personId.value) return;
    materials.value = await listMaterials(personId.value, {
      categoryCode: categoryCode.value,
      keyword: keyword.value || undefined
    });
  };

  const load = async () => {
    await loadPanel();
    await loadMaterials();
  };

  const onSelectCat = (code) => { categoryCode.value = code; keyword.value = ''; loadMaterials(); };
  const resetSearch = () => { keyword.value = ''; loadMaterials(); };
  const onSelectionChange = (rows) => { selections.value = rows; };

  const suggestPageNo = () => {
    const inCat = materials.value.filter((m) => m.categoryCode === uploadForm.value.categoryCode);
    const max = inCat.reduce((m, r) => Math.max(m, r.pageNo || 0), 0);
    uploadForm.value.pageNo = max > 0 ? max + 1 : 1;
  };

  const openUpload = () => {
    activeBatchId.value = null;
    activeBatchNo.value = '';
    uploadForm.value = { categoryCode: categoryCode.value, pageNo: 1, materialName: '', pageCount: 1, formDate: '', file: null };
    intakePreview.value = {};
    clearPendingUpload();
    suggestPageNo();
    uploadVisible.value = true;
  };

  const runIntakePreview = async () => {
    const file = pendingUploadFiles.value[0]?.file;
    if (!file) {
      return EleMessage.error({ message: '请先选择文件', plain: true });
    }
    intakeLoading.value = true;
    try {
      intakePreview.value = await previewMaterialIntake(file);
      if (intakePreview.value.suggestMaterialName && !uploadForm.value.materialName) {
        uploadForm.value.materialName = intakePreview.value.suggestMaterialName;
      }
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      intakeLoading.value = false;
    }
  };

  const onImageEdited = (file) => {
    if (editorTarget.value === 'replace') {
      replaceForm.value.file = file;
      doReplace();
      return;
    }
    addToPending(file);
  };

  const pickImageForEditor = (file, target) => {
    if (!file) return;
    const isImg = /^image\//i.test(file.type) || /\.(jpe?g|png|bmp)$/i.test(file.name || '');
    if (target === 'replace') {
      replaceForm.value.file = file;
      if (isImg) {
        editorFile.value = file;
        editorTarget.value = target;
        editorVisible.value = true;
      }
      return;
    }
    if (isImg) {
      editorFile.value = file;
      editorTarget.value = target;
      editorVisible.value = true;
      return;
    }
    addToPending(file);
  };

  const onUploadFile = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    if (files.length === 1) {
      pickImageForEditor(files[0], 'upload');
      return;
    }
    files.forEach((f) => addToPending(f));
    EleMessage.success({ message: `已加入 ${files.length} 个文件，请确认后上传`, plain: true });
  };

  const resolveMaterialName = (item, singleInBatch) => {
    if (uploadForm.value.materialName?.trim()) {
      if (singleInBatch) {
        return uploadForm.value.materialName.trim();
      }
      if (pendingUploadFiles.value.length === 1) {
        return uploadForm.value.materialName.trim();
      }
    }
    const fromItem = item.materialName?.trim() || fileNameStem(item.file?.name);
    return fromItem || '';
  };

  const doUpload = async () => {
    const queue = [...pendingUploadFiles.value];
    if (!queue.length) {
      return EleMessage.error({ message: '请先选择文件', plain: true });
    }
    if (!uploadForm.value.formDate) {
      return EleMessage.error({ message: '请选择形成日期', plain: true });
    }
    if (!uploadForm.value.pageCount || uploadForm.value.pageCount < 1) {
      return EleMessage.error({ message: '请填写页数', plain: true });
    }
    const singleInBatch = queue.length === 1;
    if (singleInBatch && !resolveMaterialName(queue[0], true)) {
      return EleMessage.error({ message: '请填写材料名称', plain: true });
    }

    uploadSubmitting.value = true;
    let pageNo = uploadForm.value.pageNo;
    let successCount = 0;
    try {
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const materialName = resolveMaterialName(item, singleInBatch);
        if (!materialName) {
          throw new Error(`第 ${i + 1} 个文件缺少材料名称`);
        }
        const fd = new FormData();
        fd.append('categoryCode', uploadForm.value.categoryCode);
        fd.append('pageNo', pageNo);
        fd.append('materialName', materialName);
        fd.append('pageCount', uploadForm.value.pageCount);
        fd.append('formDate', uploadForm.value.formDate);
        if (activeBatchId.value) fd.append('batchId', activeBatchId.value);
        fd.append('file', item.file);
        const saved = await uploadMaterial(personId.value, fd);
        if (saved?.batchId) {
          activeBatchId.value = saved.batchId;
          activeBatchNo.value = saved.batchNo || '';
        }
        pageNo += 1;
        successCount += 1;
      }
      clearPendingUpload();
      uploadForm.value.materialName = '';
      uploadForm.value.formDate = '';
      uploadForm.value.pageNo = pageNo;
      await load();
      EleMessage.success({
        message: successCount > 1 ? `本批已上传 ${successCount} 份材料` : '上传成功，可继续选择文件',
        plain: true
      });
    } catch (e) {
      if (successCount > 0) {
        pendingUploadFiles.value = queue.slice(successCount);
        uploadForm.value.pageNo = pageNo;
        await load();
      }
      EleMessage.error({
        message: successCount > 0 ? `已上传 ${successCount} 份，后续失败：${e.message}` : e.message,
        plain: true
      });
    } finally {
      uploadSubmitting.value = false;
    }
  };

  const openEdit = (row) => { editForm.value = { ...row }; editVisible.value = true; };
  const saveEdit = async () => {
    await updateMaterial(editForm.value.id, editForm.value);
    editVisible.value = false;
    EleMessage.success({ message: '已保存', plain: true });
    loadMaterials();
  };

  const openPageNo = (row) => {
    pageNoForm.value = { id: row.id, pageNo: row.pageNo || 1 };
    pageNoVisible.value = true;
  };
  const savePageNo = async () => {
    await updateMaterialPageNo(pageNoForm.value.id, pageNoForm.value.pageNo);
    pageNoVisible.value = false;
    EleMessage.success({ message: '页号已更新', plain: true });
    loadMaterials();
  };

  const onReplaceFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    pickImageForEditor(f, 'replace');
  };
  const doReplace = async () => {
    if (!replaceForm.value.file) return EleMessage.error({ message: '请选择文件', plain: true });
    const fd = new FormData();
    fd.append('file', replaceForm.value.file);
    await replaceMaterial(replaceForm.value.id, fd);
    replaceVisible.value = false;
    EleMessage.success({ message: '已替换', plain: true });
    load();
  };

  const preview = (row) => previewMaterial(row.id).catch((e) => EleMessage.error({ message: e.message, plain: true }));

  const downloadOne = async (row) => {
    const res = await request.get(`/hrams/archive/materials/${row.id}/download`, { responseType: 'blob' });
    await checkDownloadRes(res);
    download(res.data, row.fileName || `material_${row.id}`);
  };

  const removeFile = async (row) => { await deleteMaterialFile(row.id); load(); };
  const removeRow = async (row) => { await deleteMaterial(row.id); load(); };

  const doBatchDelete = async () => {
    const ids = selections.value.map((r) => r.id);
    await batchDeleteMaterials(personId.value, ids);
    EleMessage.success({ message: '删除成功', plain: true });
    load();
  };

  const doDownload = async () => {
    const ids = selectedUploaded.value.map((r) => r.id);
    await downloadMaterialsZip(personId.value, ids);
  };

  onMounted(async () => {
    if (route.query.categoryCode) categoryCode.value = route.query.categoryCode;
    if (route.query.materialId) highlightMaterialId.value = Number(route.query.materialId);
    if (personId.value) {
      await load();
      if (route.query.pageNo && materials.value.length) {
        const pn = Number(route.query.pageNo);
        const hit = materials.value.find((m) => m.pageNo === pn);
        if (hit) highlightMaterialId.value = hit.id;
      }
      await nextTick();
    }
  });

  return {
    personId,
    readOnly,
    pageDesc,
    panel,
    categoryCode,
    flatCategories,
    keyword,
    sortMode,
    sortedMaterials,
    hasSelectedUploaded,
    hasSelection,
    uploadVisible,
    editVisible,
    pageNoVisible,
    replaceVisible,
    uploadForm,
    editForm,
    pageNoForm,
    replaceForm,
    activeBatchNo,
    intakePreview,
    intakeLoading,
    pendingUploadFiles,
    uploadSubmitting,
    editorVisible,
    editorFile,
    rowClass,
    rowSelectable,
    selectPerson,
    clearPerson,
    onSelectCat,
    loadMaterials,
    resetSearch,
    onSelectionChange,
    openUpload,
    closeUploadDialog,
    suggestPageNo,
    onUploadFile,
    removePendingUpload,
    runIntakePreview,
    doUpload,
    saveEdit,
    savePageNo,
    onReplaceFile,
    doReplace,
    onImageEdited,
    preview,
    downloadOne,
    openEdit,
    openPageNo,
    removeFile,
    removeRow,
    doBatchDelete,
    doDownload
  };
}
