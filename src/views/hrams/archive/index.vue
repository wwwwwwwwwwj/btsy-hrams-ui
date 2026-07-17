<template>
  <ele-page hide-footer flex-table="auto" :multi-card="false">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <person-archive-search-form
          v-model:model="search"
          simple
          show-archive-status
          search-permission="hrams:archive:list"
          @search="reload(search, 1)"
          @reset="resetSearch"
        >
          <template #extra>
            <el-button v-permission="'hrams:archive:attach'" @click="goAttach('batch')">批量挂接</el-button>
            <el-button v-permission="'hrams:archive:attach'" @click="goAttach('incremental')">增补挂接</el-button>
            <el-button v-permission="'hrams:archive:download'" type="primary" @click="handleBatchExport">批量导出</el-button>
          </template>
        </person-archive-search-form>
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
        <ele-pro-table
          ref="tableRef"
          row-key="id"
          :columns="columns"
          :datasource="datasource"
          v-model:selections="selections"
        >
          <template #archiveStatus="{ row }">{{ archiveStatusLabel(row.archiveStatus) }}</template>
          <template #integrityStatus="{ row }">{{ integrityLabel(row.integrityStatus) }}</template>
          <template #action="{ row }">
            <btn-items type="link" :divider="true" :items="[
              { title: '查看档案', permission: 'hrams:archive:material', onClick: () => viewArchive(row) },
              { title: '导出目录', permission: 'hrams:catalog:export', onClick: () => handleExportCatalog(row) }
            ]" />
          </template>
        </ele-pro-table>
      </div>
    </div>
    <archive-detail-drawer v-model="drawerVisible" :person-id="currentPersonId" />
  </ele-page>
</template>

<script setup>
  import { ref, watch, onActivated, onMounted, nextTick } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { useDictData } from '@/utils/use-dict-data';
  import { pageArchivePersons, exportCatalog, exportBatchArchivePackage } from '@/api/hrams/archive';
  import ArchiveDetailDrawer from './components/archive-detail-drawer.vue';
  import PersonArchiveSearchForm from '../components/person-archive-search-form.vue';
  import '../styles/v2.scss';
  import { formatDateDay } from '@/utils/hrams-date';
  import { dictLabel } from '@/utils/hrams-dict';
  import { HRAMS_ARCHIVE_ATTACH } from '@/utils/hrams-routes';

  defineOptions({ name: 'HramsArchive' });
  const router = useRouter();
  const route = useRoute();
  const tableRef = ref(null);
  const search = ref({});
  const drawerVisible = ref(false);
  const currentPersonId = ref(null);
  const selections = ref([]);

  const [,, archiveStatusDicts] = useDictData(['hrams_person_status', 'hrams_education', 'hrams_archive_status']);

  const archiveStatusLabel = (code) => dictLabel(archiveStatusDicts.value, code);
  const integrityLabel = (s) => (s === 'complete' ? '完整' : s === 'missing' ? '缺项' : '—');

  const columns = ref([
    { type: 'selection', width: 50, fixed: 'left' },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120, fixed: 'left' },
    { prop: 'name', label: '姓名', minWidth: 100, fixed: 'left' },
    { prop: 'gender', label: '性别', width: 70 },
    {
      prop: 'birthDate',
      label: '出生日期',
      width: 110,
      formatter: (row) => formatDateDay(row.birthDate)
    },
    { prop: 'personStatus', label: '当前状态', width: 90 },
    { prop: 'archiveStatus', label: '档案状态', width: 100, slot: 'archiveStatus' },
    { prop: 'materialCount', label: '材料数量', width: 90 },
    { prop: 'integrityStatus', label: '完整性', width: 90, slot: 'integrityStatus' },
    {
      prop: 'updateTime',
      label: '最近更新',
      minWidth: 120,
      formatter: (row) => formatDateDay(row.updateTime)
    },
    { columnKey: 'action', label: '操作', width: 260, slot: 'action', align: 'center' }
  ]);

  const datasource = ({ pages, where: w }) => pageArchivePersons({ ...search.value, ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetSearch = () => { search.value = {}; reload(search.value, 1); };

  const viewArchive = (row) => {
    currentPersonId.value = row.id;
    drawerVisible.value = true;
  };

  const openArchiveDrawer = (id) => {
    if (id == null || id === '') {
      return;
    }
    currentPersonId.value = String(id);
    drawerVisible.value = true;
  };

  const syncViewIdFromRoute = () => {
    const raw = route.query.viewId;
    if (raw == null || raw === '') {
      return;
    }
    const id = Array.isArray(raw) ? raw[0] : raw;
    openArchiveDrawer(id);
  };

  watch(() => route.query.viewId, syncViewIdFromRoute, { immediate: true });

  onMounted(() => {
    nextTick(syncViewIdFromRoute);
  });

  onActivated(() => {
    nextTick(syncViewIdFromRoute);
  });

  watch(drawerVisible, (visible) => {
    if (visible) {
      return;
    }
    if (route.query.viewId == null || route.query.viewId === '') {
      return;
    }
    const q = { ...route.query };
    delete q.viewId;
    router.replace({ path: route.path, query: q });
  });

  const handleExportCatalog = async (row) => {
    try {
      await exportCatalog(row.id);
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const handleBatchExport = async () => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请先勾选人员', plain: true });
      return;
    }
    try {
      await exportBatchArchivePackage(selections.value.map((p) => p.id));
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const goAttach = (mode) => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请先勾选需要挂接的档案人员', plain: true });
      return;
    }
    router.push({
      path: HRAMS_ARCHIVE_ATTACH,
      query: { mode, ids: selections.value.map((p) => String(p.id)).join(',') }
    });
  };
</script>
