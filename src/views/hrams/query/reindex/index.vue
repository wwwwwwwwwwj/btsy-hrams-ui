<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div>
          <div class="hrams-v2-title">索引管理</div>
          <div class="hrams-v2-desc">重建全文检索索引（材料元数据与 Tika 正文，可选 ES）。任务提交后后台执行。</div>
        </div>
        <div class="hrams-v2-actions">
          <el-button type="primary" v-permission="'hrams:search:reindex'" @click="doReindex">重建索引</el-button>
          <el-button v-permission="'hrams:search:reindex'" @click="loadLogs">刷新日志</el-button>
        </div>
      </div>
      <div class="hrams-v2-card" style="padding: 16px 20px">
        <el-table :data="logs" size="small" border>
          <el-table-column prop="createTime" label="时间" width="170" />
          <el-table-column prop="action" label="动作" width="120" />
          <el-table-column prop="status" label="状态" width="80" />
          <el-table-column prop="materialId" label="材料ID" width="100" />
          <el-table-column prop="message" label="说明" min-width="200" show-overflow-tooltip />
        </el-table>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { reindexFulltext, listSearchSyncLogs } from '@/api/hrams/query';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsQueryReindex' });
  const logs = ref([]);

  const loadLogs = async () => {
    logs.value = await listSearchSyncLogs(50);
  };

  const doReindex = async () => {
    await reindexFulltext();
    EleMessage.success({ message: '索引重建任务已提交', plain: true });
    setTimeout(loadLogs, 800);
  };

  onMounted(loadLogs);
</script>
