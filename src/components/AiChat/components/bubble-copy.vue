<template>
  <BubbleTool
    v-if="status === 'success'"
    :icon="CheckOutlined"
    :iconStyle="{ transform: 'scale(1.1)' }"
    :tooltip="successTooltip"
    @click="handleCopyMessage"
  />
  <BubbleTool
    v-else-if="status === 'error'"
    :icon="CopyOutlined"
    :iconStyle="{ transform: 'translateY(0.5px) scale(0.98)' }"
    :tooltip="errorTooltip"
    @click="handleCopyMessage"
  />
  <BubbleTool
    v-else
    :icon="CopyOutlined"
    :iconStyle="{ transform: 'translateY(0.5px) scale(0.98)' }"
    :tooltip="tooltip"
    @click="handleCopyMessage"
  />
</template>

<script setup>
  import { ref } from 'vue';
  import { copyText, useTimer } from 'ele-admin-plus';
  import { BubbleTool } from 'ele-admin-plus/es/ele-chat/components/index';
  import { CopyOutlined, CheckOutlined } from '@/components/icons';

  const props = defineProps({
    /** 内容 */
    content: String,
    /** 提示文本 */
    tooltip: String,
    /** 成功提示文本 */
    successTooltip: String,
    /** 失败提示文本 */
    errorTooltip: String
  });

  /** 复制状态 */
  const status = ref();

  /** 重置状态 */
  const [startResetStatusTimer] = useTimer(1000, () => {
    status.value = void 0;
  });

  /** 复制消息 */
  const handleCopyMessage = () => {
    copyText(props.content ?? '')
      .then(() => {
        status.value = 'success';
        startResetStatusTimer();
      })
      .catch((e) => {
        console.error(e);
        status.value = 'error';
      });
  };
</script>
