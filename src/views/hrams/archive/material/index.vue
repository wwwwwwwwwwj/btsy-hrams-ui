<template>
  <ele-page hide-footer>
    <ele-card v-if="!personId" header="选择干部">
      <el-form :inline="true" :model="pickWhere" class="ele-form-search">
        <el-form-item label="档案编号"><el-input v-model="pickWhere.archiveNo" clearable /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="pickWhere.name" clearable /></el-form-item>
        <el-form-item><el-button type="primary" @click="pickReload(pickWhere, 1)">查询</el-button></el-form-item>
      </el-form>
      <ele-pro-table ref="pickRef" row-key="id" :columns="pickColumns" :datasource="pickDatasource">
        <template #action="{ row }">
          <el-button link type="primary" @click="selectPerson(row)">进入材料维护</el-button>
        </template>
      </ele-pro-table>
    </ele-card>

    <ele-card v-else :header="cardTitle">
      <el-button v-if="!readOnly" link type="primary" style="margin-bottom:8px" @click="clearPerson">更换干部</el-button>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-menu :default-active="categoryCode" @select="onSelectCat">
            <el-menu-item v-for="c in flatCategories" :key="c.code" :index="c.code">
              {{ c.name }} ({{ c.fileCount || 0 }})
            </el-menu-item>
          </el-menu>
          <div class="summary">总份数 {{ panel.totalFiles || 0 }}，总页数 {{ panel.totalPages || 0 }}</div>
        </el-col>
        <el-col :span="18">
          <el-form :inline="true" @submit.prevent="">
            <el-form-item label="材料名称">
              <el-input v-model="keyword" clearable placeholder="关键字" @keyup.enter="loadMaterials" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadMaterials">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
            <el-form-item label="排序">
              <el-radio-group v-model="sortMode" size="small">
                <el-radio-button value="pageNo">按页号</el-radio-button>
                <el-radio-button value="createTime">按上传时间</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <div v-if="!readOnly" class="toolbar">
            <el-button type="primary" v-permission="'hrams:archive:upload'" @click="openUpload">上传</el-button>
            <el-button v-permission="'hrams:material:batch:list'" @click="openBatchDrawer">上传批次</el-button>
            <el-button v-permission="'hrams:material:category:config'" @click="openCategoryConfig">大类配置</el-button>
            <el-button v-permission="'hrams:archive:download'" :disabled="!selectedUploaded.length" @click="doDownload">下载</el-button>
            <el-button type="danger" v-permission="'hrams:archive:remove'" :disabled="!selections.length" @click="doBatchDelete">删除</el-button>
            <span v-if="activeBatchId" class="batch-hint">本轮批次：{{ activeBatchNo || activeBatchId }}</span>
          </div>
          <el-table ref="tableRef" :data="sortedMaterials" style="margin-top:12px" :row-class-name="rowClass" @selection-change="onSelectionChange">
            <el-table-column v-if="!readOnly" type="selection" width="48" :selectable="rowSelectable" />
            <el-table-column prop="pageNo" label="页号" width="70" />
            <el-table-column prop="displayNo" label="显示序号" width="90" />
            <el-table-column prop="materialName" label="材料名称" min-width="160" />
            <el-table-column prop="formDate" label="形成时间" width="120" />
            <el-table-column prop="pageCount" label="页数" width="70" />
            <el-table-column prop="batchNo" label="批次号" width="150" show-overflow-tooltip />
            <el-table-column prop="createTime" label="上传时间" width="170" />
            <el-table-column prop="sourceType" label="来源" width="100">
              <template #default="{ row }">{{ sourceLabel(row.sourceType) }}</template>
            </el-table-column>
            <el-table-column label="操作" :width="readOnly ? 120 : 320" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  v-permission="readOnly ? 'hrams:archive:preview' : 'hrams:archive:preview'"
                  :disabled="row.fileStatus !== 'uploaded'"
                  @click="preview(row)"
                >预览</el-button>
                <el-button
                  link
                  v-permission="'hrams:archive:print'"
                  :disabled="row.fileStatus !== 'uploaded'"
                  @click="doPrint(row)"
                >打印</el-button>
                <el-button
                  v-if="readOnly"
                  link
                  v-permission="'hrams:archive:download'"
                  :disabled="row.fileStatus !== 'uploaded'"
                  @click="downloadOne(row)"
                >下载</el-button>
                <template v-if="!readOnly">
                  <el-button link v-permission="'hrams:archive:upload'" @click="openEdit(row)">改信息</el-button>
                  <el-button link v-permission="'hrams:archive:upload'" @click="openPageNo(row)">改页号</el-button>
                  <el-button link v-permission="'hrams:archive:upload'" @click="openReplace(row)">替换文件</el-button>
                  <el-button link type="danger" v-permission="'hrams:archive:remove'" @click="removeFile(row)">删附件</el-button>
                  <el-button link type="danger" v-permission="'hrams:archive:remove'" @click="removeRow(row)">删记录</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </ele-card>

    <el-dialog v-model="uploadVisible" title="上传材料" width="520px">
      <el-form label-width="90px">
        <el-form-item label="分类">
          <el-select v-model="uploadForm.categoryCode" style="width:100%" @change="suggestPageNo">
            <el-option v-for="c in flatCategories" :key="c.code" :label="c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="页号" required><el-input-number v-model="uploadForm.pageNo" :min="1" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="uploadForm.materialName" placeholder="卷内目录材料名称" /></el-form-item>
        <el-form-item label="形成日期" required><el-date-picker v-model="uploadForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="页数" required><el-input-number v-model="uploadForm.pageCount" :min="1" /></el-form-item>
        <el-form-item label="文件" required><input type="file" @change="onUploadFile" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible=false">取消</el-button>
        <el-button type="primary" @click="doUpload">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="修改材料信息" width="480px">
      <el-form label-width="90px">
        <el-form-item label="名称"><el-input v-model="editForm.materialName" /></el-form-item>
        <el-form-item label="形成日期"><el-date-picker v-model="editForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="页数"><el-input-number v-model="editForm.pageCount" :min="0" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible=false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pageNoVisible" title="调整页号" width="360px">
      <el-form label-width="80px">
        <el-form-item label="新页号"><el-input-number v-model="pageNoForm.pageNo" :min="1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pageNoVisible=false">取消</el-button>
        <el-button type="primary" @click="savePageNo">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="batchDrawer" title="上传批次记录" size="520px">
      <ele-pro-table ref="batchRef" row-key="id" :columns="batchColumns" :datasource="batchDatasource">
        <template #action="{ row }">
          <el-button link type="primary" @click="showBatchDetail(row)">明细</el-button>
        </template>
      </ele-pro-table>
    </el-drawer>

    <el-dialog v-model="batchDetailVisible" :title="`批次 ${batchDetailTitle}`" width="720px">
      <el-table :data="batchMaterials" size="small">
        <el-table-column prop="categoryCode" label="大类" width="70" />
        <el-table-column prop="pageNo" label="页号" width="70" />
        <el-table-column prop="materialName" label="材料名称" min-width="140" />
        <el-table-column prop="formDate" label="形成时间" width="110" />
      </el-table>
    </el-dialog>

    <el-dialog v-model="categoryConfigVisible" title="材料大类配置" width="640px">
      <el-table :data="categoryConfigRows" size="small">
        <el-table-column prop="name" label="大类" min-width="280" />
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.enabledFlag" active-value="1" inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="必备(完整性)" width="120">
          <template #default="{ row }">
            <el-switch v-model="row.requiredFlag" active-value="1" inactive-value="0" :disabled="row.enabledFlag !== '1'" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="categoryConfigVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategoryConfigRows">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="replaceVisible" title="替换文件" width="480px">
      <el-form label-width="90px">
        <el-form-item label="新文件" required><input type="file" @change="onReplaceFile" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replaceVisible=false">取消</el-button>
        <el-button type="primary" @click="doReplace">确定</el-button>
      </template>
    </el-dialog>

    <material-image-editor v-model="editorVisible" :file="editorFile" @done="onImageEdited" />
  </ele-page>
</template>

<script setup>
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { pagePerson } from '@/api/hrams/person';
  import {
    getMaterialPanel, listMaterials, uploadMaterial, updateMaterial, deleteMaterial, deleteMaterialFile,
    previewMaterial, printMaterial, batchDeleteMaterials, downloadMaterialsZip, replaceMaterial, updateMaterialPageNo
  } from '@/api/hrams/archive';
  import { pageUploadBatch, listBatchMaterials } from '@/api/hrams/material-batch';
  import { listCategoryConfig, saveCategoryConfig } from '@/api/hrams/material-category';
  import { useUserStore } from '@/store/modules/user';
  import MaterialImageEditor from './components/material-image-editor.vue';
  import request from '@/utils/request';
  import { checkDownloadRes, download } from '@/utils/common';

  defineOptions({ name: 'HramsArchiveMaterial' });
  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();

  const personId = ref(route.query.personId ? String(route.query.personId) : '');
  const archiveNo = ref(route.query.archiveNo || '');
  const personName = ref(route.query.name || '');
  const readOnly = computed(() => route.query.view === 'archive');

  const cardTitle = computed(() =>
    readOnly.value
      ? `档案查阅：${archiveNo.value} ${personName.value}`
      : `材料管理：${archiveNo.value} ${personName.value}`
  );

  const pickRef = ref(null);
  const pickWhere = ref({});
  const pickColumns = ref([
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'deptName', label: '部门', minWidth: 120 },
    { columnKey: 'action', label: '操作', width: 130, slot: 'action' }
  ]);
  const pickDatasource = ({ pages, where: w }) => pagePerson({ ...pickWhere.value, ...w, ...pages });
  const pickReload = (w, page) => pickRef.value?.reload?.({ where: w, page });

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
  const tableRef = ref(null);
  const activeBatchId = ref(null);
  const activeBatchNo = ref('');
  const batchDrawer = ref(false);
  const batchRef = ref(null);
  const batchDetailVisible = ref(false);
  const batchDetailTitle = ref('');
  const batchMaterials = ref([]);
  const categoryConfigVisible = ref(false);
  const categoryConfigRows = ref([]);
  const batchColumns = ref([
    { prop: 'batchNo', label: '批次号', minWidth: 150 },
    { prop: 'materialCount', label: '材料数', width: 80 },
    { prop: 'createTime', label: '上传时间', width: 170 },
    { columnKey: 'action', label: '操作', width: 80, slot: 'action' }
  ]);

  const sourceLabel = (t) =>
    ({ manual: '手工上传', scan: '历史导入', replace: '替换上传' }[t] || t || '—');

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

  const rowClass = ({ row }) => {
    const classes = [];
    if (row.fileStatus !== 'uploaded') classes.push('is-disabled');
    if (highlightMaterialId.value && row.id === highlightMaterialId.value) classes.push('is-highlight');
    return classes.join(' ');
  };
  const rowSelectable = (row) => row.fileStatus === 'uploaded';

  const selectPerson = (row) => {
    router.replace({
      path: '/material',
      query: { personId: row.id, archiveNo: row.archiveNo, name: row.name }
    });
  };

  const clearPerson = () => {
    router.replace({ path: '/material' });
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
    suggestPageNo();
    uploadVisible.value = true;
  };

  const onImageEdited = (file) => {
    if (editorTarget.value === 'replace') {
      replaceForm.value.file = file;
      doReplace();
      return;
    }
    uploadForm.value.file = file;
    suggestPageNo();
  };

  const openBatchDrawer = () => {
    batchDrawer.value = true;
    nextTick(() => batchRef.value?.reload?.({ where: { personId: personId.value }, page: 1 }));
  };

  const batchDatasource = ({ pages }) => pageUploadBatch({ personId: personId.value, ...pages });

  const showBatchDetail = async (row) => {
    batchDetailTitle.value = row.batchNo;
    batchMaterials.value = await listBatchMaterials(row.id);
    batchDetailVisible.value = true;
  };
  const pickImageForEditor = (file, target) => {
    if (!file) return;
    const isImg = /^image\//i.test(file.type) || /\.(jpe?g|png|bmp)$/i.test(file.name || '');
    if (isImg) {
      editorFile.value = file;
      editorTarget.value = target;
      editorVisible.value = true;
      return;
    }
    if (target === 'upload') uploadForm.value.file = file;
    else replaceForm.value.file = file;
  };

  const onUploadFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    pickImageForEditor(f, 'upload');
  };

  const doUpload = async () => {
    if (!uploadForm.value.file) return EleMessage.error({ message: '请选择文件', plain: true });
    if (!uploadForm.value.materialName?.trim()) return EleMessage.error({ message: '请填写材料名称', plain: true });
    if (!uploadForm.value.formDate) return EleMessage.error({ message: '请选择形成日期', plain: true });
    if (!uploadForm.value.pageCount || uploadForm.value.pageCount < 1) {
      return EleMessage.error({ message: '请填写页数', plain: true });
    }
    const fd = new FormData();
    fd.append('categoryCode', uploadForm.value.categoryCode);
    fd.append('pageNo', uploadForm.value.pageNo);
    fd.append('materialName', uploadForm.value.materialName.trim());
    fd.append('pageCount', uploadForm.value.pageCount);
    fd.append('formDate', uploadForm.value.formDate);
    if (activeBatchId.value) fd.append('batchId', activeBatchId.value);
    fd.append('file', uploadForm.value.file);
    try {
      const saved = await uploadMaterial(personId.value, fd);
      if (saved?.batchId) {
        activeBatchId.value = saved.batchId;
        activeBatchNo.value = saved.batchNo || '';
      }
      uploadVisible.value = false;
      EleMessage.success({ message: '上传成功', plain: true });
      load();
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
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

  const openReplace = (row) => {
    replaceForm.value = { id: row.id, file: null };
    replaceVisible.value = true;
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

  const doPrint = (row) => {
    const operatorName = userStore.info?.nickName || userStore.info?.userName || '';
    printMaterial(row.id, { archiveNo: archiveNo.value, operatorName }).catch((e) =>
      EleMessage.error({ message: e.message, plain: true })
    );
  };

  const openCategoryConfig = async () => {
    categoryConfigRows.value = (await listCategoryConfig()).map((r) => ({ ...r }));
    categoryConfigVisible.value = true;
  };
  const saveCategoryConfigRows = async () => {
    const items = categoryConfigRows.value.map((r) => ({
      code: r.code,
      enabledFlag: r.enabledFlag,
      requiredFlag: r.requiredFlag
    }));
    await saveCategoryConfig(items);
    categoryConfigVisible.value = false;
    EleMessage.success({ message: '大类配置已保存', plain: true });
    if (personId.value) await load();
  };

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
</script>

<style scoped>
  .summary { margin-top: 12px; font-size: 13px; color: #666; }
  .toolbar { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .batch-hint { font-size: 12px; color: #666; margin-left: 8px; }
  :deep(.is-disabled) { color: #999; background: #f9f9fc; }
  :deep(.is-highlight) { background: #fffbe6 !important; }
</style>
