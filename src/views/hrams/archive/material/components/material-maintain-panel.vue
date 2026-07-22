<template>
  <div class="material-maintain">
    <div class="hrams-v2-card hrams-v2-filter">
      <div class="person-info-bar" v-if="archiveNo">
        档案编号：{{ archiveNo }}{{ personName ? '-' + personName : '' }}
      </div>
      <el-form
        :inline="true"
        class="ele-form-search material-search-form"
        @submit.prevent=""
      >
        <el-form-item label="材料名称">
          <el-input
            :model-value="keyword"
            clearable
            placeholder="关键字"
            @update:model-value="$emit('update:keyword', $event)"
            @keyup.enter="$emit('search')"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$emit('search')">查询</el-button>
          <el-button @click="$emit('reset-search')">重置</el-button>
          <slot name="search-extra" />
        </el-form-item>
        <el-form-item v-if="!readOnly" class="material-batch-actions">
          <el-button
            v-permission="'hrams:archive:download'"
            :disabled="!hasSelectedUploaded"
            @click="$emit('batch-download')"
          >
            批量下载
          </el-button>
          <el-button
            type="danger"
            v-permission="'hrams:archive:remove'"
            :disabled="!hasSelection"
            @click="$emit('batch-delete')"
          >
            批量删除
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="hrams-v2-card hrams-v2-table-card material-workspace">
      <el-row :gutter="16">
        <el-col :md="7" :sm="24" class="material-tree-col">
          <div class="tree-head">档案目录</div>
          <el-tree
            class="category-tree"
            :data="categoryTree"
            node-key="code"
            :props="treeProps"
            :current-node-key="categoryCode"
            highlight-current
            default-expand-all
            @node-click="onTreeClick"
          >
            <template #default="{ data }">
              <span class="tree-node" :title="data.name"
                >{{ data.name }} ({{ data.fileCount || 0 }})</span
              >
            </template>
          </el-tree>
          <div class="summary"
            >总份数 {{ panel.totalFiles || 0 }}，总页数
            {{ panel.totalPages || 0 }}</div
          >
        </el-col>
        <el-col :md="17" :sm="24">
          <el-table
            :data="materials"
            :row-class-name="rowClass"
            @selection-change="(rows) => $emit('selection-change', rows)"
          >
            <el-table-column
              v-if="!readOnly"
              type="selection"
              width="48"
              :selectable="rowSelectable"
            />
            <el-table-column prop="pageNo" label="序号" width="90" />
            <el-table-column
              prop="materialName"
              label="材料名称"
              min-width="160"
              show-overflow-tooltip
            />
            <el-table-column
              prop="fileName"
              label="文件名"
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column label="形成日期" width="110">
              <template #default="{ row }">{{
                formatDateDay(row.formDate)
              }}</template>
            </el-table-column>
            <el-table-column prop="pageCount" label="页数" width="70" />
            <el-table-column prop="createTime" label="上传时间" width="165" />
            <el-table-column
              label="操作"
              :width="readOnly ? 140 : 200"
              fixed="right"
            >
              <template #default="{ row }">
                <btn-items
                  type="link"
                  :divider="true"
                  :items="actionItems(row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
  import { formatDateDay } from '@/utils/hrams-date';

  const props = defineProps({
    archiveNo: String,
    personName: String,
    readOnly: Boolean,
    panel: { type: Object, default: () => ({}) },
    categoryCode: String,
    categoryTree: { type: Array, default: () => [] },
    keyword: String,
    sortMode: String,
    materials: { type: Array, default: () => [] },
    hasSelectedUploaded: Boolean,
    hasSelection: Boolean,
    rowClass: { type: Function, required: true },
    rowSelectable: { type: Function, required: true }
  });

  const emit = defineEmits([
    'select-category',
    'update:keyword',
    'update:sortMode',
    'search',
    'reset-search',
    'batch-download',
    'batch-delete',
    'selection-change',
    'preview',
    'download-one',
    'open-edit',
    'remove-row'
  ]);

  const treeProps = { label: 'name', children: 'children' };

  const onTreeClick = (data) => {
    if (data?.code) {
      emit('select-category', data.code);
    }
  };

  const actionItems = (row) => {
    const uploaded = row.fileStatus === 'uploaded';
    const items = [
      {
        title: '预览',
        permission: 'hrams:archive:preview',
        disabled: !uploaded,
        onClick: () => emit('preview', row)
      }
    ];
    if (props.readOnly) {
      items.push({
        title: '下载',
        permission: 'hrams:archive:download',
        disabled: !uploaded,
        onClick: () => emit('download-one', row)
      });
      return items;
    }
    items.push(
      {
        title: '修改',
        permission: 'hrams:archive:upload',
        onClick: () => emit('open-edit', row)
      },
      {
        preset: 'del',
        title: '删除',
        permission: 'hrams:archive:remove',
        onClick: () => emit('remove-row', row)
      }
    );
    return items;
  };
</script>

<style scoped>
  .person-info-bar {
    font-size: 15px;
    font-weight: 600;
    color: #1f2d3d;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eef2f8;
  }
  .material-search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 8px;
  }

  .material-batch-actions {
    margin-left: auto;
  }

  .material-batch-actions :deep(.el-form-item__content) {
    flex-wrap: nowrap;
    gap: 8px;
  }

  .material-workspace {
    padding: 16px 20px 20px;
  }

  .tree-head {
    font-size: 14px;
    font-weight: 600;
    color: #1f2d3d;
    margin-bottom: 8px;
  }

  .category-tree {
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
    word-break: break-all;
  }

  .category-tree :deep(.el-tree-node__content) {
    height: auto;
    min-height: 32px;
    align-items: flex-start;
    padding: 4px 8px 4px 0;
  }

  .category-tree :deep(.el-tree-node__label) {
    flex: 1;
    min-width: 0;
    white-space: normal;
    line-height: 1.45;
    word-break: break-all;
  }

  .category-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
    border-radius: 8px;
  }

  .summary {
    margin-top: 12px;
    font-size: 13px;
    color: #6c7e97;
  }

  .material-tree-col {
    margin-bottom: 12px;
  }

  :deep(.is-disabled) {
    color: #999;
    background: #f9f9fc;
  }

  :deep(.is-highlight) {
    background: #fffbe6 !important;
  }
</style>
