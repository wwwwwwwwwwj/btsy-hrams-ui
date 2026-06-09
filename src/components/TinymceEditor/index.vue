<!-- 富文本编辑器 -->
<template>
  <component v-if="inlineEditor" :is="tagName" :id="elementId" />
  <textarea v-else :id="elementId" style="visibility: hidden"></textarea>
</template>

<script setup>
  import {
    watch,
    onMounted,
    onBeforeUnmount,
    onActivated,
    onDeactivated,
    nextTick,
    useAttrs,
    useId
  } from 'vue';
  import tinymce from 'tinymce/tinymce';
  import 'tinymce/themes/silver/theme';
  import 'tinymce/icons/default/icons';
  import 'tinymce/models/dom/model';
  import 'tinymce/plugins/advlist/plugin';
  import 'tinymce/plugins/anchor/plugin';
  import 'tinymce/plugins/autolink/plugin';
  import 'tinymce/plugins/charmap/plugin';
  import 'tinymce/plugins/code/plugin';
  import 'tinymce/plugins/codesample/plugin';
  import 'tinymce/plugins/directionality/plugin';
  import 'tinymce/plugins/emoticons/plugin';
  import 'tinymce/plugins/fullscreen/plugin';
  import 'tinymce/plugins/image/plugin';
  import 'tinymce/plugins/link/plugin';
  import 'tinymce/plugins/lists/plugin';
  import 'tinymce/plugins/media/plugin';
  import 'tinymce/plugins/nonbreaking/plugin';
  import 'tinymce/plugins/pagebreak/plugin';
  import 'tinymce/plugins/preview/plugin';
  import 'tinymce/plugins/quickbars/plugin';
  import 'tinymce/plugins/searchreplace/plugin';
  import 'tinymce/plugins/table/plugin';
  import 'tinymce/plugins/visualblocks/plugin';
  import 'tinymce/plugins/visualchars/plugin';
  import 'tinymce/plugins/wordcount/plugin';
  import 'tinymce/plugins/emoticons/js/emojis';
  import { escape } from 'ele-admin-plus';
  import { storeToRefs } from 'pinia';
  import { useThemeStore } from '@/store/modules/theme';
  import { useComponentLang } from '@/utils/use-component-lang';
  import { uploadOss } from '@/api/system/oss';
  import { getDefaultConfig, bindHandlers, openAlert } from './util';

  defineOptions({ name: 'TinymceEditor' });

  const props = defineProps({
    /** 编辑器唯一id */
    id: String,
    /** v-model */
    modelValue: String,
    /** 编辑器配置 */
    init: Object,
    /** 是否内联模式 */
    inline: Boolean,
    /** model events */
    modelEvents: {
      type: String,
      default: 'change input undo redo'
    },
    /** 内联模式标签名 */
    tagName: {
      type: String,
      default: 'div'
    },
    /** 是否禁用 */
    disabled: Boolean,
    /** 是否跟随框架主题 */
    autoTheme: {
      type: Boolean,
      default: true
    },
    /** 不跟随框架主题时是否使用暗黑主题 */
    darkTheme: Boolean
  });

  const emit = defineEmits({
    'update:modelValue': (_value) => true
  });

  const attrs = useAttrs();
  const themeStore = useThemeStore();
  const { darkMode } = storeToRefs(themeStore);
  const { lang } = useComponentLang({
    zh_CN: { language: 'zh_CN' },
    zh_TW: { language: 'zh_TW' },
    en: { language: 'en' }
  });

  /** 编辑器唯一id */
  const elementId = props.id || useId();

  /** 是否内联模式 */
  const inlineEditor = props.init?.inline || props.inline;

  /** 编辑器实例 */
  let editorIns = null;

  /** v-model */
  const updateValue = (value) => {
    emit('update:modelValue', value);
  };

  /** 修改内容 */
  const setContent = (value = '') => {
    if (editorIns != null && value !== editorIns.getContent()) {
      editorIns.setContent(value);
    }
  };

  /** 渲染编辑器 */
  const render = () => {
    const isDark = props.autoTheme ? darkMode.value : props.darkTheme;
    tinymce.init({
      ...getDefaultConfig(isDark, lang.value.language),
      // 图片上传处理
      images_upload_handler: async (blobInfo, _progress) => {
        const file = blobInfo.blob();
        const filename = blobInfo.filename();
        const res = await uploadOss(file, void 0, filename);
        return res.url;
      },
      // 文件上传处理
      file_picker_callback: (callback, _value, meta) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        if (meta.filetype === 'image') {
          input.setAttribute('accept', 'image/*');
        } else if (meta.filetype === 'media') {
          input.setAttribute('accept', 'video/*, audio/*');
        }
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            uploadOss(file, void 0, file.name)
              .then((res) => {
                callback(res.url ?? '', { text: file.name, alt: file.name });
              })
              .catch((e) => {
                console.error(e);
                alert({ content: escape(e.message) });
              });
          }
        };
        input.click();
      },
      ...props.init,
      selector: `#${elementId}`,
      readonly: props.disabled,
      inline: inlineEditor,
      setup: (editor) => {
        editorIns = editor;
        editor.on('init', (e) => {
          // 回显初始值
          if (props.modelValue) {
            setContent(props.modelValue);
          }
          // v-model
          editor.on(props.modelEvents, () => {
            updateValue(editor.getContent());
          });
          // valid events
          bindHandlers(e, attrs, editor);
        });
        if (typeof props.init?.setup === 'function') {
          props.init.setup(editor);
        }
      }
    });
  };

  /** 弹出提示框 */
  const alert = (option) => {
    openAlert(editorIns, option);
  };

  /** 获取编辑器实例 */
  const getEditorIns = () => {
    return editorIns;
  };

  /** 销毁编辑器 */
  const destory = () => {
    if (tinymce != null && editorIns != null) {
      tinymce.remove(editorIns);
      editorIns = null;
    }
  };

  /** 同步内容 */
  watch(
    () => props.modelValue,
    (value) => {
      setContent(value);
    }
  );

  /** 同步禁用状态 */
  watch(
    () => props.disabled,
    (disable) => {
      if (editorIns != null) {
        editorIns.mode.set(disable ? 'readonly' : 'design');
      }
    }
  );

  /** 同步其它配置 */
  watch([() => props.tagName, lang], () => {
    destory();
    nextTick(() => {
      render();
    });
  });

  watch(darkMode, () => {
    if (props.autoTheme) {
      destory();
      nextTick(() => {
        render();
      });
    }
  });

  onMounted(() => {
    render();
  });

  onBeforeUnmount(() => {
    destory();
  });

  onActivated(() => {
    render();
  });

  onDeactivated(() => {
    destory();
  });

  defineExpose({ getEditorIns, alert });
</script>

<style lang="scss">
  body .tox.tox-tinymce-aux,
  body.tox-fullscreen .tox.tox-tinymce-aux {
    z-index: 19990000;
  }
</style>
