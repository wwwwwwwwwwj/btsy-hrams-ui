<!-- 部门选择下拉框 -->
<template>
  <el-tree-select
    clearable
    check-strictly
    default-expand-all
    :data="treeData"
    node-key="deptId"
    :props="{ label: 'deptName' }"
    v-model="model"
    :placeholder="placeholder"
    :popper-options="{ strategy: 'fixed' }"
    class="ele-fluid"
  >
    <template #default="{ node }">
      <span class="el-tree-node__label" :title="node.label">
        <el-icon style="margin-right: 4px; vertical-align: -2px">
          <CityOutlined />
        </el-icon>
        <span>{{ node.label }}</span>
      </span>
    </template>
  </el-tree-select>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage, toTree } from 'ele-admin-plus';
  import { CityOutlined } from '@/components/icons';
  import { listDept } from '@/api/system/dept';

  defineProps({
    /** 提示信息 */
    placeholder: {
      type: String,
      default: '请选择归属部门'
    }
  });

  /** 选中值 */
  const model = defineModel({ type: [Number, String] });

  /** 数据 */
  const treeData = ref([]);

  /** 获取数据 */
  listDept()
    .then((data) => {
      treeData.value = toTree({
        data,
        idField: 'deptId',
        parentIdField: 'parentId'
      });
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });
</script>
