<template>
  <div>
    <div v-if="personSummaries.length" class="hrams-v2-card person-summary-card">
      <div class="upload-title">人员校验汇总</div>
      <div v-for="p in personSummaries" :key="p.personId" class="person-summary-row">
        <span>{{ p.label }}</span>
        <el-tag :type="p.attachable && !p.cancelled ? 'success' : 'danger'" size="small">
          {{ p.cancelled ? '已取消挂接' : p.attachable ? '可挂接' : '校验不通过' }}
        </el-tag>
        <el-button v-if="p.attachable && !p.cancelled" link type="warning" v-permission="'hrams:archive:attach'" @click="$emit('cancel-person', p.personId)">取消挂接</el-button>
        <el-button v-if="p.cancelled" link v-permission="'hrams:archive:attach'" @click="$emit('restore-person', p.personId)">恢复</el-button>
      </div>
    </div>

    <div class="hrams-v2-card result-card">
      <div class="result-head">
        <div>
          <div class="upload-title">待挂接文件清单</div>
          <div class="upload-desc">
            文件 {{ fileCount }} 个 · 选中人员 {{ selectedPersonCount }} 人 · 可挂接材料 {{ attachableFileCount }} 份 · 可确认 {{ confirmableCount }} 人
          </div>
        </div>
        <el-button type="primary" :loading="confirmLoading" :disabled="!canConfirm" v-permission="'hrams:archive:attach'" @click="$emit('confirm')">确认挂接</el-button>
      </div>
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="tree-title">目录树预览</div>
          <el-tree
            :data="sortedPreviewTree"
            node-key="id"
            default-expand-all
            highlight-current
            :props="{ label: 'label', children: 'children' }"
            @node-click="onTreeNodeClick"
          />
        </el-col>
        <el-col :span="16">
          <el-table ref="tableRef" :data="visiblePreviewRows" border max-height="480" :row-class-name="tableRowClass">
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column prop="personName" label="人员" width="120" show-overflow-tooltip />
            <el-table-column prop="personKey" label="人员目录" min-width="130" show-overflow-tooltip />
            <el-table-column prop="fileName" label="文件名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="categoryCode" label="分类" width="80" />
            <el-table-column prop="itemNo" label="页号" width="80" />
            <el-table-column label="校验状态" width="110">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row)">
                  {{ row.status === 'pass' ? '通过' : row.statusText || '—' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="问题说明" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="90">
              <template #default="{ row }">
                <el-button v-if="canDeleteRow(row)" link type="danger" v-permission="'hrams:archive:attach'" @click="$emit('remove-row', row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref, nextTick } from 'vue';

  const props = defineProps({
    personSummaries: { type: Array, default: () => [] },
    previewTree: { type: Array, default: () => [] },
    visiblePreviewRows: { type: Array, default: () => [] },
    fileCount: { type: Number, default: 0 },
    selectedPersonCount: { type: Number, default: 0 },
    confirmableCount: { type: Number, default: 0 },
    attachableFileCount: { type: Number, default: 0 },
    canConfirm: Boolean,
    confirmLoading: Boolean,
    canDeleteRow: { type: Function, required: true }
  });

  defineEmits(['confirm', 'cancel-person', 'restore-person', 'remove-row']);

  const tableRef = ref(null);

  const sortCategoryChildren = (nodes) => {
    if (!nodes || !nodes.length) return nodes;
    return [...nodes].sort((a, b) => {
      const aNum = parseFloat(a.id?.replace(/^c-\d+-/, '') || '');
      const bNum = parseFloat(b.id?.replace(/^c-\d+-/, '') || '');
      return aNum - bNum;
    }).map(n => n.children?.length ? { ...n, children: sortCategoryChildren(n.children) } : n);
  };

  const sortedPreviewTree = computed(() => {
    return props.previewTree.map(person => ({
      ...person,
      children: sortCategoryChildren(person.children)
    }));
  });

  const tableRowClass = ({ row }) => {
    return highlightRowIndex.value === row.index ? 'attach-highlight-row' : '';
  };

  const highlightRowIndex = ref(null);

  const onTreeNodeClick = (node) => {
    if (node.rowIndex == null || node.rowIndex < 0) return;
    highlightRowIndex.value = node.rowIndex;
    nextTick(() => {
      const tableBody = tableRef.value?.$el?.querySelector?.('.el-table__body-wrapper');
      if (!tableBody) return;
      const row = tableBody.querySelector('.attach-highlight-row');
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const statusTagType = (row) => {
    if (row.status === 'fail' || row.status === 'exists') return 'danger';
    if (row.status === 'catalog') return 'info';
    return 'success';
  };
</script>

<style scoped>
  .person-summary-card,
  .result-card { padding: 22px 24px; margin-bottom: 24px; }
  .person-summary-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #eef2f6;
  }
  .upload-title { margin-bottom: 6px; font-size: 16px; font-weight: 600; }
  .upload-desc { margin: 0; font-size: 13px; color: #6c7e97; }
  .result-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .tree-title { margin-bottom: 8px; font-size: 14px; font-weight: 600; }
  :deep(.attach-highlight-row) { background: #fdf6ec !important; }
</style>
