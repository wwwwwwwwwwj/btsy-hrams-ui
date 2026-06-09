<!-- markdown 编辑器 -->
<template>
  <div
    ref="rootRef"
    class="ele-md-editor"
    :style="{ height }"
    @click="handleClick"
  ></div>
</template>

<script setup>
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { useModal } from 'ele-admin-plus';
  import { Editor } from 'bytemd';
  /** 链接/删除线/复选框/表格等插件 */
  import gfm from '@bytemd/plugin-gfm';
  /** 代码高亮插件 */
  import highlightSsr from '@bytemd/plugin-highlight-ssr';
  /** 数学公式插件 */
  import mathSsr from '@bytemd/plugin-math-ssr';
  /** 主题 */
  import './style/index';
  /** 自定义插件 */
  import { eleMdProcessEditor, handleAction, defaultEditorLangs } from './util';
  import { useComponentLang } from '@/utils/use-component-lang';

  defineOptions({ name: 'ByteMdEditor' });

  const props = defineProps({
    /** 绑定值 */
    modelValue: String,
    /** 编辑器配置 */
    config: Object,
    /** 高度 */
    height: String,
    /** 全屏时的层级 */
    fullIndex: Number,
    /** 自定义文案 */
    componentLang: Object
  });

  const emit = defineEmits({
    'update:modelValue': (_value) => true,
    change: (_value) => true
  });

  const { lang } = useComponentLang(defaultEditorLangs, props);
  const { imageViewer } = useModal();

  /** 编辑器实例 */
  let editor = null;

  /** 根节点 */
  const rootRef = ref(null);

  /** 获取默认插件 */
  const getDefaultPlugins = () => {
    return [
      gfm({ locale: lang.value.bytemdGfm }),
      mathSsr({ locale: lang.value.bytemdMath }),
      eleMdProcessEditor({ locale: lang.value }),
      highlightSsr()
    ];
  };

  /** 渲染编辑器 */
  const renderEditor = () => {
    const config = props.config || {};
    const ins = new Editor({
      target: rootRef.value,
      props: {
        locale: lang.value.bytemd,
        ...config,
        editorConfig: { lineNumbers: true, ...(config.editorConfig || {}) },
        plugins: [...getDefaultPlugins(), ...(config.plugins || [])],
        value: props.modelValue
      }
    });
    ins.$on('change', (e) => {
      emit('update:modelValue', e.detail.value);
      emit('change', e.detail.value);
    });
    editor = ins;
  };

  /** 销毁编辑器 */
  const destroyEditor = () => {
    editor?.$destroy?.();
  };

  onMounted(() => {
    renderEditor();
  });

  onBeforeUnmount(() => {
    destroyEditor();
  });

  /** 同步国际化切换 */
  watch(lang, () => {
    editor?.$set?.({
      locale: lang.value.bytemd,
      plugins: [...getDefaultPlugins(), ...(props.config?.plugins || [])]
    });
  });

  /** 更新配置 */
  watch(
    () => props.config,
    (config) => {
      const option = Object.assign({}, config);
      if (!option.plugins?.length) {
        delete option.plugins;
      } else {
        option.plugins = [...getDefaultPlugins(), ...option.plugins];
      }
      if (!option.editorConfig || !Object.keys(option.editorConfig).length) {
        delete option.editorConfig;
      } else {
        option.editorConfig = {
          lineNumbers: true,
          ...(option.editorConfig || {})
        };
      }
      Object.keys(option).forEach((key) => {
        if (key === 'plugins' || typeof option[key] === 'undefined') {
          delete option[key];
        }
      });
      editor?.$set?.(option);
    },
    { deep: true }
  );

  watch(
    () => props.modelValue,
    (value) => {
      editor?.$set?.({ value });
    }
  );

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
    // 处理工具按钮点击操作
    handleAction($el, openImagePreview);
  };

  defineExpose({ editor });
</script>
