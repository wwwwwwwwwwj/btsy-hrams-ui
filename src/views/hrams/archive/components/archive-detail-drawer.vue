<template>
  <el-drawer
    :model-value="modelValue"
    title="查看档案"
    size="72%"
    append-to-body
    class="archive-detail-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div v-if="loading" v-loading="true" class="drawer-loading" />
    <template v-else-if="detail.person">
      <div class="drawer-actions">
        <el-button v-permission="'hrams:archive:download'" type="primary" @click="exportMaterials">导出档案材料</el-button>
        <el-button v-permission="'hrams:catalog:export'" @click="exportCatalogFile">导出档案目录</el-button>
      </div>
      <el-descriptions v-if="fullPersonInfo" :column="3" border size="small" class="drawer-summary">
        <el-descriptions-item label="档案编号">{{ detail.person.archiveNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.person.name }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detail.person.idCard }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail.person.gender }}</el-descriptions-item>
        <el-descriptions-item label="出生日期">{{ detail.person.birthDate }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ detail.person.age }}</el-descriptions-item>
        <el-descriptions-item label="民族">{{ detail.person.nation }}</el-descriptions-item>
        <el-descriptions-item label="政治面貌">{{ detail.person.politicalStatus }}</el-descriptions-item>
        <el-descriptions-item label="学历">{{ detail.person.education }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">{{ detail.person.personStatus }}</el-descriptions-item>
      </el-descriptions>
      <el-descriptions v-else :column="3" border size="small" class="drawer-summary">
        <el-descriptions-item label="档案编号">{{ detail.person.archiveNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.person.name }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">{{ detail.person.personStatus || '—' }}</el-descriptions-item>
        <el-descriptions-item label="材料数量">{{ detail.person.materialCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="完整性">{{ integrityLabel(detail.person.integrityStatus) }}</el-descriptions-item>
      </el-descriptions>
      <div class="drawer-workspace">
        <div class="drawer-tree-col">
          <div class="tree-head">档案目录</div>
          <el-tree
            class="category-tree"
            :data="categoryTree"
            node-key="code"
            :props="treeProps"
            :current-node-key="detailCat"
            highlight-current
            default-expand-all
            @node-click="onTreeClick"
          >
            <template #default="{ data }">
              <span class="tree-node" :title="data.name">{{ data.name }} ({{ data.fileCount || 0 }})</span>
            </template>
          </el-tree>
          <div class="summary">
            总份数 {{ detailStats.totalFiles }}，总页数 {{ detailStats.totalPages }}
          </div>
        </div>
        <div class="drawer-table-col">
          <el-table :data="detailMaterials" size="small" border height="100%">
            <el-table-column prop="pageNo" label="序号" width="90" />
            <el-table-column prop="materialName" label="材料名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="形成时间" width="110">
              <template #default="{ row }">{{ formatDateDay(row.formDate) }}</template>
            </el-table-column>
            <el-table-column prop="pageCount" label="页数" width="70" />
            <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.fileStatus === 'uploaded'"
                  v-permission="'hrams:archive:preview'"
                  link
                  @click="openPreview(row.id)"
                >
                  预览
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </template>
    <el-empty v-else description="暂无档案数据" />
  </el-drawer>
</template>

<script setup>
  import { computed, ref, watch } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { formatDateDay } from '@/utils/hrams-date';
  import { getPerson } from '@/api/hrams/person';
  import {
    getMaterialPanel,
    listMaterials,
    previewMaterial,
    exportArchivePackage,
    exportCatalog
  } from '@/api/hrams/archive';

  const props = defineProps({
    modelValue: Boolean,
    personId: [Number, String],
    detailLoader: { type: Function, default: null },
    exportMaterialsHandler: { type: Function, default: null },
    fullPersonInfo: { type: Boolean, default: false }
  });
  const emit = defineEmits(['update:modelValue']);

  const loading = ref(false);
  const detail = ref({});
  const detailCat = ref('');
  const detailMaterials = ref([]);

  const treeProps = { label: 'name', children: 'children' };
  const categoryTree = computed(() => detail.value.categories || []);
  const detailStats = computed(() => ({
    totalFiles: detail.value.panel?.totalFiles
      ?? detail.value.materials?.length
      ?? 0,
    totalPages: detail.value.panel?.totalPages
      ?? detail.value.materials?.reduce((sum, item) => sum + (Number(item.pageCount) || 0), 0)
      ?? 0
  }));

  const integrityLabel = (s) => (s === 'complete' ? '完整' : s === 'missing' ? '缺项' : '—');

  const firstSelectableCode = (nodes) => {
    for (const n of nodes || []) {
      if (n.children?.length) {
        const code = firstSelectableCode(n.children);
        if (code) return code;
      } else if (n.code) {
        return n.code;
      }
    }
    return nodes?.[0]?.code || '';
  };

  const findTreeNode = (nodes, code) => {
    if (!code || !nodes?.length) {
      return null;
    }
    for (const n of nodes) {
      if (n.code === code) {
        return n;
      }
      if (n.children?.length) {
        const found = findTreeNode(n.children, code);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const collectCategoryCodes = (node) => {
    if (!node) {
      return [];
    }
    const codes = node.code ? [node.code] : [];
    if (node.children?.length) {
      return [...codes, ...node.children.flatMap((child) => collectCategoryCodes(child))];
    }
    return codes;
  };

  const filterMaterials = (node) => {
    const codes = node ? collectCategoryCodes(node) : [];
    if (!codes.length) {
      detailMaterials.value = [];
      return;
    }
    const set = new Set(codes);
    detailMaterials.value = (detail.value.materials || []).filter((m) => set.has(m.categoryCode));
  };

  const onTreeClick = (data) => {
    if (!data?.code) return;
    detailCat.value = data.code;
    filterMaterials(data);
  };

  const loadDetail = async () => {
    if (!props.personId) return;
    loading.value = true;
    try {
      if (props.detailLoader) {
        detail.value = await props.detailLoader(props.personId);
      } else {
        const [person, panel, materials] = await Promise.all([
          getPerson(props.personId),
          getMaterialPanel(props.personId),
          listMaterials(props.personId, {})
        ]);
        detail.value = {
          person,
          panel,
          categories: panel?.categories || [],
          materials
        };
      }
      detailCat.value = firstSelectableCode(detail.value.categories);
      const firstNode = findTreeNode(detail.value.categories, detailCat.value);
      filterMaterials(firstNode);
    } catch (e) {
      detail.value = {};
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => [props.modelValue, props.personId],
    ([open, id]) => {
      if (!open) {
        detail.value = {};
        return;
      }
      if (id != null && id !== '') {
        loadDetail();
      }
    },
    { immediate: true }
  );

  const openPreview = (id) => {
    previewMaterial(id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const exportMaterials = () => {
    const p = detail.value.person;
    if (!p?.id) {
      return;
    }
    const task = props.exportMaterialsHandler
      ? props.exportMaterialsHandler(detail.value)
      : exportArchivePackage(p.id);
    Promise.resolve(task).catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const exportCatalogFile = () => {
    const p = detail.value.person;
    if (!p?.id) {
      EleMessage.error({ message: '人员信息缺失，无法导出目录', plain: true });
      return;
    }
    exportCatalog(p.id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };
</script>

<style scoped lang="scss">
  .drawer-actions {
    margin-bottom: 12px;
  }

  .drawer-summary {
    margin-bottom: 16px;
  }

  .drawer-loading {
    min-height: 200px;
  }

  .drawer-workspace {
    display: flex;
    gap: 16px;
    min-height: 420px;
    align-items: stretch;
  }

  .drawer-tree-col {
    flex: 0 0 32%;
    max-width: 320px;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .drawer-table-col {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .tree-head {
    font-size: 14px;
    font-weight: 600;
    color: #1f2d3d;
    margin-bottom: 8px;
  }

  .category-tree {
    flex: 1;
    min-height: 0;
    max-height: calc(100vh - 320px);
    overflow: auto;
    border: 1px solid #eef2f8;
    border-radius: 12px;
    padding: 8px;
    box-sizing: border-box;
  }

  .tree-node {
    display: block;
    font-size: 13px;
    line-height: 1.45;
    white-space: normal;
    word-break: break-word;
  }

  .summary {
    margin-top: 12px;
    font-size: 13px;
    color: #6c7e97;
  }

  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 32px;
    padding: 4px 8px 4px 0;
    align-items: flex-start;
  }

  :deep(.el-tree-node__label) {
    flex: 1;
    min-width: 0;
    white-space: normal;
    line-height: 1.45;
    word-break: break-word;
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    border-radius: 8px;
  }
</style>

<style lang="scss">
  .archive-detail-drawer .el-drawer__body {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
</style>
