import { defineStore } from 'pinia';

/**
 * 字典状态管理
 */
export const useDictStore = defineStore('dict', {
  state: () => ({
    /** 字典数据缓存 */
    dicts: null
  }),
  actions: {
    /**
     * 清空字典数据
     */
    clearDicts() {
      if (this.dicts == null) {
        return;
      }
      this.dicts.clear();
    },
    /**
     * 更新字典数据
     * @param value 字典数据
     * @param code 字典代码
     */
    setDicts(value, code) {
      if (code != null) {
        if (this.dicts == null) {
          this.dicts = new Map();
        }
        this.dicts.set(code, value);
        return;
      }
      if (value == null) {
        this.dicts = null;
        return;
      }
      if (value instanceof Map) {
        this.dicts = value;
        return;
      }
      if (this.dicts == null) {
        this.dicts = new Map();
      } else {
        this.clearDicts();
      }
      Object.keys(value).forEach((key) => {
        this.dicts.set(key, value[key]);
      });
    },
    /**
     * 获取字典数据
     * @param code 字典代码
     */
    getDicts(code) {
      if (code != null) {
        if (this.dicts == null) {
          return void 0;
        }
        return this.dicts.get(code);
      }
      return this.dicts;
    }
  }
});
