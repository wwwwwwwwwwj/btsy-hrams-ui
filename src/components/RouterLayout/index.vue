<!-- 主体区域路由出口 -->
<template>
  <router-view v-slot="{ route, Component }">
    <template v-if="!transitionName || transitionName === 'none'">
      <keep-alive
        v-if="pageKeepAlive"
        :include="keepAliveInclude"
        :max="TAB_MAX_NUM"
      >
        <component :key="route.path" :is="Component" />
      </keep-alive>
      <component v-else :key="route.path" :is="Component" />
    </template>
    <transition
      v-else
      :name="transitionName"
      mode="out-in"
      :appear="true"
      @enter="handleBeforeEnter(route)"
    >
      <keep-alive
        v-if="pageKeepAlive"
        :include="keepAliveInclude"
        :max="TAB_MAX_NUM"
      >
        <component :key="route.path" :is="Component" />
      </keep-alive>
      <component v-else :key="route.path" :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
  import { useEventListener } from '@vueuse/core';
  import { useRoute } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import { TAB_MAX_NUM, REDIRECT_PATH, LAYOUT_PATH } from '@/config/setting';
  import { useTabStore, parseRouteTabKey } from '@/store/modules/tab';
  import { useThemeStore } from '@/store/modules/theme';

  defineOptions({ name: 'RouterLayout' });

  const tabStore = useTabStore();
  const { keepAliveInclude, pageKeepAlive, tabs, tabsCache } =
    storeToRefs(tabStore);

  const themeStore = useThemeStore();
  const { transitionName } = storeToRefs(themeStore);

  const currentRoute = useRoute();

  /** 恢复页签滚动位置 */
  const handleBeforeEnter = (route) => {
    if (pageKeepAlive.value && !route.path.includes(REDIRECT_PATH)) {
      const bodyEl = themeStore.getBodyScrollEl();
      const tabKey = parseRouteTabKey(route);
      const top = tabs.value.find((d) => d.key === tabKey)?.meta?.tabScrollTop;
      bodyEl.scrollTo({ top: top ?? 0, behavior: 'instant' });
    }
  };

  /** 如果开启刷新保留已打开页签在浏览器关闭时记录当前页签滚动位置 */
  useEventListener('beforeunload', () => {
    if (
      currentRoute.path !== LAYOUT_PATH &&
      !currentRoute.path.includes(REDIRECT_PATH) &&
      pageKeepAlive.value &&
      tabsCache.value
    ) {
      const tabScrollTop = themeStore.getBodyScrollEl().scrollTop;
      tabStore.tabSetItem({
        key: parseRouteTabKey(currentRoute),
        meta: { tabScrollTop }
      });
    }
  });
</script>
