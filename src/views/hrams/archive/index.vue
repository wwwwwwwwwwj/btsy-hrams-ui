<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div class="hrams-v2-title">档案管理</div>
        <div class="hrams-v2-actions">
          <el-button type="primary" v-permission="'hrams:archive:attach'" @click="goAttach('batch')">批量挂接</el-button>
          <el-button type="primary" v-permission="'hrams:archive:attach'" @click="goAttach('incremental')">增补挂接</el-button>
        </div>
      </div>
      <div class="hrams-v2-card hrams-v2-filter">
        <person-archive-search-form
          v-model:model="search"
          show-integrity
          show-archive-status
          @search="reload(search, 1)"
          @reset="resetSearch"
        />
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
        <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource" v-model:selections="selections">
          <template #archiveStatus="{ row }">{{ archiveStatusLabel(row.archiveStatus) }}</template>
          <template #integrityStatus="{ row }">{{ integrityLabel(row.integrityStatus) }}</template>
          <template #action="{ row }">
            <btn-items type="link" :divider="true" :items="[
              { title: '查看档案', permission: 'hrams:archive:material', onClick: () => viewArchive(row) },
              { title: '导出目录', permission: 'hrams:archive:catalog:export', onClick: () => handleExportCatalog(row) },
              { title: '材料管理', permission: 'hrams:archive:material', onClick: () => goMaterial(row) }
            ]" />
          </template>
        </ele-pro-table>
      </div>
    </div>
    <archive-detail-drawer v-model="drawerVisible" :person-id="currentPersonId" />
  </ele-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { useDictData } from '@/utils/use-dict-data';
  import { pageArchivePersons, exportCatalog } from '@/api/hrams/archive';
  import { HRAMS_MATERIAL_MAINTAIN_PATH } from '@/utils/hrams-routes';
  import ArchiveDetailDrawer from './components/archive-detail-drawer.vue';
  import PersonArchiveSearchForm from '../components/person-archive-search-form.vue';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsArchive' });
  const router = useRouter();
  const route = useRoute();
  const tableRef = ref(null);
  const search = ref({});
  const selections = ref([]);
  const drawerVisible = ref(false);
  const currentPersonId = ref(null);

  const [,, archiveStatusDicts] = useDictData(['hrams_person_status', 'hrams_education', 'hrams_archive_status']);

  const archiveStatusLabel = (code) => {
    const d = archiveStatusDicts.value?.find((x) => x.value === code);
    return d?.label || code || '—';
  };
  const integrityLabel = (s) => (s === 'complete' ? '完整' : s === 'missing' ? '缺项' : '—');

  const columns = ref([
    { type: 'selection', width: 50 },
    { type: 'index', width: 50 },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'gender', label: '性别', width: 70 },
    { prop: 'birthDate', label: '出生年月', width: 110 },
    { prop: 'personStatus', label: '当前状态', width: 90 },
    { prop: 'archiveStatus', label: '档案状态', width: 100, slot: 'archiveStatus' },
    { prop: 'materialCount', label: '材料数量', width: 90 },
    { prop: 'integrityStatus', label: '完整性', width: 90, slot: 'integrityStatus' },
    { prop: 'updateTime', label: '最近更新', minWidth: 160 },
    { columnKey: 'action', label: '操作', width: 260, slot: 'action', align: 'center' }
  ]);

  const datasource = ({ pages, where: w }) => pageArchivePersons({ ...search.value, ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetSearch = () => { search.value = {}; reload(search.value, 1); };

  const goAttach = (mode) => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请先勾选需要挂接的档案人员', plain: true });
      return;
    }
    router.push({
      path: '/person-archive/archive/attach',
      query: { mode, ids: selections.value.map((p) => p.id).join(',') }
    });
  };

  const goMaterial = (row) => {
    router.push({
      path: HRAMS_MATERIAL_MAINTAIN_PATH,
      query: { personId: row.id, archiveNo: row.archiveNo, name: row.name }
    });
  };

  const viewArchive = (row) => {
    currentPersonId.value = row.id;
    drawerVisible.value = true;
  };

  const handleExportCatalog = async (row) => {
    try {
      await exportCatalog(row.id);
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  onMounted(() => {
    const viewId = route.query.viewId;
    if (viewId) {
      currentPersonId.value = Number(viewId);
      drawerVisible.value = true;
    }
  });
</script>
