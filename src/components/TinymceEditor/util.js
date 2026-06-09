const BASE_URL = import.meta.env.BASE_URL;
//const BASE_URL = `${location.protocol}//${location.host}${import.meta.env.BASE_URL}`;

/** 默认加载插件 */
const PLUGINS = [
  'advlist',
  'anchor',
  'autolink',
  'charmap',
  'code',
  'codesample',
  'directionality',
  'emoticons',
  'fullscreen',
  'image',
  'link',
  'lists',
  'media',
  'nonbreaking',
  'pagebreak',
  'preview',
  'quickbars',
  'searchreplace',
  'table',
  'visualblocks',
  'visualchars',
  'wordcount'
].join(' ');

/** 默认工具栏布局 */
const TOOLBAR = [
  'fullscreen',
  'preview',
  //'code',
  //'|',
  'undo',
  'redo',
  //'|',
  'forecolor',
  'backcolor',
  //'|',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  //'|',
  'alignleft',
  'aligncenter',
  'alignright',
  'alignjustify',
  //'|',
  'outdent',
  'indent',
  //'|',
  'numlist',
  'bullist',
  //'|',
  'blocks',
  //'fontfamily',
  'fontsize',
  //'|',
  //'link',
  'image',
  'media',
  //'emoticons',
  //'charmap',
  //'anchor',
  'pagebreak' /* ,
  'codesample',
  '|',
  'ltr',
  'rtl' */
].join(' ');

/** 默认配置 */
const DEFAULT_CONFIG = {
  height: 300,
  branding: false,
  promotion: false,
  license_key: 'gpl',
  skin_url: BASE_URL + 'tinymce/skins/ui/oxide',
  content_css: BASE_URL + 'tinymce/skins/content/default/content.min.css',
  language_url: BASE_URL + 'tinymce/langs/zh_CN.js',
  language: 'zh_CN',
  plugins: PLUGINS,
  toolbar: TOOLBAR,
  draggable_modal: true,
  toolbar_mode: 'sliding',
  quickbars_insert_toolbar: '',
  convert_urls: false,
  file_picker_types: 'media image file'
};

/** 暗黑主题配置 */
const DARK_CONFIG = {
  skin_url: BASE_URL + 'tinymce/skins/ui/oxide-dark',
  content_css: BASE_URL + 'tinymce/skins/content/dark/content.min.css'
};

/** 支持监听的事件 */
const VALID_EVENTS = [
  'onActivate',
  'onAddUndo',
  'onBeforeAddUndo',
  'onBeforeExecCommand',
  'onBeforeGetContent',
  'onBeforeRenderUI',
  'onBeforeSetContent',
  'onBeforePaste',
  'onBlur',
  'onChange',
  'onClearUndos',
  'onClick',
  'onContextMenu',
  'onCopy',
  'onCut',
  'onDblclick',
  'onDeactivate',
  'onDirty',
  'onDrag',
  'onDragDrop',
  'onDragEnd',
  'onDragGesture',
  'onDragOver',
  'onDrop',
  'onExecCommand',
  'onFocus',
  'onFocusIn',
  'onFocusOut',
  'onGetContent',
  'onHide',
  'onInit',
  'onKeyDown',
  'onKeyPress',
  'onKeyUp',
  'onLoadContent',
  'onMouseDown',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseMove',
  'onMouseOut',
  'onMouseOver',
  'onMouseUp',
  'onNodeChange',
  'onObjectResizeStart',
  'onObjectResized',
  'onObjectSelected',
  'onPaste',
  'onPostProcess',
  'onPostRender',
  'onPreProcess',
  'onProgressState',
  'onRedo',
  'onRemove',
  'onReset',
  'onSaveContent',
  'onSelectionChange',
  'onSetAttrib',
  'onSetContent',
  'onShow',
  'onSubmit',
  'onUndo',
  'onVisualAid'
];

/**
 * 获取编辑器默认配置
 * @param isDark 是否是暗黑主题
 * @param lang 语言名称
 */
export function getDefaultConfig(isDark, lang) {
  return {
    ...DEFAULT_CONFIG,
    ...(isDark ? DARK_CONFIG : {}),
    language: lang,
    language_url: lang === 'en' ? void 0 : `${BASE_URL}tinymce/langs/${lang}.js`
  };
}

/**
 * 绑定事件
 */
export function bindHandlers(initEvent, listeners, editor) {
  const validEvents = VALID_EVENTS.map((event) => event.toLowerCase());
  Object.keys(listeners)
    .filter((key) => validEvents.includes(key.toLowerCase()))
    .forEach((key) => {
      const handler = listeners[key];
      if (typeof handler === 'function') {
        if (key === 'onInit') {
          handler(initEvent, editor);
        } else {
          editor.on(key.substring(2), (e) => handler(e, editor));
        }
      }
    });
}

/**
 * 弹出提示框
 * @param editor 编辑器实例
 * @param option 参数
 */
export function openAlert(editor, option = {}) {
  editor?.windowManager?.open?.(
    {
      title: option.title ?? '提示',
      body: {
        type: 'panel',
        items: [
          {
            type: 'htmlpanel',
            html: `<p>${option.content ?? ''}</p>`
          }
        ]
      },
      buttons: [
        {
          type: 'cancel',
          name: 'closeButton',
          text: '确定',
          primary: true
        }
      ],
      ...(option.config || {})
    },
    option.params
  );
}
