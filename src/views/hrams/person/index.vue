<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div class="hrams-v2-title">人员管理</div>
        <div class="hrams-v2-actions">
          <el-button type="primary" v-permission="'hrams:person:add'" @click="() => handleEdit()">新增人员</el-button>
          <el-button v-permission="'hrams:person:import'" @click="handleImport">批量导入</el-button>
          <el-button v-permission="'hrams:person:export'" @click="handleExport">批量导出</el-button>
        </div>
      </div>
      <div class="hrams-v2-card hrams-v2-filter">
        <el-form :inline="true" :model="where" class="ele-form-search">
        <el-form-item label="档案编号"><el-input v-model="where.archiveNo" clearable /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="where.name" clearable /></el-form-item>
        <el-form-item label="身份证号"><el-input v-model="where.idCard" clearable /></el-form-item>
        <el-form-item label="性别">
          <dict-data v-model="where.gender" code="hrams_gender" type="select" placeholder="全部" style="width:100px" />
        </el-form-item>
        <el-form-item label="出生日期"><el-date-picker v-model="where.birthDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="年龄"><el-input-number v-model="where.age" :min="0" :max="120" controls-position="right" /></el-form-item>
        <el-form-item label="民族">
          <dict-data v-model="where.nation" code="hrams_nation" type="select" placeholder="全部" filterable clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="政治面貌">
          <dict-data v-model="where.politicalStatus" code="hrams_political_status" type="select" placeholder="全部" filterable clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="学历">
          <el-select v-model="where.education" clearable>
            <el-option v-for="d in educationDicts" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前状态">
          <el-select v-model="where.personStatus" clearable>
            <el-option v-for="d in personStatusDicts" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reload(where, 1)">查询</el-button>
          <el-button @click="resetWhere">重置</el-button>
        </el-form-item>
      </el-form>
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource" v-model:selections="selections">
        <template #action="{ row }">
          <btn-items type="link" :divider="true" :items="[
            { title: '查看', permission: 'hrams:person:query', onClick: () => handleView(row) },
            { preset: 'edit', permission: 'hrams:person:edit', onClick: () => handleEdit(row) },
            { title: '管理材料', permission: 'hrams:archive:upload', onClick: () => goMaterial(row) },
            { title: '查看档案', permission: 'hrams:archive:list', onClick: () => goArchive(row) },
            { preset: 'del', permission: 'hrams:person:remove', onClick: () => handleRemove(row) }
          ]" />
        </template>
      </ele-pro-table>
      </div>
    </div>
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
  import { useRouter } from 'vue-router';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { useDictData } from '@/utils/use-dict-data';
  import DictData from '@/components/DictData/index.vue';
  import { pagePerson, removePerson, exportPerson, importPerson } from '@/api/hrams/person';
  import { HRAMS_MATERIAL_MAINTAIN_PATH } from '@/utils/hrams-routes';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsPerson' });
  const router = useRouter();
  const { openModal } = useModal();
  const tableRef = ref(null);
  const selections = ref([]);
  const where = ref({});
  const importVisible = ref(false);
  const importResult = ref({ total: 0, successCount: 0, failCount: 0, errors: [] });
  const [personStatusDicts, educationDicts] = useDictData(['hrams_person_status', 'hrams_education']);

  const columns = ref([
    { type: 'selection', width: 50 },
    { type: 'index', width: 50 },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'idCard', label: '身份证号', minWidth: 170 },
    { prop: 'gender', label: '性别', width: 70 },
    { prop: 'birthDate', label: '出生日期', width: 110 },
    { prop: 'age', label: '年龄', width: 70 },
    { prop: 'nation', label: '民族', width: 90 },
    { prop: 'politicalStatus', label: '政治面貌', minWidth: 110 },
    { prop: 'education', label: '学历', width: 90 },
    { prop: 'nativePlace', label: '籍贯', minWidth: 100 },
    { prop: 'major', label: '专业', minWidth: 100 },
    { prop: 'personStatus', label: '当前状态', width: 90 },
    { columnKey: 'action', label: '操作', width: 280, slot: 'action', align: 'center' }
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

  const handleView = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/person-detail.vue'),
      componentProps: { personId: row.id }
    });
  };

  const goMaterial = (row) => {
    router.push({
      path: HRAMS_MATERIAL_MAINTAIN_PATH,
      query: { personId: row.id, archiveNo: row.archiveNo, name: row.name }
    });
  };

  const goArchive = (row) => {
    router.push({ path: '/person-archive/archive', query: { viewId: row.id } });
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
