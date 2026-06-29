<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div>
          <div class="hrams-v2-title">提醒记录</div>
          <div class="hrams-v2-desc">系统扫描与规则触发的提醒历史</div>
        </div>
      </div>
      <div class="hrams-v2-card" style="padding: 16px 20px">
        <el-table :data="records">
          <el-table-column prop="remindType" label="类型" width="120">
            <template #default="{ row }">{{ typeLabel(row.remindType) }}</template>
          </el-table-column>
          <el-table-column prop="content" label="内容" min-width="200" />
          <el-table-column prop="remindTime" label="时间" width="170" />
        </el-table>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { listRemindRecords } from '@/api/hrams/remind';
  import { remindTypeLabel } from '../remind-shared';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsRemindRecords' });
  const records = ref([]);
  const typeLabel = remindTypeLabel;

  onMounted(async () => {
    records.value = await listRemindRecords();
  });
</script>
