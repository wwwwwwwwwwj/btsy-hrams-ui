<template>
  <div class="material-page">

    <MaterialBatchList
      v-if="currentView === 'batches'"
      :batches="batchList"
      :retrying-id="retryingBatchId"
      @new-batch="checkingVisible = true"
      @open-workbench="openWorkbench"
      @open-archive="openArchive"
      @retry-batch="retryBatch"
    />

    <MaterialWorkbench
      v-if="currentView === 'workbench' && activeBatch"
      :batch="activeBatch"
      @back="currentView = 'batches'; loadBatches()"
      @switch-to-archive="switchToArchive"
      @confirm="onConfirm"
      @delete="onDelete"
      @return="onReturn"
    />

    <MaterialArchive
      v-if="currentView === 'archive' && activeBatch"
      :batch="activeBatch"
      @back="currentView = 'batches'; loadBatches()"
      @switch-to-workbench="switchToWorkbench"
      @delete="onDelete"
    />

    <MaterialCheckingDialog
      v-model="checkingVisible"
      @done="onCheckingDone"
    />

  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { ElMessage } from 'element-plus';
  import MaterialCheckingDialog from './components/material-checking-dialog.vue';
  import MaterialBatchList from './components/material-batch-list.vue';
  import MaterialWorkbench from './components/material-workbench.vue';
  import MaterialArchive from './components/material-archive.vue';
  import { listBatches, listMaterials, confirmMaterial, returnMaterial, deleteMaterialApi, retryMaterialAi } from '@/api/hrams/checking';

  defineOptions({ name: 'HramsMaterialUploadEntry' });

  const currentView = ref('batches');
  const checkingVisible = ref(false);
  const activeBatch = ref(null);
  const batchList = reactive([]);
  const retryingBatchId = ref(null);

  // ── 加载批次 ──
  async function loadBatches() {
    try {
      const res = await listBatches();
      batchList.splice(0, batchList.length, ...(res.data?.data || []));
    } catch (e) {
      console.error('加载批次失败', e);
    }
  }

  onMounted(loadBatches);

  async function retryBatch(batch) {
    if (!batch?.id || retryingBatchId.value) return;
    retryingBatchId.value = batch.id;
    try {
      const res = await listMaterials(batch.id);
      const items = res.data?.data || [];
      const targets = items.filter((i) => i.ossKey && (i.status === 'pending' || i.status === 'ocr_failed'));
      if (!targets.length) {
        ElMessage.warning('没有可重新识别的材料（需已入库且未确认）');
        return;
      }
      let ok = 0;
      let fail = 0;
      for (const item of targets) {
        try {
          await retryMaterialAi(item);
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      if (fail && ok) ElMessage.warning(`整批识别结束：成功 ${ok} 份，失败 ${fail} 份`);
      else if (ok) ElMessage.success(`整批识别完成 ${ok} 份，请到分类确认台核对`);
      else ElMessage.error(`整批识别失败 ${fail} 份`);
      await loadBatches();
    } catch (e) {
      ElMessage.error(e.message || '整批识别失败');
    } finally {
      retryingBatchId.value = null;
    }
  }

  // ── 上传完成（批次和材料已在 dialog 中处理） ──
  async function onCheckingDone() {
    checkingVisible.value = false;
    await loadBatches();
  }

  // ── 打开工作台 ──
  async function openWorkbench(batch) {
    try {
      const res = await listMaterials(batch.id);
      activeBatch.value = { ...batch, items: (res.data?.data || []).map(m => ({ ...m, _returnReason: m.returnReason, _issue: null })) };
      currentView.value = 'workbench';
    } catch (e) {
      ElMessage.error('加载材料失败');
    }
  }

  function openArchive(batch) {
    activeBatch.value = { ...batch };
    currentView.value = 'archive';
  }

  function switchToArchive() {
    currentView.value = 'archive';
  }

  async function switchToWorkbench() {
    try {
      const batch = activeBatch.value;
      if (!batch) return;
      const res = await listMaterials(batch.id);
      activeBatch.value = { ...batch, items: (res.data?.data || []).map(m => ({ ...m, _returnReason: m.returnReason, _issue: null })) };
      currentView.value = 'workbench';
    } catch (e) {
      ElMessage.error('加载材料失败');
    }
  }

  // ── 材料操作 ──
  function checkBizError(res, defaultMsg) {
    if (res.data?.code && res.data.code !== 200) {
      throw new Error(res.data.msg || defaultMsg);
    }
  }

  async function onConfirm({ material, form }) {
    try {
      const res = await confirmMaterial(material.id, form);
      checkBizError(res, '确认归类失败');
      ElMessage.success('已确认归类');
      if (activeBatch.value) {
        const idx = activeBatch.value.items.findIndex(i => i.id === material.id);
        if (idx >= 0) {
          activeBatch.value.items[idx] = { ...activeBatch.value.items[idx], ...form, status: 'confirmed' };
          activeBatch.value.confirmedCount = activeBatch.value.items.filter(i => i.status !== 'pending' && i.status !== 'ocr_failed').length;
        }
      }
    } catch (e) { ElMessage.error(e.message || '操作失败'); }
  }

  async function onDelete({ material }) {
    try {
      const res = await deleteMaterialApi(material.id);
      checkBizError(res, '删除失败');
      ElMessage.success('已删除');
      if (activeBatch.value) {
        activeBatch.value.items = activeBatch.value.items.filter(i => i.id !== material.id);
        // 失败文件不计入总数
        const validItems = activeBatch.value.items.filter(i => i.status !== 'failed');
        activeBatch.value.totalFiles = validItems.length;
        activeBatch.value.confirmedCount = validItems.filter(i => i.status !== 'pending').length;
      }
    } catch (e) { ElMessage.error(e.message || '操作失败'); }
  }

  async function onReturn({ material, reason }) {
    try {
      const res = await returnMaterial(material.id, reason);
      checkBizError(res, '退回失败');
      ElMessage.success('已退回');
      if (activeBatch.value) {
        const idx = activeBatch.value.items.findIndex(i => i.id === material.id);
        if (idx >= 0) {
          activeBatch.value.items[idx] = { ...activeBatch.value.items[idx], status: 'returned', returnReason: reason };
          // 进度 = 已确认 + 已退回
          activeBatch.value.confirmedCount = activeBatch.value.items.filter(i => i.status !== 'pending' && i.status !== 'ocr_failed').length;
        }
      }
    } catch (e) { ElMessage.error(e.message || '操作失败'); }
  }
</script>

<style scoped>
.material-page { flex: 1; min-height: 0; display: flex; flex-direction: column; background: #fff; border-radius: 16px; border: 1px solid #eef2f8; overflow: hidden; }
</style>
