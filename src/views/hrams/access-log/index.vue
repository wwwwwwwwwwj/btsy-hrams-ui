<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <el-form :inline="true" :model="where" class="ele-form-search">
        <el-form-item label="档案编号"><el-input v-model="where.archiveNo" clearable /></el-form-item>
        <el-form-item label="操作类型"><el-input v-model="where.actionType" clearable /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reload(where, 1)">查询</el-button>
          <el-button @click="resetWhere">重置</el-button>
          <el-button v-permission="'hrams:access:log:export'" @click="doExport">导出</el-button>
        </el-form-item>
      </el-form>
    </ele-card>
    <ele-card bordered flex-table="auto" :body-style="{ paddingTop: '8px' }">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource" />
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { pageAccessLog, exportAccessLog } from '@/api/hrams/access-log';

  defineOptions({ name: 'HramsAccessLog' });

  const tableRef = ref(null);
  const where = ref({});

  const columns = ref([
    { prop: 'createTime', label: '时间', width: 170 },
    { prop: 'actionType', label: '操作', width: 120 },
    { prop: 'moduleName', label: '模块', width: 100 },
    { prop: 'archiveNo', label: '档案编号', width: 120 },
    { prop: 'fileName', label: '文件', minWidth: 140, showOverflowTooltip: true },
    { prop: 'operatorName', label: '操作人', width: 100 },
    { prop: 'clientIp', label: 'IP', width: 120 },
    { prop: 'resultStatus', label: '结果', width: 80 },
    { prop: 'remark', label: '备注', minWidth: 160, showOverflowTooltip: true }
  ]);

  const datasource = ({ pages, where: w }) => pageAccessLog({ ...where.value, ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => { where.value = {}; reload(where.value, 1); };
  const doExport = () => exportAccessLog(where.value);
</script>
