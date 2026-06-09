<!-- eslint-disable vue/no-v-html -->
<template>
  <div v-if="data && data.meta" class="code-view">
    <div class="code-header">
      <div class="code-title">{{ data.meta.path }}</div>
      <div class="code-tools">
        <ele-copyable
          :text="data.meta.text"
          :iconProps="{ style: { color: '#d6dde3' } }"
          :tooltip="{ placement: 'bottom', bg: '#383838', arrowBg: '#383838' }"
        />
        <ele-tooltip
          content="下载"
          placement="bottom"
          :offset="6"
          bg="#383838"
          arrow-bg="#383838"
        >
          <el-icon class="code-icon-tool" @click="handleDownload">
            <DownloadOutlined />
          </el-icon>
        </ele-tooltip>
      </div>
    </div>
    <code-viewer
      :key="data.meta.path"
      :code="code"
      :language="language"
      class="code-body"
    />
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { DownloadOutlined } from '@/components/icons';
  import { downloadText } from './gen-util';

  const props = defineProps({
    /** 数据 */
    data: Object
  });

  /** 代码 */
  const code = ref('');

  /** 语言 */
  const language = ref();

  /** 下载 */
  const handleDownload = () => {
    if (props.data && props.data.meta) {
      downloadText(props.data.meta.text, props.data.label);
    }
  };

  watch(
    () => props.data,
    (data) => {
      code.value = data?.meta?.text || '';
      language.value = data?.meta?.language;
    },
    { immediate: true }
  );
</script>

<style lang="scss" scoped>
  .code-view {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #1e1e1e;
    overflow: hidden;
  }

  .code-body {
    flex: 1;
  }

  .code-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #000;
    box-sizing: border-box;
  }

  .code-title {
    flex: 1;
    color: #e6edf3;
    padding: 0 12px;
    font-family: monospace;
    box-sizing: border-box;
    text-overflow: ellipsis;
    word-break: break-all;
    white-space: nowrap;
    overflow: hidden;
  }

  .code-tools {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 6px 10px 6px 0;

    & > .ele-copyable {
      border-radius: 4px;
      background: #444444;
      transition: background-color 0.2s;

      :deep(.ele-copyable-icon) {
        padding: 4px;
        margin: 0;
      }

      &:hover {
        background: #707070;
      }
    }
  }

  .code-icon-tool {
    width: auto;
    height: auto;
    font-size: 15px;
    color: #d6dde3;
    background: #444444;
    padding: 4px;
    margin-left: 8px;
    border-radius: 4px;
    box-sizing: border-box;
    transition: background-color 0.2s;
    cursor: pointer;

    &:hover {
      background: #707070;
    }
  }
</style>
