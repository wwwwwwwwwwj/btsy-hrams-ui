<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :width="1320"
    :title="readonly ? '查看' : '流程设计'"
    :maxable="true"
    :close-on-click-modal="false"
    height="calc(100vh - 80px)"
    :body-style="{ height: '100%' }"
    v-bind="modalProps"
  >
    <workflow-design
      v-if="data"
      :definitionId="data.id"
      :disabled="readonly"
      @done="handleDesignDone"
    />
  </ele-modal>
</template>

<script setup>
  import { useModal } from 'ele-admin-plus';

  defineProps({
    /** 数据 */
    data: Object,
    /** 是否是查看模式 */
    readonly: Boolean
  });

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps } = useModal();

  /** 流程设计完成事件 */
  const handleDesignDone = () => {
    emit('done');
  };
</script>
