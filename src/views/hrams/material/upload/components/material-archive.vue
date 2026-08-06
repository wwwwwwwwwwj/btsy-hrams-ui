<template>
  <div class="archive-view">
    <!-- 人员信息条 -->
    <div class="person-strip">
      <div class="person-avatar">{{ batch.personName?.charAt(0) || '?' }}</div>
      <div class="person-info">
        <span class="p-name">{{ batch.personName }} <span class="archive-badge">📁 {{ batch.archiveNo }}</span></span>
        <span class="p-sub">档案分类预览 · 共 {{ archiveMaterials.length }} 份已确认材料</span>
      </div>
      <div class="strip-actions">
        <el-button size="large" type="primary" round @click="$emit('switch-to-workbench')">📂 分类确认台</el-button>
        <el-button size="large" type="primary" round @click="$emit('back')">← 返回批次列表</el-button>
      </div>
    </div>

    <!-- 双栏布局 -->
    <div class="archive-columns">
      <!-- ====== 左栏：分类目录 ====== -->
      <div class="col-rail">
        <template v-for="root in categoryTree" :key="root.code">
          <div
            :class="['rail-item', { active: selectedCode === root.code, empty: catCount(root.code) === 0 }]"
            @click="selectCategory(root.code)"
          >
            <span class="rail-num">{{ numLabel(root.code) }}</span>
            <span class="rail-name">{{ root.name.replace(/^[一二三四五六七八九十]、/, '') }}</span>
            <span class="rail-cnt">{{ catCount(root.code) }}</span>
          </div>
          <template v-if="root.children">
            <div
              v-for="sub in root.children"
              :key="sub.code"
              :class="['rail-sub', { active: selectedCode === sub.code }]"
              @click="selectCategory(sub.code)"
            >
              <span>{{ subAbbr(root.code, sub) }}</span>
              <span class="rail-cnt">{{ catCount(sub.code) }}</span>
            </div>
          </template>
        </template>
      </div>

      <!-- ====== 右栏：材料列表 ====== -->
      <div class="col-main">
        <!-- 标题 -->
        <h2 class="cat-title">{{ selectedTitle }}</h2>
        <p class="cat-desc" v-if="selectedMaterials.length">共 {{ selectedMaterials.length }} 份材料</p>

        <!-- 空状态 -->
        <div v-if="!selectedMaterials.length" class="empty-state">
          <b>⚠ 该类目暂无已确认材料。</b>请先在"分类确认台"中确认材料归类。
        </div>

        <!-- 材料表格 -->
        <table v-else class="mat-table">
          <thead>
            <tr>
              <th>顺序</th>
              <th>材料名称</th>
              <th>形成日期</th>
              <th>页数</th>
              <th>来源批次</th>
              <th>状态</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in selectedMaterials" :key="m.id">
              <td class="order-col">{{ m.pageNo || '-' }}</td>
              <td>{{ m.materialName || (m.originalFileName || m.fileName) }}</td>
              <td>{{ formatDate(m.formDate) }}</td>
              <td>{{ m.pageCount || '-' }} 页</td>
              <td class="batch-col">{{ m.batchNo }}</td>
              <td><span class="status-confirmed">已确认</span></td>
              <td class="remark-col">
                <span v-if="m.remark" :title="m.remark">{{ m.remark }}</span>
                <span v-else>-</span>
              </td>
              <td>
                <span :class="['action-link', { 'is-loading': modalLoading }]" @click="openPreview(m)">👁 预览</span>
                <span :class="['action-link', { 'is-loading': modalLoading }]" style="margin-left:10px" @click="openReclassify(m)">重新归类</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 预览 / 重新归类弹窗 -->
    <el-dialog
      v-model="reclassifyVisible"
      :title="modalTitle"
      width="85vw"
      top="3vh"
      :close-on-click-modal="false"
    >
      <div class="reclassify-body" v-if="reclassifyItem">
        <!-- 预览 -->
        <div class="rc-preview">
          <div v-if="modalLoading" class="rc-preview-loading">
            <i class="el-icon-loading" style="font-size:32px;color:#2c6e9e" />
            <span style="margin-top:12px;font-size:14px;color:#57677a">正在加载预览…</span>
          </div>
          <template v-else>
            <img
              v-if="reclassifyPreviewType === 'image'"
              :src="reclassifyPreviewSrc"
              class="rc-preview-img"
              @error="reclassifyPreviewSrc = ''"
            />
            <iframe
              v-else-if="reclassifyPreviewType === 'pdf'"
              :src="reclassifyPreviewSrc"
              class="rc-preview-pdf"
            />
            <div v-else class="rc-preview-empty">📄 无法预览此文件类型</div>
          </template>
        </div>
        <!-- 表单 -->
        <div class="rc-form">
          <div class="field">
            <label>材料名称 <span v-if="!isPreview" class="required">*</span></label>
            <el-input v-model="reclassifyForm.materialName" size="small" :disabled="isPreview" />
          </div>
          <div class="field">
            <label>归入类目 <span v-if="!isPreview" class="required">*</span></label>
            <el-select v-model="reclassifyForm.categoryCode" size="small" style="width:100%" :disabled="isPreview">
              <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value" :disabled="c.disabled" />
            </el-select>
          </div>
          <div class="field">
            <label>材料顺序</label>
            <el-input v-model="reclassifyForm.pageNo" size="small" placeholder="正整数" :disabled="isPreview" />
          </div>
          <div class="field">
            <label>材料形成日期</label>
            <el-date-picker v-model="reclassifyForm.formDate" type="date" value-format="YYYY-MM-DD" size="small" style="width:100%" :disabled="isPreview" />
          </div>
          <div class="field">
            <label>材料页数</label>
            <el-input v-model="reclassifyForm.pageCount" size="small" placeholder="正整数" :disabled="isPreview" />
          </div>
          <div class="field">
            <label>备注</label>
            <el-input v-model="reclassifyForm.remark" type="textarea" size="small" rows="2" :disabled="isPreview" />
          </div>
        </div>
      </div>

      <template #footer>
        <template v-if="isPreview">
          <el-button @click="reclassifyVisible = false">关闭</el-button>
        </template>
        <template v-else>
          <el-button type="danger" plain @click="modalDelete">删除</el-button>
          <el-button type="primary" @click="submitReclassify" :loading="reclassifySubmitting">确认归类</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listArchiveByPerson, reclassifyMaterial, getPresignedUrl, listCategories } from '@/api/hrams/checking';
import request from '@/utils/request';
import { getToken } from '@/utils/token-util';
import { TOKEN_HEADER_NAME } from '@/config/setting';

const props = defineProps({
  batch: { type: Object, required: true }
});

const emit = defineEmits(['back', 'switch-to-workbench', 'delete']);

const NUM_MAP = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

// ── 分类树 ──
const categoryTree = ref([]);
const categories = computed(() => {
  const flat = [];
  for (const root of categoryTree.value) {
    const hasChildren = root.children && root.children.length > 0;
    flat.push({ value: root.code, label: root.name, disabled: hasChildren });
    if (hasChildren) {
      for (const sub of root.children) {
        const majorNum = NUM_MAP[parseInt(root.code)] || root.code;
        const subNumMatch = sub.name.match(/（([^）]+)）/);
        const subNum = subNumMatch ? subNumMatch[1] : '';
        const subLabel = sub.name.replace(/^（[^）]+）/, '');
        flat.push({ value: sub.code, label: `${majorNum}(${subNum})、${subLabel}` });
      }
    }
  }
  return flat;
});

// ── 已确认材料 ──
const archiveMaterials = ref([]);
const selectedCode = ref('1');

/** 按分类编码分组计数 */
const materialByCategory = computed(() => {
  const map = {};
  for (const m of archiveMaterials.value) {
    const code = m.categoryCode || '';
    if (!map[code]) map[code] = [];
    map[code].push(m);
  }
  return map;
});

function catCount(code) {
  return (materialByCategory.value[code] || []).length;
}

const selectedMaterials = computed(() => {
  const list = materialByCategory.value[selectedCode.value] || [];
  return [...list].sort((a, b) => (a.pageNo || 999) - (b.pageNo || 999));
});

const selectedTitle = computed(() => {
  const opt = categories.value.find(c => c.value === selectedCode.value);
  return opt?.label || '请选择类目';
});

function numLabel(code) {
  const n = parseInt(code);
  return NUM_MAP[n] || code;
}

function subAbbr(rootCode, sub) {
  const majorNum = NUM_MAP[parseInt(rootCode)] || rootCode;
  const subNumMatch = sub.name.match(/（([^）]+)）/);
  const subNum = subNumMatch ? subNumMatch[1] : '';
  const subLabel = sub.name.replace(/^（[^）]+）/, '');
  return `${majorNum}(${subNum}) ${subLabel}`;
}

function selectCategory(code) {
  selectedCode.value = code;
}

async function loadData() {
  try {
    const personId = props.batch.personId;
    const [archiveRes, catRes] = await Promise.all([
      listArchiveByPerson(personId),
      listCategories()
    ]);
    archiveMaterials.value = archiveRes.data?.data || [];
    categoryTree.value = catRes.data?.data || [];
  } catch (e) {
    console.error('加载档案数据失败', e);
  }
}

onMounted(loadData);

// ── 工具 ──
function formatDate(d) {
  if (!d) return '-';
  const s = String(d);
  return s.substring(0, 10);
}

// ── 预览 / 重新归类弹窗 ──
const reclassifyVisible = ref(false);
const reclassifySubmitting = ref(false);
const reclassifyItem = ref(null);
const isPreview = ref(false);
const reclassifyForm = reactive({
  materialName: '', categoryCode: '', pageNo: '', formDate: '', pageCount: '', remark: ''
});
const reclassifyPreviewSrc = ref('');
const reclassifyPreviewType = ref('');
const reclassifyObjectUrl = ref(null);
const modalLoading = ref(false);

// 关闭弹窗时释放 blob URL，避免内存泄漏
watch(reclassifyVisible, (visible) => {
  if (!visible && reclassifyObjectUrl.value) {
    URL.revokeObjectURL(reclassifyObjectUrl.value);
    reclassifyObjectUrl.value = null;
  }
});

const modalTitle = computed(() => {
  const name = reclassifyItem.value?.materialName || reclassifyItem.value?.fileName || '';
  const prefix = isPreview.value ? '材料预览' : '重新归类';
  return name ? `${prefix} - ${name}` : prefix;
});

async function openModal(m, preview) {
  if (modalLoading.value) return;
  isPreview.value = preview;
  reclassifyItem.value = m;
  reclassifyForm.materialName = m.materialName || (m.originalFileName || m.fileName)?.replace(/\.[^.]+$/, '') || '';
  reclassifyForm.categoryCode = m.categoryCode || '';
  reclassifyForm.pageNo = m.pageNo || '';
  reclassifyForm.formDate = formatDate(m.formDate);
  reclassifyForm.pageCount = m.pageCount || '';
  reclassifyForm.remark = m.remark || '';
  reclassifyPreviewSrc.value = '';
  const name = ((m.originalFileName || m.fileName) || '').toLowerCase();
  if (/\.(jpg|jpeg|png|bmp|gif|webp)$/.test(name)) reclassifyPreviewType.value = 'image';
  else if (name.endsWith('.pdf')) reclassifyPreviewType.value = 'pdf';
  else reclassifyPreviewType.value = 'other';
  reclassifyVisible.value = true;
  modalLoading.value = true;
  try {
    if (m.ossKey) {
      try {
        const res = await getPresignedUrl(m.ossKey);
        if (res.data?.success) reclassifyPreviewSrc.value = res.data.url;
      } catch (e) { /* ignore */ }
    } else if (m.id) {
      // 先清理旧的 blob URL
      if (reclassifyObjectUrl.value) {
        URL.revokeObjectURL(reclassifyObjectUrl.value);
        reclassifyObjectUrl.value = null;
      }
      const res = await request.get(`/hrams/archive/materials/${m.id}/preview`, {
        responseType: 'blob',
        headers: { [TOKEN_HEADER_NAME]: `Bearer ${getToken() || ''}` }
      });
      const contentType = res.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      reclassifyObjectUrl.value = URL.createObjectURL(blob);
      reclassifyPreviewSrc.value = reclassifyObjectUrl.value;
    }
  } finally {
    modalLoading.value = false;
  }
}

async function modalDelete() {
  if (!reclassifyItem.value) return;
  try {
    await ElMessageBox.confirm('确认删除该材料？删除后不可恢复。', '确认删除', { type: 'warning' });
    emit('delete', { material: reclassifyItem.value });
    reclassifyVisible.value = false;
  } catch {}
}

function openPreview(m) { openModal(m, true); }
function openReclassify(m) { openModal(m, false); }

async function submitReclassify() {
  if (!reclassifyItem.value) return;
  reclassifySubmitting.value = true;
  try {
    const formData = {
      categoryCode: reclassifyForm.categoryCode,
      categoryName: categories.value.find(c => c.value === reclassifyForm.categoryCode)?.label || '',
      materialName: reclassifyForm.materialName,
      pageNo: parseInt(reclassifyForm.pageNo) || null,
      formDate: reclassifyForm.formDate,
      pageCount: parseInt(reclassifyForm.pageCount) || null,
      remark: reclassifyForm.remark
    };
    await reclassifyMaterial(reclassifyItem.value.id, formData);
    ElMessage.success('已重新归类');
    reclassifyVisible.value = false;
    // 刷新列表
    await loadData();
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  } finally {
    reclassifySubmitting.value = false;
  }
}

</script>

<style scoped>
.archive-view { display: flex; flex-direction: column; flex: 1; min-height: 0; background: #fff; }

/* 人员信息条 */
.person-strip { display: flex; align-items: center; gap: 14px; padding: 12px 20px; background: #f9fbfe; border-bottom: 1px solid #e6edf4; flex-shrink: 0; }
.person-avatar { width: 38px; height: 38px; border-radius: 50%; background: #2c6e9e; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; flex-shrink: 0; }
.person-info { display: flex; flex-direction: column; }
.p-name { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px; }
.archive-badge { font-size: 11px; font-weight: 400; color: #57677a; background: #eef2f6; padding: 2px 8px; border-radius: 4px; }
.p-sub { font-size: 12px; color: #909399; }
.strip-actions { margin-left: auto; }

/* 双栏 */
.archive-columns { display: flex; flex: 1; min-height: 0; }

/* 左栏 */
.col-rail { width: 260px; flex-shrink: 0; background: #f9fbfe; border-right: 1px solid #e6edf4; overflow-y: auto; padding: 10px 0; }
.rail-item { margin: 0 10px 6px; padding: 9px 12px; border-radius: 2px 8px 8px 2px; cursor: pointer; display: flex; align-items: center; gap: 8px; border-left: 3px solid transparent; background: #f7f7f4; font-size: 13px; }
.rail-item:hover { background: #ecf5fc; }
.rail-item.active { background: #ecf5fc; border-left-color: #2c6e9e; }
.rail-item.empty .rail-cnt { color: #9c3b34; }
.rail-num { font-family: 'Noto Serif SC', serif; font-size: 13px; color: #57677a; min-width: 16px; }
.rail-name { flex: 1; }
.rail-cnt { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #57677a; }
.rail-sub { margin: 0 10px 6px 34px; padding: 6px 10px; border-radius: 2px; font-size: 12px; cursor: pointer; color: #57677a; display: flex; justify-content: space-between; }
.rail-sub:hover { background: #ecf5fc; }
.rail-sub.active { background: #ecf5fc; color: #1f2d3d; }

/* 右栏 */
.col-main { flex: 1; overflow-y: auto; padding: 22px 26px; background: #fff; }
.cat-title { font-family: 'Noto Serif SC', serif; font-size: 19px; margin: 0 0 4px; }
.cat-desc { font-size: 13px; color: #57677a; margin-bottom: 20px; }

.empty-state { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 30px; text-align: center; color: #57677a; font-size: 13px; }
.empty-state b { color: #9c3b34; }

.mat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mat-table th { text-align: left; font-weight: 500; color: #57677a; font-size: 11.5px; padding: 8px 10px; border-bottom: 1px solid #e6edf4; text-transform: uppercase; letter-spacing: .4px; }
.mat-table td { padding: 10px 10px; border-bottom: 1px solid #f0f2f6; }
.mat-table tr:hover td { background: #f9fbfe; }
.order-col { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 500; color: #2c6e9e; width: 50px; text-align: center; }
.batch-col { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #57677a; }
.remark-col span { display: inline-block; max-width: 6ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
.status-confirmed { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #e2efe7; color: #3e7a5c; }
.action-link { color: #2c6e9e; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.action-link:hover { text-decoration: underline; }
.action-link.is-loading { color: #909399; cursor: not-allowed; pointer-events: none; }

/* 重新归类弹窗 */
.reclassify-body { display: flex; gap: 20px; }
.rc-preview { flex: 1; background: #eef2f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; min-height: 75vh; overflow: hidden; }
.rc-preview-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #57677a; }
.rc-preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.rc-preview-pdf { width: 100%; height: 75vh; border: none; }
.rc-preview-empty { color: #909399; font-size: 14px; }
.rc-form { width: 260px; flex-shrink: 0; }
.rc-form .field { margin-bottom: 12px; }
.rc-form .field label { display: block; font-size: 12px; color: #57677a; margin-bottom: 4px; }
.rc-form .required { color: #9c3b34; }
</style>
