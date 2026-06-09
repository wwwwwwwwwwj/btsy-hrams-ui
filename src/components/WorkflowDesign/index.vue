<!-- 工作流设计 -->
<template>
  <iframe
    :src="`${apiUrl}/warm-flow-ui/index.html?id=${definitionId}&disabled=${disabled}&Authorization=Bearer ${token}&clientid=${clientId}`"
    scrolling="no"
    style="width: 100%; height: 100%; border: none"
  ></iframe>
</template>

<script setup>
  import { onMounted, onBeforeUnmount } from 'vue';
  import { getToken } from '@/utils/token-util';

  defineOptions({ name: 'WorkflowDesign' });

  defineProps({
    /** 流程定义id */
    definitionId: [String, Number],
    /** 是否禁用 */
    disabled: Boolean
  });

  const emit = defineEmits({
    done: () => true
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  const clientId = import.meta.env.VITE_APP_CLIENT_ID;
  const token = getToken();

  /** 监听设计器保存 */
  const messageListener = (event) => {
    switch (event.data.method) {
      case 'close':
        emit('done');
        break;
    }
  };

  onMounted(() => {
    window.addEventListener('message', messageListener);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('message', messageListener);
  });
</script>
