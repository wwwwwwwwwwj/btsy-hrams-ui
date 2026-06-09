<!-- 作废弹窗 -->
<template>
  <ele-modal :width="460" title="作废" :loading="loading" v-bind="modalProps">
    <el-input
      :rows="4"
      type="textarea"
      v-model="reason"
      placeholder="请输入作废原因"
    />
    <template #footer>
      <btn-items
        :items="[
          { preset: 'cancel', onClick: () => handleCancel() },
          { preset: 'save', onClick: () => handleSave() }
        ]"
      />
    </template>
  </ele-modal>
</template>

<script setup>
  import { ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { invalidInstance } from '@/api/workflow/instance';

  const props = defineProps({
    /** 流程实例id */
    id: [Number, String]
  });

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 作废原因 */
  const reason = ref('');

  /** 提交状态 */
  const loading = ref(false);

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 保存编辑 */
  const handleSave = () => {
    ElMessageBox.confirm('是否确认作废？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        loading.value = true;
        invalidInstance({
          id: props.id,
          comment: reason.value
        })
          .then(() => {
            loading.value = false;
            EleMessage.success({ message: '操作成功', plain: true });
            emit('done');
            handleCancel();
          })
          .catch((e) => {
            loading.value = false;
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };
</script>
