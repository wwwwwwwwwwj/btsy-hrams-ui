import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { EleMessage } from 'ele-admin-plus';
import { createManualBatch } from '@/api/hrams/material-batch';
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
  previewMaterialIntake,
  uploadMaterialIntake,
  getMaterialIntake,
  confirmMaterialIntake,
  rejectMaterialIntake
} from '@/api/hrams/archive';
import { pagePerson } from '@/api/hrams/person';
import { listCategoryConfig } from '@/api/hrams/material-category';
import { HRAMS_MATERIAL_MAINTAIN_PATH, HRAMS_MATERIAL_MGMT_PATH } from '@/utils/hrams-routes';
import {
  INTAKE_TERMINAL_STATUSES,
  intakeVoToRow,
  pollMaterialIntake
} from '@/utils/hrams-material-intake';
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

  const PAGE_TITLE = '卷内材料维护';

  const syncLayoutTitle = () => {
    const onMaintain = route.path === HRAMS_MATERIAL_MAINTAIN_PATH;
    const onMgmtUpload =
      route.path === HRAMS_MATERIAL_MGMT_PATH && String(route.query.tab || '') === 'upload';
    if (!onMaintain && !onMgmtUpload) {
      return;
    }
    const menuPath = onMgmtUpload ? HRAMS_MATERIAL_MGMT_PATH : HRAMS_MATERIAL_MAINTAIN_PATH;
    activeMenu(menuPath);
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
  const createUploadForm = () => ({
    personId: personId.value || '',
    categoryCode: personId.value ? categoryCode.value : '',
    pageNo: 1,
    materialName: '',
    pageCount: 1,
    formDate: '',
    ocrFlag: true,
    file: null
  });
  const uploadForm = ref(createUploadForm());
  const editForm = ref({});
  const pageNoForm = ref({ id: null, pageNo: 1 });
  const replaceForm = ref({ id: null, file: null });
  const highlightMaterialId = ref(null);
  const globalCategories = ref([]);
  const flatCategories = computed(() => {
    const list = [];
    const walk = (nodes) => (nodes || []).forEach((n) => { list.push(n); if (n.children?.length) walk(n.children); });
    walk(panel.value.categories?.length ? panel.value.categories : globalCategories.value);
    return list;
  });

  const sortMode = ref('pageNo');
  const editorVisible = ref(false);
  const editorFile = ref(null);
  const editorTarget = ref('upload');
  const editorPendingKey = ref('');
  const activeBatchId = ref(null);
  const activeBatchNo = ref('');
  const intakePreview = ref({});
  const intakeRows = ref([]);
  const intakeLoading = ref(false);
  const pendingUploadFiles = ref([]);
  const uploadSubmitting = ref(false);
  const confirmSubmitting = ref(false);
  const uploadPersonOptions = ref([]);

  const fileNameStem = (name) => (name ? String(name).replace(/\.[^.]+$/, '') : '');

  const nextPendingKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const selectedUploadPerson = computed(() =>
    uploadPersonOptions.value.find((p) => String(p.id) === String(uploadForm.value.personId))
  );

  const uploadNeedsIntake = computed(() =>
    !uploadForm.value.personId || !uploadForm.value.categoryCode
  );

  const categoryName = (code) => {
    if (code == null || code === '') return '';
    return flatCategories.value.find((c) => String(c.code) === String(code))?.name || String(code);
  };

  const parseJsonMaybe = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const intakeRowCtx = () => ({
    uploadPersonOptions: uploadPersonOptions.value,
    flatCategories: flatCategories.value
  });

  const mapIntakeVo = (vo, queueItem) => intakeVoToRow(vo, queueItem, intakeRowCtx());

  const loadUploadOptions = async () => {
    try {
      const data = await pagePerson({ pageNum: 1, pageSize: 500 });
      uploadPersonOptions.value = data.rows || [];
    } catch {
      uploadPersonOptions.value = [];
    }
    try {
      globalCategories.value = await listCategoryConfig();
    } catch {
      globalCategories.value = [];
    }
  };

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
    intakePreview.value = {};
    intakeRows.value = [];
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

  const materialBasePath = () =>
    route.path === HRAMS_MATERIAL_MGMT_PATH ? HRAMS_MATERIAL_MGMT_PATH : HRAMS_MATERIAL_MAINTAIN_PATH;

  const materialPersonQuery = (person) => {
    const q = {
      personId: String(person.id),
      archiveNo: person.archiveNo,
      name: person.name
    };
    if (route.path === HRAMS_MATERIAL_MGMT_PATH) {
      q.tab = 'upload';
    }
    return q;
  };

  const selectPerson = (row) => {
    router.replace({
      path: materialBasePath(),
      query: materialPersonQuery(row)
    });
  };

  const clearPerson = () => {
    const q = route.path === HRAMS_MATERIAL_MGMT_PATH ? { tab: 'upload' } : {};
    router.replace({ path: materialBasePath(), query: q });
  };

  watch(
    () => route.query,
    (q) => {
      personId.value = q.personId ? String(q.personId) : '';
      archiveNo.value = q.archiveNo || '';
      personName.value = q.name || '';
      if (personId.value) {
        load();
      } else {
        panel.value = { categories: [], totalFiles: 0, totalPages: 0 };
        materials.value = [];
        selections.value = [];
      }
    }
  );

  watch(
    () => route.fullPath,
    () => {
      const onMaintain = route.path === HRAMS_MATERIAL_MAINTAIN_PATH;
      const onMgmtUpload =
        route.path === HRAMS_MATERIAL_MGMT_PATH && String(route.query.tab || '') === 'upload';
      if (!onMaintain && !onMgmtUpload) {
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
    if (!personId.value || String(uploadForm.value.personId || '') !== String(personId.value)) {
      uploadForm.value.pageNo = 1;
      return;
    }
    const inCat = materials.value.filter((m) => m.categoryCode === uploadForm.value.categoryCode);
    const max = inCat.reduce((m, r) => Math.max(m, r.pageNo || 0), 0);
    uploadForm.value.pageNo = max > 0 ? max + 1 : 1;
  };

  const openUpload = () => {
    activeBatchId.value = null;
    activeBatchNo.value = '';
    uploadForm.value = createUploadForm();
    intakePreview.value = {};
    intakeRows.value = [];
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
    if (editorTarget.value === 'pending') {
      pendingUploadFiles.value = pendingUploadFiles.value.map((item) =>
        item.key === editorPendingKey.value
          ? { ...item, file, materialName: item.materialName || fileNameStem(file.name) || '' }
          : item
      );
      editorPendingKey.value = '';
      return;
    }
    addToPending(file);
  };

  const isImageFile = (file) =>
    file && (/^image\//i.test(file.type) || /\.(jpe?g|png|bmp)$/i.test(file.name || ''));

  const editPendingUpload = (key) => {
    const item = pendingUploadFiles.value.find((p) => p.key === key);
    if (!item?.file || !isImageFile(item.file)) return;
    editorPendingKey.value = key;
    editorFile.value = item.file;
    editorTarget.value = 'pending';
    editorVisible.value = true;
  };

  const pickImageForEditor = (file, target) => {
    if (!file) return;
    const isImg = isImageFile(file);
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

  const doIntakeUpload = async (queue) => {
    intakeLoading.value = true;
    let successCount = 0;
    const rows = [];
    try {
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const fd = new FormData();
        fd.append('file', item.file);
        fd.append('ocr', 'true');
        if (uploadForm.value.personId) fd.append('personId', uploadForm.value.personId);
        if (uploadForm.value.categoryCode) fd.append('categoryCode', uploadForm.value.categoryCode);
        if (uploadForm.value.materialName?.trim()) fd.append('materialName', uploadForm.value.materialName.trim());
        if (uploadForm.value.formDate) fd.append('formDate', uploadForm.value.formDate);
        if (uploadForm.value.pageCount) fd.append('pageCount', uploadForm.value.pageCount);
        const saved = await uploadMaterialIntake(fd);
        let vo = saved;
        if (saved?.id && !INTAKE_TERMINAL_STATUSES.has(saved.status)) {
          vo = await pollMaterialIntake(saved.id, getMaterialIntake);
        }
        rows.push(mapIntakeVo(vo, item));
        successCount += 1;
      }
      intakeRows.value = rows;
      clearPendingUpload();
      intakePreview.value = {};
      const failed = rows.filter((r) => r.status === 'recognize_failed');
      if (failed.length) {
        EleMessage.warning({
          message: failed.length === rows.length ? '识别失败，请核对文件或稍后重试' : `部分识别失败（${failed.length} 份）`,
          plain: true
        });
      } else {
        EleMessage.success({
          message: successCount > 1 ? `已完成 ${successCount} 份识别，请确认归属` : '识别完成，请确认归属',
          plain: true
        });
      }
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      intakeLoading.value = false;
    }
  };

  const doUpload = async () => {
    const queue = [...pendingUploadFiles.value];
    if (!queue.length) {
      return EleMessage.error({ message: '请先选择文件', plain: true });
    }

    uploadSubmitting.value = true;
    const intakeMode = uploadNeedsIntake.value;
    let pageNo = uploadForm.value.pageNo;
    let successCount = 0;
    try {
      if (intakeMode) {
        await doIntakeUpload(queue);
        return;
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
      if (!activeBatchId.value) {
        const pid = uploadForm.value.personId;
        if (!pid) {
          return EleMessage.error({ message: '请先选择人员', plain: true });
        }
        const batch = await createManualBatch(pid);
        activeBatchId.value = batch.id;
        activeBatchNo.value = batch.batchNo || '';
      }
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
        fd.append('ocrFlag', uploadForm.value.ocrFlag ? '1' : '0');
        fd.append('file', item.file);
        const saved = await uploadMaterial(uploadForm.value.personId, fd, activeBatchId.value);
        if (saved?.batchId) {
          activeBatchId.value = saved.batchId;
          activeBatchNo.value = saved.batchNo || activeBatchNo.value;
        }
        pageNo += 1;
        successCount += 1;
      }
      clearPendingUpload();
      uploadForm.value.materialName = '';
      uploadForm.value.formDate = '';
      uploadForm.value.pageNo = pageNo;
      if (String(uploadForm.value.personId) === String(personId.value)) {
        await load();
      }
      EleMessage.success({
        message: successCount > 1 ? `本批已上传 ${successCount} 份材料` : '上传成功，可继续选择文件',
        plain: true
      });
    } catch (e) {
      if (!intakeMode && successCount > 0) {
        pendingUploadFiles.value = queue.slice(successCount);
        uploadForm.value.pageNo = pageNo;
        if (String(uploadForm.value.personId) === String(personId.value)) {
          await load();
        }
      }
      EleMessage.error({
        message: successCount > 0 ? `已上传 ${successCount} 份，后续失败：${e.message}` : e.message,
        plain: true
      });
    } finally {
      uploadSubmitting.value = false;
    }
  };

  const confirmIntakeRow = async (row) => {
    if (!row.id) {
      return EleMessage.error({ message: '缺少待审核记录ID', plain: true });
    }
    if (!row.personId || !row.categoryCode) {
      return EleMessage.error({ message: '请先确认人员和目录', plain: true });
    }
    confirmSubmitting.value = true;
    try {
      await confirmMaterialIntake(row.id, {
        personId: row.personId,
        categoryCode: row.categoryCode,
        materialName: row.materialName,
        formDate: row.formDate,
        pageNo: row.pageNo,
        pageCount: row.pageCount
      });
      row.status = 'archived';
      row.statusText = '已归档';
      EleMessage.success({ message: '已确认归属', plain: true });
      if (String(row.personId) === String(personId.value)) {
        await load();
      }
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      confirmSubmitting.value = false;
    }
  };

  const rejectIntakeRow = async (row) => {
    if (!row?.id) {
      return EleMessage.error({ message: '缺少待审核记录ID', plain: true });
    }
    confirmSubmitting.value = true;
    try {
      await rejectMaterialIntake(row.id, '管理员驳回');
      row.status = 'rejected';
      row.statusText = '已驳回';
      EleMessage.success({ message: '已驳回', plain: true });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      confirmSubmitting.value = false;
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
    await loadUploadOptions();
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
    intakeRows,
    intakeLoading,
    pendingUploadFiles,
    uploadSubmitting,
    confirmSubmitting,
    uploadPersonOptions,
    selectedUploadPerson,
    uploadNeedsIntake,
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
    editPendingUpload,
    runIntakePreview,
    doUpload,
    confirmIntakeRow,
    rejectIntakeRow,
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
