<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <el-form :inline="true" :model="search" class="ele-form-search">
        <el-form-item label="档案编号"><el-input v-model="search.archiveNo" clearable /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="search.name" clearable /></el-form-item>
        <el-form-item label="性别"><el-select v-model="search.gender" clearable><el-option label="男" value="男" /><el-option label="女" value="女" /></el-select></el-form-item>
        <el-form-item label="人员状态">
          <el-select v-model="search.personStatus" clearable>
            <el-option label="在职" value="在职" />
            <el-option label="离职" value="离职" />
            <el-option label="退休" value="退休" />
          </el-select>
        </el-form-item>
        <el-form-item label="身份证"><el-input v-model="search.idCard" clearable /></el-form-item>
        <el-form-item label="档案状态">
          <dict-data code="hrams_archive_status" v-model="search.archiveStatus" placeholder="全部" />
        </el-form-item>
        <el-form-item label="完整性">
          <el-select v-model="search.integrityStatus" clearable placeholder="全部">
            <el-option label="完整" value="complete" />
            <el-option label="缺项" value="missing" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="reload(search, 1)">查询</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
    </ele-card>
    <ele-card bordered flex-table="auto" :body-style="{ paddingTop: '8px' }">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
        <template #archiveStatus="{ row }">
          <dict-data code="hrams_archive_status" type="text" :model-value="row.archiveStatus" />
        </template>
        <template #integrity="{ row }">{{ integrityLabel(row.integrityStatus) }}</template>
        <template #action="{ row }">
          <el-button link type="primary" v-permission="'hrams:archive:material'" @click="goMaterial(row)">查阅材料</el-button>
          <el-button link v-permission="'hrams:archive:catalog:export'" @click="exportCatalog(row.id)">导出目录</el-button>
        </template>
      </ele-pro-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { pageArchivePersons, exportCatalog as exportCatalogApi } from '@/api/hrams/archive';
  import { useDictData } from '@/utils/use-dict-data';
  import { integrityLabel } from '@/utils/hrams-labels';

  useDictData(['hrams_archive_status']);

  defineOptions({ name: 'HramsArchive' });
  const router = useRouter();
  const tableRef = ref(null);
  const search = ref({});

  const columns = ref([
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'gender', label: '性别', width: 70 },
    { prop: 'birthDate', label: '出生年月', width: 110 },
    { prop: 'personStatus', label: '当前状态', width: 90 },
    { columnKey: 'archiveStatus', label: '档案状态', width: 100, slot: 'archiveStatus' },
    { prop: 'materialCount', label: '材料数量', width: 90 },
    { columnKey: 'integrity', label: '完整性', width: 80, slot: 'integrity' },
    { prop: 'updateTime', label: '最近更新', width: 170 },
    { columnKey: 'action', label: '操作', width: 180, slot: 'action' }
  ]);

  const datasource = ({ pages, where: w }) => pageArchivePersons({ ...search.value, ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetSearch = () => { search.value = {}; reload(search.value, 1); };

  const goMaterial = (row) => {
    router.push({
      path: '/material',
      query: { personId: row.id, archiveNo: row.archiveNo, name: row.name, view: 'archive' }
    });
  };

  const exportCatalog = (personId) => exportCatalogApi(personId);
</script>
