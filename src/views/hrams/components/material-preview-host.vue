<template>
  <div>
    <div
      v-if="state.loading"
      v-loading="true"
      element-loading-text="正在加载预览…"
      class="hrams-mat-preview-loading"
    />
    <ele-image-viewer
      v-model="state.imageVisible"
      :url-list="state.imageUrls"
      @close="closeMaterialPreview"
    />
    <el-dialog
      v-model="state.pdfVisible"
      :title="state.title"
      width="min(1200px, 92vw)"
      class="hrams-mat-preview-pdf-dialog"
      destroy-on-close
      append-to-body
      @closed="closeMaterialPreview"
    >
      <iframe v-if="state.pdfUrl" :src="state.pdfUrl" class="hrams-mat-preview-pdf" title="材料预览" />
    </el-dialog>
  </div>
</template>

<script setup>
  import { closeMaterialPreview, useMaterialPreview } from '../composables/use-material-preview';

  const { state } = useMaterialPreview();
</script>

<style scoped>
  .hrams-mat-preview-loading {
    position: fixed;
    inset: 0;
    z-index: 3000;
    background: rgba(255, 255, 255, 0.5);
  }
  .hrams-mat-preview-pdf {
    display: block;
    width: 100%;
    height: min(78vh, 900px);
    border: none;
    background: #f5f7fa;
  }
</style>
