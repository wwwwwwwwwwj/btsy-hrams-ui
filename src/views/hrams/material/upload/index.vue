<template>
  <div class="material-upload-page">
    <div class="hrams-v2-card upload-hero">
      <div class="upload-hero-inner">
        <h2 class="upload-title">上传档案材料</h2>
        <p class="upload-desc">
          支持 JPG、PNG、BMP、PDF。可先选干部与卷内目录后定向上传；不选则自动 OCR，并由 AI 推荐归属，在「待归属审核」中确认。
        </p>
        <el-button
          type="primary"
          size="large"
          class="upload-main-btn"
          v-permission="'hrams:archive:upload'"
          @click="openUpload"
        >
          上传材料
        </el-button>
      </div>
    </div>

    <material-form-dialogs
      v-model:upload-visible="uploadVisible"
      v-model:edit-visible="editVisible"
      v-model:page-no-visible="pageNoVisible"
      v-model:replace-visible="replaceVisible"
      hide-batch-hint
      :flat-categories="flatCategories"
      :upload-form="uploadForm"
      :edit-form="editForm"
      :page-no-form="pageNoForm"
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
      @save-page-no="savePageNo"
      @replace-file="onReplaceFile"
      @do-replace="doReplace"
    />

    <material-image-editor v-model="editorVisible" :file="editorFile" @done="onImageEdited" />
  </div>
</template>

<script setup>
  import MaterialImageEditor from '../../archive/material/components/material-image-editor.vue';
  import MaterialFormDialogs from '../../archive/material/components/material-form-dialogs.vue';
  import { useMaterialMaintain } from '../../archive/material/composables/use-material-maintain';

  defineOptions({ name: 'HramsMaterialUploadEntry' });

  const {
    flatCategories,
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
    intakeRows,
    intakeLoading,
    pendingUploadFiles,
    uploadSubmitting,
    confirmSubmitting,
    uploadPersonOptions,
    uploadNeedsIntake,
    editorVisible,
    editorFile,
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
    savePageNo,
    onReplaceFile,
    doReplace,
    onImageEdited
  } = useMaterialMaintain();
</script>

<style scoped>
  .material-upload-page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .upload-hero {
    flex: 1;
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  .upload-hero-inner {
    text-align: center;
    max-width: 520px;
    padding: 48px 24px;
  }
  .upload-title {
    margin: 0 0 16px;
    font-size: 22px;
    font-weight: 600;
    color: #1f2d3d;
  }
  .upload-desc {
    margin: 0 0 32px;
    font-size: 14px;
    line-height: 1.7;
    color: #606266;
  }
  .upload-main-btn {
    min-width: 200px;
    height: 48px;
    font-size: 16px;
  }
</style>
