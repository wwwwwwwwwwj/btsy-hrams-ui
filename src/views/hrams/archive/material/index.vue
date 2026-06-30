<template>
  <ele-page hide-footer :flex-table="personId ? void 0 : 'auto'">
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div>
          <div class="hrams-v2-title">材料维护</div>
          <div class="hrams-v2-desc">
            {{ pageDesc }}
            <el-tag v-if="readOnly" type="info" size="small" class="readonly-tag">只读查阅</el-tag>
          </div>
        </div>
        <div v-if="personId" class="hrams-v2-actions">
          <el-button @click="clearPerson">更换干部</el-button>
          <el-button
            v-if="!readOnly"
            type="primary"
            v-permission="'hrams:archive:upload'"
            @click="openUpload"
          >
            上传材料
          </el-button>
        </div>
      </div>

      <material-person-pick v-if="!personId" @select="selectPerson" />

      <material-maintain-panel
        v-else
        :read-only="readOnly"
        :panel="panel"
        :category-code="categoryCode"
        :category-tree="panel.categories || []"
        v-model:keyword="keyword"
        v-model:sort-mode="sortMode"
        :materials="sortedMaterials"
        :has-selected-uploaded="hasSelectedUploaded"
        :has-selection="hasSelection"
        :row-class="rowClass"
        :row-selectable="rowSelectable"
        @select-category="onSelectCat"
        @search="loadMaterials"
        @reset-search="resetSearch"
        @batch-download="doDownload"
        @batch-delete="doBatchDelete"
        @selection-change="onSelectionChange"
        @preview="preview"
        @download-one="downloadOne"
        @open-edit="openEdit"
        @open-page-no="openPageNo"
        @remove-file="removeFile"
        @remove-row="removeRow"
      />
    </div>

    <material-form-dialogs
      v-model:upload-visible="uploadVisible"
      v-model:edit-visible="editVisible"
      v-model:page-no-visible="pageNoVisible"
      v-model:replace-visible="replaceVisible"
      :flat-categories="flatCategories"
      :upload-form="uploadForm"
      :edit-form="editForm"
      :page-no-form="pageNoForm"
      :replace-form="replaceForm"
      :active-batch-no="activeBatchNo"
      :intake-preview="intakePreview"
      :intake-loading="intakeLoading"
      :pending-upload-files="pendingUploadFiles"
      :upload-submitting="uploadSubmitting"
      @close-upload="closeUploadDialog"
      @suggest-page-no="suggestPageNo"
      @upload-file="onUploadFile"
      @remove-pending="removePendingUpload"
      @intake-preview="runIntakePreview"
      @do-upload="doUpload"
      @save-edit="saveEdit"
      @save-page-no="savePageNo"
      @replace-file="onReplaceFile"
      @do-replace="doReplace"
    />

    <material-image-editor
      v-model="editorVisible"
      :file="editorFile"
      @done="onImageEdited"
    />
  </ele-page>
</template>

<script setup>
  import MaterialImageEditor from './components/material-image-editor.vue';
  import MaterialPersonPick from './components/material-person-pick.vue';
  import MaterialFormDialogs from './components/material-form-dialogs.vue';
  import MaterialMaintainPanel from './components/material-maintain-panel.vue';
  import { useMaterialMaintain } from './composables/use-material-maintain';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsArchiveMaterial' });

  const {
    personId,
    readOnly,
    pageDesc,
    panel,
    categoryCode,
    flatCategories,
    keyword,
    sortMode,
    sortedMaterials,
    hasSelectedUploaded,
    hasSelection,
    uploadVisible,
    editVisible,
    pageNoVisible,
    replaceVisible,
    uploadForm,
    editForm,
    pageNoForm,
    replaceForm,
    activeBatchNo,
    intakePreview,
    intakeLoading,
    pendingUploadFiles,
    uploadSubmitting,
    editorVisible,
    editorFile,
    rowClass,
    rowSelectable,
    selectPerson,
    clearPerson,
    onSelectCat,
    loadMaterials,
    resetSearch,
    onSelectionChange,
    openUpload,
    closeUploadDialog,
    suggestPageNo,
    onUploadFile,
    removePendingUpload,
    runIntakePreview,
    doUpload,
    saveEdit,
    savePageNo,
    onReplaceFile,
    doReplace,
    onImageEdited,
    preview,
    downloadOne,
    openEdit,
    openPageNo,
    removeFile,
    removeRow,
    doBatchDelete,
    doDownload
  } = useMaterialMaintain();
</script>

<style scoped>
  .readonly-tag {
    margin-left: 8px;
    vertical-align: middle;
  }
</style>
