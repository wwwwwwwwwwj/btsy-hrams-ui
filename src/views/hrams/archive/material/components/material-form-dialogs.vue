<template>
  <div>
    <el-dialog v-model="uploadVisible" title="上传材料" width="880px">
      <el-form label-width="90px">
        <el-form-item label="干部">
          <el-select
            v-model="uploadForm.personId"
            clearable
            filterable
            placeholder="不选则由 OCR 和 AI 推荐归属"
            style="width:100%"
            @change="$emit('suggest-page-no')"
          >
            <el-option
              v-for="p in uploadPersonOptions"
              :key="p.id"
              :label="`${p.archiveNo || ''} ${p.name || ''}`.trim()"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目录">
          <el-select
            v-model="uploadForm.categoryCode"
            clearable
            filterable
            placeholder="不选则由 OCR 和 AI 推荐目录"
            style="width:100%"
            @change="$emit('suggest-page-no')"
          >
            <el-option v-for="c in flatCategories" :key="c.code" :label="c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="OCR">
          <el-switch v-model="uploadForm.ocrFlag" :disabled="uploadNeedsIntake" />
          <span class="field-hint inline-hint">
            {{ uploadNeedsIntake ? '未完整选择归属时默认 OCR' : '关闭后仅上传归档文件' }}
          </span>
        </el-form-item>
        <el-form-item v-if="!uploadNeedsIntake" label="页号" required>
          <el-input-number v-model="uploadForm.pageNo" :min="1" />
          <div v-if="pendingUploadFiles.length > 1" class="field-hint">多份时从该页号起依次占号</div>
        </el-form-item>
        <el-form-item label="名称" :required="nameRequired">
          <el-input
            v-model="uploadForm.materialName"
            :placeholder="uploadNeedsIntake ? '可不填，由 AI 推荐' : pendingUploadFiles.length > 1 ? '多份默认取各文件名；仅一份时可在此填写' : '卷内目录材料名称'"
          />
        </el-form-item>
        <el-form-item v-if="!uploadNeedsIntake" label="形成日期" required><el-date-picker v-model="uploadForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item v-if="!uploadNeedsIntake" label="页数" required><el-input-number v-model="uploadForm.pageCount" :min="1" /></el-form-item>
        <el-form-item v-if="activeBatchNo" label="本轮批次"><span class="batch-inline">{{ activeBatchNo }}</span></el-form-item>
        <el-form-item label="文件" required>
          <div class="file-picker">
            <input type="file" accept=".jpg,.jpeg,.png,.bmp" multiple @change="(e) => $emit('upload-file', e)" />
            <div class="field-hint">图片会先进入旋转、裁剪处理；可多选，同一轮次共用一个批次号</div>
            <ul v-if="pendingUploadFiles.length" class="pending-list">
              <li v-for="(item, index) in pendingUploadFiles" :key="item.key" class="pending-item">
                <span class="pending-page">{{ uploadNeedsIntake ? `待识别 ${index + 1}` : `页 ${pageNoForIndex(index)}` }}</span>
                <span class="pending-name">{{ item.file?.name }}</span>
                <span class="pending-size">{{ formatFileSize(item.file?.size) }}</span>
                <el-button link type="primary" @click="$emit('edit-pending', item.key)">处理</el-button>
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
      <div v-if="intakeRows.length" class="intake-result">
        <div class="intake-result-title">AI 推荐归属</div>
        <el-table :data="intakeRows" border size="small">
          <el-table-column prop="fileName" label="文件" min-width="150" show-overflow-tooltip />
          <el-table-column label="推荐人员" min-width="170">
            <template #default="{ row }">
              <el-select v-model="row.personId" filterable clearable placeholder="选择人员" style="width:100%">
                <el-option
                  v-for="p in uploadPersonOptions"
                  :key="p.id"
                  :label="`${p.archiveNo || ''} ${p.name || ''}`.trim()"
                  :value="p.id"
                />
              </el-select>
              <div v-if="row.personName" class="field-hint">AI：{{ row.archiveNo }} {{ row.personName }}</div>
              <div v-if="row.personCandidateHint" class="field-hint">候选：{{ row.personCandidateHint }}</div>
            </template>
          </el-table-column>
          <el-table-column label="推荐目录" min-width="180">
            <template #default="{ row }">
              <el-select v-model="row.categoryCode" filterable clearable placeholder="选择目录" style="width:100%">
                <el-option v-for="c in flatCategories" :key="c.code" :label="c.name" :value="c.code" />
              </el-select>
              <div v-if="row.categoryName" class="field-hint">AI：{{ row.categoryName }}</div>
            </template>
          </el-table-column>
          <el-table-column label="材料名称" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.materialName" placeholder="材料名称" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="108">
            <template #default="{ row }">
              <el-tag :type="row.status === 'archived' ? 'success' : row.status === 'recognize_failed' || row.status === 'rejected' ? 'danger' : 'warning'">
                {{ row.statusText }}
              </el-tag>
              <div v-if="row.recognizeMessage" class="field-hint">{{ row.recognizeMessage }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                :disabled="row.status !== 'pending_confirm'"
                :loading="confirmSubmitting"
                @click="$emit('confirm-intake', row)"
              >
                确认
              </el-button>
              <el-button
                link
                type="danger"
                :disabled="row.status !== 'pending_confirm' && row.status !== 'recognize_failed'"
                :loading="confirmSubmitting"
                @click="$emit('reject-intake', row)"
              >
                驳回
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="$emit('close-upload')">取消</el-button>
        <el-button :loading="intakeLoading" :disabled="!pendingUploadFiles.length" @click="$emit('intake-preview')">识别预览</el-button>
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
  import { computed, watch } from 'vue';

  const props = defineProps({
    flatCategories: { type: Array, default: () => [] },
    uploadForm: { type: Object, required: true },
    editForm: { type: Object, required: true },
    pageNoForm: { type: Object, required: true },
    activeBatchNo: String,
    intakePreview: { type: Object, default: () => ({}) },
    intakeRows: { type: Array, default: () => [] },
    intakeLoading: Boolean,
    uploadSubmitting: Boolean,
    confirmSubmitting: Boolean,
    uploadPersonOptions: { type: Array, default: () => [] },
    uploadNeedsIntake: Boolean,
    pendingUploadFiles: { type: Array, default: () => [] },
    replaceForm: { type: Object, default: () => ({}) }
  });

  const nameRequired = computed(
    () => !props.uploadNeedsIntake && (!props.pendingUploadFiles.length || props.pendingUploadFiles.length === 1)
  );

  const uploadButtonLabel = computed(() => {
    const n = props.pendingUploadFiles.length;
    if (props.uploadNeedsIntake) {
      return n > 1 ? `提交识别（${n} 份）` : '提交识别';
    }
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

  watch(
    () => props.uploadNeedsIntake,
    (needsIntake) => {
      if (needsIntake) {
        props.uploadForm.ocrFlag = true;
      }
    },
    { immediate: true }
  );

  defineEmits([
    'close-upload', 'suggest-page-no', 'upload-file', 'intake-preview', 'do-upload', 'confirm-intake', 'reject-intake', 'remove-pending', 'edit-pending',
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
  .inline-hint {
    margin-top: 0;
    margin-left: 10px;
  }
  .intake-result {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #eef2f8;
  }
  .intake-result-title {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #1f2d3d;
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
