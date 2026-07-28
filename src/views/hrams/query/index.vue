<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <person-archive-search-form
          v-model:model="where"
          search-permission="hrams:query:list"
          @search="reload(where, 1)"
          @reset="resetWhere"
        />
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
        <template #action="{ row }">
          <el-button link type="primary" v-permission="'hrams:query:list'" @click="showDetail(row)">查看档案</el-button>
        </template>
      </ele-pro-table>
      </div>
    </div>
    <archive-detail-drawer
      v-model="drawer"
      :person-id="currentPersonId"
      :detail-loader="getQueryPersonDetail"
      full-person-info
    />
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import PersonArchiveSearchForm from '../components/person-archive-search-form.vue';
  import ArchiveDetailDrawer from '../archive/components/archive-detail-drawer.vue';
  import { pageQueryPerson, getQueryPersonDetail } from '@/api/hrams/query';
  import { previewMaterial, exportArchivePackage, exportCatalog as exportCatalogApi } from '@/api/hrams/archive';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsQuery' });
  const route = useRoute();
  const tableRef = ref(null);
  const where = ref({});
  const drawer = ref(false);
  const currentPersonId = ref(null);

  const columns = ref([
    { type: 'index', width: 50 },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'gender', label: '性别', width: 70 },
    { prop: 'birthDate', label: '出生年月', minWidth: 110 },
    { prop: 'age', label: '年龄', width: 70 },
    { prop: 'nation', label: '民族', width: 80 },
    { prop: 'politicalStatus', label: '政治面貌', minWidth: 110 },
    { prop: 'education', label: '学历', width: 90 },
    { prop: 'idCard', label: '身份证号', minWidth: 200 },
    { prop: 'personStatus', label: '当前状态', width: 90 },
    { columnKey: 'action', label: '操作', width: 100, slot: 'action' }
  ]);

  const datasource = ({ pages, where: w }) => pageQueryPerson({ ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => { where.value = {}; reload(where.value, 1); };

  const showDetail = async (row) => {
    try {
      detail.value = await getQueryPersonDetail(row.id);
      detailCat.value = flatCats.value[0]?.code || '1';
      filterDetailMaterials();
      drawer.value = true;
    } catch (e) {
      EleMessage.error({ message: e.message || '加载档案详情失败', plain: true });
    }
  };

  const exportMaterials = () => {
    const p = detail.value.person;
    if (!p?.id) return;
    exportArchivePackage(p.id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const exportCatalog = () => {
    const p = detail.value.person;
    if (p?.id) {
      exportCatalogApi(p.id);
    }
  };

  onMounted(async () => {
    const pid = route.query.personId;
    if (pid != null && String(pid).trim() !== '') {
      showDetail({ id: String(pid).trim() });
    }
  });
</script>
