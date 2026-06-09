<template>
  <div style="max-width: 860px; margin: 0 auto; padding: 16px">
    <div
      style="
        background: linear-gradient(
          170deg,
          rgba(0, 147, 255, 0.08) 0%,
          rgba(85, 0, 255, 0.08) 100%
        );
        border-radius: 12px;
        padding: 18px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <img :src="logoSrc" style="height: 66px" />
      <div style="padding-left: 16px">
        <EleText type="heading" size="xl" style="font-weight: normal">
          <span>{{ lang.welcomeTitle }}</span>
          <span>{{ logoTitle }}</span>
        </EleText>
        <EleText>{{ lang.welcomeText }}</EleText>
      </div>
    </div>
    <EleText size="md" style="margin: 28px 0 14px 0">
      {{ lang.welcomeTip }}
    </EleText>
    <div style="display: flex; flex-direction: column; align-items: flex-start">
      <InputTool
        v-for="item in prompts"
        :key="item.key ?? item.label"
        :button="true"
        :round="false"
        style="height: auto; padding: 6px 16px 6px 10px; margin-bottom: 14px"
        @click="handlePromptClick(item)"
      >
        {{ item.label }}
      </InputTool>
    </div>
    <slot></slot>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { useModal } from 'ele-admin-plus';
  import { InputTool } from 'ele-admin-plus/es/ele-chat/components/index';
  import { getPromptsApi } from '../config';

  defineProps({
    /** 文案 */
    lang: {
      type: Object,
      required: true
    },
    /** 图标 */
    logoSrc: String,
    /** 名称 */
    logoTitle: String
  });

  const emit = defineEmits({
    promptClick: (_item) => true
  });

  const { message: EleMessage } = useModal();

  /** 提示列表 */
  const prompts = ref([]);

  /** 提示列表点击事件 */
  const handlePromptClick = (item) => {
    emit('promptClick', item);
  };

  /** 查询提示列表 */
  getPromptsApi()
    .then((data) => {
      prompts.value = data;
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });
</script>
