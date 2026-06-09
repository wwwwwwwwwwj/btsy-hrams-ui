<!-- 上传弹窗 -->
<template>
  <ele-modal
    :width="720"
    :height="480"
    title="上传文件"
    :close-on-click-modal="false"
    :loading="loading"
    v-bind="modalProps"
  >
    <ele-upload-list
      :drag="true"
      :multiple="true"
      accept=""
      v-model="images"
      :readonly="loading"
      @upload="handleFileSelect"
      @remove="handleFileRemove"
      @retry="uploadItem"
    />
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleStart">开始上传</el-button>
    </template>
  </ele-modal>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { uploadOss } from '@/api/system/oss';

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 上传状态 */
  const loading = ref(false);

  /** 文件 */
  const images = ref([]);

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 全部上传完成事件 */
  const handleDone = () => {
    EleMessage.success({ message: '全部上传成功', plain: true });
    handleCancel();
    emit('done');
  };

  /** 校验选择的文件 */
  const checkFile = (file) => {
    if (!file) {
      return;
    }
    if (file.size / 1024 / 1024 > 5) {
      EleMessage.error({ message: '大小不能超过 5MB', plain: true });
      return;
    }
    return true;
  };

  /** 文件选择事件 */
  const handleFileSelect = (item) => {
    if (!checkFile(item.file)) {
      return;
    }
    images.value.push({ ...item });
  };

  /** 文件删除事件 */
  const handleFileRemove = (item) => {
    images.value.splice(images.value.indexOf(item), 1);
  };

  /** 检查是否全部上传完毕 */
  const checkDone = () => {
    return !images.value.some((d) => d.status !== 'done');
  };

  /** 上传文件 */
  const uploadItem = (d) => {
    const item = images.value.find((t) => t.key === d.key);
    if (!item) {
      return;
    }
    item.progress = 0;
    item.status = 'uploading';
    uploadOss(item.file, {
      onUploadProgress: (e) => {
        if (e.total != null && item.status !== 'done') {
          item.progress = (e.loaded / e.total) * 100;
        }
      }
    })
      .then(() => {
        item.status = 'done';
        if (checkDone()) {
          handleDone();
        }
      })
      .catch((e) => {
        item.status = 'exception';
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 开始上传 */
  const handleStart = () => {
    if (!images.value.length) {
      EleMessage.error({ message: '请至少选择一个文件', plain: true });
      return;
    }
    if (checkDone()) {
      handleDone();
      return;
    }
    loading.value = true;
    images.value.forEach((item) => {
      if (item.status == null || item.status === 'exception') {
        uploadItem(item);
      }
    });
  };
</script>
