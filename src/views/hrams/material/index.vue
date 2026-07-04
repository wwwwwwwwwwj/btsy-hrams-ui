<template>
  <div class="hrams-material-mgmt">
    <el-tabs v-model="activeTab" class="material-mgmt-tabs" @tab-change="onTabChange">
      <el-tab-pane label="批次记录" name="batch" lazy>
        <material-batch-mgmt />
      </el-tab-pane>
      <el-tab-pane label="上传材料" name="upload" lazy>
        <material-upload-entry />
      </el-tab-pane>
      <el-tab-pane label="待归属审核" name="intake" lazy>
        <material-intake-pending />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import MaterialBatchMgmt from './batch/index.vue';
  import MaterialIntakePending from './intake-pending/index.vue';
  import MaterialUploadEntry from './upload/index.vue';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsMaterialMgmt' });

  const route = useRoute();
  const router = useRouter();

  const tabFromQuery = () => {
    const t = route.query.tab;
    if (t === 'batch') return 'batch';
    if (t === 'intake') return 'intake';
    return 'upload';
  };

  const activeTab = ref(tabFromQuery());

  watch(
    () => route.query.tab,
    () => {
      const next = tabFromQuery();
      if (activeTab.value !== next) {
        activeTab.value = next;
      }
    }
  );

  const onTabChange = (name) => {
    const q = { ...route.query };
    if (name === 'upload' || name === 'intake') {
      q.tab = name;
    } else {
      delete q.tab;
    }
    delete q.openUpload;
    router.replace({ path: route.path, query: q });
  };
</script>

<style scoped>
  .hrams-material-mgmt {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    padding: 0 2px;
  }

  .material-mgmt-tabs {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .material-mgmt-tabs :deep(.el-tabs__header) {
    margin: 0 0 16px;
    padding: 10px 16px 0;
    background: #fff;
    border: 1px solid #eef2f8;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 2%);
  }

  .material-mgmt-tabs :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: #eef2f8;
  }

  .material-mgmt-tabs :deep(.el-tabs__item) {
    height: 40px;
    line-height: 40px;
    font-size: 14px;
    padding: 0 20px;
  }

  .material-mgmt-tabs :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: visible;
  }

  .material-mgmt-tabs :deep(.el-tab-pane) {
    min-height: 0;
  }

  .hrams-material-mgmt :deep(.ele-page) {
    padding: 0;
    min-height: 0;
  }

  .hrams-material-mgmt :deep(.ele-page-body) {
    padding: 0;
  }
</style>
