<template>
  <el-drawer
    :model-value="modelValue"
    title="档案详情"
    size="72%"
    class="archive-detail-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div v-if="loading" v-loading="true" class="drawer-loading" />
    <template v-else-if="detail.person">
      <div class="drawer-actions">
        <el-button v-permission="'hrams:archive:download'" type="primary" @click="exportMaterials">导出档案材料</el-button>
        <el-button v-permission="'hrams:archive:catalog:export'" @click="exportCatalogFile">导出档案目录</el-button>
      </div>
      <el-descriptions :column="3" border size="small" class="drawer-summary">
        <el-descriptions-item label="档案编号">{{ detail.person.archiveNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.person.name }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">{{ detail.person.personStatus || '—' }}</el-descriptions-item>
        <el-descriptions-item label="档案状态">{{ archiveStatusLabel(detail.person.archiveStatus) }}</el-descriptions-item>
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
            总份数 {{ detail.panel?.totalFiles ?? 0 }}，总页数 {{ detail.panel?.totalPages ?? 0 }}
          </div>
        </div>
        <div class="drawer-table-col">
          <el-table :data="detailMaterials" size="small" border height="100%">
            <el-table-column prop="displayNo" label="序号" width="90" />
            <el-table-column prop="materialName" label="材料名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="形成时间" width="110">
              <template #default="{ row }">{{ formatDateDay(row.formDate) }}</template>
            </el-table-column>
            <el-table-column prop="pageCount" label="页数" width="70" />
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
  import { useDictData } from '@/utils/use-dict-data';
  import { dictLabel } from '@/utils/hrams-dict';
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
    personId: [Number, String]
  });
  const emit = defineEmits(['update:modelValue']);

  const loading = ref(false);
  const detail = ref({});
  const detailCat = ref('');
  const detailMaterials = ref([]);
  const [, , archiveStatusDicts] = useDictData(['hrams_person_status', 'hrams_education', 'hrams_archive_status']);

  const treeProps = { label: 'name', children: 'children' };
  const categoryTree = computed(() => detail.value.categories || []);

  const archiveStatusLabel = (code) => dictLabel(archiveStatusDicts.value, code);
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

  const filterMaterials = () => {
    const code = detailCat.value;
    detailMaterials.value = (detail.value.materials || []).filter((m) => m.categoryCode === code);
  };

  const onTreeClick = (data) => {
    if (!data?.code) return;
    detailCat.value = data.code;
    filterMaterials();
  };

  const loadDetail = async () => {
    if (!props.personId) return;
    loading.value = true;
    try {
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
      detailCat.value = firstSelectableCode(panel?.categories);
      filterMaterials();
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
    }
  );

  const openPreview = (id) => {
    previewMaterial(id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const exportMaterials = () => {
    const p = detail.value.person;
    if (!p?.id) {
      return;
    }
    exportArchivePackage(p.id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const exportCatalogFile = () => {
    const p = detail.value.person;
    if (p?.id) exportCatalog(p.id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
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
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    vertical-align: middle;
  }

  .summary {
    margin-top: 12px;
    font-size: 13px;
    color: #6c7e97;
  }

  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 30px;
    padding: 4px 0;
    align-items: flex-start;
  }

  :deep(.el-tree-node__label) {
    white-space: normal;
    line-height: 1.4;
    word-break: break-all;
  }
</style>

<style lang="scss">
  .archive-detail-drawer .el-drawer__body {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
</style>
