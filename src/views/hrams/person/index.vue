<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <el-form :inline="true" :model="where" class="ele-form-search">
        <el-form-item label="档案编号"><el-input v-model="where.archiveNo" clearable /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="where.name" clearable /></el-form-item>
        <el-form-item label="性别"><el-select v-model="where.gender" clearable><el-option label="男" value="男" /><el-option label="女" value="女" /></el-select></el-form-item>
        <el-form-item label="民族"><el-input v-model="where.nation" clearable /></el-form-item>
        <el-form-item label="政治面貌"><el-input v-model="where.politicalStatus" clearable /></el-form-item>
        <el-form-item label="部门"><el-input v-model="where.deptName" clearable /></el-form-item>
        <el-form-item label="身份证"><el-input v-model="where.idCard" clearable /></el-form-item>
        <el-form-item label="人员状态">
          <el-select v-model="where.personStatus" clearable>
            <el-option label="在职" value="在职" /><el-option label="离职" value="离职" /><el-option label="退休" value="退休" />
          </el-select>
        </el-form-item>
        <el-form-item label="档案状态">
          <dict-data code="hrams_archive_status" v-model="where.archiveStatus" placeholder="全部" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reload(where, 1)">查询</el-button>
          <el-button @click="resetWhere">重置</el-button>
        </el-form-item>
      </el-form>
    </ele-card>
    <ele-card bordered flex-table="auto" :body-style="{ paddingTop: '8px' }">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource" v-model:selections="selections">
        <template #toolbar>
          <btn-items :items="[
            { preset: 'add', permission: 'hrams:person:add', onClick: () => handleEdit() },
            { preset: 'del', permission: 'hrams:person:remove', onClick: () => handleRemove() },
            { preset: 'export', permission: 'hrams:person:export', onClick: handleExport },
            { title: '导入', permission: 'hrams:person:import', onClick: handleImport }
          ]" />
        </template>
        <template #archiveStatus="{ row }">
          <dict-data code="hrams_archive_status" type="text" :model-value="row.archiveStatus" />
        </template>
        <template #action="{ row }">
          <btn-items type="link" :divider="true" :items="[
            { title: '查看', permission: 'hrams:person:query', onClick: () => handleView(row) },
            { title: '管理材料', permission: 'hrams:material:list', onClick: () => goMaterial(row) },
            { preset: 'edit', permission: 'hrams:person:edit', onClick: () => handleEdit(row) },
            { preset: 'del', permission: 'hrams:person:remove', onClick: () => handleRemove(row) }
          ]" />
        </template>
      </ele-pro-table>
    </ele-card>
    <el-dialog v-model="importVisible" title="导入结果" width="640px">
      <p>共 {{ importResult.total }} 行，成功 {{ importResult.successCount }}，失败 {{ importResult.failCount }}</p>
      <el-table v-if="importResult.errors?.length" :data="importResult.errors" size="small" max-height="320">
        <el-table-column prop="rowNum" label="行号" width="70" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="message" label="原因" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { useRouter } from 'vue-router';
  import { pagePerson, removePerson, exportPerson, importPerson } from '@/api/hrams/person';
  import { useDictData } from '@/utils/use-dict-data';

  useDictData(['hrams_archive_status']);

  defineOptions({ name: 'HramsPerson' });
  const router = useRouter();
  const { openModal } = useModal();
  const tableRef = ref(null);
  const selections = ref([]);
  const where = ref({});
  const importVisible = ref(false);
  const importResult = ref({ total: 0, successCount: 0, failCount: 0, errors: [] });

  const columns = ref([
    { type: 'selection', width: 50 },
    { type: 'index', width: 50 },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'gender', label: '性别', width: 70 },
    { prop: 'deptName', label: '部门', minWidth: 120 },
    { prop: 'personStatus', label: '人员状态', width: 90 },
    { columnKey: 'archiveStatus', label: '档案状态', width: 100, slot: 'archiveStatus' },
    { prop: 'materialCount', label: '材料份数', width: 90 },
    { columnKey: 'action', label: '操作', width: 260, slot: 'action', align: 'center' }
  ]);

  const datasource = ({ pages, where: w }) => pagePerson({ ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => { where.value = {}; reload(where.value, 1); };

  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/person-edit.vue'),
      componentProps: { data: row || {}, onDone: () => reload(where.value, 1) }
    });
  };

  const goMaterial = (row) => {
    router.push({
      path: '/material',
      query: { personId: row.id, archiveNo: row.archiveNo, name: row.name }
    });
  };

  const handleView = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/person-detail.vue'),
      componentProps: { personId: row.id }
    });
  };

  const handleRemove = (row) => {
    const rows = row ? [row] : selections.value;
    if (!rows.length) return EleMessage.error({ message: '请选择数据', plain: true });
    ElMessageBox.confirm('确认注销所选人员？', '提示', { type: 'warning' }).then(() => {
      removePerson(rows.map((d) => d.id)).then(() => {
        EleMessage.success({ message: '已注销', plain: true });
        reload(where.value, 1);
      });
    }).catch(() => {});
  };

  const handleExport = () => {
    tableRef.value?.fetch?.(({ where: w, pages }) => exportPerson({ ...w, ...pages }));
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = await importPerson(file);
        importResult.value = data || importResult.value;
        importVisible.value = true;
        if (data?.successCount > 0) reload(where.value, 1);
        if (data?.failCount > 0) {
          EleMessage.warning({ message: `导入完成：成功 ${data.successCount}，失败 ${data.failCount}`, plain: true });
        } else {
          EleMessage.success({ message: '导入成功', plain: true });
        }
      } catch (e) {
        EleMessage.error({ message: e.message, plain: true });
      }
    };
    input.click();
  };
</script>
