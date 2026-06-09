<!-- 图片上传 -->
<template>
  <CommonUpload v-bind="pick($props, commonUploadPropKeys)" v-model="images" />
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { pick } from 'lodash-es';
  import CommonUpload from '@/components/CommonUpload/index.vue';
  import {
    commonUploadProps,
    commonUploadPropKeys
  } from '@/components/CommonUpload/props';

  defineOptions({ name: 'ImageUpload' });

  const props = defineProps({
    ...commonUploadProps,
    accept: {
      type: String,
      default: 'image/*'
    },
    /** 绑定值 */
    modelValue: String
  });

  const emit = defineEmits(['update:modelValue', 'change']);

  /** 上传组件数据 */
  const images = ref([]);

  /** 更新绑定值 */
  const updateModelValue = (value) => {
    const oldValue = props.modelValue ?? '';
    const newValue = value ?? '';
    if (oldValue !== newValue) {
      emit('update:modelValue', newValue);
      emit('change', value);
    }
  };

  /** 清空上传组件数据 */
  const clearData = () => {
    images.value = [];
  };

  /** 判断是否全部上传完成 */
  const isDone = () => {
    return !images.value.some((item) => item.status !== 'done');
  };

  /** 获取上传数据对应的值 */
  const getDataValue = (imagesValue) => {
    const urls = [];
    imagesValue.forEach((item) => {
      if (item.status === 'done' && item.url != null) {
        urls.push(item.url);
      }
    });
    return urls;
  };

  /** 获取值对应的上传数据 */
  const getImagesValue = (dataValue, imagesValue) => {
    if (!dataValue) {
      return imagesValue.filter((item) => item.status !== 'done');
    }
    const result = [];
    if (props.limit === 1) {
      result.push({ key: `0-${dataValue}`, url: dataValue, status: 'done' });
      return result;
    }
    try {
      const urls = JSON.parse(dataValue);
      imagesValue.forEach((item) => {
        if ((item.url && urls.includes(item.url)) || item.status !== 'done') {
          result.push(item);
        }
      });
      urls.forEach((url, index) => {
        if (url && !result.some((item) => item.url === url)) {
          const key = `${index}-${url}`;
          const oldIndex = result.findIndex((item) => item.key === key);
          if (oldIndex !== -1) {
            result.splice(oldIndex, 1);
          }
          result.push({ key, url, status: 'done' });
        }
      });
      if (props.limit != null && result.length > props.limit) {
        const temp = result.filter((item) => item.status !== 'done');
        for (const t of temp) {
          const i = result.indexOf(t);
          result.splice(i, 1);
          if (result.length <= props.limit) {
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      imagesValue.forEach((item) => {
        if (item.status !== 'done') {
          result.push(item);
        }
      });
    }
    return result;
  };

  /** 判断上传数据是否改变 */
  const imagesIsChanged = (newImages, oldImages) => {
    if (newImages.length !== oldImages.length) {
      return true;
    }
    for (let i = 0; i < newImages.length; i++) {
      const newItem = newImages[i];
      const oldItem = oldImages[i];
      if (
        newItem.key !== oldItem.key ||
        newItem.url !== oldItem.url ||
        newItem.status !== oldItem.status
      ) {
        return true;
      }
    }
    return false;
  };

  /** 同步绑定值 */
  watch(
    images,
    (imagesValue) => {
      const dataValue = getDataValue(imagesValue);
      if (props.limit === 1) {
        updateModelValue(dataValue.join());
        return;
      }
      updateModelValue(dataValue.length ? JSON.stringify(dataValue) : '');
    },
    { deep: true }
  );

  watch(
    () => props.modelValue,
    (dataValue) => {
      const imagesValue = getImagesValue(dataValue, images.value);
      if (imagesIsChanged(imagesValue, images.value)) {
        images.value = imagesValue;
      }
    },
    { immediate: true }
  );

  defineExpose({ clearData, isDone });
</script>
