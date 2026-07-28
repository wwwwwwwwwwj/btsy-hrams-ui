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
        @source-changed="onSourceChanged"
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
        :attachable-file-count="attachableFileCount"
        :can-confirm="canConfirm"
        :confirm-loading="confirmLoading"
        :scan-loading="scanLoading"
        :can-delete-row="canDeleteRow"
        @confirm="doConfirmAttach"
        @cancel-person="cancelPerson"
        @restore-person="restorePerson"
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
      const key = String(r.personId);
      if (!map.has(key)) {
        map.set(key, {
          personId: r.personId,
          label: `${r.archiveNo || ''}${r.personName || ''}`,
          hasPass: false,
          hasFail: false
        });
      }
      const entry = map.get(key);
      if (r.status === 'pass') {
        entry.hasPass = true;
      }
      // 与后端 OK_STATUS = {"pass", "catalog"} 保持一致，
      // 只要有一条非 pass 且非 catalog 就是不通过
      if (r.status !== 'pass' && r.status !== 'catalog') {
        entry.hasFail = true;
      }
    });
    return [...map.values()].map((p) => ({
      personId: p.personId,
      label: p.label,
      attachable: p.hasPass && !p.hasFail,
      cancelled: cancelledPersonIds.value.has(String(p.personId))
    }));
  });

  const attachableFileCount = computed(
    () => previewRows.value.filter((r) => r.status === 'pass').length
  );

  const confirmedPersonIds = computed(() =>
    personSummaries.value
      .filter((p) => p.attachable && !p.cancelled)
      .map((p) => String(p.personId))
  );

  const canConfirm = computed(
    () =>
      Boolean(batchId.value) &&
      attachableFileCount.value > 0 &&
      confirmedPersonIds.value.length > 0 &&
      !scanLoading.value
  );

  const visiblePreviewRows = computed(() =>
    previewRows.value.filter((r) => !r.personId || !cancelledPersonIds.value.has(String(r.personId)))
  );

  /** 人员根目录下的文件夹段（不含文件名）；目录表行返回空 */
  const folderSegmentsOf = (relativePath) => {
    if (!relativePath) return [];
    const parts = String(relativePath).split(/[/\\]/).filter(Boolean);
    if (parts.length <= 2) return [];
    return parts.slice(1, -1);
  };

  const ensureChild = (parent, id, label) => {
    let node = parent.children.find((c) => c.id === id);
    if (!node) {
      node = { id, label, children: [] };
      parent.children.push(node);
    }
    return node;
  };

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
      const fileNode = {
        id: `f-${r.index}-${r.relativePath || r.fileName}`,
        label: `${r.fileName || '—'} [${r.statusText || r.status}]`,
        rowIndex: r.index
      };

      if (r.status === 'catalog') {
        ensureChild(personNode, `c-${pid}-catalog`, '目录表').children.push(fileNode);
        return;
      }

      const segments = folderSegmentsOf(r.relativePath);
      if (!segments.length) {
        ensureChild(personNode, `c-${pid}-other`, '未归类').children.push(fileNode);
        return;
      }
      let parent = personNode;
      let pathKey = '';
      segments.forEach((seg) => {
        pathKey = pathKey ? `${pathKey}/${seg}` : seg;
        parent = ensureChild(parent, `c-${pid}-${pathKey}`, seg);
      });
      parent.children.push(fileNode);
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
    uploadPanelRef.value?.clearSource?.() || uploadPanelRef.value?.clearZip?.();
    zipFile.value = null;
    router.replace({ path: route.path, query: { ...route.query, mode: nextMode } });
  };

  const onSourceChanged = (source) => {
    uploadSession += 1;
    zipFile.value = source?.zip || null;
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
            st.scanStatus === 'scanning' ? '服务端正在解压并校验，请稍候…' : '等待扫描…';
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
    const attachableCount = previewRows.value.filter((r) => r.status === 'pass').length;
    if (attachableCount === 0) {
      EleMessage.warning({
        message: '未发现可挂接材料，请确认上传包中包含材料文件',
        plain: true,
        duration: 6000
      });
    }
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
      EleMessage.error({ message: '请先选择 ZIP 或文件夹', plain: true });
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
        personIds: selectedIds.value.map(String),
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
    const isUnmatched = row.message && row.message.includes('目录表未匹配到该文件');
    const isDuplicate = row.message && row.message.includes('不同分类下出现相同文件');
    const isNoCheck = row.message && row.message.includes('未参与校验');
    if (mode.value === 'incremental') {
      return row.status === 'exists' || isUnmatched || isDuplicate || isNoCheck;
    }
    return isUnmatched || isDuplicate || isNoCheck;
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
    if (attachableFileCount.value === 0 || confirmedPersonIds.value.length === 0) {
      EleMessage.warning({
        message: '未发现可挂接材料，请确认上传包中包含材料文件',
        plain: true
      });
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
