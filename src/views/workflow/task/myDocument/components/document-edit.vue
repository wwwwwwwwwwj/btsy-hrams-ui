<!-- 修改弹窗 -->
<template>
  <ele-drawer
    :size="980"
    title="修改"
    :body-style="{ height: '100%', overflow: 'auto' }"
    v-bind="modalProps"
  >
    <WorkflowProcess
      v-if="data"
      :businessId="data.businessId"
      :taskId="data.id"
      viewType="update"
      :formCustom="data.formCustom"
      :formPath="data.formPath"
      :status="data.flowStatus"
      @done="handleDone"
    />
  </ele-drawer>
</template>

<script setup>
  import { useModal } from 'ele-admin-plus';

  defineProps({
    /** 数据 */
    data: Object
  });

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 审批完成事件 */
  const handleDone = () => {
    emit('done');
    closeModal();
  };
</script>
