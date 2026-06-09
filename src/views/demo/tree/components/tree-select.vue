<!-- 测试树下拉选择框 -->
<template>
  <el-tree-select
    clearable
    check-strictly
    default-expand-all
    :data="treeData"
    node-key="id"
    :props="{ label: 'treeName' }"
    v-model="model"
    :placeholder="placeholder"
    :popper-options="{ strategy: 'fixed' }"
    class="ele-fluid"
  />
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage, toTree } from 'ele-admin-plus';
  import { listTree } from '@/api/demo/tree';

  defineProps({
    /** 提示信息 */
    placeholder: String
  });

  /** 选中值 */
  const model = defineModel({ type: [Number, String] });

  /** 数据 */
  const treeData = ref([]);

  /** 获取数据 */
  listTree()
    .then((data) => {
      treeData.value = toTree({
        data,
        idField: 'id',
        parentIdField: 'parentId'
      });
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });
</script>
