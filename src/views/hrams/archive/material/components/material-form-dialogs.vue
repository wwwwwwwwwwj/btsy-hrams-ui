<template>
  <div>
    <el-dialog v-model="uploadVisible" title="上传材料" width="520px">
      <el-form label-width="90px">
        <el-form-item label="分类">
          <el-select v-model="uploadForm.categoryCode" style="width:100%" @change="$emit('suggest-page-no')">
            <el-option v-for="c in flatCategories" :key="c.code" :label="c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="页号" required><el-input-number v-model="uploadForm.pageNo" :min="1" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="uploadForm.materialName" placeholder="卷内目录材料名称" /></el-form-item>
        <el-form-item label="形成日期" required><el-date-picker v-model="uploadForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="页数" required><el-input-number v-model="uploadForm.pageCount" :min="1" /></el-form-item>
        <el-form-item v-if="activeBatchNo" label="本轮批次"><span class="batch-inline">{{ activeBatchNo }}</span></el-form-item>
        <el-form-item label="文件" required><input type="file" accept=".jpg,.jpeg,.png,.bmp" @change="(e) => $emit('upload-file', e)" /></el-form-item>
        <el-form-item v-if="intakePreview.materialType" label="智能识别">
          <div class="intake-hint">类型：{{ intakePreview.materialType }}</div>
          <div v-if="intakePreview.matchedPersonName" class="intake-hint">匹配干部：{{ intakePreview.matchedArchiveNo }} {{ intakePreview.matchedPersonName }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="$emit('close-upload')">取消</el-button>
        <el-button :loading="intakeLoading" @click="$emit('intake-preview')">识别正文</el-button>
        <el-button type="primary" @click="$emit('do-upload')">确认并继续</el-button>
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
        <el-form-item label="新文件" required><input type="file" @change="(e) => $emit('replace-file', e)" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replaceVisible = false">取消</el-button>
        <el-button type="primary" @click="$emit('do-replace')">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  defineProps({
    flatCategories: { type: Array, default: () => [] },
    uploadForm: { type: Object, required: true },
    editForm: { type: Object, required: true },
    pageNoForm: { type: Object, required: true },
    activeBatchNo: String,
    intakePreview: { type: Object, default: () => ({}) },
    intakeLoading: Boolean
  });

  const uploadVisible = defineModel('uploadVisible', { type: Boolean, default: false });
  const editVisible = defineModel('editVisible', { type: Boolean, default: false });
  const pageNoVisible = defineModel('pageNoVisible', { type: Boolean, default: false });
  const replaceVisible = defineModel('replaceVisible', { type: Boolean, default: false });

  defineEmits([
    'close-upload', 'suggest-page-no', 'upload-file', 'intake-preview', 'do-upload',
    'save-edit', 'save-page-no', 'replace-file', 'do-replace'
  ]);
</script>

<style scoped>
  .batch-inline { font-size: 13px; color: #2c6e9e; }
  .intake-hint { font-size: 12px; color: #666; line-height: 1.6; }
</style>
