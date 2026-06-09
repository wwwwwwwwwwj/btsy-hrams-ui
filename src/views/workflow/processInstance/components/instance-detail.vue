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
      :businessId="data.businessId"
      :taskId="data.id"
      viewType="view"
      :formCustom="data.formCustom"
      :formPath="data.formPath"
      :status="data.flowStatus"
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
