<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div>
          <div class="hrams-v2-title">数据备份</div>
          <div class="hrams-v2-desc">备份含 manifest.json + OSS 附件包；增量恢复回灌数据，全量恢复会清空本租户业务数据并尝试回传附件</div>
        </div>
        <div class="hrams-v2-actions">
          <el-button type="primary" v-permission="'hrams:backup:create'" @click="doCreate">立即备份</el-button>
        </div>
      </div>
      <div class="hrams-v2-card" style="padding: 16px 20px">
        <el-table :data="jobs" size="small">
          <el-table-column prop="backupTime" label="备份时间" min-width="160" />
          <el-table-column prop="triggerType" label="触发" width="90">
            <template #default="{ row }">{{ row.triggerType === 'manual' ? '手动' : row.triggerType }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'info'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="大小" width="100">
            <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
          </el-table-column>
          <el-table-column prop="filePath" label="路径" min-width="220" show-overflow-tooltip />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'success'"
                link
                type="primary"
                v-permission="'hrams:backup:restore'"
                @click="doRestore(row, 'merge')"
              >增量恢复</el-button>
              <el-button
                v-if="row.status === 'success'"
                link
                type="danger"
                v-permission="'hrams:backup:restore'"
                @click="doRestore(row, 'full')"
              >全量恢复</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage } from 'ele-admin-plus';
  import { createBackup, listBackups, restoreBackup } from '@/api/hrams/backup';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsBackup' });
  const jobs = ref([]);

  const load = async () => {
    jobs.value = await listBackups();
  };

  const formatSize = (n) => {
    if (!n) return '-';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  };

  const doCreate = async () => {
    await createBackup();
    EleMessage.success({ message: '备份任务已完成', plain: true });
    load();
  };

  const doRestore = async (row, mode) => {
    const full = mode === 'full';
    await ElMessageBox.confirm(
      full
        ? '将清空当前租户干部档案业务数据后从备份全量恢复，并尝试从 oss-files.zip 回传附件。不可撤销，仅限灾备演练。'
        : '将用该备份增量回灌业务表（同 ID 覆盖）。仅建议在测试或补数场景操作。',
      full ? '确认全量恢复' : '确认增量恢复',
      { type: full ? 'error' : 'warning' }
    );
    await restoreBackup(row.id, full ? 'CONFIRM_FULL_RESTORE' : 'CONFIRM_RESTORE', mode);
    EleMessage.success({ message: '恢复完成', plain: true });
    load();
  };

  onMounted(load);
</script>
