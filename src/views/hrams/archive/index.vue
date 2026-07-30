<template>
  <ele-page hide-footer flex-table="auto" :multi-card="false">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <person-archive-search-form
          v-model:model="search"
          simple
          show-id-card
          search-permission="hrams:archive:list"
          @search="reload(search, 1)"
          @reset="resetSearch"
        >
          <template #extra>
            <el-button v-permission="'hrams:archive:attach'" @click="handleDownloadTemplate">下载挂接模板</el-button>
            <el-button v-permission="'hrams:archive:attach'" @click="goAttach('batch')">批量挂接</el-button>
            <el-button v-permission="'hrams:archive:attach'" @click="goAttach('incremental')">增补挂接</el-button>
            <el-button v-permission="'hrams:archive:download'" @click="handleBatchExport">导出档案材料</el-button>
            <el-button v-permission="'hrams:catalog:export'" @click="handleBatchExportCatalog">导出档案目录</el-button>
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
          <template #action="{ row }">
            <btn-items
              type="link"
              :divider="true"
              :items="[
                {
                  title: '材料维护',
                  permission: 'hrams:archive:material',
                  onClick: () => goMaterialMaintain(row)
                }
              ]"
            />
          </template>
        </ele-pro-table>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { useDictData } from '@/utils/use-dict-data';
  import { pageArchivePersons, exportCatalog, exportBatchArchivePackage, exportBatchCatalog, downloadAttachTemplate } from '@/api/hrams/archive';
  import ArchiveDetailDrawer from './components/archive-detail-drawer.vue';
  import PersonArchiveSearchForm from '../components/person-archive-search-form.vue';
  import '../styles/v2.scss';
  import { formatDateDay } from '@/utils/hrams-date';
  import {
    HRAMS_ARCHIVE_ATTACH,
    HRAMS_MATERIAL_MAINTAIN_PATH
  } from '@/utils/hrams-routes';

  defineOptions({ name: 'HramsArchive' });
  const router = useRouter();
  const tableRef = ref(null);
  const search = ref({});
  const selections = ref([]);

  const columns = ref([
    { type: 'selection', width: 50, fixed: 'left' },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120, fixed: 'left' },
    { prop: 'name', label: '姓名', minWidth: 100, fixed: 'left' },
    { prop: 'idCard', label: '身份证号', minWidth: 180 },
    { prop: 'gender', label: '性别', width: 70 },
    {
      prop: 'birthDate',
      label: '出生日期',
      width: 110,
      formatter: (row) => formatDateDay(row.birthDate)
    },
    { prop: 'personStatus', label: '当前状态', width: 90 },
    { prop: 'archiveStatus', label: '档案状态', width: 90, slot: 'archiveStatus' },
    {
      prop: 'updateTime',
      label: '最近更新',
      minWidth: 120,
      formatter: (row) => formatDateDay(row.updateTime)
    },
    {
      columnKey: 'action',
      label: '操作',
      width: 120,
      slot: 'action',
      align: 'center'
    }
  ]);

  const datasource = ({ pages, where: w }) =>
    pageArchivePersons({ ...search.value, ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetSearch = () => {
    search.value = {};
    reload(search.value, 1);
  };

  const archiveStatusLabel = (status) => {
    if (status === 'borrowing') return '借阅中';
    if (status === 'overdue') return '逾期未还';
    return '正常';
  };

  const goMaterialMaintain = (row) => {
    router.push({
      path: HRAMS_MATERIAL_MAINTAIN_PATH,
      query: {
        personId: String(row.id),
        archiveNo: row.archiveNo || '',
        name: row.name || ''
      }
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadAttachTemplate();
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

  const handleBatchExportCatalog = async () => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请先勾选人员', plain: true });
      return;
    }
    try {
      await exportBatchCatalog(selections.value.map((p) => p.id));
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
