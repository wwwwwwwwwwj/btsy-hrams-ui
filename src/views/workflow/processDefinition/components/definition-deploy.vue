<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :width="520"
    title="部署流程文件"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form label-width="100px" @submit.prevent="">
      <el-form-item label="部署流程分类">
        <category-select
          v-model="category"
          placeholder="请选择部署流程分类"
          value-type="string"
        />
      </el-form-item>
    </el-form>
    <el-upload
      drag
      action=""
      accept=".json"
      :show-file-list="false"
      :before-upload="handleUpload"
      class="definition-import-upload"
    >
      <ele-text
        type="primary"
        :icon="CloudUploadOutlined"
        :icon-props="{ size: 52 }"
        :icon-style="{ strokeWidth: 3 }"
        style="margin-bottom: 10px"
      />
      <ele-text type="placeholder">
        将 JSON 流程文件拖到此处, 或点击上传
      </ele-text>
    </el-upload>
    <div style="display: flex; align-items: center; justify-content: center">
      仅支持 json 格式文件, 如若部署请部署从本项目模型管理导出的数据
    </div>
    <div></div>
  </ele-modal>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { CloudUploadOutlined } from '@/components/icons';
  import CategorySelect from '@/views/workflow/category/components/category-select.vue';
  import { importDef } from '@/api/workflow/definition';

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 流程分类 */
  const category = ref();

  /** 提交状态 */
  const loading = ref(false);

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 上传 */
  const handleUpload = (file) => {
    if (!category.value) {
      EleMessage.error({ message: '请选择要上传的分类！', plain: true });
      return false;
    }
    if (category.value === 'ALL') {
      EleMessage.error({ message: '顶级节点不可作为分类！', plain: true });
      return false;
    }
    loading.value = true;
    importDef(category.value, file)
      .then((msg) => {
        loading.value = false;
        EleMessage.success({ message: msg, plain: true });
        emit('done');
        handleCancel();
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
    return false;
  };
</script>

<style lang="scss" scoped>
  .definition-import-upload {
    margin-bottom: 12px;

    :deep(.el-upload-dragger) {
      padding: 0;
      height: 180px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      transition: (border-color 0.2s, background-color 0.2s);

      &:not(.is-dragover) {
        background: var(--el-fill-color-light);
      }

      &.is-dragover {
        border-width: 1px;
      }
    }
  }
</style>
