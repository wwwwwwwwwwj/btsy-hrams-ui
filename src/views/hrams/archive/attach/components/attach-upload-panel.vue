<template>
  <div class="hrams-v2-card upload-card">
    <div class="upload-title">选择本地档案文件夹或 ZIP</div>
    <div class="upload-desc">{{ uploadHint }}</div>
    <input ref="fileInputRef" type="file" webkitdirectory multiple class="folder-input" @change="onFilesChange" />
    <input ref="zipInputRef" type="file" accept=".zip" class="folder-input" @change="onZipChange" />
    <div class="hrams-v2-actions">
      <el-button type="primary" @click="chooseFolder">选择文件夹</el-button>
      <el-button @click="chooseZip">选择 ZIP</el-button>
      <el-button :loading="scanLoading" :disabled="!fileCount" @click="$emit('scan')">扫描预览</el-button>
      <el-button v-if="mode === 'incremental'" :loading="scanLoading" :disabled="!fileCount" @click="$emit('rescan')">重新扫描</el-button>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { unzipArchiveToFiles } from '@/utils/hrams-attach-files';

  const props = defineProps({
    mode: { type: String, default: 'batch' },
    scanLoading: Boolean,
    fileCount: { type: Number, default: 0 }
  });

  const emit = defineEmits(['files-changed', 'scan', 'rescan']);

  const fileInputRef = ref(null);
  const zipInputRef = ref(null);

  const uploadHint = computed(() =>
    props.mode === 'incremental'
      ? '请选择增补目录表和增补材料（文件夹或 zip），校验通过后执行挂接。'
      : '请选择包含人员档案文件夹的总目录，或直接上传按人员打包的 zip。'
  );

  const chooseFolder = () => fileInputRef.value?.click?.();
  const chooseZip = () => zipInputRef.value?.click?.();

  const onFilesChange = (event) => {
    const list = Array.from(event.target.files || []);
    if (zipInputRef.value) zipInputRef.value.value = '';
    emit('files-changed', list);
  };

  const onZipChange = async (event) => {
    const zip = event.target.files?.[0];
    event.target.value = '';
    if (!zip) return;
    if (fileInputRef.value) fileInputRef.value.value = '';
    try {
      const list = await unzipArchiveToFiles(zip);
      EleMessage.success({ message: `已解压 ${list.length} 个文件`, plain: true });
      emit('files-changed', list);
    } catch (e) {
      EleMessage.error({ message: e.message || 'ZIP 解压失败', plain: true });
    }
  };

  defineExpose({ clearInputs: () => {
    if (fileInputRef.value) fileInputRef.value.value = '';
    if (zipInputRef.value) zipInputRef.value.value = '';
  } });
</script>

<style scoped>
  .upload-card { padding: 22px 24px; margin-bottom: 24px; }
  .upload-title { margin-bottom: 6px; font-size: 16px; font-weight: 600; }
  .upload-desc { margin: 0; font-size: 13px; color: #6c7e97; }
  .folder-input { display: none; }
  .upload-card .hrams-v2-actions { margin-top: 18px; }
</style>
