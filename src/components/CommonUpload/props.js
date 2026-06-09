export const commonUploadProps = {
  /** 文件大小限制, 单位MB */
  fileLimit: {
    type: Number,
    default: 100
  },
  /** 是否只读 */
  readonly: Boolean,
  /** 是否禁用 */
  disabled: Boolean,
  /** 是否支持点击预览 */
  preview: {
    type: Boolean,
    default: true
  },
  /** 最大上传数量 */
  limit: Number,
  /** 是否支持多选文件 */
  multiple: Boolean,
  /** 是否启用拖拽上传 */
  drag: {
    type: Boolean,
    default: true
  },
  /** 接受上传的文件类型 */
  accept: {
    type: String,
    default: ''
  },
  /** 自定义样式 */
  itemStyle: Object,
  /** 自定义上传按钮样式 */
  buttonStyle: Object,
  /** 是否开启拖拽排序 */
  sortable: {
    type: [Boolean, Object],
    default: () => {
      return {
        forceFallback: true
      };
    }
  },
  /** 自定义图片属性 */
  imageProps: Object,
  /** 自定义进度条属性 */
  progressProps: Object,
  /** 自定义图片预览属性 */
  previewProps: Object,
  /** 是否开启底部预览和修改的操作按钮 */
  tools: {
    type: Boolean,
    default: true
  },
  /** 列表显示样式 */
  listType: String,
  /** 上传按钮点击前的钩子 */
  beforeUploadClick: Function,
  /** 修改按钮点击前的钩子 */
  beforeItemEdit: Function,
  /** 预览按钮点击前的钩子 */
  beforePreview: Function,
  /** 国际化 */
  locale: Object,
  /** 自定义文案 */
  componentLang: Object,
  /** 更多上传请求参数 */
  uploadApiParams: Object
};

export const commonUploadPropKeys = Object.keys(commonUploadProps);
