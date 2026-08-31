<template>
  <div class="batch-list">
    <div class="list-header">
      <h2>材料批次管理</h2>
      <el-button type="primary" size="large" round @click="$emit('new-batch')">
        <el-icon class="btn-icon"><Upload /></el-icon>上传新批次
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-fields">
        <div class="field-group">
          <label>批次号</label>
          <el-input v-model="search.batchNo" placeholder="如 BATCH-20260615" clearable style="width:160px" />
        </div>
        <div class="field-group">
          <label>档案编号</label>
          <el-input v-model="search.archiveNo" placeholder="如 20260001" clearable style="width:140px" />
        </div>
        <div class="field-group">
          <label>姓名</label>
          <el-input v-model="search.name" placeholder="请输入姓名" clearable style="width:120px" />
        </div>
        <div class="field-group">
          <label>身份证号</label>
          <el-input v-model="search.idCard" placeholder="请输入身份证号" clearable style="width:180px" />
        </div>
        <div class="field-group">
          <label>状态</label>
          <el-select v-model="search.status" placeholder="全部状态" clearable style="width:130px">
            <el-option label="待确认" value="pending" />
            <el-option label="AI处理中" value="processing" />
            <el-option label="已完成" value="done" />
            <el-option label="异常" value="error" />
          </el-select>
        </div>
        <el-button type="primary" round @click="doSearch">搜索</el-button>
        <el-button round @click="resetSearch">重置</el-button>
      </div>
      <span class="search-stats">共 {{ filteredBatches.length }} 条</span>
    </div>

    <!-- 批次卡片列表 -->
    <div class="batch-cards">
      <div v-if="!filteredBatches.length" class="empty">暂无批次数据，请上传新材料</div>
      <div v-for="b in filteredBatches" :key="b.id" class="batch-card">
        <div class="card-main">
          <div class="card-top">
            <span class="person-name">{{ b.personName }}</span>
            <span class="archive-no">
              <el-icon><Folder /></el-icon>{{ b.archiveNo }}
            </span>
            <span class="batch-id">{{ b.batchNo }}</span>
            <span v-if="b.idCard" class="idcard-text">
              <el-icon><Postcard /></el-icon>{{ b.idCard }}
            </span>
          </div>
          <div class="card-meta">
            上传人：{{ b.uploader }} · {{ b.createTime }} · 共 {{ b.fileCount ?? 0 }} 份
          </div>
          <div v-if="failCount(b) > 0 || b.note" class="fail-hint">
            <el-icon><WarningFilled /></el-icon>
            <span v-if="failCount(b) > 0">AI处理失败 {{ failCount(b) }} 份</span>
            <span v-if="b.note">{{ failCount(b) > 0 ? '，' : '' }}{{ b.note }}</span>
          </div>
        </div>
        <div class="progress-col">
          <div class="progress-label"><span>人工确认</span><span>{{ b.successCount ?? 0 }}/{{ b.fileCount ?? 0 }}</span></div>
          <div class="progress-bar"><div class="progress-fill" :style="{ width: pct(b) + '%' }" /></div>
          <div class="fail-count">{{ failCount(b) > 0 ? `失败 ${failCount(b)}` : '\u00a0' }}</div>
        </div>
        <span class="status-pill" :class="statusClass(b)">{{ retryingId === b.id ? '识别中' : statusText(b) }}</span>
        <div class="card-actions">
          <el-button
            size="large"
            round
            :loading="retryingId === b.id"
            :disabled="isBusy(b)"
            @click="$emit('retry-batch', b)"
          >整批重新识别</el-button>
          <el-button size="large" round :disabled="isBusy(b)" @click="$emit('open-workbench', b)">分类确认台</el-button>
          <el-button size="large" round :disabled="retryingId === b.id" @click="$emit('open-archive', b)">档案分类预览</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { Upload, Folder, Postcard, WarningFilled } from '@element-plus/icons-vue';

const props = defineProps({
  batches: { type: Array, default: () => [] },
  retryingId: { type: [Number, String], default: null }
});

defineEmits(['new-batch', 'open-workbench', 'open-archive', 'retry-batch']);

const search = reactive({
  batchNo: '', archiveNo: '', name: '', idCard: '', status: ''
});

const filteredBatches = computed(() => {
  let list = props.batches;
  if (search.batchNo) list = list.filter(b => (b.batchNo || '').toLowerCase().includes(search.batchNo.toLowerCase()));
  if (search.archiveNo) list = list.filter(b => (b.archiveNo || '').toLowerCase().includes(search.archiveNo.toLowerCase()));
  if (search.name) list = list.filter(b => (b.personName || '').toLowerCase().includes(search.name.toLowerCase()));
  if (search.idCard) list = list.filter(b => (b.idCard || '').toLowerCase().includes(search.idCard.toLowerCase()));
  if (search.status) list = list.filter(b => b.status === search.status);
  return list;
});

function doSearch() {}
function resetSearch() {
  search.batchNo = '';
  search.archiveNo = '';
  search.name = '';
  search.idCard = '';
  search.status = '';
}

function pct(b) { return Math.round((b.successCount || 0) / (b.fileCount || 1) * 100); }
function failCount(b) { return Number(b.errorCount || 0); }
function statusClass(b) {
  if (props.retryingId === b.id) return 's-processing';
  return { pending: 's-pending', processing: 's-processing', done: 's-done', error: 's-error' }[b.status] || 's-pending';
}
function statusText(b) {
  return { pending: '待确认', processing: 'AI处理中', done: '已完成', error: '异常' }[b.status] || b.status;
}
function isProcessing(b) {
  return b.status === 'processing';
}
function isBusy(b) {
  return isProcessing(b) || props.retryingId === b.id;
}
</script>

<style scoped>
.batch-list { display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 20px 24px; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.list-header h2 { font-size: 20px; font-weight: 600; margin: 0; color: #1f2d3d; }

.search-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; background: #f9fbfe; padding: 14px 18px; border-radius: 14px; border: 1px solid #e6edf4; margin-bottom: 16px; }
.search-fields { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; flex: 1; }
.field-group { display: flex; align-items: center; gap: 8px; }
.field-group label { font-size: 14px; font-weight: 500; color: #44546f; white-space: nowrap; }
.search-stats { font-size: 13px; color: #57677a; flex-shrink: 0; }

.batch-cards { flex: 1; overflow-y: auto; }
.empty { text-align: center; padding: 60px; color: #909399; font-size: 15px; }
.batch-card { background: #fff; border: 1px solid #e6edf4; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px; transition: box-shadow .15s; }
.batch-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.card-main { flex: 1; min-width: 0; }
.card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
.person-name { font-size: 15px; font-weight: 600; color: #1f2d3d; }
.btn-icon { margin-right: 6px; }
.archive-no, .idcard-text { display: inline-flex; align-items: center; gap: 4px; }
.archive-no { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #2c6e9e; background: #ecf5fc; padding: 3px 10px; border-radius: 4px; }
.batch-id { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #57677a; }
.idcard-text { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #57677a; }
.card-meta { font-size: 13px; color: #7b8ba0; }
.fail-hint { margin-top: 6px; display: flex; align-items: center; gap: 4px; font-size: 12px; color: #9c3b34; }
.fail-count { font-size: 12px; color: #9c3b34; width: 100%; min-height: 18px; line-height: 18px; text-align: left; }

.progress-col { width: 150px; display: flex; flex-direction: column; align-items: stretch; gap: 5px; flex-shrink: 0; }
.progress-label { font-size: 12px; color: #57677a; display: flex; justify-content: space-between; width: 100%; }
.progress-bar { width: 100%; height: 8px; background: #eef2f6; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #2c6e9e; border-radius: 4px; transition: width .3s; }

.status-pill { width: 88px; box-sizing: border-box; text-align: center; font-size: 12px; padding: 5px 0; border-radius: 20px; white-space: nowrap; flex-shrink: 0; font-weight: 500; }
.s-pending { background: #f6ead4; color: #b4791f; }
.s-done { background: #e2efe7; color: #3e7a5c; }
.s-error { background: #f4e4e1; color: #9c3b34; }
.s-processing { background: #e5e9f0; color: #3a527a; }

.card-actions { display: flex; gap: 8px; flex-shrink: 0; }
</style>
