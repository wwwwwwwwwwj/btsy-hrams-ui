<template>
  <ele-page flex-table hide-footer :multi-card="false">
    <ele-card
      :bordered="true"
      :flex-table="true"
      :body-style="{ padding: 0 }"
      style="height: 100%"
    >
      <ai-chat
        style="height: 100%"
        :ai-sdk-option="{
          systemMessages: [
            { role: 'system', content: 'You are a helpful assistant.' }
          ],
          baseURL: 'https://v2.eleadmin.com/api'
        }"
      />
    </ele-card>
  </ele-page>
</template>

<script setup>
  defineOptions({ name: 'IndexAiChat' });
</script>
