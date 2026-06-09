<template>
  <!-- 侧栏风格 -->
  <div class="ele-setting-theme">
    <div class="ele-setting-theme-item">
      <div
        class="ele-setting-theme-item-cover ele-setting-side-light"
        @click="updateValue('sidebarStyle', 'light')"
      >
        <EleText
          v-if="sidebarStyle === 'light'"
          type="primary"
          :icon="CheckOutlined"
        />
      </div>
      <div>亮色侧栏</div>
    </div>
    <div class="ele-setting-theme-item">
      <div
        class="ele-setting-theme-item-cover ele-setting-side-dark"
        @click="updateValue('sidebarStyle', 'dark')"
      >
        <EleText
          v-if="sidebarStyle === 'dark'"
          type="primary"
          :icon="CheckOutlined"
        />
      </div>
      <div>暗色侧栏</div>
    </div>
  </div>
  <!-- 顶栏风格 -->
  <div class="ele-setting-theme">
    <div class="ele-setting-theme-item">
      <div
        class="ele-setting-theme-item-cover ele-setting-head-light"
        @click="updateValue('headerStyle', 'light')"
      >
        <EleText
          v-if="headerStyle === 'light'"
          type="primary"
          :icon="CheckOutlined"
        />
      </div>
      <div>亮色顶栏</div>
    </div>
    <div class="ele-setting-theme-item">
      <div
        class="ele-setting-theme-item-cover ele-setting-head-dark"
        @click="updateValue('headerStyle', 'dark')"
      >
        <EleText
          v-if="headerStyle === 'dark'"
          type="primary"
          :icon="CheckOutlined"
        />
      </div>
      <div>暗色顶栏</div>
    </div>
    <div class="ele-setting-theme-item">
      <div
        class="ele-setting-theme-item-cover ele-setting-head-primary"
        @click="updateValue('headerStyle', 'primary')"
      >
        <EleText
          v-if="headerStyle === 'primary'"
          type="primary"
          :icon="CheckOutlined"
        />
      </div>
      <div>主色顶栏</div>
    </div>
  </div>
  <!-- 主题色 -->
  <div class="ele-setting-colors">
    <div
      v-for="item in PREDEFINE_THEMES"
      :key="item.name"
      :style="{
        backgroundColor: item.color || item.value,
        color: item.color || item.value
      }"
      class="ele-setting-color-item"
      :title="item.name"
      @click="updateColor(item.value)"
    >
      <ElIcon v-if="item.value ? item.value === color : !color">
        <CheckOutlined />
      </ElIcon>
    </div>
    <!-- 颜色选择器 -->
    <ElColorPicker
      :teleported="false"
      v-model="colorPickerValue"
      :predefine="PREDEFINE_COLORS"
      class="ele-setting-color-picker"
      :class="{ 'is-empty-color': !colorPickerValue }"
      :popperOptions="{ strategy: 'fixed' }"
      @change="updateColor"
    />
  </div>
  <!-- 暗黑模式 -->
  <SettingItem title="开启暗黑模式">
    <ElSwitch
      ref="darkSwitchRef"
      size="small"
      :modelValue="darkMode"
      @update:modelValue="updateDarkMode"
    />
  </SettingItem>
  <!-- 圆角主题 -->
  <SettingItem title="开启圆角主题">
    <ElSwitch
      size="small"
      :modelValue="roundedTheme"
      @update:modelValue="(val) => updateValue('roundedTheme', val)"
    />
  </SettingItem>
  <ElDivider />
  <!-- 导航布局 -->
  <EleText type="placeholder" class="ele-setting-title">导航模式</EleText>
  <div class="ele-setting-theme hidden-xs-only">
    <div class="ele-setting-theme-item">
      <div
        class="ele-setting-theme-item-cover ele-setting-side-dark ele-setting-layout-side"
        @click="updateValue('layout', 'default')"
      >
        <EleText
          v-if="layout === 'default'"
          type="primary"
          :icon="CheckOutlined"
        />
      </div>
      <div>左侧菜单</div>
    </div>
    <div class="ele-setting-theme-item">
      <div
        class="ele-setting-theme-item-cover ele-setting-head-dark ele-setting-layout-top"
        @click="updateValue('layout', 'top')"
      >
        <EleText v-if="layout === 'top'" type="primary" :icon="CheckOutlined" />
      </div>
      <div>顶部菜单</div>
    </div>
    <div class="ele-setting-theme-item">
      <div
        class="ele-setting-theme-item-cover ele-setting-layout-mix"
        @click="updateValue('layout', 'mix')"
      >
        <EleText v-if="layout === 'mix'" type="primary" :icon="CheckOutlined" />
      </div>
      <div>混合菜单</div>
    </div>
  </div>
  <!-- 侧栏菜单布局 -->
  <SettingItem title="侧栏双排菜单">
    <ElSwitch
      size="small"
      :disabled="layout === 'top'"
      :modelValue="sidebarLayout === 'mix'"
      @update:modelValue="
        (value) => updateValue('sidebarLayout', value ? 'mix' : 'default')
      "
    />
  </SettingItem>
  <!-- 双侧栏二级风格 -->
  <SettingItem title="暗色二级侧栏">
    <ElSwitch
      size="small"
      :disabled="sidebarLayout !== 'mix'"
      :modelValue="mixSidebarStyle === 'dark'"
      @update:modelValue="
        (value) => updateValue('mixSidebarStyle', value ? 'dark' : 'light')
      "
    />
  </SettingItem>
  <!-- 混合菜单分割 -->
  <SettingItem title="混合菜单分割">
    <ElSelect
      size="small"
      :teleported="false"
      :disabled="
        layout === 'top' || (sidebarLayout !== 'mix' && layout !== 'mix')
      "
      :modelValue="menuItemTrigger"
      @update:modelValue="(val) => updateValue('menuItemTrigger', val)"
      :popperOptions="{ strategy: 'fixed' }"
      style="width: 72px"
    >
      <ElOption value="route" label="Route" />
      <ElOption value="click" label="Click" />
      <ElOption value="hover" label="Hover" />
    </ElSelect>
  </SettingItem>
  <ElDivider />
  <EleText type="placeholder" class="ele-setting-title">更多配置</EleText>
  <!-- 固定主体 -->
  <SettingItem title="内容区域滚动">
    <ElSwitch
      size="small"
      :modelValue="fixedBody"
      @update:modelValue="(val) => updateValue('fixedBody', val)"
    />
  </SettingItem>
  <!-- 固定顶栏 -->
  <SettingItem title="固定顶栏区域">
    <ElSwitch
      size="small"
      :disabled="fixedBody"
      :modelValue="fixedHeader"
      @update:modelValue="(val) => updateValue('fixedHeader', val)"
    />
  </SettingItem>
  <!-- 固定侧栏 -->
  <SettingItem title="固定侧栏区域">
    <ElSwitch
      size="small"
      :modelValue="fixedSidebar"
      :disabled="fixedBody || layout === 'top'"
      @update:modelValue="(val) => updateValue('fixedSidebar', val)"
    />
  </SettingItem>
  <!-- 图标是否置于顶栏 -->
  <SettingItem title="Logo置于顶栏" class="hidden-xs-only">
    <ElSwitch
      size="small"
      :modelValue="logoInHeader"
      :disabled="layout === 'top'"
      @update:modelValue="(val) => updateValue('logoInHeader', val)"
    />
  </SettingItem>
  <!-- 侧栏彩色图标 -->
  <SettingItem title="侧栏彩色图标">
    <ElSwitch
      size="small"
      :modelValue="colorfulIcon"
      :disabled="layout === 'top'"
      @update:modelValue="(val) => updateValue('colorfulIcon', val)"
    />
  </SettingItem>
  <!-- 侧栏排它展开 -->
  <SettingItem title="侧栏排它展开">
    <ElSwitch
      size="small"
      :modelValue="uniqueOpened"
      @update:modelValue="(val) => updateValue('uniqueOpened', val)"
    />
  </SettingItem>
  <!-- 内容区域铺满 -->
  <SettingItem title="内容区域铺满" class="hidden-xs-only">
    <ElSwitch
      size="small"
      :modelValue="fluid"
      @update:modelValue="(val) => updateValue('fluid', val)"
    />
  </SettingItem>
  <ElDivider />
  <EleText type="placeholder" class="ele-setting-title">页签配置</EleText>
  <!-- 页签 -->
  <SettingItem title="开启多页签栏">
    <ElSwitch
      size="small"
      :modelValue="tabBar"
      @update:modelValue="(value) => updateValue('tabBar', value)"
    />
  </SettingItem>
  <!-- 固定主页页签 -->
  <SettingItem title="固定主页页签">
    <ElSwitch
      size="small"
      :disabled="!tabBar"
      :modelValue="fixedHome"
      @update:modelValue="(val) => updateValue('fixedHome', val)"
    />
  </SettingItem>
  <!-- 页签置于顶栏 -->
  <SettingItem title="页签置于顶栏">
    <ElSwitch
      size="small"
      :disabled="!tabBar"
      :modelValue="tabInHeader"
      @update:modelValue="(val) => updateValue('tabInHeader', val)"
    />
  </SettingItem>
  <!-- 页签显示图标 -->
  <SettingItem title="页签显示图标">
    <ElSwitch
      size="small"
      :disabled="!tabBar"
      :modelValue="tabIcon"
      @update:modelValue="(val) => updateValue('tabIcon', val)"
    />
  </SettingItem>
  <!-- 刷新保留页签 -->
  <SettingItem title="刷新保留页签">
    <ElSwitch
      size="small"
      :disabled="!tabBar"
      :modelValue="tabsCache"
      @update:modelValue="(val) => updateValue('tabsCache', val)"
    />
  </SettingItem>
  <!-- 页签风格 -->
  <SettingItem title="页签显示风格">
    <ElSelect
      size="small"
      :teleported="false"
      :disabled="!tabBar"
      :modelValue="tabStyle"
      @update:modelValue="(val) => updateValue('tabStyle', val)"
      :popperOptions="{ strategy: 'fixed' }"
      style="width: 90px"
    >
      <ElOption value="simple" label="默认" />
      <ElOption value="indicator" label="圆点" />
      <ElOption value="tag" label="标签" />
      <ElOption value="button" label="卡片" />
    </ElSelect>
  </SettingItem>
  <ElDivider />
  <EleText type="placeholder" class="ele-setting-title">其它配置</EleText>
  <!-- 切换路由是否缓存 -->
  <SettingItem title="页面切换缓存">
    <ElSwitch
      size="small"
      :modelValue="pageKeepAlive"
      @update:modelValue="(val) => updateValue('pageKeepAlive', val)"
    />
  </SettingItem>
  <!-- 全局页脚 -->
  <SettingItem title="开启全局页脚">
    <ElSwitch
      size="small"
      :modelValue="footer"
      @update:modelValue="(val) => updateValue('footer', val)"
    />
  </SettingItem>
  <!-- 切换动画 -->
  <SettingItem title="路由切换动画">
    <ElSelect
      size="small"
      :teleported="false"
      :modelValue="transitionName"
      @update:modelValue="(val) => updateValue('transitionName', val)"
      :popperOptions="{ strategy: 'fixed' }"
      style="width: 110px"
    >
      <ElOption value="slide-right" label="滑动消退" />
      <ElOption value="slide-bottom" label="底部消退" />
      <ElOption value="zoom-in" label="放大渐变" />
      <ElOption value="zoom-out" label="缩小渐变" />
      <ElOption value="fade" label="淡入淡出" />
      <ElOption value="none" label="无" />
    </ElSelect>
  </SettingItem>
  <ElDivider />
  <!-- 重置 -->
  <div class="ele-setting-footer">
    <ElButton
      :icon="CopyOutlined"
      type="primary"
      size="small"
      class="ele-fluid"
      @click="copySetting"
    >
      拷贝设置
    </ElButton>
    <ElButton
      :icon="UndoOutlined"
      size="small"
      class="ele-fluid"
      @click="resetSetting"
    >
      重置
    </ElButton>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import { EleMessage, copyText } from 'ele-admin-plus';
  import {
    CheckOutlined,
    UndoOutlined,
    CopyOutlined
  } from '@/components/icons';
  import { useTabStore, tabStateProps } from '@/store/modules/tab';
  import { useThemeStore } from '@/store/modules/theme';
  import { PREDEFINE_THEMES, PREDEFINE_COLORS } from '@/utils/skin-config';
  import { doWithTransition } from '@/utils/common';
  import SettingItem from './setting-item.vue';

  const tabStore = useTabStore();
  const themeStore = useThemeStore();

  const {
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
    transitionName,
    colorfulIcon,
    uniqueOpened,
    tabInHeader,
    menuItemTrigger,
    darkMode,
    color,
    roundedTheme,
    footer,
    tabIcon
  } = storeToRefs(themeStore);
  const { fixedHome, tabsCache, pageKeepAlive } = storeToRefs(tabStore);

  /** 暗黑主题切换开关 */
  const darkSwitchRef = ref(null);

  /** 颜色选择器选中颜色 */
  const colorPickerValue = ref();

  /** 初始化主题色选择器选中 */
  const initColorValue = () => {
    if (color.value && !PREDEFINE_THEMES.some((t) => t.value === color.value)) {
      colorPickerValue.value = color.value;
    } else {
      colorPickerValue.value = void 0;
    }
  };

  /** 更新主题配置 */
  const updateValue = (prop, value) => {
    if (tabStateProps.includes(prop)) {
      tabStore.setValue(prop, value);
      return;
    }
    themeStore.setValue(prop, value).catch((e) => {
      console.error(e);
    });
  };

  /** 切换主题色 */
  const updateColor = (val) => {
    themeStore
      .setValue('color', val)
      .then(() => {
        initColorValue();
      })
      .catch((e) => {
        console.error(e);
      });
  };

  /** 切换暗黑模式 */
  const updateDarkMode = (val) => {
    doWithTransition(
      () => themeStore.setValue('darkMode', val),
      darkSwitchRef.value?.$el?.querySelector?.('.el-switch__action'),
      !val
    );
  };

  /** 重置 */
  const resetSetting = () => {
    themeStore
      .resetSetting()
      .then(() => {
        tabStore.resetSetting();
        initColorValue();
      })
      .catch((e) => {
        console.error(e);
      });
  };

  /** 拷贝 */
  const copySetting = () => {
    const themeState = themeStore.$state;
    const skinConfig = themeState.skinConfig;
    const themeResult = {
      ...themeState,
      contentWidth: null,
      skinConfig: skinConfig == null ? null : { ...skinConfig, layouts: void 0 }
    };
    const tabResult = { ...tabStore.$state, tabs: [] };
    const result = `/** src/store/modules/theme.js 默认值 */
const DEFAULT_STATE = ${JSON.stringify(themeResult, null, 2)};

/** src/store/modules/tab.js 默认值 */
const DEFAULT_STATE = ${JSON.stringify(tabResult, null, 2)};
`;
    copyText(result)
      .then(() => {
        EleMessage.success({ message: '复制成功', plain: true });
      })
      .catch((e) => {
        console.error(e);
      });
  };

  watch(
    color,
    () => {
      initColorValue();
    },
    { immediate: true }
  );
</script>
