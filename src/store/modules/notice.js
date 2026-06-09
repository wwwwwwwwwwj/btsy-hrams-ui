import { defineStore } from 'pinia';

/**
 * 消息通知状态管理
 */
export const useNoticeStore = defineStore('notice', {
  state: () => ({
    /** 消息通知 */
    notices: []
  }),
  getters: {
    /** 未读数量 */
    unreadNum() {
      return this.notices.filter((item) => !item.read).length;
    }
  },
  actions: {
    /**
     * 添加消息通知
     */
    addNotice(item) {
      this.notices.push(item);
    },
    /**
     * 删除消息通知
     */
    removeNotice(item) {
      this.notices.splice(this.notices.indexOf(item), 1);
    },
    /**
     * 清空消息通知
     */
    clearNotice() {
      this.notices = [];
    },
    /**
     * 已读消息通知
     */
    readNotice(item) {
      for (const temp of this.notices) {
        if (item === temp) {
          temp.read = true;
          return;
        }
      }
    },
    /**
     * 全部已读消息通知
     */
    readAllNotice() {
      this.notices.forEach((item) => {
        item.read = true;
      });
    }
  }
});
