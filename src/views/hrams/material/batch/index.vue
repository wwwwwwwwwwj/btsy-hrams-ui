<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <el-form :inline="true" :model="where" class="ele-form-search">
          <el-form-item label="批次号">
            <el-input v-model="where.batchNo" clearable placeholder="模糊查询" style="width: 200px" />
          </el-form-item>
          <el-form-item label="批次类型">
            <el-select v-model="where.batchType" clearable placeholder="全部" style="width: 140px">
              <el-option v-for="opt in batchTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="where.status" clearable placeholder="全部" style="width: 120px">
              <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" v-permission="'hrams:batch:list'" @click="reload(where, 1)">查询</el-button>
            <el-button @click="resetWhere">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
        <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
          <template #batchType="{ row }">{{ batchTypeLabel(row.batchType) }}</template>
          <template #status="{ row }">{{ batchStatusLabel(row.status) }}</template>
          <template #action="{ row }">
            <el-button link type="primary" v-permission="'hrams:batch:list'" @click="showDetail(row)">明细</el-button>
          </template>
        </ele-pro-table>
      </div>
    </div>

    <el-dialog v-model="detailVisible" :title="detailTitle" width="960px" destroy-on-close>
      <el-descriptions v-if="detailBatch" :column="3" border size="small" class="batch-summary">
        <el-descriptions-item label="批次号">{{ detailBatch.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ batchTypeLabel(detailBatch.batchType) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ batchStatusLabel(detailBatch.status) }}</el-descriptions-item>
        <el-descriptions-item label="人员数">{{ detailBatch.personCount ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="扫描文件数">{{ detailBatch.fileCount ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="成功入库">{{ detailBatch.successCount ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="校验失败数">{{ detailBatch.errorCount ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ detailBatch.createTime || '—' }}</el-descriptions-item>
        <el-descriptions-item v-if="detailBatch.failMessage" label="失败说明" :span="3">
          {{ detailBatch.failMessage }}
        </el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailRows" size="small" max-height="420" class="batch-items-table">
        <el-table-column prop="archiveNo" label="档案编号" width="100" />
        <el-table-column prop="personName" label="姓名" width="72" />
        <el-table-column prop="relativePath" label="相对路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="categoryCode" label="类号" width="64" />
        <el-table-column label="序号" width="56">
          <template #default="{ row }">{{ row.itemNo ?? '—' }}</template>
        </el-table-column>
        <el-table-column prop="materialName" label="材料名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="形成日期" width="108">
          <template #default="{ row }">{{ formatDateDay(row.formDate) }}</template>
        </el-table-column>
        <el-table-column label="校验" width="88">
          <template #default="{ row }">{{ row.statusText || row.status || '—' }}</template>
        </el-table-column>
        <el-table-column prop="message" label="说明" min-width="140" show-overflow-tooltip />
        <el-table-column label="材料ID" width="100">
          <template #default="{ row }">{{ row.materialId || '—' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { getMaterialBatch, listMaterialBatchItems, pageMaterialBatch } from '@/api/hrams/material-batch';
  import { formatDateDay } from '@/utils/hrams-date';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsMaterialBatchMgmt' });

  const DIR_MARKER = '.hrams-dir-marker';

  const tableRef = ref(null);
  const where = ref({ batchNo: '', batchType: '', status: '' });
  const detailVisible = ref(false);
  const detailTitle = ref('');
  const detailBatch = ref(null);
  const detailRows = ref([]);

  const batchTypeOptions = [
    { value: 'manual', label: '手工上传' },
    { value: 'batch_attach', label: '批量挂接' },
    { value: 'incremental_attach', label: '增补挂接' }
  ];

  const statusOptions = [
    { value: 'created', label: '进行中' },
    { value: 'scanning', label: '扫描中' },
    { value: 'ready', label: '待确认' },
    { value: 'confirming', label: '确认中' },
    { value: 'confirmed', label: '已完成' },
    { value: 'failed', label: '失败' },
    { value: 'cancelled', label: '已取消' },
    { value: 'expired', label: '已过期' }
  ];

  const batchTypeLabel = (type) => {
    const hit = batchTypeOptions.find((o) => o.value === type);
    return hit ? hit.label : type || '—';
  };

  const batchStatusLabel = (status) => {
    const hit = statusOptions.find((o) => o.value === status);
    return hit ? hit.label : status || '—';
  };

  const isDirMarkerItem = (item) => {
    if (!item) return true;
    if (item.originalFileName === DIR_MARKER || item.normalizedFileName === DIR_MARKER) {
      return true;
    }
    const rp = (item.relativePath || '').replace(/\\/g, '/');
    return rp === DIR_MARKER || rp.endsWith(`/${DIR_MARKER}`);
  };

  const columns = ref([
    { prop: 'batchNo', label: '批次号', minWidth: 160 },
    { prop: 'batchType', label: '类型', width: 100, slot: 'batchType' },
    { prop: 'status', label: '状态', width: 96, slot: 'status' },
    { prop: 'personCount', label: '人员', width: 72 },
    { prop: 'fileCount', label: '文件', width: 72 },
    { prop: 'successCount', label: '成功', width: 72 },
    { prop: 'errorCount', label: '失败', width: 72 },
    { prop: 'createTime', label: '创建时间', width: 170 },
    { columnKey: 'action', label: '操作', width: 80, slot: 'action', fixed: 'right' }
  ]);

  const datasource = ({ pages }) => {
    const params = { ...where.value, ...pages };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });
    return pageMaterialBatch(params);
  };

  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => {
    where.value = { batchNo: '', batchType: '', status: '' };
    reload(where.value, 1);
  };

  const showDetail = async (row) => {
    const batchId = row?.id;
    if (!batchId) return;
    detailTitle.value = `批次 ${row.batchNo || batchId}`;
    detailBatch.value = null;
    detailRows.value = [];
    detailVisible.value = true;
    try {
      detailBatch.value = await getMaterialBatch(batchId);
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
    try {
      const items = await listMaterialBatchItems(batchId);
      detailRows.value = (items || []).filter((i) => !isDirMarkerItem(i));
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };
</script>

<style scoped>
  .batch-summary {
    margin-bottom: 12px;
  }
  .batch-items-table {
    width: 100%;
  }
</style>
