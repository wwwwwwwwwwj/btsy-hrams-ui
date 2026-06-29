<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div>
          <div class="hrams-v2-title">综合查询</div>
          <div class="hrams-v2-desc">档案查询 · 材料查看 · 目录导出</div>
        </div>
      </div>
      <div class="hrams-v2-card hrams-v2-filter">
        <person-archive-search-form
          v-model:model="where"
          show-integrity
          show-archive-status
          @search="reload(where, 1)"
          @reset="resetWhere"
        />
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
        <template #archiveStatus="{ row }">{{ archiveStatusLabel(row.archiveStatus) }}</template>
        <template #integrityStatus="{ row }">{{ integrityLabel(row.integrityStatus) }}</template>
        <template #action="{ row }">
          <el-button link type="primary" @click="showDetail(row)">查看详情</el-button>
          <el-button link type="primary" @click="goFulltext(row)">全文检索</el-button>
          <el-button link type="primary" @click="goQa(row)">智能问答</el-button>
        </template>
      </ele-pro-table>
      </div>
    </div>
    <el-drawer v-model="drawer" title="档案详情" size="58%">
      <template v-if="detail.person">
        <div class="drawer-actions">
          <el-button type="primary" @click="exportMaterials">导出档案材料</el-button>
          <el-button @click="exportCatalog">导出档案目录</el-button>
          <el-button @click="goFulltext(detail.person)">全文检索此人</el-button>
          <el-button @click="goQa(detail.person)">智能问答</el-button>
        </div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="档案编号">{{ detail.person.archiveNo }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ detail.person.name }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ detail.person.idCard }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ detail.person.gender }}</el-descriptions-item>
          <el-descriptions-item label="出生日期">{{ detail.person.birthDate }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ detail.person.age }}</el-descriptions-item>
          <el-descriptions-item label="民族">{{ detail.person.nation }}</el-descriptions-item>
          <el-descriptions-item label="政治面貌">{{ detail.person.politicalStatus }}</el-descriptions-item>
          <el-descriptions-item label="学历">{{ detail.person.education }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">{{ detail.person.personStatus }}</el-descriptions-item>
        </el-descriptions>
        <el-row :gutter="12" style="margin-top:16px">
          <el-col :span="8">
            <el-menu :default-active="detailCat" @select="(c) => { detailCat = c; filterDetailMaterials(); }">
              <el-menu-item v-for="c in flatCats" :key="c.code" :index="c.code">{{ c.name }} ({{ c.fileCount || 0 }})</el-menu-item>
            </el-menu>
          </el-col>
          <el-col :span="16">
            <el-table :data="detailMaterials" size="small">
              <el-table-column prop="displayNo" label="序号" width="90" />
              <el-table-column prop="materialName" label="材料名称" />
              <el-table-column prop="formDate" label="形成时间" width="110" />
              <el-table-column prop="pageCount" label="页数" width="70" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button v-if="row.fileStatus === 'uploaded'" link @click="previewMaterial(row.id)">预览</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </template>
    </el-drawer>
  </ele-page>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { useDictData } from '@/utils/use-dict-data';
  import PersonArchiveSearchForm from '../components/person-archive-search-form.vue';
  import { pageQueryPerson, getQueryPersonDetail } from '@/api/hrams/query';
  import { previewMaterial, downloadMaterialsZip, exportCatalog as exportCatalogApi } from '@/api/hrams/archive';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsQuery' });
  const route = useRoute();
  const router = useRouter();
  const tableRef = ref(null);
  const where = ref({});
  const drawer = ref(false);
  const detail = ref({});
  const detailCat = ref('1');
  const detailMaterials = ref([]);
  const [, , archiveStatusDicts] = useDictData(['hrams_person_status', 'hrams_education', 'hrams_archive_status']);
  const archiveStatusLabel = (code) => {
    const d = archiveStatusDicts.value?.find((x) => x.value === code);
    return d?.label || code || '—';
  };
  const integrityLabel = (s) => (s === 'complete' ? '完整' : s === 'missing' ? '缺项' : '—');

  const flatCats = computed(() => {
    const list = [];
    const walk = (nodes) => (nodes || []).forEach((n) => { list.push(n); if (n.children?.length) walk(n.children); });
    walk(detail.value.categories);
    return list;
  });

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
    { prop: 'idCard', label: '身份证号', minWidth: 170 },
    { prop: 'personStatus', label: '当前状态', width: 90 },
    { prop: 'archiveStatus', label: '档案状态', width: 100, slot: 'archiveStatus' },
    { prop: 'integrityStatus', label: '完整性', width: 90, slot: 'integrityStatus' },
    { columnKey: 'action', label: '操作', width: 260, slot: 'action' }
  ]);

  const goFulltext = (row) => {
    router.push({
      path: '/query-search/fulltext',
      query: { keyword: row.name || row.archiveNo || '', personId: row.id }
    });
  };

  const goQa = (row) => {
    router.push({
      path: '/query-search/qa',
      query: { personId: row.id, name: row.name, archiveNo: row.archiveNo }
    });
  };

  const datasource = ({ pages, where: w }) => pageQueryPerson({ ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => { where.value = {}; reload(where.value, 1); };

  const filterDetailMaterials = () => {
    detailMaterials.value = (detail.value.materials || []).filter((m) => m.categoryCode === detailCat.value);
  };

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
    const ids = (detail.value.materials || []).filter((m) => m.fileStatus === 'uploaded').map((m) => m.id);
    if (p?.id && ids.length) {
      downloadMaterialsZip(p.id, ids);
    }
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
      await showDetail({ id: String(pid).trim() });
    }
  });
</script>

<style scoped>
  .drawer-actions { margin-bottom: 12px; }
</style>
