<template>
  <div class="hrams-material-mgmt">
    <material-upload-entry />
  </div>
</template>

<script setup>
  import MaterialUploadEntry from './upload/index.vue';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsMaterialMgmt' });
</script>

<style scoped>
  .hrams-material-mgmt {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    padding: 0 2px;
  }

  .hrams-material-mgmt :deep(.ele-page) {
    padding: 0;
    min-height: 0;
  }

  .hrams-material-mgmt :deep(.ele-page-body) {
    padding: 0;
  }
</style>
