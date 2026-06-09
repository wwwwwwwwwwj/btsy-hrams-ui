<!-- 文件上传 -->
<template>
  <EleUploadList
    v-model="images"
    :readonly="readonly"
    :disabled="disabled"
    :preview="preview"
    :limit="limit"
    :multiple="multiple"
    :drag="drag"
    :accept="accept"
    :itemStyle="itemStyle"
    :buttonStyle="buttonStyle"
    :sortable="sortable"
    :imageProps="imageProps"
    :progressProps="progressProps"
    :previewProps="previewProps"
    :tools="tools"
    :listType="listType"
    :beforeUploadClick="beforeUploadClick"
    :beforeItemEdit="beforeItemEdit"
    :beforePreview="beforePreview"
    :locale="locale"
    @upload="handleItemUpload"
    @retry="(item) => handleItemUpload(item, true)"
    @remove="handleItemRemove"
    @editUpload="handleItemEditUpload"
    @itemClick="handleItemClick"
    @preview="handleItemPreview"
  >
    <template v-for="name in Object.keys($slots)" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}"></slot>
    </template>
  </EleUploadList>
</template>

<script setup>
  import { EleMessage } from 'ele-admin-plus';
  import { useComponentLang } from '@/utils/use-component-lang';
  import { uploadApi } from './config';
  import { commonUploadProps } from './props';

  defineOptions({ name: 'CommonUpload' });

  const props = defineProps(commonUploadProps);

  const emit = defineEmits(['itemClick', 'preview']);

  const { lang } = useComponentLang(
    {
      zh_CN: {
        imageError: '只能选择图片',
        excelError: '只能选择 excel 文件',
        limitError: '大小不能超过 {limit}MB'
      },
      zh_TW: {
        imageError: '只能選擇圖片',
        excelError: '只能選擇 Excel 檔案',
        limitError: '大小不能超過 {limit}MB'
      },
      en: {
        imageError: 'Can only select images',
        excelError: 'Can only select excel files',
        limitError: 'File size cannot exceed {limit}MB'
      }
    },
    props
  );

  /** 已上传数据 */
  const images = defineModel({
    type: Array,
    default: () => []
  });

  /** 校验选择的文件 */
  const checkFile = (file) => {
    if (!file) {
      return;
    }
    if (props.accept === 'image/*') {
      if (!file.type.startsWith('image')) {
        EleMessage.error({ message: lang.value.imageError, plain: true });
        return;
      }
    } else if (props.accept === '.xls,.xlsx') {
      if (
        ![
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ].includes(file.type)
      ) {
        EleMessage.error({ message: lang.value.excelError, plain: true });
        return;
      }
    }
    if (props.fileLimit && file.size / 1024 / 1024 > props.fileLimit) {
      EleMessage.error({
        message: lang.value.limitError.replace(
          /\{\s*limit\s*\}/g,
          String(props.fileLimit)
        ),
        plain: true
      });
      return;
    }
    return true;
  };

  /** 上传事件 */
  const handleItemUpload = (data, retry) => {
    if (!data.file || !checkFile(data.file)) {
      return;
    }
    if (!retry) {
      images.value.push({ ...data });
    }
    const item = images.value.find((t) => t.key === data.key);
    if (!item) {
      return;
    }
    item.status = 'uploading';
    item.progress = 0;
    uploadApi(
      data.file,
      {
        onUploadProgress: (e) => {
          if (e.total != null && item.status !== 'done') {
            item.progress = (e.loaded / e.total) * 100;
          }
        }
      },
      item.name,
      props.uploadApiParams
    )
      .then((res) => {
        item.progress = 100;
        item.status = 'done';
        item.url = res.url;
        item.response = res;
      })
      .catch((e) => {
        item.status = 'exception';
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 修改事件 */
  const handleItemEditUpload = ({ item, newItem }) => {
    if (!checkFile(newItem.file)) {
      return;
    }
    const oldItem = images.value.find((t) => t.key === item.key);
    if (oldItem) {
      oldItem.url = void 0;
      oldItem.name = newItem.name;
      oldItem.file = newItem.file;
      oldItem.progress = 0;
      oldItem.status = void 0;
      handleItemUpload(oldItem, true);
    }
  };

  /** 删除事件 */
  const handleItemRemove = (item) => {
    images.value.splice(images.value.indexOf(item), 1);
  };

  /** 点击事件 */
  const handleItemClick = (item) => {
    emit('itemClick', item);
  };

  /** 预览事件 */
  const handleItemPreview = (item) => {
    emit('preview', item);
  };
</script>
