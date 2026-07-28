<template>
  <ele-page hide-footer :flex-table="personId ? void 0 : 'auto'">
    <div class="hrams-v2-page">
      <material-person-pick
        v-if="!personId"
        @select="selectPerson"
        @open-upload="openUpload"
      />
      
      <material-maintain-panel
        v-else
        :archive-no="archiveNo"
        :person-name="personName"
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
        @remove-row="removeRow"
      >
        <template #search-extra>
          <span class="hrams-v2-filter-actions">
            <el-tag v-if="readOnly" type="info" size="small">只读查阅</el-tag>
            <el-button @click="goBack">返回</el-button>
            <el-button
              v-if="!readOnly"
              type="primary"
              v-permission="'hrams:archive:upload'"
              @click="openUpload"
            >
              上传材料
            </el-button>
          </span>
        </template>
      </material-maintain-panel>
    </div>

    <material-form-dialogs
      v-model:upload-visible="uploadVisible"
      v-model:edit-visible="editVisible"
      v-model:replace-visible="replaceVisible"
      :flat-categories="flatCategories"
      :upload-form="uploadForm"
      :edit-form="editForm"
      :replace-form="replaceForm"
      :active-batch-no="activeBatchNo"
      :intake-preview="intakePreview"
      :intake-rows="intakeRows"
      :intake-loading="intakeLoading"
      :pending-upload-files="pendingUploadFiles"
      :upload-submitting="uploadSubmitting"
      :confirm-submitting="confirmSubmitting"
      :upload-person-options="uploadPersonOptions"
      :upload-needs-intake="uploadNeedsIntake"
      @close-upload="closeUploadDialog"
      @suggest-page-no="suggestPageNo"
      @upload-file="onUploadFile"
      @remove-pending="removePendingUpload"
      @edit-pending="editPendingUpload"
      @intake-preview="runIntakePreview"
      @do-upload="doUpload"
      @confirm-intake="confirmIntakeRow"
      @reject-intake="rejectIntakeRow"
      @save-edit="saveEdit"
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
  import { useRouter } from 'vue-router';
  import MaterialImageEditor from './components/material-image-editor.vue';
  import MaterialPersonPick from './components/material-person-pick.vue';
  import MaterialFormDialogs from './components/material-form-dialogs.vue';
  import MaterialMaintainPanel from './components/material-maintain-panel.vue';
  import { useMaterialMaintain } from './composables/use-material-maintain';
  import { HRAMS_ARCHIVE_LIST } from '@/utils/hrams-routes';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsArchiveMaterial' });

  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push({ path: HRAMS_ARCHIVE_LIST });
  };

  const {
    personId,
    archiveNo,
    personName,
    readOnly,
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
    replaceVisible,
    uploadForm,
    editForm,
    replaceForm,
    activeBatchNo,
    intakePreview,
    intakeRows,
    intakeLoading,
    pendingUploadFiles,
    uploadSubmitting,
    confirmSubmitting,
    uploadPersonOptions,
    uploadNeedsIntake,
    editorVisible,
    editorFile,
    rowClass,
    rowSelectable,
    selectPerson,
    onSelectCat,
    loadMaterials,
    resetSearch,
    onSelectionChange,
    openUpload,
    closeUploadDialog,
    suggestPageNo,
    onUploadFile,
    removePendingUpload,
    editPendingUpload,
    runIntakePreview,
    doUpload,
    confirmIntakeRow,
    rejectIntakeRow,
    saveEdit,
    onReplaceFile,
    doReplace,
    onImageEdited,
    preview,
    downloadOne,
    openEdit,
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
