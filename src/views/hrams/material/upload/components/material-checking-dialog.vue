<template>
  <el-dialog
    v-model="visible"
    title="上传新批次"
    width="720px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <!-- 干部选择（必选） -->
    <el-form label-width="70px">
      <el-form-item label="干部" required>
        <el-select
          v-model="selectedPersonId"
          filterable
          placeholder="请选择干部"
          style="width:100%"
          :loading="personLoading"
        >
          <el-option
            v-for="p in personOptions"
            :key="p.id"
            :label="`${p.archiveNo || ''} ${p.name || ''}`.trim()"
            :value="String(p.id)"
          />
        </el-select>
      </el-form-item>

      <!-- 文件上传 -->
      <el-form-item label="文件" required>
        <div class="file-area">
          <label class="file-pick-btn">
            📎 选择文件
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.bmp,.pdf,image/*,application/pdf"
              multiple
              hidden
              @change="onPickFiles"
            />
          </label>
          <label class="file-pick-btn">
            📁 选择文件夹
            <input
              type="file"
              webkitdirectory
              hidden
              @change="onPickFiles"
            />
          </label>
          <span class="file-hint">支持 JPG、PNG、BMP、PDF，可多选文件或整个文件夹</span>
        </div>

        <!-- 文件列表 + 进度 -->
        <div v-if="fileItems.length" class="file-list">
          <div
            v-for="(f, i) in fileItems"
            :key="i"
            class="file-row"
          >
            <span class="file-icon">{{ isPdf(f.name) ? '📕' : '🖼️' }}</span>
            <span class="file-name">{{ f.name }}</span>
            <span class="file-size">{{ formatSize(f.size) }}</span>
            <span class="file-status" :class="statusClass(f)">
              <i v-if="f._status === 'uploading' || f._status === 'ocr_processing' || f._status === 'ai_processing'" class="el-icon-loading" />
              {{ statusLabel(f) }}
            </span>
            <el-button
              v-if="f._status === 'idle' || f._status === 'failed'"
              link
              type="danger"
              @click="removeFile(i)"
            >移除</el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose" :disabled="submitting">取消</el-button>
      <el-button
        type="primary"
        :disabled="!canSubmit || submitting"
        :loading="submitting"
        @click="handleSubmit"
      >提交识别</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import { pagePerson } from '@/api/hrams/person';
import { uploadOssFile, ocrOssFile, analyzeOcrTextStream, createBatch, addMaterialsToBatch } from '@/api/hrams/checking';

const props = defineProps({
  modelValue: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'done']);

// ── 对话框可见性 ──
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
});

// ── 干部下拉 ──
const personOptions = ref([]);
const personLoading = ref(false);
const selectedPersonId = ref('');

async function loadPersons() {
  personLoading.value = true;
  try {
    const data = await pagePerson({ pageNum: 1, pageSize: 500 });
    personOptions.value = data.rows || [];
  } catch { personOptions.value = []; }
  finally { personLoading.value = false; }
}

// ── 文件列表 ──
const fileItems = ref([]);
const submitting = ref(false);

const canSubmit = computed(() =>
  selectedPersonId.value && fileItems.value.length > 0 &&
  fileItems.value.some(f => f._status === 'idle') &&
  fileItems.value.every(f => f._status === 'idle' || f._status === 'failed')
);

const selectedPerson = computed(() =>
  personOptions.value.find(p => String(p.id) === selectedPersonId.value)
);

function onPickFiles(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  files.forEach(f => {
    const ext = f.name?.toLowerCase().split('.').pop();
    const supported = ['jpg', 'jpeg', 'png', 'bmp', 'pdf'];
    const valid = supported.includes(ext);
    fileItems.value.push({
      name: f.name,
      size: f.size,
      file: valid ? f : null,
      _status: valid ? 'idle' : 'failed',   // 不支持格式直接标为 upload_failed
      _ossKey: null,
      _ocrText: null,
      _result: null,
      _error: valid ? null : '不支持的文件格式，仅支持 JPG/PNG/BMP/PDF'
    });
  });
}

function removeFile(i) {
  fileItems.value.splice(i, 1);
}

// ── 状态展示 ──
const STATUS_MAP = {
  idle:       { cls: '', label: '待上传' },
  uploading:  { cls: 'is-loading', label: '上传中…' },
  ocr_processing: { cls: 'is-loading', label: 'OCR识别中…' },
  ai_processing: { cls: 'is-loading', label: 'AI分析中…' },
  done:       { cls: 'is-done', label: '解析完成' },
  failed:     { cls: 'is-error', label: '失败' }
};

function statusClass(f) { return (STATUS_MAP[f._status] || STATUS_MAP.idle).cls; }
function statusLabel(f) {
  const m = STATUS_MAP[f._status] || STATUS_MAP.idle;
  return f._error ? `失败: ${f._error}` : m.label;
}

// ── 提交识别：先建批次→关闭对话框→后台处理上传/OCR/Dify ──
async function handleSubmit() {
    if (!canSubmit.value) return;
    if (!selectedPersonId.value) { ElMessage.warning('请先选择干部'); return; }
    submitting.value = true;

    const person = selectedPerson.value;
    const archiveNo = person?.archiveNo || 'unknown';
    const filesToProcess = [...fileItems.value];

    try {
      // Phase 0: pre-create batch → show in list immediately
      const userStore = useUserStore();
      const batchRes = await createBatch({
        personId: selectedPersonId.value,
        personName: person?.name || '',
        archiveNo: archiveNo,
        idCard: person?.idCard || '',
        uploader: userStore.info?.nickName || userStore.info?.userName || ''
      });
      const batch = batchRes.data?.data;
      if (!batch?.batchNo) throw new Error('创建批次失败');
      const batchNo = batch.batchNo;
      const batchId = batch.id;

      // close dialog + refresh batch list (batch shows AI processing)
      submitting.value = false;
      fileItems.value = [];
      selectedPersonId.value = '';
      visible.value = false;
      emit('done');

      // background: upload → OCR → Dify → add materials
      await processInBackground(filesToProcess, archiveNo, batchNo, batchId);
    } catch (e) {
      ElMessage.error(e.message);
      submitting.value = false;
    }
  }

  /** background: upload → OCR → Dify → add materials to batch */
  async function processInBackground(files, archiveNo, batchNo, batchId) {
    // Phase 1: parallel upload (skip unsupported files)
    const upResults = await Promise.allSettled(files.map(async (f) => {
      if (f._status === 'failed') return f; // 格式不支持，跳过上传
      f._status = 'uploading';
      try {
        const res = await uploadOssFile(f.file, archiveNo, batchNo);
        if (!res?.data?.success) throw new Error(res?.data?.error || '上传失败');
        f._ossKey = res.data.key;
        return f;
      } catch (e) {
        f._status = 'failed';
        f._error = e.message || '上传失败';
        return f;
      }
    }));
    const okUploads = upResults.filter(r => r.status === 'fulfilled').map(r => r.value).filter(f => f._ossKey);
    if (!okUploads.length) { ElMessage.error('所有文件上传失败'); return; }

    // Phase 2: parallel OCR (skip already-failed files)
    const ocrResults = await Promise.allSettled(okUploads.map(async (f) => {
      if (f._status === 'failed' || !f._ossKey) return f;
      f._status = 'ocr_processing';
      try {
        const res = await ocrOssFile(f._ossKey);
        if (!res?.data?.success || !res?.data?.ocrText) throw new Error(res?.data?.error || 'OCR 结果为空');
        f._ocrText = res.data.ocrText;
        f._pageCount = res.data.pageCount || 1;
        return f;
      } catch (e) {
        f._status = 'failed';
        f._error = e.message || 'OCR 失败';
        return f;
      }
    }));
    const okOcr = ocrResults.filter(r => r.status === 'fulfilled').map(r => r.value).filter(f => f._status !== 'failed' && f._ocrText);

    // Phase 3: parallel Dify SSE (skip already-failed files)
    if (okOcr.length) {
      await Promise.allSettled(okOcr.map(async (f) => {
      if (f._status === 'failed' || !f._ocrText) return f;
      f._status = 'ai_processing';
      try {
        const resp = await analyzeOcrTextStream(f._ocrText);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '', fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            if (!part.trim()) continue;
            const lines = part.split('\n');
            let eventName = '', eventData = '';
            for (const line of lines) {
              if (line.startsWith('event:')) eventName = line.substring(6).trim();
              else if (line.startsWith('data:')) eventData = line.substring(5).trim();
            }
            if (!eventName || !eventData) continue;
            let data;
            try { data = JSON.parse(eventData); } catch { data = eventData; }
            if (eventName === 'done') fullText = data.answer || fullText;
            else if (eventName === 'error') throw new Error(data.message || '分析失败');
          }
        }
        f._result = fullText || '（无返回内容）';
        f._status = 'done';
      } catch (e) {
        f._status = 'failed';
        f._error = e.message || 'AI分析失败，请人工归类';
      }
    }));
    }

    // Phase 4: add materials to batch (skip upload_failed — never made it to MinIO)
    const toSubmit = files.filter(f => f._status !== 'failed' || f._ossKey);
    if (toSubmit.length) {
      const itemsPayload = toSubmit.map(f => ({
        fileName: f.name,
        ossKey: f._ossKey || '',
        ocrText: f._ocrText || '',
        result: f._result || '',
        pageCount: f._pageCount || 1,
        status: f._status === 'done' ? 'pending' : 'ocr_failed',
        remark: f._error || (f._ossKey ? 'OCR识别失败，请人工归类' : '')
      }));
      try {
        await addMaterialsToBatch(batchId, itemsPayload);
        const doneCount = files.filter(f => f._status === 'done').length;
        const failCount = files.filter(f => f._status === 'failed' && f._ossKey).length;
        if (failCount && doneCount) {
          ElMessage.warning(doneCount + ' 份完成，' + failCount + ' 份失败，请前往分类确认台查看');
        } else if (doneCount) {
          ElMessage.success(doneCount + ' 份材料 AI 识别完成，请前往分类确认台查看');
        } else if (failCount) {
          ElMessage.error('全部 ' + failCount + ' 份 OCR 识别失败，请重新上传');
        }
      } catch (e) {
        ElMessage.error('材料入库失败: ' + (e.message || ''));
      }
      emit('done'); // 通知父组件刷新批次列表
    }
  }

function handleClose() {
  if (submitting.value) return;
  fileItems.value = [];
  selectedPersonId.value = '';
  visible.value = false;
}

// ── 工具 ──
function isPdf(name) { return name?.toLowerCase().endsWith('.pdf'); }
function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ── 初始化 ──
watch(visible, (v) => {
  if (v && !personOptions.value.length) loadPersons();
});
</script>

<style scoped>
.file-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.file-pick-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #2c6e9e;
  font-size: 13px;
  cursor: pointer;
  transition: all .2s;
}
.file-pick-btn:hover { border-color: #2c6e9e; background: #f5f9fc; }
.file-hint { font-size: 12px; color: #909399; }

.file-list {
  border: 1px solid #e6edf4;
  border-radius: 8px;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
}
.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f2f6;
  font-size: 13px;
}
.file-row:last-child { border-bottom: none; }
.file-icon { font-size: 20px; flex-shrink: 0; }
.file-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1f2d3d; }
.file-size { font-size: 12px; color: #909399; flex-shrink: 0; }
.file-status {
  font-size: 12px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 110px;
  justify-content: flex-end;
}
.file-status.is-loading { color: #2c6e9e; }
.file-status.is-done { color: #3e7a5c; font-weight: 500; }
.file-status.is-error { color: #e74c3c; max-width: 280px; white-space: normal; word-break: break-all; }
</style>
