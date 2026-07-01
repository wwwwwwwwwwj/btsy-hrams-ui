<template>
  <div class="hrams-v2-card upload-card">
    <div class="upload-title">上传档案 ZIP</div>
    <div class="upload-desc">{{ uploadHint }}</div>
    <input ref="zipInputRef" type="file" accept=".zip,application/zip" class="folder-input" @change="onZipChange" />
    <div v-if="zipName" class="upload-zip-name">已选择：{{ zipName }}</div>
    <div class="hrams-v2-actions">
      <el-button type="primary" @click="chooseZip">选择 ZIP</el-button>
      <el-button :loading="scanLoading" :disabled="attachBusy || !zipFile" v-permission="'hrams:archive:attach'" @click="$emit('scan')">上传并扫描</el-button>
      <el-button :loading="scanLoading" :disabled="attachBusy || !batchId" v-permission="'hrams:archive:attach'" @click="$emit('rescan')">重新扫描</el-button>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';

  const props = defineProps({
    mode: { type: String, default: 'batch' },
    scanLoading: Boolean,
    attachBusy: { type: Boolean, default: false },
    batchId: { type: [String, Number], default: null }
  });

  const emit = defineEmits(['zip-changed', 'scan', 'rescan']);

  const zipInputRef = ref(null);
  const zipFile = ref(null);
  const zipName = ref('');

  const uploadHint = computed(() =>
    props.mode === 'incremental'
      ? '请上传包含增补目录表与增补材料的 ZIP，服务端解压并校验。'
      : '请上传包含人员档案文件夹结构的 ZIP，服务端解压并校验。'
  );

  const chooseZip = () => zipInputRef.value?.click?.();

  const onZipChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.zip')) {
      EleMessage.error({ message: '请选择 .zip 文件', plain: true });
      return;
    }
    zipFile.value = file;
    zipName.value = file.name;
    emit('zip-changed', file);
  };

  defineExpose({
    getZipFile: () => zipFile.value,
    clearZip: () => {
      zipFile.value = null;
      zipName.value = '';
      if (zipInputRef.value) {
        zipInputRef.value.value = '';
      }
    }
  });
</script>

<style scoped>
  .upload-card { padding: 22px 24px; margin-bottom: 24px; }
  .upload-title { margin-bottom: 6px; font-size: 16px; font-weight: 600; }
  .upload-desc { margin: 0; font-size: 13px; color: #6c7e97; }
  .upload-zip-name { margin-top: 10px; font-size: 13px; color: #1f2d3d; }
  .folder-input { display: none; }
  .upload-card .hrams-v2-actions { margin-top: 18px; }
</style>
