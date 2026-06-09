import { defineStore } from 'pinia';
import { cloneDeep } from 'lodash-es';
import { TAB_MAX_NUM } from '@/config/setting';
import {
  getCacheSetting,
  cacheSetting,
  clearSetting,
  RESET_EXCLUDES
} from '@/utils/theme-util';

/**
 * 默认值
 */
const DEFAULT_STATE = {
  /** 页签数据 */
  tabs: [],
  /** 固定主页页签 */
  fixedHome: true,
  /** 刷新是否保留已打开页签 */
  tabsCache: false,
  /** 切换路由是否缓存 */
  pageKeepAlive: true
};

/**
 * 页签状态管理
 */
export const useTabStore = defineStore('tab', {
  state: () => {
    const state = cloneDeep(DEFAULT_STATE);
    // 读取本地缓存
    const cache = getCacheSetting();
    Object.keys(state).forEach((key) => {
      const value = cache[key];
      if (typeof value !== 'undefined') {
        state[key] = value;
      }
    });
    if (!state.tabsCache) {
      state.tabs = [];
    }
    return state;
  },
  getters: {
    /** 需要缓存的路由组件 */
    keepAliveInclude() {
      if (!this.pageKeepAlive || !this.tabs) {
        return [];
      }
      const components = new Set();
      this.tabs.forEach((t) => {
        if (t.meta?.keepAlive !== false && !t.refresh && t.components) {
          t.components.forEach((c) => {
            if (typeof c === 'string' && c) {
              components.add(c);
            }
          });
        }
      });
      return Array.from(components);
    }
  },
  actions: {
    /**
     * 修改配置
     * @param prop 属性名
     * @param value 值
     */
    setValue(prop, value) {
      if (prop === 'tabs') {
        this.tabs = value.sort(
          (a, b) =>
            (this.fixedHome && a.home ? -1 : Number(!!a.closable)) -
            (this.fixedHome && b.home ? -1 : Number(!!b.closable))
        );
      } else {
        this[prop] = value;
      }
      if (prop !== 'tabs' || this.tabsCache) {
        cacheSetting(prop, value);
      }
      // 页签缓存开关切换后同时更新缓存的页签数据
      if (prop === 'tabsCache') {
        cacheSetting('tabs', this.tabsCache ? this.tabs : void 0);
      }
    },
    /**
     * 重置
     */
    resetSetting() {
      Object.keys(DEFAULT_STATE).forEach((key) => {
        if (!RESET_EXCLUDES.includes(key)) {
          this[key] = cloneDeep(DEFAULT_STATE[key]);
        }
      });
      clearSetting(tabStateProps);
    },
    /**
     * 添加页签或更新页签数据
     * @param data 页签数据
     * @param active 当前选中页签的标识
     * @param removeFirst 页签超出限制数量时是否自动移出第一个
     */
    async tabAdd(data, active, removeFirst) {
      const i = this.tabs.findIndex((d) => d.key === data.key);
      if (i === -1) {
        const temps = [...this.tabs];
        // 判断页签数量限制
        if (TAB_MAX_NUM && this.tabs.length >= TAB_MAX_NUM) {
          if (!removeFirst) {
            return Promise.reject();
          }
          // 移出超出数量的页签
          temps.splice(0, this.tabs.length - TAB_MAX_NUM + 1);
        }
        // 添加页签数据
        const ai = active ? this.tabs.findIndex((d) => d.key === active) : -1;
        if (ai === -1 || ai === temps.length - 1) {
          temps.push(data);
        } else {
          // 在选中页签后面添加
          temps.splice(ai + 1, 0, data);
        }
        this.setValue('tabs', temps);
      } else if (data.fullPath !== this.tabs[i].fullPath) {
        // 页签已存在更新数据
        const temps = [...this.tabs];
        temps[i] = data;
        this.setValue('tabs', temps);
      }
    },
    /**
     * 关闭页签
     */
    async tabRemove({ key, active }) {
      const i = this.tabs.findIndex((t) => t.key === key || t.fullPath === key);
      if (i === -1) {
        return {};
      }
      const t = this.tabs[i];
      if (
        !t.closable ||
        (t.home && (this.tabs.length === 1 || this.fixedHome))
      ) {
        return Promise.reject();
      }
      const path = this.tabs[i + (i === 0 ? 1 : -1)]?.fullPath;
      this.setValue(
        'tabs',
        this.tabs.filter((_d, j) => j !== i)
      );
      return t.key === active ? { path, home: !path } : {};
    },
    /**
     * 关闭左侧页签
     */
    async tabRemoveLeft({ key, active }) {
      let index = -1; // 选中页签的索引
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].key === active) {
          index = i;
        }
        if (this.tabs[i].key === key) {
          if (i === 0) {
            break;
          }
          const temp = this.tabs.filter((d, j) => !d.closable && j < i);
          if (temp.length === i) {
            break;
          }
          const path = index === -1 ? void 0 : this.tabs[i].fullPath;
          this.setValue('tabs', temp.concat(this.tabs.slice(i)));
          return { path };
        }
      }
      return Promise.reject();
    },
    /**
     * 关闭右侧页签
     */
    async tabRemoveRight({ key, active }) {
      let index = -1; // 选中页签的索引
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].key === active) {
          index = i;
        }
        if (this.tabs[i].key === key) {
          if (i === this.tabs.length - 1) {
            break;
          }
          const temp = this.tabs.filter((d, j) => !d.closable && j > i);
          if (temp.length === this.tabs.length - i - 1) {
            break;
          }
          const path = index === -1 ? this.tabs[i].fullPath : void 0;
          this.setValue('tabs', this.tabs.slice(0, i + 1).concat(temp));
          return { path };
        }
      }
      return Promise.reject();
    },
    /**
     * 关闭其它页签
     */
    async tabRemoveOther({ key, active }) {
      let path; // 关闭后跳转的地址
      const temps = this.tabs.filter((d) => {
        if (d.key === key) {
          path = d.fullPath;
        }
        return !d.closable || d.key === key;
      });
      if (temps.length === this.tabs.length) {
        return Promise.reject();
      }
      this.setValue('tabs', temps);
      return key === active ? {} : { path };
    },
    /**
     * 关闭全部页签
     */
    async tabRemoveAll({ active }) {
      if (this.tabs.length === 1 && this.tabs[0].home) {
        return Promise.reject();
      }
      const temps = this.tabs.filter(
        (t) => !t.closable || (t.home && this.fixedHome)
      );
      if (temps.length === this.tabs.length) {
        return Promise.reject();
      }
      const t = active ? this.tabs.find((d) => d.key === active) : void 0;
      const jump = t != null && t.closable === true; // 关闭后是否跳转
      if (!temps.length) {
        const h = this.tabs.find((d) => d.home);
        if (!h) {
          this.setValue('tabs', []);
          return { home: true };
        }
        this.setValue('tabs', [h]);
        return { home: t?.home ? void 0 : true };
      }
      this.setValue('tabs', temps);
      return { path: jump ? temps[0].fullPath : void 0 };
    },
    /**
     * 修改页签
     * @param data 页签数据
     */
    tabSetItem(data) {
      const { key, fullPath, path } = data;
      const k = key ? 'key' : fullPath ? 'fullPath' : path ? 'path' : void 0;
      if (!k) {
        return;
      }
      let flag = false;
      const temps = [...this.tabs];
      this.tabs.forEach((d, i) => {
        if (data[k] === d[k]) {
          const item = { ...d };
          // 修改页签标题
          if (data.title) {
            const title = data.title;
            item.title = title;
            if (item.meta) {
              item.meta = {
                ...item.meta,
                lang: { zh_CN: title, zh_TW: title, en: title }
              };
            }
          }
          // 修改页签关闭状态
          if (typeof data.closable === 'boolean') {
            item.closable = data.closable;
          }
          // 修改页签刷新状态
          if (typeof data.refresh === 'boolean') {
            item.refresh = data.refresh;
          }
          // 修改页签组件名称
          if (data.components) {
            item.components = data.components;
          }
          // 修改页签滚动位置
          const tabScrollTop = data.meta?.tabScrollTop;
          if (tabScrollTop != null) {
            item.meta = { ...(item.meta || {}), tabScrollTop };
          }
          temps[i] = item;
          flag = true;
        }
      });
      if (flag) {
        this.setValue('tabs', temps);
      }
    }
  }
});

export const tabStateProps = Object.keys(DEFAULT_STATE);

/**
 * 获取路由对应的页签key
 * @param route 路由信息
 */
export function parseRouteTabKey(route) {
  const { path, fullPath, meta } = route;
  return meta.tabUnique === false ? fullPath : path;
}
