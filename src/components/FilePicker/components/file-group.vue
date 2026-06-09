<template>
  <ElTree
    ref="treeRef"
    :data="groupData"
    :highlightCurrent="true"
    nodeKey="id"
    :props="{ label: 'name' }"
    :expandOnClickNode="false"
    :defaultExpandAll="true"
    class="ele-file-picker-left"
    @node-click="handleGroupSelect"
    @node-contextmenu="handleGroupContextmenu"
  >
    <template #default="scope">
      <ElIcon class="ele-file-picker-tree-icon">
        <FileFolderFilled />
      </ElIcon>
      <span class="el-tree-node__label" :title="scope.data.name">
        {{ scope.data.name }}
      </span>
      <ElIcon
        v-if="scope.data.id !== 0 && scope.data.id !== -1"
        class="ele-file-picker-tree-more"
        @click.stop="(e) => handleMoreIconClick(e, scope.data)"
      >
        <MoreOutlined style="transform: scale(1.1)" />
      </ElIcon>
    </template>
  </ElTree>
  <ElLink
    type="primary"
    underline="never"
    class="ele-file-picker-left-add"
    @click="handleAddBtnClick"
  >
    {{ lang.groupAddTitle }}
  </ElLink>
</template>

<script setup>
  import { ref } from 'vue';
  import { queryChild } from 'ele-admin-plus';
  import { FileFolderFilled, MoreOutlined } from 'ele-admin-plus/es/icons';

  defineProps({
    /** 分组数据 */
    groupData: Array,
    /** 组件文案 */
    lang: Object
  });

  const emit = defineEmits([
    'groupSelect',
    'addBtnClick',
    'moreIconClick',
    'hideGroupCtxMenu'
  ]);

  /** 树组件 */
  const treeRef = ref(null);

  /** 分组选中事件 */
  const handleGroupSelect = (item) => {
    emit('groupSelect', item, true);
  };

  /** 添加分组按钮点击事件 */
  const handleAddBtnClick = () => {
    emit('addBtnClick');
  };

  /** 更多图标点击事件 */
  const handleMoreIconClick = (e, item) => {
    emit('moreIconClick', e.currentTarget, item);
  };

  /** 分组右键事件 */
  const handleGroupContextmenu = (e, item) => {
    if (item.id === 0 || item.id === -1) {
      emit('hideGroupCtxMenu');
      return;
    }
    const triggerEl = queryChild(
      e.currentTarget,
      'el-tree-node__content'
    )?.querySelector?.('.ele-file-picker-tree-more');
    triggerEl && triggerEl.click();
  };

  /** 设置选中分组 */
  const setSelectedGroup = (item) => {
    treeRef.value?.setCurrentKey?.(item.id);
  };

  defineExpose({ setSelectedGroup });
</script>
