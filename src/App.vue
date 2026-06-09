<template>
  <el-config-provider :locale="elLocale">
    <ele-config-provider :locale="eleLocale" v-bind="globalConfig">
      <ele-app>
        <router-view />
      </ele-app>
    </ele-config-provider>
  </el-config-provider>
</template>

<script setup>
  import { useGlobalConfig } from '@/config/use-global-config';
  import { useThemeStore } from '@/store/modules/theme';
  import elLocale from 'element-plus/es/locale/lang/zh-cn';
  import eleLocale from 'ele-admin-plus/es/lang/zh_CN';
  import dayjs from 'dayjs';
  import 'dayjs/locale/zh-cn';

  dayjs.locale('zh-cn');

  /** 组件全局配置 */
  const globalConfig = useGlobalConfig();

  /** 恢复缓存主题 */
  const themeStore = useThemeStore();
  themeStore.recoverTheme();
</script>
