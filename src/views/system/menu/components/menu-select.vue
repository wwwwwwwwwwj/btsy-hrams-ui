<!-- 菜单选择下拉框 -->
<template>
  <el-tree-select
    clearable
    check-strictly
    default-expand-all
    :data="treeData"
    node-key="menuId"
    :props="{ label: 'menuName' }"
    v-model="model"
    :placeholder="placeholder"
    :popper-options="{ strategy: 'fixed' }"
    class="ele-fluid"
  >
    <template #default="{ data }">
      <menu-icon
        v-if="data.icon"
        :icon="data.icon"
        :component-style="{ marginRight: '4px', transform: 'translateY(-1px)' }"
        :img-style="{
          width: '20px',
          height: '20px',
          marginRight: '4px',
          transform: 'translateY(-1px)'
        }"
      />
      <span>{{ data.menuName }}</span>
    </template>
    <template v-if="selectedIcon" #prefix>
      <el-icon color="var(--el-text-color-regular)" style="margin-right: 6px">
        <component :is="selectedIcon" />
      </el-icon>
    </template>
  </el-tree-select>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { EleMessage, toTree, findTree } from 'ele-admin-plus';
  import { listMenu } from '@/api/system/menu';

  defineProps({
    /** 提示信息 */
    placeholder: {
      type: String,
      default: '请选择上级菜单'
    }
  });

  /** 选中值 */
  const model = defineModel({ type: [Number, String] });

  /** 数据 */
  const treeData = ref([]);

  /** 选中的图标 */
  const selectedIcon = computed(() => {
    if (!model.value) {
      return;
    }
    return findTree(treeData.value, (d) => d.menuId == model.value)?.icon;
  });

  /** 获取菜单数据 */
  listMenu()
    .then((data) => {
      treeData.value = toTree({
        data,
        idField: 'menuId',
        parentIdField: 'parentId'
      });
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });
</script>
