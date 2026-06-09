<!-- 变量弹窗 -->
<template>
  <ele-modal
    :width="720"
    :body-style="{ padding: '12px' }"
    :loading="loading"
    v-bind="modalProps"
  >
    <template #header>
      <div style="display: inline-flex; align-items: center">
        <div>流程变量</div>
        <el-tag
          v-if="data"
          size="small"
          :disable-transitions="true"
          style="font-weight: normal; margin-left: 8px"
        >
          {{ data.flowName }}
        </el-tag>
      </div>
    </template>
    <code-viewer :code="variables" language="json" style="min-height: 320px" />
  </ele-modal>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { getInstanceVariable } from '@/api/workflow/instance';

  const props = defineProps({
    /** 流程实例 */
    data: Object
  });

  const { modalProps } = useModal();

  /** 流程变量 */
  const variables = ref('');

  /** 请求状态 */
  const loading = ref(false);

  /** 请求数据 */
  if (props.data?.id) {
    loading.value = true;
    getInstanceVariable(props.data.id)
      .then((result) => {
        loading.value = false;
        try {
          variables.value = JSON.stringify(
            JSON.parse(result.variable),
            null,
            4
          );
        } catch (e) {
          console.error(e);
        }
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  }
</script>
