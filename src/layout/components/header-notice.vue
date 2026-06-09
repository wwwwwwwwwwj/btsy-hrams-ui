<!-- 顶栏消息通知 -->
<template>
  <ele-popover
    :width="336"
    trigger="click"
    transition="el-zoom-in-top"
    :content-style="{ padding: 0 }"
    :body-style="{ overflow: 'hidden' }"
    :popper-style="{ maxWidth: 'calc(100% - 32px)' }"
    :popper-options="{
      strategy: 'fixed',
      modifiers: [{ name: 'offset', options: { offset: [0, 5] } }]
    }"
  >
    <template #reference>
      <div style="display: flex; align-items: center; height: 100%">
        <el-badge
          :value="unreadNum"
          :hidden="!unreadNum"
          style="line-height: 1; padding: 4px 0"
        >
          <el-icon style="transform: scale(1.17)">
            <BellOutlined />
          </el-icon>
        </el-badge>
      </div>
    </template>
    <el-empty v-if="!notices.length" :image-size="68" />
    <template v-else>
      <div class="list-wrapper">
        <div
          v-for="(item, index) in notices"
          :key="index"
          class="list-item"
          @click="handleItemClick(item)"
        >
          <div class="list-item-body">
            <ele-ellipsis>{{ item.message }}</ele-ellipsis>
            <ele-ellipsis type="placeholder" class="list-item-text">
              {{ item.time }}
            </ele-ellipsis>
          </div>
          <el-tag
            v-if="item.read"
            type="success"
            size="small"
            :disable-transitions="true"
          >
            已读
          </el-tag>
          <el-tag v-else type="danger" size="small" :disable-transitions="true">
            未读
          </el-tag>
        </div>
      </div>
      <div class="bottom-tools">
        <div class="bottom-tool" @click="handleClearAll">清空通知</div>
        <el-divider direction="vertical" style="margin: 0; width: 0" />
        <div class="bottom-tool" @click="handleReadAll">全部已读</div>
      </div>
    </template>
  </ele-popover>
</template>

<script setup>
  import { storeToRefs } from 'pinia';
  import { BellOutlined } from '@/components/icons';
  import { useNoticeStore } from '@/store/modules/notice';

  const noticeStore = useNoticeStore();
  const { notices, unreadNum } = storeToRefs(noticeStore);

  /** 清空通知 */
  const handleClearAll = () => {
    noticeStore.clearNotice();
  };

  /** 全部已读通知 */
  const handleReadAll = () => {
    noticeStore.readAllNotice();
  };

  /** 通知点击事件 */
  const handleItemClick = (item) => {
    noticeStore.readNotice(item);
  };
</script>

<style lang="scss" scoped>
  .list-wrapper {
    padding: 8px 0;
    box-sizing: border-box;
    max-height: calc(100vh - 180px);
    min-height: 60px;
    overflow: auto;
  }

  .list-item {
    display: flex;
    padding: 14px 24px;
    box-sizing: border-box;
    transition: background-color 0.2s;
    cursor: pointer;

    .list-item-body {
      flex: 1;
      overflow: hidden;

      .list-item-text {
        margin-top: 6px;
      }
    }

    &:hover {
      background-color: hsla(0, 0%, 60%, 0.08);
    }

    & + .list-item {
      border-top: 1px solid hsla(0, 0%, 60%, 0.2);
    }
  }

  /* 操作按钮 */
  .bottom-tools {
    display: flex;
    align-items: center;
    border-top: 1px solid hsla(0, 0%, 60%, 0.2);

    .bottom-tool {
      flex: 1;
      line-height: 46px;
      text-align: center;
      text-decoration: none;
      transition: background-color 0.3s;
      cursor: pointer;
      color: inherit;

      &:hover {
        background: hsla(0, 0%, 60%, 0.08);
      }
    }
  }
</style>
