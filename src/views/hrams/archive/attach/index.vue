<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page attach-page">
      <div class="hrams-v2-card-toolbar" style="margin-bottom: 12px">
        <el-button @click="goBack">返回档案管理</el-button>
      </div>

      <div class="type-grid">
        <div :class="['hrams-v2-card', 'type-card', { active: mode === 'batch' }]" @click="switchMode('batch')">
          <h3>批量挂接</h3>
          <p>适用于首次建档，按人员文件夹逐人校验目录表与实体材料。</p>
        </div>
        <div :class="['hrams-v2-card', 'type-card', { active: mode === 'incremental' }]" @click="switchMode('incremental')">
          <h3>增补挂接</h3>
          <p>适用于已有档案增补，增加新旧目录表一致性校验。</p>
        </div>
      </div>

      <attach-upload-panel
        ref="uploadPanelRef"
        :mode="mode"
        :scan-loading="scanLoading"
        :file-count="files.length"
        @files-changed="onFilesChanged"
        @scan="scanPreview"
        @rescan="rescan"
      />

      <attach-preview-panel
        :person-summaries="personSummaries"
        :preview-tree="previewTree"
        :visible-preview-rows="visiblePreviewRows"
        :file-count="files.length"
        :selected-person-count="selectedIds.length"
        :confirmable-count="confirmedPersonIds.length"
        :can-confirm="canConfirm"
        :confirm-loading="confirmLoading"
        :can-delete-row="canDeleteRow"
        @confirm="doConfirmAttach"
        @cancel-person="cancelPerson"
        @restore-person="restorePerson"
        @remove-row="removePreviewRow"
      />
    </div>
  </ele-page>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { scanAttach, confirmAttach } from '@/api/hrams/attach';
  import { HRAMS_ARCHIVE_LIST } from '@/utils/hrams-routes';
  import AttachUploadPanel from './components/attach-upload-panel.vue';
  import AttachPreviewPanel from './components/attach-preview-panel.vue';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsArchiveAttach' });

  const route = useRoute();
  const router = useRouter();
  const uploadPanelRef = ref(null);
  const mode = ref(route.query.mode === 'incremental' ? 'incremental' : 'batch');
  const files = ref([]);
  const previewRows = ref([]);
  const scanLoading = ref(false);
  const confirmLoading = ref(false);
  const cancelledPersonIds = ref(new Set());

  const selectedIds = computed(() => String(route.query.ids || '').split(',').filter(Boolean));

  const personSummaries = computed(() => {
    const map = new Map();
    previewRows.value.forEach((r) => {
      if (!r.personId) return;
      if (!map.has(r.personId)) {
        map.set(r.personId, {
          personId: r.personId,
          label: `${r.archiveNo || ''}${r.personName || ''}`,
          attachable: Boolean(r.personAttachable)
        });
      }
    });
    return [...map.values()].map((p) => ({
      ...p,
      cancelled: cancelledPersonIds.value.has(String(p.personId))
    }));
  });

  const confirmedPersonIds = computed(() =>
    personSummaries.value
      .filter((p) => p.attachable && !p.cancelled)
      .map((p) => String(p.personId))
  );

  const canConfirm = computed(() => confirmedPersonIds.value.length > 0);

  const visiblePreviewRows = computed(() =>
    previewRows.value.filter((r) => !r.personId || !cancelledPersonIds.value.has(String(r.personId)))
  );

  const previewTree = computed(() => {
    const roots = [];
    const personMap = new Map();
    visiblePreviewRows.value.forEach((r) => {
      const pid = r.personId || 'unknown';
      if (!personMap.has(pid)) {
        const node = {
          id: `p-${pid}`,
          label: r.personName ? `${r.archiveNo || ''} ${r.personName}` : '未识别人员',
          children: []
        };
        personMap.set(pid, node);
        roots.push(node);
      }
      const personNode = personMap.get(pid);
      const cat = r.categoryCode || '—';
      let catNode = personNode.children.find((c) => c.id === `c-${pid}-${cat}`);
      if (!catNode) {
        catNode = { id: `c-${pid}-${cat}`, label: `类 ${cat}`, children: [] };
        personNode.children.push(catNode);
      }
      catNode.children.push({
        id: `f-${r.index}`,
        label: `${r.fileName || '—'} [${r.statusText || r.status}]`,
        rowIndex: r.index
      });
    });
    return roots;
  });

  const switchMode = (nextMode) => {
    mode.value = nextMode;
    cancelledPersonIds.value = new Set();
    previewRows.value = [];
    router.replace({ path: route.path, query: { ...route.query, mode: nextMode } });
  };

  const onFilesChanged = (list) => {
    files.value = list;
    previewRows.value = [];
    cancelledPersonIds.value = new Set();
  };

  const scanPreview = async () => {
    if (!files.value.length) {
      EleMessage.error({ message: '请先选择文件夹', plain: true });
      return;
    }
    scanLoading.value = true;
    try {
      previewRows.value = await scanAttach({
        mode: mode.value,
        personIds: selectedIds.value,
        files: files.value
      });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      scanLoading.value = false;
    }
  };

  const rescan = async () => {
    uploadPanelRef.value?.clearInputs?.();
    await scanPreview();
  };

  const canDeleteRow = (row) => {
    if (row.index == null || row.index < 0) return false;
    if (row.status === 'pass' || row.status === 'catalog') return false;
    if (mode.value === 'incremental') {
      return row.status === 'exists' || (row.message && row.message.includes('目录表未匹配到该文件'));
    }
    return row.message && row.message.includes('目录表未匹配到该文件');
  };

  const removePreviewRow = async (row) => {
    if (!canDeleteRow(row)) {
      EleMessage.error({ message: '该问题需修正文件夹后重新上传，不能仅删除行', plain: true });
      return;
    }
    files.value = files.value.filter((_, i) => i !== row.index);
    await scanPreview();
  };

  const cancelPerson = (personId) => {
    cancelledPersonIds.value = new Set([...cancelledPersonIds.value, String(personId)]);
  };

  const restorePerson = (personId) => {
    const next = new Set(cancelledPersonIds.value);
    next.delete(String(personId));
    cancelledPersonIds.value = next;
  };

  const doConfirmAttach = async () => {
    confirmLoading.value = true;
    try {
      await confirmAttach({
        mode: mode.value,
        personIds: selectedIds.value,
        confirmedPersonIds: confirmedPersonIds.value,
        files: files.value
      });
      EleMessage.success({ message: '挂接完成', plain: true });
      goBack();
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      confirmLoading.value = false;
    }
  };

  const goBack = () => router.push(HRAMS_ARCHIVE_LIST);
</script>

<style scoped>
  .type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 24px;
  }
  .type-card {
    padding: 22px 24px;
    cursor: pointer;
    border: 2px solid transparent;
  }
  .type-card.active {
    border-color: #2c6e9e;
    background: #ecf5fc;
  }
  .type-card h3 { margin: 0 0 8px; color: #1f2d3d; }
  .type-card p { margin: 0; font-size: 13px; color: #6c7e97; }
</style>
