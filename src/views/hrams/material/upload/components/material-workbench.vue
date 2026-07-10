<template>
  <div class="workbench">
    <!-- 人员信息条 -->
    <div class="person-strip">
      <div class="person-avatar">{{ batch.personName?.charAt(0) || '?' }}</div>
      <div class="person-info">
        <span class="p-name">{{ batch.personName }} <span class="archive-badge">📁 {{ batch.archiveNo }}</span>|<span>{{ batch.idCard }}</span></span>
        <span class="p-sub">批次 {{ batch.batchNo }} · {{ batch.createTime }}</span>
      </div>
      <div class="strip-actions">
        <el-button size="large" type="primary" round @click="$emit('switch-to-archive')">📋 档案分类预览</el-button>
        <el-button size="large" type="primary" round @click="$emit('back')">← 返回批次列表</el-button>
      </div>
    </div>

    <!-- 三栏布局 -->
    <div class="wb-columns">
      <!-- ====== 左栏：文件队列 ====== -->
      <div class="col col-queue">
        <div class="queue-head">
          <h3>批次 {{ batch.batchNo }} · {{ batch.personName }}</h3>
          <div class="filter-chips">
            <span :class="['chip', { active: filter === 'all' }]" @click="filter = 'all'">全部 {{ counts.all }}</span>
            <span :class="['chip', { active: filter === 'unconfirmed' }]" @click="filter = 'unconfirmed'">待确认 {{ counts.unconfirmed }}</span>
            <span :class="['chip', { active: filter === 'confirmed' }]" @click="filter = 'confirmed'">已确认 {{ counts.confirmed }}</span>
            <span :class="['chip', { active: filter === 'returned' }]" @click="filter = 'returned'">已退回 {{ counts.returned }}</span>
          </div>
        </div>
        <div class="queue-list">
          <div
            v-for="(item, i) in filteredItems"
            :key="i"
            :class="['qitem', { selected: selectedIdx === i, 'is-failed': item.status === 'ocr_failed' }]"
            @click="selectItem(i)"
          >
            <span :class="['dot', statusDot(item)]" />
            <span class="qicon">{{ isPdf(item.fileName) ? '📕' : '🖼️' }}</span>
            <div class="qbody">
              <div class="qname">{{ item.fileName }}</div>
              <div v-if="item.status === 'ocr_failed'" class="qerr">⚠ {{ item.remark || 'OCR识别失败，请人工归类' }}</div>
              <div v-else class="qcat">{{ getCategoryDisplay(item) }}</div>
              <span v-if="item.status === 'returned'" class="badge badge-returned">↩ 已退回</span>
            </div>
          </div>
          <div v-if="!filteredItems.length" class="qempty">暂无材料</div>
        </div>
      </div>

      <!-- ====== 中栏：文件预览 ====== -->
      <div class="col col-preview">
        <div class="prev-toolbar">
          <span class="prev-fname">{{ selected?.fileName || '无材料' }}</span>
          <template v-if="previewType === 'image'">
            <el-button size="small" round @click="rotation = (rotation || 0) - 90">⟲</el-button>
            <el-button size="small" round @click="rotation = (rotation || 0) + 90">⟳</el-button>
          </template>
          <el-button size="small" round :type="ocrOn ? 'primary' : 'default'" @click="ocrOn = !ocrOn">👁 OCR</el-button>
        </div>
        <div class="prev-stage">
          <!-- 无选中 -->
          <div v-if="!selected" class="prev-empty">请从左侧选择材料预览</div>

          <template v-else>
            <!-- 始终渲染 img/iframe 让它开始加载，用 v-show 控制可见性 -->
            <img
              v-show="!previewLoading && !previewError && previewType === 'image'"
              :src="previewSrc"
              :style="{ transform: `rotate(${rotation || 0}deg)` }"
              class="prev-image"
              @load="onPreviewLoad"
              @error="onPreviewError"
            />
            <iframe
              v-show="!previewLoading && !previewError && previewType === 'pdf'"
              :key="'pdf-' + previewSrc"
              :src="previewSrc"
              class="prev-pdf"
              @load="onPreviewLoad"
              @error="onPreviewError"
            />
            <div v-if="previewType === 'other'" class="prev-unsupported">
              <span style="font-size:48px;margin-bottom:12px">📄</span>
              <span>无法预览此文件类型</span>
              <span style="font-size:11px;color:#909399;margin-top:4px">{{ selected?.fileName }}</span>
            </div>

            <!-- 加载/错误叠加层 -->
            <div v-if="previewLoading" class="prev-overlay">
              <i class="el-icon-loading" style="font-size:28px;color:#2c6e9e" />
              <span style="margin-top:10px;font-size:14px;color:#57677a">正在加载预览…</span>
            </div>
            <div v-else-if="previewError" class="prev-overlay">
              <span style="font-size:36px;margin-bottom:10px">⚠️</span>
              <span style="font-size:14px;color:#57677a">文件加载失败</span>
              <el-button size="small" style="margin-top:12px" @click="retryPreview">重试</el-button>
            </div>

            <!-- OCR 叠加层 -->
            <div v-if="ocrOn" class="ocr-overlay-panel">
              <div class="ocr-overlay-header">
                <span class="ocr-overlay-title">📝 OCR 识别结果</span>
                <el-button link size="small" @click="ocrOn = false">✕</el-button>
              </div>
              <pre class="ocr-overlay-body">{{ selected?.ocrText || '暂无 OCR 识别结果' }}</pre>
            </div>
          </template>
        </div>
        <div class="prev-footer">第 1 / 1 页</div>
      </div>

      <!-- ====== 右栏：分类确认 ====== -->
      <div class="col col-classify">
        <!-- 异常提示 -->
        <div v-if="selected?.status === 'returned'" class="cls-section issue-section">
          <h4>退回提示</h4>
          <div class="return-banner">已退回重传 · 原因：{{ selected.returnReason }}</div>
        </div>

        <!-- 材料信息表单 -->
        <div class="cls-section">
          <h4>材料信息（可编辑）</h4>
          <div class="field">
            <label>材料名称 <span class="required">*</span></label>
            <el-input v-model="form.materialName" size="small" placeholder="如 干部履历表" />
            <span v-if="formErrors.materialName" class="err">请填写材料名称</span>
          </div>
          <div class="field">
            <label>归入类目 <span class="required">*</span> <span class="ai-tag">AI</span></label>
            <el-select v-model="form.categoryCode" size="small" style="width:100%" placeholder="选择类目">
              <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value" :disabled="c.disabled" />
            </el-select>
            <span v-if="formErrors.categoryCode" class="err">请选择归入类目</span>
          </div>
          <div class="field">
            <label>材料顺序 <span class="required">*</span></label>
            <el-input v-model="form.pageNo" size="small" placeholder="正整数" />
            <span v-if="formErrors.pageNo" class="err">请输入正整数</span>
          </div>
          <div class="field">
            <label>材料形成日期 <span class="required">*</span></label>
            <el-date-picker v-model="form.formDate" type="date" value-format="YYYY-MM-DD" size="small" style="width:100%" />
            <span v-if="formErrors.formDate" class="err">请选择形成日期</span>
          </div>
          <div class="field">
            <label>材料页数 <span class="required">*</span></label>
            <el-input v-model="form.pageCount" size="small" placeholder="正整数" />
            <span v-if="formErrors.pageCount" class="err">请输入正整数</span>
          </div>
          <div class="field">
            <label>备注</label>
            <el-input v-model="form.remark" type="textarea" size="small" rows="2" placeholder="可填写材料说明" />
          </div>
        </div>

        <!-- 关键信息核验 -->
        <div class="cls-section">
          <h4>关键信息核验</h4>
          <div class="verify-legend">
            <span class="v-ok">● 一致</span>
            <span class="v-warn">● 不一致</span>
            <span class="v-empty">● 未识别到</span>
          </div>
          <div class="verify-row"><span class="vk">姓名</span><span :class="verifyCls(verify.name)">{{ verify.name }}</span></div>
          <div class="verify-row"><span class="vk">身份证号</span><span :class="verifyCls(verify.idCard)">{{ verify.idCard }}</span></div>
          <div class="verify-row"><span class="vk">材料年度</span><span :class="verifyCls(verify.year)">{{ verify.year }}</span></div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-row" v-if="selected">
          <!-- confirmed -->
          <template v-if="selected.status === 'confirmed'">
            <el-button class="done-btn" disabled>已归类</el-button>
          </template>
          <!-- returned -->
          <template v-else-if="selected.status === 'returned'">
            <el-button type="danger" plain size="small" @click="handleDelete">删除</el-button>
            <el-button class="returned-btn" disabled>已退回</el-button>
          </template>
          <!-- pending / ocr_failed：完整操作 -->
          <template v-else>
            <el-button type="danger" plain size="small" @click="handleDelete">删除</el-button>
            <el-button size="small" @click="showReturn = !showReturn">退回重传</el-button>
            <el-button type="primary" size="small" @click="handleConfirm">确认归类</el-button>
          </template>
        </div>

        <!-- 退回表单 -->
        <div v-if="showReturn && selected?.status !== 'confirmed'" class="return-form">
          <el-input v-model="returnReason" type="textarea" size="small" rows="2" placeholder="请填写退回原因，如：图像模糊、非本人材料等" />
          <div class="return-actions">
            <el-button size="small" @click="showReturn = false">取消</el-button>
            <el-button type="primary" size="small" @click="handleReturn">确认退回</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPresignedUrl, listCategories } from '@/api/hrams/checking';

const props = defineProps({
  batch: { type: Object, required: true }
});

const emit = defineEmits(['back', 'switch-to-archive', 'confirm', 'delete', 'return']);

// ── 文件列表数据 ──
const items = computed(() => props.batch.items || []);

// ── 筛选 ──
const filter = ref('all');
const selectedIdx = ref(0);

// 切换筛选标签时重置选中位置，避免选到失败文件
watch(filter, () => { selectedIdx.value = 0; });

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    if (filter.value === 'unconfirmed') return item.status === 'pending';
    if (filter.value === 'confirmed') return item.status === 'confirmed';
    if (filter.value === 'returned') return item.status === 'returned';
    return true; // 'all'
  });
});

const selected = computed(() => {
  const list = filteredItems.value;
  return list.length > selectedIdx.value ? list[selectedIdx.value] : null;
});

const counts = computed(() => {
  const all = items.value;
  return {
    all: all.length,
    confirmed: all.filter(i => i.status === 'confirmed').length,
    returned: all.filter(i => i.status === 'returned').length,
    unconfirmed: all.filter(i => i.status === 'pending').length,
    failed: all.filter(i => i.status === 'failed').length
  };
});

// ── 文件预览 ──
const previewSrc = ref('');
const previewLoading = ref(false);
const previewError = ref(false);
let previewTimer = null;

/**
 * ossKey → presignedUrl 缓存。
 * 同一文件只请求一次预签名 URL，后续点击复用；img/iframe 直连 MinIO，后端不存文件字节。
 */
const previewCache = new Map();

const PREVIEW_TIMEOUT = 120000; // 120 秒超时

const previewType = computed(() => {
  const name = (selected.value?.fileName || '').toLowerCase();
  if (/\.(jpg|jpeg|png|bmp|gif|webp)$/.test(name)) return 'image';
  if (name.endsWith('.pdf')) return 'pdf';
  return 'other';
});

function clearPreviewTimer() {
  if (previewTimer != null) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
}

async function selectItem(i) {
  const item = filteredItems.value[i];
  if (!item) return;
  selectedIdx.value = i;
  rotation.value = 0;
  previewError.value = false;

  if (!item?.ossKey) {
    previewLoading.value = false;
    previewSrc.value = '';
    return;
  }

  // ── 命中缓存（字符串 URL，直接可用） ──
  const cached = previewCache.get(item.ossKey);
  if (cached) {
    clearPreviewTimer();
    previewLoading.value = false;
    previewSrc.value = cached;
    return;
  }

  // ── 首次：调用认证 API 获取预签名 URL ──
  previewLoading.value = true;
  clearPreviewTimer();

  try {
    const res = await getPresignedUrl(item.ossKey);
    clearPreviewTimer();
    if (res.data?.success && res.data?.url) {
      previewCache.set(item.ossKey, res.data.url);
      previewSrc.value = res.data.url;
      previewLoading.value = false;
      previewError.value = false;
    } else {
      previewLoading.value = false;
      previewError.value = true;
    }
  } catch (e) {
    console.error('获取预签名URL失败', e);
    clearPreviewTimer();
    previewLoading.value = false;
    previewError.value = true;
  }
}

function onPreviewLoad() {
  clearPreviewTimer();
  previewLoading.value = false;
}

function onPreviewError() {
  clearPreviewTimer();
  previewLoading.value = false;
  previewError.value = true;
}

function retryPreview() {
  const item = selected.value;
  if (item?.ossKey) {
    previewCache.delete(item.ossKey);
  }
  if (selected.value) selectItem(selectedIdx.value);
}

onBeforeUnmount(() => {
  clearPreviewTimer();
});

// ── 表单 ──
const form = reactive({
  materialName: '',
  categoryCode: '',
  pageNo: '',
  formDate: '',
  pageCount: '',
  remark: ''
});
const formErrors = reactive({});

const showReturn = ref(false);
const returnReason = ref('');
const rotation = ref(0);
const ocrOn = ref(false);

// 从 Dify 结果中解析字段（优先文本行，其次 JSON 块）
function parseFieldsFromResult(resultStr) {
  if (!resultStr) return {};
  const out = {};
  // 1) 中文键名匹配
  const cnMap = {
    '姓名': 'name', '身份证号': 'idCard', '出生日期': 'birthDate',
    '入党时间': 'partyJoinDate', '参加工作时间': 'workStartDate',
    '最高学历': 'education', '最高学位': 'degree',
    '现任职务': 'position', '工作单位': 'department',
    '考核年度': 'assessmentYear', '考核等次': 'assessmentResult',
    '材料类型': 'materialType',
    '材料时间': 'materialTime', '材料形成日期': 'materialTime', '材料形成时间': 'materialTime'
  };
  for (const [cn, key] of Object.entries(cnMap)) {
    const re = new RegExp(cn + '[:：]\\s*(\\S+)');
    const m = resultStr.match(re);
    if (m) out[key] = m[1].replace(/[—\\-]$/, '').trim();
  }
  // 2) 英文键名匹配
  const enMap = { 'material_time': 'materialTime', 'name': 'name', 'id_card': 'idCard' };
  for (const [en, key] of Object.entries(enMap)) {
    if (!out[key]) {
      const re = new RegExp(en + '[:：]\\s*(\\S+)');
      const m = resultStr.match(re);
      if (m) out[key] = m[1].replace(/[—\\-]$/, '').trim();
    }
  }
  // 3) 尝试从 JSON 块中提取字段（可能在顶层或 normalized 内）
  try {
    const jsonMatch = resultStr.match(/\{[\s\S]*"material_time"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const n = parsed.normalized || parsed;
      if (!out.materialTime) out.materialTime = n.material_time || '';
      if (!out.name) out.name = n.name || '';
      if (!out.idCard) out.idCard = n.id_card || '';
    }
  } catch {}
  return out;
}

watch(selected, (item) => {
  if (!item) return;
  const df = item.difyResult || '';
  const parsed = parseFieldsFromResult(df);
  form.materialName = item.materialName || item.fileName?.replace(/\.[^.]+$/, '') || '';
  // 优先使用后端匹配的分类编码，其次用 materialType 文本
  form.categoryCode = item.categoryCode || item.materialType || parsed.materialType || '';
  form.pageNo = item.pageNo || '';
  form.formDate = item.formDate || parsed.materialTime || '';
  form.pageCount = item.pageCount || '1';
  form.remark = item.remark || '';
  formErrors.materialName = false;
  formErrors.categoryCode = false;
  formErrors.pageNo = false;
  formErrors.formDate = false;
  formErrors.pageCount = false;
  showReturn.value = false;
  returnReason.value = '';
}, { immediate: true });

// ── 关键信息核验（Dify 字段 vs 干事数据） ──
function maskIdCard(idCard) {
  if (!idCard) return '';
  const s = String(idCard);
  if (s.length <= 6) return s;
  return s.substring(0, 6) + '**********' + s.substring(s.length - 4);
}

const verify = computed(() => {
  if (!selected.value) return { name: '未识别到', idCard: '未识别到', year: '未识别到' };
  const df = selected.value.difyResult || '';
  const parsed = parseFieldsFromResult(df);
  const personName = props.batch.personName || '';
  const personIdCard = props.batch.idCard || '';

  // 姓名比对
  let nameResult = '未识别到';
  if (parsed.name) {
    nameResult = (parsed.name === personName) ? `一致 ✓ 与档案主人一致` : `⚠ 不一致（Dify: ${parsed.name}，档案: ${personName}）`;
  }

  // 身份证号比对（支持完整或后6位）
  let idResult = '未识别到';
  if (parsed.idCard) {
    const difyId = parsed.idCard.replace(/\*/g, '').trim();
    if (difyId.length >= 6) {
      const difyLast6 = difyId.slice(-6);
      const personLast6 = personIdCard.slice(-6);
      if (difyId === personIdCard || difyLast6 === personLast6) {
        idResult = `一致 ✓ 与档案主人一致`;
      } else {
        idResult = `⚠ 不一致（Dify: ${maskIdCard(parsed.idCard)}，档案: ${maskIdCard(personIdCard)}）`;
      }
    } else if (difyId === personIdCard) {
      idResult = `一致 ✓ 与档案主人一致`;
    }
  }

  // 材料年度
  let yearResult = '未识别到';
  if (parsed.materialTime) {
    const y = String(parsed.materialTime).substring(0, 4);
    yearResult = y || '未识别到';
  }

  return { name: nameResult, idCard: idResult, year: yearResult };
});

function verifyCls(v) {
  if (v.startsWith('一致')) return 'v-ok';
  if (v.startsWith('⚠')) return 'v-warn';
  return 'v-empty';
}

// ── 操作 ──
function validate() {
  let ok = true;
  formErrors.materialName = !form.materialName?.trim();
  formErrors.categoryCode = !form.categoryCode;
  formErrors.pageNo = !form.pageNo || !/^[1-9]\d*$/.test(form.pageNo);
  formErrors.formDate = !form.formDate;
  formErrors.pageCount = !form.pageCount || !/^[1-9]\d*$/.test(form.pageCount);
  return !Object.values(formErrors).some(Boolean);
}

async function handleConfirm() {
  if (!validate()) return;
  const item = selected.value;
  if (!item) return;
  const formData = {
    materialName: form.materialName,
    categoryCode: form.categoryCode,
    categoryName: categories.value.find(c => c.value === form.categoryCode)?.label || form.categoryCode,
    pageNo: parseInt(form.pageNo) || null,
    formDate: form.formDate,
    pageCount: parseInt(form.pageCount) || null,
    remark: form.remark
  };
  emit('confirm', { material: item, form: formData });
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('确认删除该材料？删除后不可恢复。', '确认删除', { type: 'warning' });
    emit('delete', { material: selected.value });
  } catch {}
}

function handleReturn() {
  if (!returnReason.value.trim()) { ElMessage.warning('请填写退回原因'); return; }
  emit('return', { material: selected.value, reason: returnReason.value });
  showReturn.value = false;
  returnReason.value = '';
}

// ── 类目选项（从后端分类树构建） ──
const NUM_MAP = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const categoryTree = ref([]);
// 扁平化的下拉选项列表，value=code, label=显示名
const categories = computed(() => {
  const flat = [];
  for (const root of categoryTree.value) {
    const hasChildren = root.children && root.children.length > 0;
    // 有子类的大类不可选，仅作为分组展示
    flat.push({ value: root.code, label: root.name, disabled: hasChildren });
    if (hasChildren) {
      for (const sub of root.children) {
        // 缩写显示：四(一)、学历学位材料
        const majorNum = NUM_MAP[parseInt(root.code)] || root.code;
        const subLabel = sub.name.replace(/^（[^）]+）/, ''); // 去掉"（一）"前缀
        const subNumMatch = sub.name.match(/（([^）]+)）/);
        const subNum = subNumMatch ? subNumMatch[1] : '';
        flat.push({ value: sub.code, label: `${majorNum}(${subNum})、${subLabel}` });
      }
    }
  }
  return flat;
});

/** 根据分类编码获取缩写展示名（用于左侧文件列表） */
function abbrevCategory(code) {
  if (!code) return '';
  for (const root of categoryTree.value) {
    if (root.code === code) return root.name;
    if (root.children) {
      for (const sub of root.children) {
        if (sub.code === code) {
          const majorNum = NUM_MAP[parseInt(root.code)] || root.code;
          const subNumMatch = sub.name.match(/（([^）]+)）/);
          const subNum = subNumMatch ? subNumMatch[1] : '';
          const subLabel = sub.name.replace(/^（[^）]+）/, '');
          return `${majorNum}(${subNum})、${subLabel}`;
        }
      }
    }
  }
  return code;
}

/**
 * 获取材料分类的展示文本（左侧文件列表用）。
 * 优先用 categoryCode 查分类树，其次用 materialType 文本模糊匹配。
 */
function getCategoryDisplay(item) {
  if (!item) return '待分类';
  // 优先使用后端匹配的分类编码
  if (item.categoryCode) {
    const abbr = abbrevCategory(item.categoryCode);
    if (abbr) return abbr;
  }
  // 回退：用 materialType 文本匹配分类树
  const mt = (item.materialType || '').trim();
  if (!mt) return '待分类';
  // Dify 格式："大类名称-(一)小类名称" 或 "大类名称"
  const dashIdx = mt.indexOf('-');
  const majorText = dashIdx > 0 ? mt.substring(0, dashIdx).trim() : mt;
  const subText = dashIdx > 0 ? mt.substring(dashIdx + 1).trim() : '';
  // 在分类树中查找大类
  for (const root of categoryTree.value) {
    const rootPure = root.name.replace(/^[一二三四五六七八九十]、/, ''); // 去前缀
    if (root.name === majorText || rootPure === majorText || majorText.includes(rootPure) || rootPure.includes(majorText)) {
      if (subText) {
        // 有子类，尝试匹配
        if (root.children) {
          for (const sub of root.children) {
            if (sub.name === subText || sub.name.includes(subText) || subText.includes(sub.name)) {
              const majorNum = NUM_MAP[parseInt(root.code)] || root.code;
              const subNumMatch = sub.name.match(/（([^）]+)）/);
              const subNum = subNumMatch ? subNumMatch[1] : '';
              const subLabel = sub.name.replace(/^（[^）]+）/, '');
              return `${majorNum}(${subNum})、${subLabel}`;
            }
          }
        }
      }
      // 无子类或未匹配到子类，返回大类全名
      return root.name;
    }
  }
  // 最终回退
  return mt;
}

async function loadCategories() {
  try {
    const res = await listCategories();
    categoryTree.value = res.data?.data || [];
  } catch (e) {
    console.error('加载分类树失败', e);
  }
}

onMounted(() => { loadCategories(); });

// ── 工具 ──
function isPdf(name) { return name?.toLowerCase().endsWith('.pdf'); }
function statusDot(item) {
  if (item.status === 'ocr_failed') return 'd-ocr-failed';
  if (item.status === 'returned') return 'd-returned';
  if (item.status === 'confirmed') return 'd-confirmed';
  return 'd-pending';
}
</script>

<style scoped>
.workbench { display: flex; flex-direction: column; flex: 1; min-height: 0; background: #fff; }

/* 人员信息条 */
.person-strip { display: flex; align-items: center; gap: 14px; padding: 10px 20px; background: #f9fbfe; border-bottom: 1px solid #e6edf4; flex-shrink: 0; }
.person-avatar { width: 36px; height: 36px; border-radius: 50%; background: #2c6e9e; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; flex-shrink: 0; }
.person-info { display: flex; flex-direction: column; }
.p-name { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px; }
.archive-badge { font-size: 11px; font-weight: 400; color: #57677a; background: #eef2f6; padding: 2px 8px; border-radius: 4px; }
.p-sub { font-size: 12px; color: #909399; }
.strip-actions { margin-left: auto; }

/* 三栏 */
.wb-columns { display: flex; flex: 1; min-height: 0; }
.col { display: flex; flex-direction: column; border-right: 1px solid #e6edf4; }
.col:last-child { border-right: none; }

/* 左栏 */
.col-queue { width: 280px; flex-shrink: 0; }
.queue-head { padding: 12px 14px; border-bottom: 1px solid #e6edf4; background: #f9fbfe; }
.queue-head h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #1f2d3d; }
.filter-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.chip { font-size: 11px; padding: 4px 10px; border: 1px solid #cbd5e1; border-radius: 14px; cursor: pointer; color: #57677a; background: #fff; }
.chip.active { background: #2c6e9e; color: #fff; border-color: #2c6e9e; }
.chip-fail.active { background: #e74c3c; border-color: #e74c3c; }
.chip-fail { color: #e74c3c; border-color: #f4e4e1; }

.queue-list { flex: 1; overflow-y: auto; }
.qitem { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #f0f2f6; cursor: pointer; position: relative; }
.qitem:hover { background: #f9fbfe; }
.qitem.selected { background: #ecf5fc; }
.qitem.selected::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #2c6e9e; }
.dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.d-pending { background: #cbd5e1; }
.d-confirmed { background: #3e7a5c; }
.d-returned { background: #b4791f; }
.d-ocr-failed { background: #e67e22; }

/* OCR 失败文件 */
.qitem.is-failed { background: #fef9f5; }
.qitem.is-failed:hover { background: #fef9f5; }
.qerr { font-size: 11px; color: #e74c3c; margin-top: 3px; font-weight: 500; }
.qicon { font-size: 18px; flex-shrink: 0; }
.qbody { flex: 1; min-width: 0; }
.qname { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qcat { font-size: 11px; color: #909399; margin-top: 2px; }
.badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 10px; margin-top: 4px; }
.badge-returned { background: #f6ead4; color: #b4791f; }
.badge-issue { background: #f4e4e1; color: #9c3b34; }
.qempty { text-align: center; padding: 30px; color: #909399; font-size: 13px; }

/* 中栏 */
.col-preview { flex: 1; background: #eef2f6; min-width: 0; position: relative; }
.prev-toolbar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #fff; border-bottom: 1px solid #e6edf4; }
.prev-fname { font-size: 13px; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prev-stage { flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 20px; position: relative; }
.prev-image { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform .25s; box-shadow: 0 2px 12px rgba(0,0,0,.1); border-radius: 4px; }
.prev-pdf { width: 100%; height: 100%; border: none; border-radius: 4px; box-shadow: 0 2px 12px rgba(0,0,0,.1); }
.prev-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #909399; font-size: 14px; padding: 40px; }
.prev-unsupported { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #57677a; font-size: 14px; padding: 40px; }
.prev-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(238,242,246,.85); z-index: 5; }
.prev-footer { padding: 6px 14px; background: #fff; border-top: 1px solid #e6edf4; font-size: 11px; color: #909399; text-align: center; }

/* OCR 叠加面板 */
.ocr-overlay-panel { position: absolute; top: 8px; right: 8px; width: 320px; max-height: 60%; background: rgba(255,255,255,.96); border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12); display: flex; flex-direction: column; z-index: 10; }
.ocr-overlay-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #e6edf4; }
.ocr-overlay-title { font-size: 12px; font-weight: 600; color: #57677a; }
.ocr-overlay-body { flex: 1; margin: 0; padding: 10px 12px; font-size: 11px; line-height: 1.6; color: #1f2d3d; white-space: pre-wrap; overflow-y: auto; font-family: inherit; }

/* 右栏 */
.col-classify { width: 300px; flex-shrink: 0; overflow-y: auto; background: #f9fbfe; }
.cls-section { padding: 12px 14px; border-bottom: 1px solid #e6edf4; background: #fff; }
.cls-section h4 { margin: 0 0 10px; font-size: 12px; color: #57677a; text-transform: uppercase; font-weight: 500; letter-spacing: .3px; }
.issue-section { background: #fef5f5; }
.warn-banner { background: #f4e4e1; border: 1px solid #e3c4c0; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #9c3b34; display: flex; gap: 6px; align-items: flex-start; }
.return-banner { background: #f6ead4; border: 1px solid #ead9af; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #8a631e; }

.field { margin-bottom: 10px; }
.field label { display: block; font-size: 12px; color: #57677a; margin-bottom: 3px; }
.required { color: #9c3b34; }
.ai-tag { font-size: 10px; padding: 1px 7px; border-radius: 8px; background: #ecf5fc; color: #2c6e9e; margin-left: 4px; }
.err { font-size: 11px; color: #9c3b34; margin-top: 3px; }

.verify-legend { font-size: 11px; color: #57677a; margin-bottom: 8px; display: flex; gap: 14px; }
.v-ok { color: #3e7a5c; }
.v-warn { color: #9c3b34; }
.v-empty { color: #a6a99e; }
.verify-row { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px dashed #e7e7e0; }
.vk { color: #57677a; }

.action-row { display: flex; gap: 8px; padding: 12px 14px; background: #fff; border-top: 1px solid #e6edf4; }
.action-row .el-button { flex: 1; }
.done-btn { flex: 1; background: #3e7a5c; color: #fff; border: none; border-radius: 20px; cursor: default; }
.returned-btn { flex: 1; background: #b4791f; color: #fff; border: none; border-radius: 20px; cursor: default; }

.return-form { padding: 0 14px 12px; background: #fff; }
.return-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>
