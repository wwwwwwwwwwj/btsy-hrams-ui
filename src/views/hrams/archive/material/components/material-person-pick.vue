<template>
  <div class="material-person-pick">
    <p class="pick-steps">步骤：1. 查询并选择干部 → 2. 按材料分类上传与维护</p>
    <div class="hrams-v2-card hrams-v2-filter">
      <el-form :inline="true" :model="pickWhere" class="ele-form-search">
        <el-form-item label="档案编号"><el-input v-model="pickWhere.archiveNo" clearable /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="pickWhere.name" clearable /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="pickReload(pickWhere, 1)">查询</el-button>
          <el-button @click="resetPick">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="hrams-v2-card hrams-v2-table-card">
      <ele-pro-table ref="pickRef" row-key="id" :columns="pickColumns" :datasource="pickDatasource">
        <template #action="{ row }">
          <el-button link type="primary" @click="$emit('select', row)">材料维护</el-button>
        </template>
      </ele-pro-table>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { pagePerson } from '@/api/hrams/person';

  defineEmits(['select']);

  const pickRef = ref(null);
  const pickWhere = ref({});
  const pickColumns = ref([
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'deptName', label: '部门', minWidth: 120 },
    { prop: 'personStatus', label: '当前状态', width: 100 },
    { columnKey: 'action', label: '操作', width: 100, slot: 'action', fixed: 'right' }
  ]);
  const pickDatasource = ({ pages, where: w }) => pagePerson({ ...pickWhere.value, ...w, ...pages });
  const pickReload = (w, page) => pickRef.value?.reload?.({ where: w, page });
  const resetPick = () => {
    pickWhere.value = {};
    pickReload(pickWhere.value, 1);
  };
</script>

<style scoped>
  .pick-steps {
    margin: 0 0 16px;
    font-size: 13px;
    color: #6c7e97;
  }
</style>
