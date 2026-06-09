<!-- markdown 解析器 -->
<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    ref="rootRef"
    v-html="content"
    class="markdown-body ele-md-body"
    @click="handleClick"
  >
  </div>
</template>

<script setup>
  import {
    ref,
    watch,
    onMounted,
    onBeforeUnmount,
    onActivated,
    nextTick
  } from 'vue';
  import { useModal } from 'ele-admin-plus';
  import { getProcessor } from 'bytemd';
  /** 链接/删除线/复选框/表格等插件 */
  import gfm from '@bytemd/plugin-gfm';
  /** 代码高亮插件 */
  import highlightSsr from '@bytemd/plugin-highlight-ssr';
  /** 数学公式插件 */
  import mathSsr from '@bytemd/plugin-math-ssr';
  /** 主题 */
  import './style/index';
  /** 自定义插件 */
  import {
    eleMdProcess,
    renderAllMermaid,
    handleAction,
    defaultLangs
  } from './util';
  import { useComponentLang } from '@/utils/use-component-lang';

  defineOptions({ name: 'ByteMdViewer' });

  const props = defineProps({
    /** 内容 */
    value: String,
    /** 配置 */
    config: Object,
    /** 自定义文案 */
    componentLang: Object
  });

  const { lang } = useComponentLang(defaultLangs, props);
  const { imageViewer } = useModal();

  /** 根节点 */
  const rootRef = ref(null);

  /** 解析后内容 */
  const content = ref(null);

  /** 已绑定的插件 */
  const cbs = ref([]);

  /** 绑定插件 */
  const on = () => {
    if (rootRef.value && content.value) {
      const plugins = props.config?.plugins || [];
      cbs.value = plugins.map(({ viewerEffect }) => {
        if (viewerEffect) {
          return viewerEffect({
            markdownBody: rootRef.value,
            file: content.value
          });
        }
      });
    }
  };

  /** 解绑插件 */
  const off = () => {
    if (cbs.value) {
      cbs.value.forEach((cb) => cb && cb());
    }
  };

  /** 更新内容 */
  watch(
    [() => props.value, () => props.config, lang],
    () => {
      try {
        const config = props.config || {};
        content.value = getProcessor({
          ...config,
          plugins: [
            gfm(),
            mathSsr(),
            eleMdProcess({ locale: lang.value }),
            highlightSsr(),
            ...(config.plugins || [])
          ]
        }).processSync(props.value);
        off();
        nextTick(() => {
          on();
          renderAllMermaid(rootRef.value);
        });
      } catch (e) {
        console.error(e);
      }
    },
    {
      immediate: true,
      deep: true
    }
  );

  onActivated(() => {
    renderAllMermaid(rootRef.value, true);
  });

  onMounted(() => {
    on();
    renderAllMermaid(rootRef.value);
  });

  onBeforeUnmount(() => {
    off();
  });

  /** 打开预览图片弹窗 */
  const openImagePreview = (viewerProps) => {
    imageViewer && imageViewer.opemImageViewer(viewerProps);
  };

  /** 处理点击事件 */
  const handleClick = (e) => {
    const $el = e.target;
    const tagName = $el.tagName;
    // 图片预览
    if (tagName === 'IMG') {
      const src = $el.getAttribute('src');
      if (src) {
        openImagePreview({ urlList: [src], initialIndex: 0 });
      }
      return;
    }
    // 支持锚点
    if (tagName === 'A') {
      const href = $el.getAttribute('href');
      if (href && href.startsWith('#')) {
        const $root = rootRef.value;
        if ($root) {
          const dest = $root.querySelector(`#user-content-${href.slice(1)}`);
          if (dest) {
            dest.scrollIntoView();
          }
        }
      }
      return;
    }
    // 处理工具按钮点击操作
    handleAction($el, openImagePreview);
  };
</script>
