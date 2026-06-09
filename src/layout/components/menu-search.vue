<!-- 菜单搜索 -->
<template>
  <el-select
    ref="selectRef"
    placement="bottom"
    placeholder="搜索"
    class="ele-layout-menu-search hidden-sm-and-down"
    popper-class="ele-layout-menu-search-popper"
    :popper-options="{ strategy: 'fixed' }"
    :offset="8"
    :suffix-icon="SuffixIcon"
    :automatic-dropdown="true"
    :filterable="true"
    :filter-method="filterMethod"
    @update:modelValue="handleClick"
    @visible-change="handleVisibleChange"
  >
    <template #prefix>
      <el-icon style="margin-right: 4px">
        <SearchOutlined style="transform: translateY(-1px)" />
      </el-icon>
    </template>
    <el-option
      v-for="item in optionItems"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    >
      <div class="ele-layout-menu-search-item">
        <menu-icon
          :icon="item.icon"
          component-class="ele-layout-menu-search-item-icon"
        />
        <div class="ele-layout-menu-search-item-body">
          <div class="ele-layout-menu-search-item-title">
            <div class="ele-layout-menu-search-item-name">{{ item.label }}</div>
            <div class="ele-layout-menu-search-item-path">{{ item.value }}</div>
          </div>
          <div class="ele-layout-menu-search-item-text">
            <span>{{ item.parentLabel }}</span>
            <span>{{ item.label }}</span>
          </div>
        </div>
        <el-icon class="ele-layout-menu-search-item-suffix">
          <RollbackOutlined style="transform: scaleY(-1) translateY(1px)" />
        </el-icon>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
  import { ref, computed, h, markRaw, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { storeToRefs } from 'pinia';
  import { mapTree, isExternalLink } from 'ele-admin-plus';
  import { match } from 'pinyin-pro';
  import { useMagicKeys } from '@vueuse/core';
  import { useUserStore } from '@/store/modules/user';
  import { SearchOutlined, RollbackOutlined } from '@/components/icons';

  const { push } = useRouter();
  const userStore = useUserStore();
  const { menus } = storeToRefs(userStore);

  /** 后缀图标 */
  const SuffixIcon = markRaw(h('div', 'Ctrl K'));

  /** 选择器 */
  const selectRef = ref(null);

  /** 数据 */
  const menuItems = computed(() => {
    const items = [];
    mapTree(menus.value, (item, _index, parent) => {
      const label = item.meta?.title || '';
      const parentLabel = parent?.meta?.pathLabel || '';
      items.push({
        value: item.path,
        label,
        parentLabel: parentLabel ? `${parentLabel} / ` : '',
        icon: item.meta?.icon
      });
      const pathLabel = parentLabel ? `${parentLabel} / ${label}` : label;
      return { ...item, meta: { ...(item.meta || {}), pathLabel } };
    });
    return items;
  });

  /** 下拉选项数据 */
  const optionItems = ref([...menuItems.value]);

  /** 根据拼音首字母搜索 */
  const filterMethod = (query) => {
    if (query) {
      optionItems.value = menuItems.value.filter((item) => {
        return (
          (item.value || '').toLowerCase().includes(query.toLowerCase()) ||
          match(item.label, query)
        );
      });
    } else {
      optionItems.value = [...menuItems.value];
    }
  };

  /** 跳转菜单 */
  const handleClick = (path) => {
    if (!path) {
      return;
    }
    if (isExternalLink(path)) {
      window.open(path);
      return;
    }
    push(path);
  };

  /** 下拉框关闭事件 */
  const handleVisibleChange = (visible) => {
    if (!visible) {
      selectRef.value?.blur?.();
    }
  };

  /** 监听快捷键 */
  const keys = useMagicKeys({
    passive: false,
    onEventFired(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
      }
    }
  });
  const CtrlK = keys['Ctrl+K'];
  const MetaK = keys['Meta+K'];

  watch([CtrlK, MetaK], ([v1, v2]) => {
    if (v1 || v2) {
      selectRef.value?.focus?.();
    }
  });
</script>
