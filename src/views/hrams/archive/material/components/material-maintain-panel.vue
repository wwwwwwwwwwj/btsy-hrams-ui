<template>
  <div class="material-maintain">
    <div class="hrams-v2-card hrams-v2-filter">
      <el-form :inline="true" class="ele-form-search" @submit.prevent="">
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
        </el-form-item>
        <el-form-item label="排序">
          <el-radio-group :model-value="sortMode" size="small" @update:model-value="$emit('update:sortMode', $event)">
            <el-radio-button value="pageNo">按页号</el-radio-button>
            <el-radio-button value="createTime">按上传时间</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div v-if="!readOnly" class="hrams-v2-actions material-toolbar">
        <el-button v-permission="'hrams:archive:download'" :disabled="!hasSelectedUploaded" @click="$emit('batch-download')">
          批量下载
        </el-button>
        <el-button type="danger" v-permission="'hrams:archive:remove'" :disabled="!hasSelection" @click="$emit('batch-delete')">
          批量删除
        </el-button>
      </div>
    </div>

    <div class="hrams-v2-card hrams-v2-table-card material-workspace">
      <el-row :gutter="16">
        <el-col :md="5" :sm="24" class="material-tree-col">
          <div class="tree-head">材料目录</div>
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
              <span class="tree-node">{{ data.name }} ({{ data.fileCount || 0 }})</span>
            </template>
          </el-tree>
          <div class="summary">总份数 {{ panel.totalFiles || 0 }}，总页数 {{ panel.totalPages || 0 }}</div>
        </el-col>
        <el-col :md="19" :sm="24">
          <el-table
            :data="materials"
            :row-class-name="rowClass"
            @selection-change="(rows) => $emit('selection-change', rows)"
          >
            <el-table-column v-if="!readOnly" type="selection" width="48" :selectable="rowSelectable" />
            <el-table-column label="缩略图" width="72" align="center">
              <template #default="{ row }">
                <el-image
                  v-if="isImageMaterial(row)"
                  :src="row.previewUrl"
                  fit="cover"
                  class="mat-thumb"
                  :preview-src-list="[]"
                />
                <el-icon v-else-if="row.fileStatus === 'uploaded'" class="mat-file-icon"><Document /></el-icon>
                <span v-else class="mat-empty">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="pageNo" label="页号" width="70" />
            <el-table-column prop="displayNo" label="显示序号" width="90" />
            <el-table-column prop="materialName" label="材料名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="fileName" label="文件名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="formDate" label="形成时间" width="120" />
            <el-table-column prop="pageCount" label="页数" width="70" />
            <el-table-column prop="batchNo" label="上传批次" min-width="130" show-overflow-tooltip />
            <el-table-column prop="createTime" label="上传时间" width="165" />
            <el-table-column label="操作" :width="readOnly ? 140 : 200" fixed="right">
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
  import { Document } from '@element-plus/icons-vue';

  const props = defineProps({
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
    rowSelectable: { type: Function, required: true },
    isImageMaterial: { type: Function, required: true }
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
    'open-page-no',
    'remove-file',
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
      { title: '修改', permission: 'hrams:archive:upload', onClick: () => emit('open-edit', row) },
      { title: '改序号', permission: 'hrams:archive:upload', onClick: () => emit('open-page-no', row) },
      { title: '删文件', permission: 'hrams:archive:remove', onClick: () => emit('remove-file', row) },
      { preset: 'del', title: '删记录', permission: 'hrams:archive:remove', onClick: () => emit('remove-row', row) }
    );
    return items;
  };
</script>

<style scoped>
  .material-toolbar {
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px solid #eef2f8;
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
  }

  .tree-node {
    font-size: 13px;
  }

  .summary {
    margin-top: 12px;
    font-size: 13px;
    color: #6c7e97;
  }

  .material-tree-col {
    margin-bottom: 12px;
  }

  .mat-thumb {
    width: 48px;
    height: 48px;
    border-radius: 8px;
  }

  .mat-file-icon {
    font-size: 28px;
    color: #8a99b0;
  }

  .mat-empty {
    color: #ccc;
  }

  :deep(.is-disabled) {
    color: #999;
    background: #f9f9fc;
  }

  :deep(.is-highlight) {
    background: #fffbe6 !important;
  }
</style>
