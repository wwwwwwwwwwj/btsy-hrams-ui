<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <el-space wrap>
          <el-tag>已盘 {{ summary.total || 0 }}</el-tag>
          <el-tag type="success">合格 {{ summary.qualified || 0 }}</el-tag>
          <el-tag type="warning">待整改 {{ summary.remediationRequired || 0 }}</el-tag>
          <el-tag>整改中 {{ summary.doing || 0 }}</el-tag>
          <el-tag type="info">已完成 {{ summary.done || 0 }}</el-tag>
          <el-button type="primary" v-permission="'hrams:inventory:run'" @click="doScan">扫描存量</el-button>
        </el-space>
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
        <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
          <template #risk="{ row }">{{ riskLabel(row.riskLevel) }}</template>
          <template #task="{ row }">{{ taskLabel(row.taskStatus) }}</template>
        </ele-pro-table>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { inventorySummary, pageInventory, scanInventory } from '@/api/hrams/inventory';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsInventory' });

  const tableRef = ref(null);
  const summary = ref({});
  const columns = [
    { prop: 'archiveNo', label: '档案编号', width: 120 },
    { prop: 'personName', label: '姓名', width: 90 },
    { prop: 'materialId', label: '材料ID', width: 140 },
    { columnKey: 'risk', label: '风险标记', width: 140, slot: 'risk' },
    { columnKey: 'task', label: '整改状态', width: 100, slot: 'task' },
    { prop: 'issueText', label: '说明', minWidth: 220, showOverflowTooltip: true },
    { prop: 'dueTime', label: '期限', minWidth: 160 }
  ];

  const riskLabel = (v) => ({
    unknown: '未知',
    suspected: '疑似',
    qualified: '合格',
    remediation_required: '待整改'
  }[v] || v);
  const taskLabel = (v) => ({ open: '待整改', doing: '整改中', done: '已完成' }[v] || v);

  const datasource = ({ pages }) => pageInventory({ ...pages });
  const loadSummary = async () => {
    summary.value = await inventorySummary();
  };

  const doScan = async () => {
    try {
      const n = await scanInventory();
      EleMessage.success({ message: `新增盘点 ${n} 条，未改历史业务状态`, plain: true });
      await loadSummary();
      tableRef.value?.reload?.({ page: 1 });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  onMounted(loadSummary);
</script>
