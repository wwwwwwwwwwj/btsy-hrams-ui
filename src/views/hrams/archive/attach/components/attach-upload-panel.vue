<template>
  <div class="hrams-v2-card upload-card">
    <div class="upload-title">上传档案材料</div>
    <div class="upload-desc">{{ uploadHint }}</div>
    <input ref="zipInputRef" type="file" accept=".zip,application/zip" class="folder-input" @change="onZipChange" />
    <input
      ref="folderInputRef"
      type="file"
      class="folder-input"
      webkitdirectory
      directory
      multiple
      @change="onFolderChange"
    />
    <div v-if="sourceLabel" class="upload-zip-name">已选择：{{ sourceLabel }}</div>
    <div class="hrams-v2-actions">
      <el-button type="primary" :disabled="attachBusy || packing" @click="chooseZip">选择 ZIP</el-button>
      <el-button :loading="packing" :disabled="attachBusy || packing" @click="chooseFolder">选择文件夹</el-button>
      <el-button
        :loading="scanLoading || packing"
        :disabled="attachBusy || packing || !zipFile"
        v-permission="'hrams:archive:attach'"
        @click="$emit('scan')"
      >
        上传并扫描
      </el-button>
      <el-button
        :loading="scanLoading"
        :disabled="attachBusy || packing || !batchId"
        v-permission="'hrams:archive:attach'"
        @click="$emit('rescan')"
      >
        重新扫描
      </el-button>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import {
    ATTACH_ZIP_MAX_FILES,
    ATTACH_ZIP_MAX_SIZE,
    assertAttachFolderLimits,
    zipFolderFiles
  } from '@/utils/hrams-attach-files';

  const props = defineProps({
    mode: { type: String, default: 'batch' },
    scanLoading: Boolean,
    attachBusy: { type: Boolean, default: false },
    batchId: { type: [String, Number], default: null }
  });

  const emit = defineEmits(['source-changed', 'scan', 'rescan']);

  const zipInputRef = ref(null);
  const folderInputRef = ref(null);
  const zipFile = ref(null);
  const sourceLabel = ref('');
  const packing = ref(false);
  const fromFolder = ref(false);

  const maxMb = Math.round(ATTACH_ZIP_MAX_SIZE / 1024 / 1024);
  const uploadHint = computed(() =>
    props.mode === 'incremental'
      ? `可上传 ZIP，或选择文件夹（本地打包后走异步扫描）。单次不超过 ${ATTACH_ZIP_MAX_FILES} 个文件、${maxMb}MB。`
      : `可上传 ZIP，或选择文件夹（本地打包后走异步扫描）。单次不超过 ${ATTACH_ZIP_MAX_FILES} 个文件、${maxMb}MB。`
  );

  const chooseZip = () => zipInputRef.value?.click?.();
  const chooseFolder = () => folderInputRef.value?.click?.();

  const clearSource = () => {
    zipFile.value = null;
    sourceLabel.value = '';
    fromFolder.value = false;
    packing.value = false;
    if (zipInputRef.value) zipInputRef.value.value = '';
    if (folderInputRef.value) folderInputRef.value.value = '';
  };

  const emitSource = () => {
    emit('source-changed', {
      type: 'zip',
      zip: zipFile.value,
      fromFolder: fromFolder.value
    });
  };

  const onZipChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      EleMessage.error({ message: '请选择 .zip 文件', plain: true });
      return;
    }
    if (file.size > ATTACH_ZIP_MAX_SIZE) {
      EleMessage.error({ message: `ZIP 超过 ${maxMb}MB，请拆分后分批挂接`, plain: true });
      return;
    }
    fromFolder.value = false;
    zipFile.value = file;
    sourceLabel.value = file.name;
    emitSource();
  };

  const onFolderChange = async (event) => {
    const list = Array.from(event.target.files || []);
    event.target.value = '';
    if (!list.length) return;

    const files = [];
    const paths = [];
    list.forEach((file) => {
      const rel = (file.webkitRelativePath || file.name).replace(/\\/g, '/');
      if (!rel || rel.endsWith('/')) return;
      if (rel.includes('__MACOSX') || rel.endsWith('.DS_Store')) return;
      files.push(file);
      paths.push(rel);
    });

    packing.value = true;
    try {
      assertAttachFolderLimits(files);
      const root = paths[0]?.split('/')?.[0] || 'folder';
      const packed = await zipFolderFiles(files, paths, `${root}.zip`);
      fromFolder.value = true;
      zipFile.value = packed;
      sourceLabel.value = `文件夹 ${root}（${files.length} 个文件，已打包）`;
      emitSource();
      EleMessage.success({ message: '文件夹已打包，可上传并扫描', plain: true });
    } catch (e) {
      clearSource();
      EleMessage.error({ message: e.message || '文件夹打包失败', plain: true });
    } finally {
      packing.value = false;
    }
  };

  defineExpose({
    getSource: () => ({
      type: zipFile.value ? 'zip' : null,
      zip: zipFile.value,
      fromFolder: fromFolder.value
    }),
    getZipFile: () => zipFile.value,
    clearZip: clearSource,
    clearSource
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
