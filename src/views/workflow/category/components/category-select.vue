<!-- 流程分类选择下拉框 -->
<template>
  <el-tree-select
    clearable
    check-strictly
    default-expand-all
    :data="treeData"
    node-key="categoryId"
    :props="{ label: 'categoryName' }"
    v-model="model"
    :placeholder="placeholder"
    :popper-options="{ strategy: 'fixed' }"
    class="ele-fluid"
  />
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage, toTree } from 'ele-admin-plus';
  import { listCategory } from '@/api/workflow/category';

  const props = defineProps({
    /** 提示信息 */
    placeholder: {
      type: String,
      default: '请选择流程分类'
    },
    /** 转换值类型 */
    valueType: String
  });

  /** 选中值 */
  const model = defineModel({ type: [Number, String] });

  /** 数据 */
  const treeData = ref([]);

  /** 处理数据值类型 */
  const formatValue = (value) => {
    if (value == null || !props.valueType) {
      return value;
    }
    return String(value);
  };

  /** 获取数据 */
  listCategory()
    .then((data) => {
      const result = data.map((d) => ({
        ...d,
        categoryId: formatValue(d.categoryId),
        parentId: formatValue(d.parentId)
      }));
      treeData.value = toTree({
        data: result,
        idField: 'categoryId',
        parentIdField: 'parentId'
      });
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });
</script>
