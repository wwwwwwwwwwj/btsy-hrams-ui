<template>
  <el-switch
    ref="darkSwitchRef"
    :active-action-icon="MoonOutlined"
    :inactive-action-icon="SunOutlined"
    :model-value="darkMode"
    @update:modelValue="updateDarkMode"
  />
</template>

<script setup>
  import { ref } from 'vue';
  import { storeToRefs } from 'pinia';
  import { MoonOutlined, SunOutlined } from '@/components/icons';
  import { doWithTransition } from '@/utils/common';
  import { useThemeStore } from '@/store/modules/theme';

  const themeStore = useThemeStore();
  const { darkMode } = storeToRefs(themeStore);

  /** 暗黑主题切换开关 */
  const darkSwitchRef = ref(null);

  /** 切换暗黑模式 */
  const updateDarkMode = (isDark) => {
    doWithTransition(
      () => themeStore.setValue('darkMode', isDark),
      darkSwitchRef.value?.$el?.querySelector?.('.el-switch__action'),
      !isDark
    );
  };
</script>
