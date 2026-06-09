<!-- 常用布局 -->
<template>
  <div class="ele-setting-layout-list">
    <SettingLayoutItem
      v-for="item in skinConfig?.layouts || PREDEFINED_LAYOUTS"
      :key="item.name"
      :title="item.title"
      :cover="item.cover"
      :active="!!(layoutName && item.name === layoutName)"
      @click="handleLayoutItemClick(item)"
    />
  </div>
</template>

<script setup>
  import { storeToRefs } from 'pinia';
  import { useThemeStore } from '@/store/modules/theme';
  import { PREDEFINED_LAYOUTS } from '@/utils/skin-config';
  import SettingLayoutItem from './setting-layout-item.vue';

  const themeStore = useThemeStore();

  const { skinConfig, layoutName } = storeToRefs(themeStore);

  /** 切换常用布局 */
  const handleLayoutItemClick = (layoutItem) => {
    themeStore.setLayout(layoutItem);
  };
</script>
