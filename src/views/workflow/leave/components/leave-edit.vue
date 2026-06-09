<!-- 编辑弹窗 -->
<template>
  <ele-drawer
    :size="980"
    :title="data ? '修改' : '添加'"
    :body-style="{ height: '100%', overflow: 'auto' }"
    v-bind="modalProps"
  >
    <WorkflowProcess
      :businessId="data?.id"
      :viewType="data ? 'update' : 'add'"
      formCustom="N"
      formPath="/workflow/leaveEdit/index"
      :status="data?.status"
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
