<template>
  <div class="hrams-material-mgmt">
    <div class="hrams-v2-card material-mgmt-tabs">
      <el-radio-group v-model="activeTab" size="default">
        <el-radio-button value="batch">批次记录</el-radio-button>
        <el-radio-button value="upload">上传材料</el-radio-button>
        <el-radio-button value="intake">待归属审核</el-radio-button>
      </el-radio-group>
    </div>
    <material-batch-mgmt v-if="activeTab === 'batch'" />
    <material-intake-pending v-else-if="activeTab === 'intake'" />
    <archive-material-maintain v-else />
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import MaterialBatchMgmt from './batch/index.vue';
  import MaterialIntakePending from './intake-pending/index.vue';
  import ArchiveMaterialMaintain from '../archive/material/index.vue';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsMaterialMgmt' });

  const route = useRoute();
  const router = useRouter();

  const tabFromQuery = () => {
    const t = route.query.tab;
    if (t === 'upload') return 'upload';
    if (t === 'intake') return 'intake';
    return 'batch';
  };

  const activeTab = ref(tabFromQuery());

  watch(
    () => route.query.tab,
    () => {
      activeTab.value = tabFromQuery();
    }
  );

  watch(activeTab, (tab) => {
    if (tab === tabFromQuery()) {
      return;
    }
    const q = { ...route.query };
    if (tab === 'upload') {
      q.tab = 'upload';
    } else if (tab === 'intake') {
      q.tab = 'intake';
    } else {
      delete q.tab;
    }
    router.replace({ path: route.path, query: q });
  });
</script>

<style scoped>
  .hrams-material-mgmt {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 0;
    flex: 1;
  }
  .material-mgmt-tabs {
    margin-bottom: 12px;
    padding: 12px 16px 0;
  }
  .hrams-material-mgmt :deep(.ele-page) {
    padding-top: 0;
  }
</style>
