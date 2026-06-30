<template>
  <ele-pro-layout
    :menus="menus"
    :tabs="tabs"
    :collapse="collapse"
    :compact="compact"
    :maximized="maximized"
    :expanded="expanded"
    :tab-bar="tabBar ? (tabInHeader ? 'header' : true) : false"
    :breadcrumb="layout === 'default' && (!tabBar || !tabInHeader)"
    :layout="layout"
    :sidebar-layout="sidebarLayout"
    :header-style="headerStyle"
    :sidebar-style="sidebarStyle"
    :mix-sidebar-style="mixSidebarStyle"
    :tab-style="tabStyle"
    :fixed-header="fixedHeader"
    :fixed-sidebar="fixedSidebar"
    :fixed-body="fixedBody"
    :fluid="fluid"
    :logo-in-header="logoInHeader"
    :colorful-icon="colorfulIcon"
    :sidebox-menu-props="{
      colorful: colorfulIcon,
      ...(sideboxMenuProps || {})
    }"
    :sidebar-menu-props="{
      ...(sidebarMenuProps || {}),
      colorful: sidebarLayout === 'mix' ? sidebarMenuProps?.colorful : void 0
    }"
    :unique-opened="uniqueOpened"
    :fixed-home="fixedHome"
    :home-path="HOME_PATH"
    :redirect-path="REDIRECT_PATH"
    :tab-sortable="!mobileDevice"
    :tab-context-menu="{
      popperOptions: {
        strategy: 'fixed',
        modifiers: [{ name: 'offset', options: { offset: [0, 8] } }]
      },
      menuStyle: tabDropdownMenuStyle
    }"
    :tab-context-menus="getTabContext"
    :nav-trigger="layout === 'top' ? void 0 : menuItemTrigger"
    :box-trigger="menuItemTrigger"
    :keep-alive="pageKeepAlive"
    :transition-name="transitionName"
    :auto-scroll-top="!pageKeepAlive"
    :sidebar-custom-style="sidebarCustomStyle"
    :sidebox-custom-style="sideboxCustomStyle"
    :side-custom-style="sideCustomStyle"
    :header-custom-style="headerCustomStyle"
    :tabs-custom-style="tabsCustomStyle"
    :content-custom-style="contentCustomStyle"
    :class="layoutCustomClass"
    :style="layoutCustomStyle"
    @update:collapse="updateCollapse"
    @update:maximized="updateMaximized"
    @tabAdd="handleTabAdd"
    @tabClick="handleTabClick"
    @tabRemove="removePageTab"
    @tabContextMenu="handleTabContextMenu"
    @tabSortChange="setPageTabs"
    @bodySizeChange="handleBodySizeChange"
  >
    <router-layout />
    <material-preview-host />
    <template #logo />
    <template #logoTitle>
      <h1>{{ PROJECT_NAME }}</h1>
    </template>
    <!-- 顶栏左侧按钮 -->
    <template #left="{ sidebar }">
      <!-- 折叠侧栏 -->
      <layout-tool v-if="sidebar" @click="updateCollapse(!collapse)">
        <el-icon style="transform: scale(1.14)">
          <MenuUnfoldOutlined v-if="collapse" />
          <MenuFoldOutlined v-else />
        </el-icon>
      </layout-tool>
      <!-- 刷新 -->
      <layout-tool class="hidden-sm-and-down" @click="reloadPageTab()">
        <el-icon style="transform: scale(1.09)">
          <ReloadOutlined />
        </el-icon>
      </layout-tool>
    </template>
    <!-- 顶栏右侧按钮 -->
    <template #right>
      <header-right v-model:isFullscreen="isFullscreen" />
    </template>
    <!-- 页签栏右侧下拉菜单 -->
    <template v-if="tabBar && !tabInHeader" #tabExtra="{ active }">
      <tab-dropdown
        :items="getTabContext(void 0, active)"
        :dropdown-props="{
          popperOptions: {
            strategy: 'fixed',
            modifiers: [{ name: 'offset', options: { offset: [12, 8] } }]
          },
          menuStyle: tabDropdownMenuStyle
        }"
        @menuClick="(key) => handleTabDropdownMenu(key, active)"
      />
    </template>
    <!-- 折叠双侧栏一级 -->
    <template #boxBottom>
      <div :style="{ flexShrink: 0, padding: roundedTheme ? '4px 8px' : 0 }">
        <layout-tool style="height: 32px" @click="updateCompact(!compact)">
          <el-icon style="transform: scale(1.05)">
            <MenuUnfoldOutlined v-if="compact" />
            <MenuFoldOutlined v-else />
          </el-icon>
        </layout-tool>
      </div>
    </template>
    <!-- 全局页脚 -->
    <template v-if="footer" #footer>
      <page-footer />
    </template>
    <!-- 清新主题菜单图标使用图片 -->
    <template v-if="isSimpleTheme" #icon="{ icon }">
      <menu-icon :icon="icon" img-class="el-icon" />
    </template>
    <template v-if="isSimpleTheme" #tabHome>
      <menu-icon
        v-if="tabIcon"
        icon="IconProHomeOutlined"
        :img-style="{ margin: '0 4px 0 -4px', verticalAlign: '-5px' }"
      />
      <span>主页</span>
    </template>
    <!-- 页签标题 -->
    <template #tabTitle="{ label, item }">
      <menu-icon
        v-if="tabIcon"
        :icon="item.meta?.icon"
        :component-props="item.meta?.props?.iconProps"
        component-class="ele-tab-icon"
        :component-style="{ marginRight: '4px' }"
        :icon-style="item.meta?.props?.iconStyle"
        :img-style="{ margin: '0 4px 0 -4px', verticalAlign: '-5px' }"
      />
      <span>{{ label }}</span>
    </template>
  </ele-pro-layout>
  <!-- 内容全屏退出按钮 -->
  <el-icon
    v-if="maximized ? (!tabBar || tabInHeader ? true : expanded) : false"
    class="ele-layout-fullscreen-icon"
    @click="updateMaximized(false)"
  >
    <FullscreenExitOutlined />
  </el-icon>
</template>

<script setup>
  import { ref, markRaw } from 'vue';
  import { useRouter, onBeforeRouteUpdate } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import {
    LayoutTool,
    TabDropdown,
    checkFullscreen,
    EleMessage
  } from 'ele-admin-plus';
  import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ReloadOutlined,
    ExpandOutlined,
    CompressOutlined,
    CloseOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    MinusCircleOutlined,
    CloseCircleOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    ShareOutlined,
    PinOutlined,
    UnpinOutlined
  } from '@/components/icons';
  import { HOME_PATH, REDIRECT_PATH, TAB_MAX_NUM } from '@/config/setting';
  import { useUserStore } from '@/store/modules/user';
  import { useTabStore } from '@/store/modules/tab';
  import { useThemeStore } from '@/store/modules/theme';
  import { useMobileDevice } from '@/utils/use-mobile';
  import { usePageTab } from '@/utils/use-page-tab';
  import { useIsSimpleTheme } from '@/components/IconSelect/util';
  import HeaderRight from './components/header-right.vue';
  import PageFooter from './components/page-footer.vue';
  import MaterialPreviewHost from '@/views/hrams/components/material-preview-host.vue';
  const PROJECT_NAME = import.meta.env.VITE_APP_NAME;

  defineOptions({ name: 'Layout' });

  const { push, resolve } = useRouter();
  const {
    addPageTab,
    removePageTab,
    removeAllPageTab,
    removeLeftPageTab,
    removeRightPageTab,
    removeOtherPageTab,
    reloadPageTab,
    setPageTabs,
    setPageTab
  } = usePageTab();
  const { mobileDevice } = useMobileDevice();
  const userStore = useUserStore();
  const tabStore = useTabStore();
  const themeStore = useThemeStore();

  /** 菜单数据 */
  const { menus } = storeToRefs(userStore);

  /** 页签数据 */
  const { tabs, fixedHome, pageKeepAlive } = storeToRefs(tabStore);

  /** 布局风格 */
  const {
    collapse,
    compact,
    maximized,
    expanded,
    tabBar,
    layout,
    sidebarLayout,
    headerStyle,
    sidebarStyle,
    mixSidebarStyle,
    tabStyle,
    fixedHeader,
    fixedSidebar,
    fixedBody,
    fluid,
    logoInHeader,
    colorfulIcon,
    transitionName,
    uniqueOpened,
    tabInHeader,
    sidebarCustomStyle,
    sideboxCustomStyle,
    sideCustomStyle,
    headerCustomStyle,
    tabsCustomStyle,
    contentCustomStyle,
    layoutCustomClass,
    layoutCustomStyle,
    sidebarMenuProps,
    sideboxMenuProps,
    roundedTheme,
    menuItemTrigger,
    footer,
    tabIcon
  } = storeToRefs(themeStore);

  /** 是否是清新主题 */
  const { isSimpleTheme } = useIsSimpleTheme();

  /** 是否全屏 */
  const isFullscreen = ref(false);

  /** 侧栏折叠切换 */
  const updateCollapse = (value) => {
    themeStore.setValue('collapse', value).catch((e) => console.error(e));
  };

  /** 双侧栏一级折叠切换 */
  const updateCompact = (value) => {
    themeStore.setValue('compact', value).catch((e) => console.error(e));
  };

  /** 内容区全屏切换 */
  const updateMaximized = async (value, fullscreen) => {
    try {
      if (value) {
        await themeStore.setValue('expanded', !!fullscreen);
      }
      await themeStore.setValue('maximized', value);
    } catch (e) {
      console.error(e);
    }
  };

  /** 页签添加事件 */
  const handleTabAdd = (data, active) => {
    addPageTab(data, active);
  };

  /** 页签点击事件 */
  const handleTabClick = (option) => {
    const { key, active, item } = option;
    const path = item?.fullPath || key;
    if (key !== active && path) {
      push(path);
    }
  };

  /** 内容区尺寸改变事件 */
  const handleBodySizeChange = ({ width }) => {
    themeStore
      .setValue('contentWidth', width ?? null)
      .catch((e) => console.error(e));
    isFullscreen.value = checkFullscreen();
  };

  /** 页签右键菜单 */
  const getTabContext = (item, active) => {
    const items = [
      {
        title: '重新加载',
        command: 'reload',
        icon: markRaw(ReloadOutlined),
        iconStyle: { transform: 'scale(0.98)' }
      },
      {
        title: '关闭标签页',
        command: 'close',
        icon: markRaw(CloseOutlined)
      }
    ];
    if (maximized.value) {
      items.push({
        title: '退出主体全屏',
        command: 'maximizedExit',
        icon: markRaw(CompressOutlined),
        divided: true
      });
    } else {
      items.push({
        title: '全屏主体区域',
        command: 'maximized',
        icon: markRaw(ExpandOutlined),
        iconStyle: { transform: 'scale(0.96)' },
        divided: true
      });
    }
    if (!tabInHeader.value) {
      items.push({
        title: '全屏内容区域',
        command: 'fullscreen',
        icon: markRaw(FullscreenOutlined),
        iconStyle: { transform: 'scale(0.98)' }
      });
    }
    items.push({
      title: '关闭左侧标签页',
      command: 'left',
      icon: markRaw(ArrowLeftOutlined),
      divided: true
    });
    items.push({
      title: '关闭右侧标签页',
      command: 'right',
      icon: markRaw(ArrowRightOutlined)
    });
    items.push({
      title: '关闭其它标签页',
      command: 'other',
      icon: markRaw(MinusCircleOutlined)
    });
    items.push({
      title: '关闭全部标签页',
      command: 'all',
      icon: markRaw(CloseCircleOutlined)
    });
    const tab =
      item || (active ? tabs.value.find((t) => t.key === active) : void 0);
    const home = tab?.home ?? tab?.meta?.home;
    if (
      tab &&
      !(fixedHome.value && home) &&
      !(tabs.value.length === 1 && home)
    ) {
      if (tab.closable) {
        items.push({
          title: '固定',
          command: 'pin',
          icon: markRaw(PinOutlined),
          divided: true
        });
      } else {
        items.push({
          title: '取消固定',
          command: 'unpin',
          icon: markRaw(UnpinOutlined),
          divided: true
        });
      }
    }
    items.push({
      title: '在新窗口中打开',
      command: 'blank',
      icon: markRaw(ShareOutlined),
      iconStyle: { transform: 'scale(0.9)' },
      divided: !items[items.length - 1]?.divided
    });
    return items;
  };

  /** 页签右键菜单点击事件 */
  const handleTabContextMenu = (option) => {
    const { command, key, item, active } = option;
    if (command === 'reload') {
      reloadPageTab({ fullPath: item?.fullPath || key });
    } else if (command === 'close') {
      removePageTab({ key, active });
    } else if (command === 'left') {
      removeLeftPageTab({ key, active });
    } else if (command === 'right') {
      removeRightPageTab({ key, active });
    } else if (command === 'other') {
      removeOtherPageTab({ key, active });
    } else if (command === 'all') {
      removeAllPageTab({ key, active });
    } else if (command === 'maximized') {
      updateMaximized(true);
    } else if (command === 'maximizedExit') {
      updateMaximized(false);
    } else if (command === 'fullscreen') {
      updateMaximized(true, true);
    } else if (command === 'blank') {
      window.open(resolve(item?.fullPath || '/').href);
    } else if (command === 'pin') {
      setPageTab({ path: item?.fullPath || key, closable: false });
    } else if (command === 'unpin') {
      setPageTab({ path: item?.fullPath || key, closable: true });
    }
  };

  /** 页签栏右侧下拉菜单点击事件 */
  const handleTabDropdownMenu = (command, active) => {
    if (command === 'reload') {
      reloadPageTab();
    } else if (command === 'blank') {
      window.open(location.href);
    } else {
      handleTabContextMenu({ command, key: active, active });
    }
  };

  /** 页签栏下拉菜单样式调整 */
  const tabDropdownMenuStyle = {
    '--ele-dropdown-item-padding': '0 18px',
    '--ele-dropdown-item-height': '30px',
    '--ele-dropdown-item-margin': '0px',
    '--ele-dropdown-divider-margin': '3px 0',
    '--ele-dropdown-icon-margin': '0 12px 0 -4px',
    '--ele-dropdown-icon-size': '15px'
  };

  /** 限制页签最大打开数量 */
  onBeforeRouteUpdate((to) => {
    const { path, fullPath, meta } = to;
    const toTabKey = meta.tabUnique === false ? fullPath : path;
    if (
      !to.path.includes(REDIRECT_PATH) &&
      tabBar.value &&
      TAB_MAX_NUM &&
      !tabs.value.some((d) => d.key === toTabKey) &&
      tabs.value.length >= TAB_MAX_NUM
    ) {
      EleMessage.error({
        message: `最多打开 ${TAB_MAX_NUM} 个页签`,
        plain: true
      });
      return false;
    }
  });
</script>
