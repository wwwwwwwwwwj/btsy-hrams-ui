<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page attach-page">
      <div class="hrams-v2-card-toolbar" style="margin-bottom: 12px">
        <el-button @click="goBack">返回档案管理</el-button>
      </div>

      <div class="type-grid">
        <div
          :class="['hrams-v2-card', 'type-card', { active: mode === 'batch', disabled: attachBusy }]"
          @click="switchMode('batch')"
        >
          <h3>批量挂接</h3>
          <p>适用于首次建档，按人员文件夹逐人校验目录表与实体材料。</p>
        </div>
        <div
          :class="['hrams-v2-card', 'type-card', { active: mode === 'incremental', disabled: attachBusy }]"
          @click="switchMode('incremental')"
        >
          <h3>增补挂接</h3>
          <p>适用于已有档案增补，增加新旧目录表一致性校验。</p>
        </div>
      </div>

      <attach-upload-panel
        ref="uploadPanelRef"
        :mode="mode"
        :scan-loading="scanLoading"
        :attach-busy="attachBusy"
        :batch-id="batchId"
        @zip-changed="onZipChanged"
        @scan="startScan"
        @rescan="rescanBatch"
      />

      <div v-if="scanPhaseText" class="scan-phase">{{ scanPhaseText }}</div>

      <attach-preview-panel
        :person-summaries="personSummaries"
        :preview-tree="previewTree"
        :visible-preview-rows="visiblePreviewRows"
        :file-count="fileCount"
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
  import { computed, onBeforeUnmount, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import {
    uploadAttachZip,
    getAttachScanStatus,
    getAttachScanPreview,
    excludeAttachPaths,
    rescanAttachBatch,
    confirmAttachBatch
  } from '@/api/hrams/attach';
  import { HRAMS_ARCHIVE_LIST } from '@/utils/hrams-routes';
  import AttachUploadPanel from './components/attach-upload-panel.vue';
  import AttachPreviewPanel from './components/attach-preview-panel.vue';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsArchiveAttach' });

  const route = useRoute();
  const router = useRouter();
  const uploadPanelRef = ref(null);
  const mode = ref(route.query.mode === 'incremental' ? 'incremental' : 'batch');
  const zipFile = ref(null);
  const batchId = ref(null);
  const previewRows = ref([]);
  const fileCount = ref(0);
  const scanLoading = ref(false);
  const confirmLoading = ref(false);
  const attachBusy = computed(() => scanLoading.value || confirmLoading.value);
  const scanPhaseText = ref('');
  const cancelledPersonIds = ref(new Set());
  let pollTimer = null;
  let pollGeneration = 0;
  let pollReject = null;
  let uploadSession = 0;

  const POLL_CANCELLED = 'POLL_CANCELLED';
  /** 约 20 分钟（1.5s 间隔） */
  const POLL_MAX_ATTEMPTS = 800;

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
      .map((p) => p.personId)
  );

  const canConfirm = computed(() => Boolean(batchId.value) && confirmedPersonIds.value.length > 0 && !scanLoading.value);

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
        id: `f-${r.index}-${r.relativePath || r.fileName}`,
        label: `${r.fileName || '—'} [${r.statusText || r.status}]`,
        rowIndex: r.index
      });
    });
    return roots;
  });

  const switchMode = (nextMode) => {
    if (scanLoading.value || confirmLoading.value) {
      EleMessage.warning({ message: '挂接处理中，请等待完成', plain: true });
      return;
    }
    if (nextMode === mode.value) {
      return;
    }
    uploadSession += 1;
    mode.value = nextMode;
    stopPoll(POLL_CANCELLED);
    batchId.value = null;
    previewRows.value = [];
    fileCount.value = 0;
    scanPhaseText.value = '';
    cancelledPersonIds.value = new Set();
    uploadPanelRef.value?.clearZip?.();
    router.replace({ path: route.path, query: { ...route.query, mode: nextMode } });
  };

  const onZipChanged = (file) => {
    uploadSession += 1;
    zipFile.value = file;
    batchId.value = null;
    previewRows.value = [];
    fileCount.value = 0;
    scanPhaseText.value = '';
    cancelledPersonIds.value = new Set();
    stopPoll(POLL_CANCELLED);
  };

  const stopPoll = (reason) => {
    pollGeneration += 1;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (pollReject) {
      const reject = pollReject;
      pollReject = null;
      reject(new Error(reason || POLL_CANCELLED));
    }
  };

  onBeforeUnmount(() => stopPoll(POLL_CANCELLED));

  const pollUntilReady = (id) => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (pollReject) {
      const prev = pollReject;
      pollReject = null;
      prev(new Error(POLL_CANCELLED));
    }
    const generation = ++pollGeneration;
    let pollAttempts = 0;
    let tickInFlight = false;

    return new Promise((resolve, reject) => {
      pollReject = reject;
      const tick = async () => {
        if (generation !== pollGeneration) {
          return;
        }
        if (tickInFlight) {
          return;
        }
        tickInFlight = true;
        pollAttempts += 1;
        if (pollAttempts > POLL_MAX_ATTEMPTS) {
          tickInFlight = false;
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
          pollReject = null;
          scanPhaseText.value = '';
          reject(new Error('扫描超时，请稍后刷新状态或重新上传'));
          return;
        }
        try {
          const st = await getAttachScanStatus(id);
          if (generation !== pollGeneration) {
            return;
          }
          fileCount.value = st.fileCount || 0;
          if (st.scanStatus === 'ready') {
            if (pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
            pollReject = null;
            scanPhaseText.value = '';
            resolve(st);
            return;
          }
          if (st.scanStatus === 'failed') {
            if (pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
            pollReject = null;
            scanPhaseText.value = '';
            reject(new Error(st.message || '扫描失败'));
            return;
          }
          scanPhaseText.value =
            st.scanStatus === 'processing' ? '服务端正在解压并校验，请稍候…' : '等待扫描…';
        } catch (e) {
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
          pollReject = null;
          reject(e);
        } finally {
          tickInFlight = false;
        }
      };
      tick();
      pollTimer = setInterval(tick, 1500);
    });
  };

  const loadPreview = async (id) => {
    previewRows.value = await getAttachScanPreview(id);
    const dupMsg = previewRows.value.find(
      (r) => r.message && r.message.includes('同一人员存在多个文件夹')
    );
    if (dupMsg) {
      EleMessage.warning({ message: dupMsg.message, plain: true, duration: 6000 });
    }
  };

  const startScan = async () => {
    if (confirmLoading.value) {
      EleMessage.warning({ message: '正在确认挂接，请稍候', plain: true });
      return;
    }
    const zip = uploadPanelRef.value?.getZipFile?.() || zipFile.value;
    if (!zip) {
      EleMessage.error({ message: '请先选择 ZIP 文件', plain: true });
      return;
    }
    if (!selectedIds.value.length) {
      EleMessage.error({ message: '请从档案管理选择需要挂接的人员', plain: true });
      return;
    }
    scanLoading.value = true;
    previewRows.value = [];
    const session = uploadSession;
    const modeAtStart = mode.value;
    try {
      const { batchId: id } = await uploadAttachZip({
        mode: modeAtStart,
        personIds: selectedIds.value,
        zip
      });
      if (session !== uploadSession || modeAtStart !== mode.value) {
        return;
      }
      batchId.value = id;
      await pollUntilReady(id);
      if (session !== uploadSession || modeAtStart !== mode.value) {
        batchId.value = null;
        return;
      }
      await loadPreview(id);
    } catch (e) {
      if (e.message !== POLL_CANCELLED) {
        EleMessage.error({ message: e.message, plain: true });
      }
    } finally {
      scanLoading.value = false;
    }
  };

  const rescanBatch = async () => {
    if (!batchId.value) {
      return;
    }
    if (confirmLoading.value) {
      EleMessage.warning({ message: '正在确认挂接，请稍候', plain: true });
      return;
    }
    scanLoading.value = true;
    try {
      await rescanAttachBatch(batchId.value);
      await pollUntilReady(batchId.value);
      await loadPreview(batchId.value);
    } catch (e) {
      if (e.message !== POLL_CANCELLED) {
        EleMessage.error({ message: e.message, plain: true });
      }
    } finally {
      scanLoading.value = false;
    }
  };

  const canDeleteRow = (row) => {
    if (!batchId.value || !row.relativePath) return false;
    if (row.index == null || row.index < 0) return false;
    if (row.status === 'pass' || row.status === 'catalog') return false;
    if (row.message && row.message.includes('文件命名不规范')) return false;
    if (mode.value === 'incremental') {
      return row.status === 'exists' || (row.message && row.message.includes('目录表未匹配到该文件'));
    }
    return row.message && row.message.includes('目录表未匹配到该文件');
  };

  const removePreviewRow = async (row) => {
    if (!canDeleteRow(row)) {
      EleMessage.error({ message: '该问题需修正 ZIP 后重新上传，不能仅删除行', plain: true });
      return;
    }
    scanLoading.value = true;
    try {
      await excludeAttachPaths(batchId.value, [row.relativePath]);
      await pollUntilReady(batchId.value);
      await loadPreview(batchId.value);
    } catch (e) {
      if (e.message !== POLL_CANCELLED) {
        EleMessage.error({ message: e.message, plain: true });
      }
    } finally {
      scanLoading.value = false;
    }
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
    if (!batchId.value) {
      return;
    }
    confirmLoading.value = true;
    try {
      await confirmAttachBatch({
        batchId: batchId.value,
        confirmedPersonIds: confirmedPersonIds.value
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
  .type-card.disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
  .type-card.active {
    border-color: #2c6e9e;
    background: #ecf5fc;
  }
  .type-card h3 { margin: 0 0 8px; color: #1f2d3d; }
  .type-card p { margin: 0; font-size: 13px; color: #6c7e97; }
  .scan-phase {
    margin: -12px 0 16px;
    font-size: 13px;
    color: #2c6e9e;
  }
</style>
