<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <div class="page-head">
        <div>
          <div class="title">待归档材料池</div>
          <div class="desc">扫描或接收的文件在此确认人员与目录后归档</div>
        </div>
        <el-button @click="$router.push('/hrams/archive')">返回档案管理</el-button>
      </div>
      <el-form :inline="true" :model="where" class="ele-form-search">
        <el-form-item label="状态">
          <el-select v-model="where.status" clearable style="width: 120px">
            <el-option label="待归档" value="pending" />
            <el-option label="已归档" value="archived" />
            <el-option label="已忽略" value="ignored" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="where.fileName" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reload">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
        <template #status="{ row }">{{ statusLabel(row.status) }}</template>
        <template #suggest="{ row }">
          <span v-if="row.suggestCategoryCode">{{ row.suggestCategoryCode }}-{{ row.suggestItemNo }}</span>
          <span v-else class="muted">—</span>
        </template>
        <template #action="{ row }">
          <el-button v-if="row.status === 'pending'" link type="primary" v-permission="'hrams:pool:archive'" @click="openArchive(row)">确认归档</el-button>
          <el-button v-if="row.status === 'pending'" link v-permission="'hrams:pool:ignore'" @click="doIgnore(row)">忽略</el-button>
          <el-button v-if="row.materialId" link type="primary" @click="goMaterial(row)">查看材料</el-button>
          <el-button v-if="row.status !== 'archived'" link type="danger" @click="doDelete(row)">删除</el-button>
        </template>
      </ele-pro-table>
    </ele-card>

    <el-dialog v-model="archiveVisible" title="确认归档" width="560px">
      <el-form label-width="90px">
        <el-form-item label="干部" required>
          <el-input :model-value="personLabel" readonly style="width:280px;margin-right:8px" />
          <el-button @click="pickPersonVisible = true">选择</el-button>
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="archiveForm.categoryCode" style="width:100%">
            <el-option v-for="c in flatCategories" :key="c.code" :label="c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="序号" required>
          <el-input-number v-model="archiveForm.itemNo" :min="1" />
        </el-form-item>
        <el-form-item label="材料名称"><el-input v-model="archiveForm.materialName" /></el-form-item>
        <el-form-item label="页数"><el-input-number v-model="archiveForm.pageCount" :min="1" /></el-form-item>
        <el-form-item label="形成日期">
          <el-date-picker v-model="archiveForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="archiveForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="archiveVisible = false">取消</el-button>
        <el-button type="primary" :loading="archiveLoading" @click="submitArchive">确定归档</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pickPersonVisible" title="选择干部" width="720px">
      <el-table :data="personList" height="360" @row-click="onPickPerson">
        <el-table-column prop="archiveNo" label="档案编号" width="120" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="status" label="状态" width="90" />
      </el-table>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';

  import {
    pageMaterialPool, archiveFromPool, ignoreMaterialPool, deleteMaterialPool,
    pageArchivePersons, listCategories
  } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsArchivePool' });
  const router = useRouter();
  const tableRef = ref(null);
  const where = ref({ status: 'pending' });
  const archiveVisible = ref(false);
  const archiveLoading = ref(false);
  const pickPersonVisible = ref(false);
  const personList = ref([]);
  const categories = ref([]);
  const currentPool = ref(null);
  const archiveForm = ref({});
  const personId = ref(null);
  const personLabel = ref('');

  const statusLabel = (s) => ({ pending: '待归档', archived: '已归档', ignored: '已忽略' }[s] || s);

  const flatCategories = computed(() => {
    const list = [];
    const walk = (nodes) => (nodes || []).forEach((n) => { list.push(n); if (n.children?.length) walk(n.children); });
    walk(categories.value);
    return list;
  });

  const columns = ref([
    { type: 'index', width: 55, label: '序号' },
    { prop: 'fileName', label: '文件名', minWidth: 160, showOverflowTooltip: true },
    { prop: 'sourcePath', label: '来源路径', minWidth: 200, showOverflowTooltip: true },
    { columnKey: 'suggest', label: '推荐目录', width: 110, slot: 'suggest' },
    { columnKey: 'status', label: '状态', width: 90, slot: 'status' },
    { prop: 'createTime', label: '入池时间', minWidth: 160 },
    { columnKey: 'action', label: '操作', width: 220, slot: 'action' }
  ]);

  const datasource = ({ pages }) => pageMaterialPool({ ...pages, ...where.value });
  const reload = () => tableRef.value?.reload?.({ page: 1 });
  const reset = () => { where.value = { status: 'pending' }; reload(); };

  const loadPersons = async () => {
    const res = await pageArchivePersons({ pageNum: 1, pageSize: 200 });
    personList.value = res.rows || [];
  };

  const onPickPerson = async (row) => {
    personId.value = row.id;
    personLabel.value = `${row.archiveNo} ${row.name}`;
    pickPersonVisible.value = false;
    categories.value = await listCategories(row.id);
  };

  const openArchive = async (row) => {
    currentPool.value = row;
    personId.value = null;
    personLabel.value = '';
    categories.value = [];
    archiveForm.value = {
      poolId: row.id,
      categoryCode: row.suggestCategoryCode || '1',
      itemNo: row.suggestItemNo || 1,
      materialName: row.materialName || '',
      pageCount: undefined,
      formDate: '',
      remark: ''
    };
    archiveVisible.value = true;
    if (!personList.value.length) await loadPersons();
  };

  const submitArchive = async () => {
    if (!personId.value) return EleMessage.error({ message: '请选择干部', plain: true });
    archiveLoading.value = true;
    try {
      const data = { ...archiveForm.value, personId: personId.value };
      await archiveFromPool(data);
      EleMessage.success({ message: '归档成功', plain: true });
      archiveVisible.value = false;
      reload();
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      archiveLoading.value = false;
    }
  };

  const doIgnore = async (row) => {
    await ignoreMaterialPool(row.id);
    EleMessage.success({ message: '已忽略', plain: true });
    reload();
  };

  const doDelete = async (row) => {
    await deleteMaterialPool(row.id);
    EleMessage.success({ message: '已删除', plain: true });
    reload();
  };

  const goMaterial = (row) => {
    if (!row.materialId || !row.personId) return;
    router.push({
      path: '/hrams/archive/material',
      query: { personId: row.personId, materialId: row.materialId, archiveNo: row.archiveNo, name: row.personName }
    });
  };
</script>

<style scoped>
  .page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .title { font-size: 18px; font-weight: 600; }
  .desc { font-size: 13px; color: #666; margin-top: 4px; }
  .muted { color: #999; }
</style>
