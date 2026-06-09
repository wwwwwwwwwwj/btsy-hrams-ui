<!-- 流程图 -->
<template>
  <div class="ele-workflow-process-flow-chart">
    <iframe
      v-if="instanceId"
      :src="`${apiUrl}/warm-flow-ui/index.html?id=${instanceId}&type=FlowChart&Authorization=Bearer ${token}&clientid=${clientId}`"
      scrolling="no"
      style="width: 100%; height: 100%; border: none"
    ></iframe>
  </div>
</template>

<script setup>
  import { getToken } from '@/utils/token-util';

  defineOptions({ name: 'FlowChart' });

  defineProps({
    /** 流程实例id */
    instanceId: [String, Number]
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  const clientId = import.meta.env.VITE_APP_CLIENT_ID;
  const token = getToken();
</script>
