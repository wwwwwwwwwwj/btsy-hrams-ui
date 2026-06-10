<template>
  <ele-page hide-footer>
    <ele-card :header="`材料管理：${archiveNo} ${personName}`">
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
          </el-form>
          <div class="toolbar">
            <el-button type="primary" v-permission="'hrams:archive:upload'" @click="openUpload">上传</el-button>
            <el-button v-permission="'hrams:archive:download'" :disabled="!selectedUploaded.length" @click="doDownload">下载</el-button>
            <el-button type="danger" v-permission="'hrams:archive:remove'" :disabled="!selections.length" @click="doBatchDelete">删除</el-button>
          </div>
          <el-table ref="tableRef" :data="displayMaterials" style="margin-top:12px" :row-class-name="rowClass" @selection-change="onSelectionChange">
            <el-table-column type="selection" width="48" :selectable="rowSelectable" />
            <el-table-column prop="displayNo" label="序号" width="90" />
            <el-table-column prop="materialName" label="材料名称" min-width="160" />
            <el-table-column prop="formDate" label="形成时间" width="120" />
            <el-table-column prop="pageCount" label="页数" width="70" />
            <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button link v-permission="'hrams:archive:preview'" :disabled="row.fileStatus !== 'uploaded'" @click="preview(row)">预览</el-button>
                <el-button link v-permission="'hrams:archive:upload'" @click="openEdit(row)">修改</el-button>
                <el-button link type="danger" v-permission="'hrams:archive:remove'" @click="removeFile(row)">删附件</el-button>
                <el-button link type="danger" v-permission="'hrams:archive:remove'" @click="removeRow(row)">删记录</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </ele-card>

    <el-dialog v-model="uploadVisible" title="上传材料" width="520px">
      <el-form label-width="90px">
        <el-form-item label="分类">
          <el-select v-model="uploadForm.categoryCode" style="width:100%">
            <el-option v-for="c in flatCategories" :key="c.code" :label="c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="序号" required><el-input-number v-model="uploadForm.itemNo" :min="1" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="uploadForm.materialName" /></el-form-item>
        <el-form-item label="形成日期"><el-date-picker v-model="uploadForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="页数"><el-input-number v-model="uploadForm.pageCount" :min="1" /></el-form-item>
        <el-form-item label="文件" required><input type="file" @change="onUploadFile" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible=false">取消</el-button>
        <el-button type="primary" @click="doUpload">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="修改材料" width="480px">
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
  </ele-page>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import {
    getMaterialPanel, listMaterials, uploadMaterial, updateMaterial, deleteMaterial, deleteMaterialFile,
    previewMaterial, batchDeleteMaterials, downloadMaterialsZip
  } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsArchiveMaterial' });
  const route = useRoute();
  const personId = computed(() => route.query.personId);
  const archiveNo = computed(() => route.query.archiveNo || '');
  const personName = computed(() => route.query.name || '');
  const panel = ref({ categories: [], totalFiles: 0, totalPages: 0 });
  const categoryCode = ref('1');
  const materials = ref([]);
  const keyword = ref('');
  const selections = ref([]);
  const uploadVisible = ref(false);
  const editVisible = ref(false);
  const uploadForm = ref({ categoryCode: '1', itemNo: 1, materialName: '', pageCount: 1, formDate: '', file: null });
  const editForm = ref({});

  const flatCategories = computed(() => {
    const list = [];
    const walk = (nodes) => (nodes || []).forEach((n) => { list.push(n); if (n.children?.length) walk(n.children); });
    walk(panel.value.categories);
    return list;
  });

  const displayMaterials = computed(() => materials.value);
  const selectedUploaded = computed(() => selections.value.filter((r) => r.fileStatus === 'uploaded'));

  const rowClass = ({ row }) => (row.fileStatus === 'uploaded' ? '' : 'is-disabled');
  const rowSelectable = (row) => row.fileStatus === 'uploaded';

  const loadPanel = async () => {
    panel.value = await getMaterialPanel(personId.value);
    if (!flatCategories.value.find((c) => c.code === categoryCode.value) && flatCategories.value.length) {
      categoryCode.value = flatCategories.value[0].code;
    }
  };

  const loadMaterials = async () => {
    materials.value = await listMaterials(personId.value, { categoryCode: categoryCode.value, keyword: keyword.value || undefined });
  };

  const load = async () => {
    await loadPanel();
    await loadMaterials();
  };

  const onSelectCat = (code) => { categoryCode.value = code; keyword.value = ''; loadMaterials(); };
  const resetSearch = () => { keyword.value = ''; loadMaterials(); };
  const onSelectionChange = (rows) => { selections.value = rows; };

  const openUpload = () => {
    uploadForm.value = { categoryCode: categoryCode.value, itemNo: 1, materialName: '', pageCount: 1, formDate: '', file: null };
    uploadVisible.value = true;
  };
  const onUploadFile = (e) => { uploadForm.value.file = e.target.files?.[0]; };

  const doUpload = async () => {
    if (!uploadForm.value.file) return EleMessage.error({ message: '请选择文件', plain: true });
    const fd = new FormData();
    fd.append('categoryCode', uploadForm.value.categoryCode);
    fd.append('itemNo', uploadForm.value.itemNo);
    if (uploadForm.value.materialName) fd.append('materialName', uploadForm.value.materialName);
    if (uploadForm.value.pageCount) fd.append('pageCount', uploadForm.value.pageCount);
    if (uploadForm.value.formDate) fd.append('formDate', uploadForm.value.formDate);
    fd.append('file', uploadForm.value.file);
    try {
      await uploadMaterial(personId.value, fd);
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

  const preview = (row) => previewMaterial(row.id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
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

  onMounted(load);
</script>

<style scoped>
  .summary { margin-top: 12px; font-size: 13px; color: #666; }
  .toolbar { margin-top: 8px; display: flex; gap: 8px; }
  :deep(.is-disabled) { color: #999; background: #f9f9fc; }
  :deep(mark) { background: #ffe58f; padding: 0 2px; }
</style>
