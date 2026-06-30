<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
    <div class="hrams-v2-card hrams-v2-filter">
      <el-form :inline="true" :model="where" class="ele-form-search">
        <el-form-item label="操作人"><el-input v-model="where.operatorName" clearable /></el-form-item>
        <el-form-item label="操作模块"><el-input v-model="where.moduleName" clearable /></el-form-item>
        <el-form-item label="档案编号"><el-input v-model="where.archiveNo" clearable /></el-form-item>
        <el-form-item label="操作类型"><el-input v-model="where.actionType" clearable /></el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker v-model="timeRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reload(where, 1)">查询</el-button>
          <el-button @click="resetWhere">重置</el-button>
          <el-button v-permission="'hrams:access:log:export'" @click="doExport">导出</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="hrams-v2-card hrams-v2-table-card">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource" />
    </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { pageAccessLog, exportAccessLog } from '@/api/hrams/access-log';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsAccessLog' });

  const tableRef = ref(null);
  const where = ref({});
  const timeRange = ref(null);

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

  const buildWhere = (w) => {
    const q = { ...where.value, ...(w || {}) };
    if (timeRange.value?.length === 2) {
      q.beginTime = `${timeRange.value[0]} 00:00:00`;
      q.endTime = `${timeRange.value[1]} 23:59:59`;
    }
    return q;
  };
  const datasource = ({ pages, where: w }) => pageAccessLog({ ...buildWhere(w), ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => { where.value = {}; timeRange.value = null; reload(where.value, 1); };
  const doExport = () => exportAccessLog(buildWhere());
</script>
