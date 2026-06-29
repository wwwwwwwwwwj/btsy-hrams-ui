<template>
  <ele-page hide-footer>
    <ele-card header="提醒记录">
      <el-table :data="records">
        <el-table-column prop="remindType" label="类型" width="120">
          <template #default="{ row }">{{ typeLabel(row.remindType) }}</template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="200" />
        <el-table-column prop="remindTime" label="时间" width="170" />
      </el-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { listRemindRecords } from '@/api/hrams/remind';
  import { remindTypeLabel } from '../remind-shared';

  defineOptions({ name: 'HramsRemindRecords' });
  const records = ref([]);
  const typeLabel = remindTypeLabel;

  onMounted(async () => {
    records.value = await listRemindRecords();
  });
</script>
