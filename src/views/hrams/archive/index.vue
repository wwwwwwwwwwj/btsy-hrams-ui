<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <el-form :inline="true" :model="search" class="ele-form-search">
        <el-form-item label="档案编号"><el-input v-model="search.archiveNo" clearable /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="search.name" clearable /></el-form-item>
        <el-form-item label="性别"><el-select v-model="search.gender" clearable><el-option label="男" value="男" /><el-option label="女" value="女" /></el-select></el-form-item>
        <el-form-item label="学历"><el-select v-model="search.education" clearable><el-option v-for="e in eduOptions" :key="e" :label="e" :value="e" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="search.status" clearable><el-option label="在职" value="在职" /><el-option label="离职" value="离职" /><el-option label="退休" value="退休" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="reload(search, 1)">查询</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
    </ele-card>
    <ele-card bordered flex-table="auto" :body-style="{ paddingTop: '8px' }">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource" v-model:selections="selections">
        <template #toolbar>
          <el-button type="primary" v-permission="'hrams:archive:mount'" @click="goMount('batch')">批量挂接</el-button>
          <el-button v-permission="'hrams:archive:mount'" @click="goMount('increment')">增补挂接</el-button>
          <el-button v-permission="'hrams:archive:feedback'" @click="goFeedback">挂接反馈</el-button>
          <el-button v-permission="'hrams:pool:list'" @click="goPool">待归档材料池</el-button>
          <el-button v-permission="'hrams:scan:list'" @click="goScan">扫描接收</el-button>
        </template>
        <template #action="{ row }">
          <el-button link type="primary" v-permission="'hrams:archive:material'" @click="goMaterial(row)">材料管理</el-button>
          <el-button link v-permission="'hrams:archive:catalog:export'" @click="exportCatalog(row.id)">导出目录</el-button>
        </template>
      </ele-pro-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { pageArchivePersons, exportCatalog as exportCatalogApi } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsArchive' });
  const router = useRouter();
  const tableRef = ref(null);
  const selections = ref([]);
  const search = ref({});
  const eduOptions = ['博士', '硕士', '本科', '大专', '其他'];

  const columns = ref([
    { type: 'selection', width: 50 },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'gender', label: '性别', width: 70 },
    { prop: 'education', label: '学历', minWidth: 90 },
    { prop: 'status', label: '状态', width: 90 },
    { columnKey: 'action', label: '操作', width: 200, slot: 'action' }
  ]);

  const datasource = ({ pages, where: w }) => pageArchivePersons({ ...search.value, ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetSearch = () => { search.value = {}; reload(search.value, 1); };

  const goMaterial = (row) => {
    router.push({ path: '/hrams/archive/material', query: { personId: row.id, archiveNo: row.archiveNo, name: row.name } });
  };

  const goFeedback = () => router.push({ path: '/hrams/archive/feedback' });

  const goPool = () => router.push({ path: '/hrams/archive/pool' });

  const goScan = () => router.push({ path: '/hrams/archive/scan' });

  const goMount = (mode) => {
    const ids = selections.value.map((d) => d.id);
    if (!ids.length) {
      EleMessage.error({ message: '请先勾选一名干部', plain: true });
      return;
    }
    router.push({ path: '/hrams/archive/mount', query: { mode, personId: ids[0] } });
  };

  const exportCatalog = (personId) => exportCatalogApi(personId);
</script>
