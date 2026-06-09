<!-- 详情弹窗 -->
<template>
  <ele-drawer
    :size="980"
    title="详情"
    :body-style="{ height: '100%', overflow: 'auto' }"
    v-bind="modalProps"
  >
    <WorkflowProcess
      v-if="data"
      :businessId="data.id"
      viewType="view"
      formCustom="N"
      formPath="/workflow/leaveEdit/index"
      :status="data.status"
    />
  </ele-drawer>
</template>

<script setup>
  import { useModal } from 'ele-admin-plus';

  defineProps({
    /** 数据 */
    data: Object
  });

  const { modalProps } = useModal();
</script>
