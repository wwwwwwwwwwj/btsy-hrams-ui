<template>
  <div>
    <el-dialog v-model="uploadVisible" title="上传材料" width="520px">
      <el-form label-width="90px">
        <el-form-item label="分类">
          <el-select v-model="uploadForm.categoryCode" style="width:100%" @change="$emit('suggest-page-no')">
            <el-option v-for="c in flatCategories" :key="c.code" :label="c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="页号" required>
          <el-input-number v-model="uploadForm.pageNo" :min="1" />
          <div v-if="pendingUploadFiles.length > 1" class="field-hint">多份时从该页号起依次占号</div>
        </el-form-item>
        <el-form-item label="名称" :required="nameRequired">
          <el-input
            v-model="uploadForm.materialName"
            :placeholder="pendingUploadFiles.length > 1 ? '多份默认取各文件名；仅一份时可在此填写' : '卷内目录材料名称'"
          />
        </el-form-item>
        <el-form-item label="形成日期" required><el-date-picker v-model="uploadForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="页数" required><el-input-number v-model="uploadForm.pageCount" :min="1" /></el-form-item>
        <el-form-item v-if="activeBatchNo" label="本轮批次"><span class="batch-inline">{{ activeBatchNo }}</span></el-form-item>
        <el-form-item label="文件" required>
          <div class="file-picker">
            <input type="file" accept=".jpg,.jpeg,.png,.bmp" multiple @change="(e) => $emit('upload-file', e)" />
            <div class="field-hint">可多选，同一轮次共用一个批次号</div>
            <ul v-if="pendingUploadFiles.length" class="pending-list">
              <li v-for="(item, index) in pendingUploadFiles" :key="item.key" class="pending-item">
                <span class="pending-page">页 {{ pageNoForIndex(index) }}</span>
                <span class="pending-name">{{ item.file?.name }}</span>
                <span class="pending-size">{{ formatFileSize(item.file?.size) }}</span>
                <el-button link type="danger" @click="$emit('remove-pending', item.key)">移除</el-button>
              </li>
            </ul>
          </div>
        </el-form-item>
        <el-form-item v-if="intakePreview.materialType" label="智能识别">
          <div class="intake-hint">类型：{{ intakePreview.materialType }}</div>
          <div v-if="intakePreview.matchedPersonName" class="intake-hint">匹配干部：{{ intakePreview.matchedArchiveNo }} {{ intakePreview.matchedPersonName }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="$emit('close-upload')">取消</el-button>
        <el-button :loading="intakeLoading" :disabled="!pendingUploadFiles.length" @click="$emit('intake-preview')">识别正文</el-button>
        <el-button type="primary" :loading="uploadSubmitting" :disabled="!pendingUploadFiles.length" @click="$emit('do-upload')">
          {{ uploadButtonLabel }}
        </el-button>
        <el-button @click="$emit('close-upload')">完成本轮</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="修改材料信息" width="480px">
      <el-form label-width="90px">
        <el-form-item label="名称"><el-input v-model="editForm.materialName" /></el-form-item>
        <el-form-item label="形成日期"><el-date-picker v-model="editForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="页数"><el-input-number v-model="editForm.pageCount" :min="0" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="$emit('save-edit')">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pageNoVisible" title="调整页号" width="360px">
      <el-form label-width="80px">
        <el-form-item label="新页号"><el-input-number v-model="pageNoForm.pageNo" :min="1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pageNoVisible = false">取消</el-button>
        <el-button type="primary" @click="$emit('save-page-no')">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="replaceVisible" title="替换文件" width="480px">
      <el-form label-width="90px">
        <el-form-item label="新文件" required>
          <div class="file-picker">
            <input type="file" accept=".jpg,.jpeg,.png,.bmp" @change="(e) => $emit('replace-file', e)" />
            <div v-if="replaceFile" class="file-selected">
              <span class="file-selected-name">{{ replaceFile.name }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replaceVisible = false">取消</el-button>
        <el-button type="primary" @click="$emit('do-replace')">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    flatCategories: { type: Array, default: () => [] },
    uploadForm: { type: Object, required: true },
    editForm: { type: Object, required: true },
    pageNoForm: { type: Object, required: true },
    activeBatchNo: String,
    intakePreview: { type: Object, default: () => ({}) },
    intakeLoading: Boolean,
    uploadSubmitting: Boolean,
    pendingUploadFiles: { type: Array, default: () => [] },
    replaceForm: { type: Object, default: () => ({}) }
  });

  const nameRequired = computed(
    () => !props.pendingUploadFiles.length || props.pendingUploadFiles.length === 1
  );

  const uploadButtonLabel = computed(() => {
    const n = props.pendingUploadFiles.length;
    if (n > 1) return `确认上传本批（${n} 份）`;
    if (n === 1) return '确认上传';
    return '确认上传';
  });

  const pageNoForIndex = (index) => (props.uploadForm.pageNo || 1) + index;

  const replaceFile = computed(() => props.replaceForm?.file);

  const formatFileSize = (size) => {
    if (size == null || size === 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const uploadVisible = defineModel('uploadVisible', { type: Boolean, default: false });
  const editVisible = defineModel('editVisible', { type: Boolean, default: false });
  const pageNoVisible = defineModel('pageNoVisible', { type: Boolean, default: false });
  const replaceVisible = defineModel('replaceVisible', { type: Boolean, default: false });

  defineEmits([
    'close-upload', 'suggest-page-no', 'upload-file', 'intake-preview', 'do-upload', 'remove-pending',
    'save-edit', 'save-page-no', 'replace-file', 'do-replace'
  ]);
</script>

<style scoped>
  .batch-inline { font-size: 13px; color: #2c6e9e; }
  .intake-hint { font-size: 12px; color: #666; line-height: 1.6; }
  .file-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  .file-selected {
    font-size: 13px;
    color: #1f2d3d;
    line-height: 1.5;
    padding: 8px 10px;
    background: #f9fbfe;
    border: 1px solid #eef2f8;
    border-radius: 8px;
  }
  .file-selected-name {
    word-break: break-all;
  }
  .file-selected-size {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: #6c7e97;
  }
  .field-hint {
    margin-top: 6px;
    font-size: 12px;
    color: #6c7e97;
    line-height: 1.4;
  }
  .pending-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid #eef2f8;
    border-radius: 8px;
    max-height: 200px;
    overflow: auto;
  }
  .pending-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    font-size: 13px;
    border-bottom: 1px solid #eef2f8;
  }
  .pending-item:last-child {
    border-bottom: none;
  }
  .pending-page {
    flex-shrink: 0;
    color: #2c6e9e;
    min-width: 48px;
  }
  .pending-name {
    flex: 1;
    word-break: break-all;
    color: #1f2d3d;
  }
  .pending-size {
    flex-shrink: 0;
    font-size: 12px;
    color: #6c7e97;
  }
</style>
