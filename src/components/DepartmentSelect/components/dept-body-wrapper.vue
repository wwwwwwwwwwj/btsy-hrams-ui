<template>
  <div class="ele-department-select-wrapper">
    <div class="ele-department-select-body">
      <!-- 搜索框 -->
      <div class="ele-department-select-search">
        <ElInput
          :clearable="true"
          v-model.trim="keyword"
          :placeholder="lang.searchPlaceholder"
          :prefixIcon="SearchOutlined"
          @input="handleSearch"
        />
      </div>
      <!-- 树 -->
      <div class="ele-department-tree-wrapper" ref="treeWrapperRef">
        <slot></slot>
      </div>
    </div>
    <!-- 已选列表 -->
    <div class="ele-department-select-right">
      <div class="ele-department-select-right-header">
        <div class="ele-department-select-right-title">
          <span>{{ lang.selected }}</span>
          <span>{{ selectedItems.length || 0 }}</span>
          <span>{{ lang.selectedUnit }}</span>
        </div>
        <ElLink
          type="danger"
          underline="never"
          class="ele-department-select-right-clear"
          @click="clearSelections"
        >
          {{ lang.clear }}
        </ElLink>
      </div>
      <VueDraggable
        itemKey="value"
        :animation="300"
        :setData="() => void 0"
        :delayOnTouchOnly="true"
        :delay="150"
        :disabled="!multiple"
        class="ele-department-select-right-body"
        :class="{ 'is-sortable': multiple }"
        :modelValue="selectedItems"
        @update:modelValue="updateModelValue"
      >
        <template #item="{ element: item }">
          <div class="ele-department-select-right-item">
            <ElIcon class="ele-department-select-right-icon">
              <component v-if="itemIcon" :is="itemIcon" />
              <CityOutlined v-else />
            </ElIcon>
            <div class="ele-department-select-right-label">
              {{ item.label }}
            </div>
            <ElIcon
              class="ele-department-select-right-del"
              @click="handleRemove(item)"
            >
              <CloseOutlined />
            </ElIcon>
          </div>
        </template>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup>
  import { inject, unref, computed, ref, onMounted } from 'vue';
  import VueDraggable from 'vuedraggable';
  import {
    CloseOutlined,
    CityOutlined,
    SearchOutlined
  } from 'ele-admin-plus/es/icons';
  import { SELECT_DATA_KEY } from 'ele-admin-plus/es/ele-basic-select/util';
  import { useResizeObserver } from 'ele-admin-plus';

  const props = defineProps({
    /** 是否多选 */
    multiple: Boolean,
    /** 下拉组件类型 */
    popperType: String,
    /** 已选列表项图标组件 */
    itemIcon: [String, Object, Function],
    /** 组件文案 */
    lang: Object
  });

  const emit = defineEmits(['search', 'update:treeHeight', 'bodyMounted']);

  /** 下拉组件选中标签数据操作 */
  const selectProvider = inject(SELECT_DATA_KEY, null);

  /** 是否是弹窗模式 */
  const isModalType = computed(() => {
    return props.popperType === 'modal' || props.popperType === 'drawer';
  });

  /** 选中标签数据 */
  const selectedItems = computed(() => {
    const items = isModalType.value
      ? selectProvider?.tempSelectedItems
      : selectProvider?.selectedItems;
    return (unref(items) || []).filter((item) => !item.hide);
  });

  /** 清空选中标签数据 */
  const clearSelections = () => {
    if (selectProvider) {
      if (isModalType.value) {
        selectProvider.clearTempSelectedItems();
      } else {
        selectProvider.clearSelectedItems();
      }
    }
  };

  /** 删除选中标签项 */
  const handleRemove = (item) => {
    if (selectProvider) {
      if (isModalType.value) {
        selectProvider.removeTempSelectedItem(item);
      } else {
        selectProvider.removeSelectedItem(item);
      }
    }
  };

  /** 更新选中标签数据排序 */
  const updateModelValue = (items) => {
    if (selectProvider) {
      if (isModalType.value) {
        selectProvider.updateTempSelectedItems(items);
      } else {
        selectProvider.updateSelectedItems(items);
      }
    }
  };

  /** 树搜索关键字 */
  const keyword = ref('');

  /** 搜索事件 */
  const handleSearch = () => {
    emit('search', keyword.value);
  };

  /** 树组件容器 */
  const treeWrapperRef = ref(null);

  /** 监听树容器高度 */
  useResizeObserver({
    getEl: () => treeWrapperRef.value,
    onHeightChange: (height) => {
      if (height > 0 && isModalType.value) {
        emit('update:treeHeight', height);
      }
    },
    mountedUpdateDelay: 0
  });

  /** 触发挂载事件 */
  onMounted(() => {
    emit('bodyMounted');
  });
</script>
