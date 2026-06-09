<template>
  <div class="ele-file-picker-right">
    <div class="ele-file-picker-right-header">
      <div class="ele-file-picker-right-title">
        <span>{{ lang.selected }}</span>
        <span>{{ fileSelections.length }}</span>
        <template v-if="limit">
          <span> / </span>
          <span>{{ limit }}</span>
        </template>
        <span v-else>{{ lang.selectedUnit }}</span>
      </div>
      <ElLink
        type="danger"
        underline="never"
        class="ele-file-picker-right-clear"
        @click="clearSelections"
      >
        {{ lang.clear }}
      </ElLink>
    </div>
    <EleUploadList
      :limit="limit"
      :previewProps="previewProps"
      v-bind="selectionListProps || {}"
      ref="uploadListRef"
      v-model="images"
      :buttonStyle="false"
      :sortable="{ delay: 150, delayOnTouchOnly: true }"
      @remove="handleRemove"
    />
  </div>
</template>

<script setup>
  import { ref, reactive, watch } from 'vue';
  import { valueIsChanged } from 'ele-admin-plus/es/ele-basic-select/util';

  const props = defineProps({
    /** 选中的文件数据 */
    fileSelections: Array,
    /** 最大选择数量 */
    limit: Number,
    /** 文件列表自定义属性 */
    selectionListProps: Object,
    /** 统一设置层级 */
    baseIndex: Number,
    /** 组件文案 */
    lang: Object
  });

  const emit = defineEmits(['clearSelections', 'removeItem']);

  /** 图片上传列表组件 */
  const uploadListRef = ref(null);

  /** 数据 */
  const images = ref([]);

  /** 图片预览组件属性 */
  const previewProps = reactive({
    zIndex: props.baseIndex
  });

  /** 删除事件 */
  const handleRemove = (item) => {
    const fileItem = props.fileSelections.find((d) => d.key === item.key);
    if (fileItem) {
      emit('removeItem', fileItem);
    }
  };

  /** 清空选中数据 */
  const clearSelections = () => {
    emit('clearSelections');
  };

  /** 获取选中数据 */
  const getSelections = () => {
    const result = [];
    images.value.forEach((d) => {
      const item = props.fileSelections.find((t) => t.key === d.key);
      if (item) {
        result.push(item);
      }
    });
    return result;
  };

  /** 打开预览图片弹窗 */
  const openImagePreview = (urls, index) => {
    uploadListRef.value && uploadListRef.value.openImagePreview(urls, index);
  };

  watch(
    () => props.fileSelections,
    (selections) => {
      if (!selections || !selections.length) {
        if (images.value.length) {
          images.value = [];
        }
        return;
      }
      const temp = images.value.filter((d) =>
        selections.some((t) => t.key === d.key)
      );
      selections.forEach((d) => {
        if (!temp.some((t) => t.key === d.key)) {
          temp.push({
            key: d.key,
            name: d.name,
            url: d.url,
            thumbnail: d.thumbnail || false,
            status: 'done'
          });
        }
      });
      if (
        valueIsChanged(
          images.value.map((d) => d.key),
          temp.map((d) => d.key),
          true
        )
      ) {
        images.value = temp;
      }
    },
    {
      immediate: true,
      deep: true
    }
  );

  watch(
    () => props.baseIndex,
    (baseIndex) => {
      previewProps.zIndex = baseIndex;
    }
  );

  defineExpose({ getSelections, openImagePreview });
</script>
