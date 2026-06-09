import { defineStore } from 'pinia';
import { cloneDeep } from 'lodash-es';
import {
  getCacheSetting,
  cacheSetting,
  clearSetting,
  RESET_EXCLUDES,
  changeRoundedTheme,
  cacheSkinBg,
  storeWallpaperFile,
  getCacheSkinConfig,
  getSkinConfig,
  releaseSkinBgCache,
  SKIN_THEME_CONFIG_EXCLUDES,
  changeTheme
} from '@/utils/theme-util';
import { tabStateProps } from './tab';

/**
 * 默认值
 */
const DEFAULT_STATE = {
  /** 是否折叠侧栏 */
  collapse: false,
  /** 侧栏一级是否紧凑风格 */
  compact: false,
  /** 内容区是否最大化 */
  maximized: false,
  /** 内容区最大化时是否不带页签栏 */
  expanded: false,
  /** 是否需要页签栏 */
  tabBar: true,
  /** 布局类型 */
  layout: 'default',
  /** 侧栏布局类型 */
  sidebarLayout: 'default',
  /** 顶栏风格 */
  headerStyle: 'light',
  /** 侧栏风格 */
  sidebarStyle: 'light',
  /** 双侧栏二级风格 */
  mixSidebarStyle: 'light',
  /** 页签风格 */
  tabStyle: 'simple',
  /** 是否固定顶栏 */
  fixedHeader: true,
  /** 是否固定侧栏 */
  fixedSidebar: true,
  /** 是否固定内容区 */
  fixedBody: true,
  /** 内容区是否撑满 */
  fluid: true,
  /** 图标是否置于顶栏 */
  logoInHeader: false,
  /** 侧栏菜单是否彩色图标 */
  colorfulIcon: false,
  /** 侧栏排他展开 */
  uniqueOpened: true,
  /** 页签是否置于顶栏 */
  tabInHeader: false,
  /** 自定义侧栏样式 */
  sidebarCustomStyle: null,
  /** 自定义双侧栏一级样式 */
  sideboxCustomStyle: null,
  /** 自定义侧栏容器样式 */
  sideCustomStyle: null,
  /** 自定义顶栏样式 */
  headerCustomStyle: null,
  /** 自定义页签栏样式 */
  tabsCustomStyle: null,
  /** 自定义内容区样式 */
  contentCustomStyle: null,
  /** 自定义布局类名 */
  layoutCustomClass: null,
  /** 自定义布局样式 */
  layoutCustomStyle: null,
  /** 侧栏菜单属性 */
  sidebarMenuProps: null,
  /** 双侧栏一级菜单属性 */
  sideboxMenuProps: null,
  /** 路由切换动画 */
  transitionName: 'slide-right',
  /** 是否暗黑模式 */
  darkMode: false,
  /** 主题色 */
  color: null,
  /** 主题色的色阶 */
  colors: null,
  /** 内容区宽度 */
  contentWidth: null,
  /** 是否开启圆角主题 */
  roundedTheme: true,
  /** 菜单触发模式 */
  menuItemTrigger: 'click',
  /** 是否开启全局页脚 */
  footer: true,
  /** 页签是否显示图标 */
  tabIcon: true,
  /** 皮肤背景配置 */
  skinConfig: null,
  /** 常用布局名称 */
  layoutName: null,
  /** 登录界面布局 */
  loginLayout: 'right',
  /** 主题切换提示 */
  themeTip: true
};

/**
 * 主题状态管理
 */
export const useThemeStore = defineStore('theme', {
  state: () => {
    const state = cloneDeep(DEFAULT_STATE);
    // 读取本地缓存
    const cache = getCacheSetting();
    Object.keys(state).forEach((key) => {
      if (key !== 'skinConfig') {
        const value = cache[key];
        if (typeof value !== 'undefined') {
          state[key] = value;
        }
      }
    });
    return state;
  },
  actions: {
    /**
     * 批量修改配置
     * @param config 配置
     * @returns 过滤禁止修改后的配置
     */
    setThemeConfig(config) {
      const obj = {};
      if (config) {
        Object.keys(config).forEach((k) => {
          const v = config[k];
          if (
            !SKIN_THEME_CONFIG_EXCLUDES.includes(k) &&
            typeof v !== 'undefined'
          ) {
            this[k] = v;
            obj[k] = v;
          }
        });
      }
      return obj;
    },
    /**
     * 修改皮肤背景或暗黑模式
     * @param value 皮肤背景配置
     * @param dark 修改暗黑模式时是否是暗黑模式
     * @param syncSkin 是否同步修改皮肤背景中的主题状态配置
     */
    async setSkinOrDark(value, dark, syncSkin) {
      const obj = {};
      if (dark == null) {
        this.skinConfig = value;
        obj.skinConfig = await getSkinConfig(this.skinConfig, true, false);
        if (obj.skinConfig) {
          obj.skinConfig.layouts = void 0;
        }
      } else {
        this.darkMode = dark;
        obj.darkMode = this.darkMode;
      }
      // 同步修改主题色
      const skinColor =
        (this.darkMode
          ? this.skinConfig?.darkConfig?.color
          : this.skinConfig?.color) ?? null;
      if (skinColor != null && skinColor !== this.color) {
        this.color = skinColor;
        obj.color = this.color;
      }
      if (syncSkin) {
        // 同步修改皮肤背景中的主题状态配置
        if (dark == null && this.skinConfig == null) {
          const temp = this.setThemeConfig(cloneDeep(DEFAULT_STATE));
          Object.assign(obj, temp);
          this.layoutName = null;
        } else {
          const layouts = this.skinConfig?.layouts || [];
          const defaultLN = this.skinConfig?.defaultLayout ?? this.layoutName;
          const layoutItem = defaultLN
            ? layouts.find((d) => d.name === defaultLN)
            : void 0;
          const temp = this.setThemeConfig(
            this.getLayoutConfig(layoutItem ?? layouts[0])
          );
          Object.assign(obj, temp);
          this.layoutName = layoutItem ? layoutItem.name : null;
        }
        obj.layoutName = this.layoutName;
      }
      cacheSetting(obj);
    },
    /**
     * 修改配置
     * @param prop 属性名
     * @param value 值
     * @param syncSkin 是否同步修改皮肤背景中的主题状态配置
     */
    async setValue(prop, value, syncSkin) {
      if (prop === 'skinConfig') {
        if (typeof value === 'function') {
          // 皮肤背景文件特殊处理
          const skin = await value(async (file) => {
            const id = await storeWallpaperFile(file);
            cacheSkinBg(id, file);
            return id;
          });
          const config = await getSkinConfig(skin, false, true);
          await this.setSkinOrDark(config, void 0, syncSkin);
        } else {
          await this.setSkinOrDark(value, void 0, syncSkin);
        }
        await releaseSkinBgCache(false, this.skinConfig);
      } else if (prop === 'darkMode') {
        await this.setSkinOrDark(this.skinConfig, !!value, syncSkin);
      } else {
        this[prop] = value;
        cacheSetting(prop, value);
      }
      if (prop === 'color' || prop === 'darkMode' || prop === 'skinConfig') {
        // 切换主题色、暗黑模式、皮肤背景
        this.colors = changeTheme(this.color, this.darkMode, this.skinConfig);
      } else if (prop === 'roundedTheme') {
        changeRoundedTheme(value); // 切换圆角主题
      }
    },
    /**
     * 重置
     */
    async resetSetting() {
      Object.keys(DEFAULT_STATE).forEach((key) => {
        if (!RESET_EXCLUDES.includes(key)) {
          this[key] = cloneDeep(DEFAULT_STATE[key]);
        }
      });
      clearSetting(void 0, tabStateProps);
      await releaseSkinBgCache(true, this.skinConfig);
      changeRoundedTheme(this.roundedTheme);
      this.colors = changeTheme(this.color, this.darkMode, this.skinConfig);
    },
    /**
     * 恢复主题
     */
    recoverTheme() {
      // 开启圆角主题
      if (this.roundedTheme) {
        changeRoundedTheme(true);
      }
      // 读取缓存的皮肤背景
      getCacheSkinConfig(this.skinConfig)
        .then((skin) => {
          this.skinConfig = skin;
          // 恢复主题色、暗黑模式、皮肤背景
          if (this.color || this.darkMode || this.skinConfig) {
            this.colors = changeTheme(
              this.color,
              this.darkMode,
              this.skinConfig
            );
          }
        })
        .catch((e) => {
          console.error(e);
        });
    },
    /**
     * 获取布局对应的主题配置
     * @param layoutItem 布局
     */
    getLayoutConfig(layoutItem) {
      const traditionalConfig = this.roundedTheme
        ? void 0
        : layoutItem.traditionalThemeConfig;
      return { ...(layoutItem.config || {}), ...(traditionalConfig || {}) };
    },
    /**
     * 修改常用布局
     * @param layoutItem 布局
     */
    setLayout(layoutItem) {
      this.layoutName = layoutItem.name;
      const obj = this.setThemeConfig(this.getLayoutConfig(layoutItem));
      obj.layoutName = this.layoutName;
      cacheSetting(obj);
    },
    /**
     * 获取滚动区域节点
     */
    getBodyScrollEl() {
      if (this.fixedBody) {
        const el = document.querySelector('.ele-pro-layout-content');
        if (el) {
          return el;
        }
      }
      return document.body;
    }
  }
});
