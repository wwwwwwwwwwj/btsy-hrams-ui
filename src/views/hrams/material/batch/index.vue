<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <el-form :inline="true" :model="where" class="ele-form-search">
          <el-form-item label="干部">
            <el-select v-model="where.personId" clearable filterable placeholder="全部" style="width:220px">
              <el-option v-for="p in personOptions" :key="p.id" :label="`${p.archiveNo} ${p.name}`" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="reload(where, 1)">查询</el-button>
            <el-button @click="resetWhere">重置</el-button>
            <el-button @click="goMaintain">去材料维护上传</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
        <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
          <template #action="{ row }">
            <el-button link type="primary" @click="showDetail(row)">明细</el-button>
          </template>
        </ele-pro-table>
      </div>
    </div>
    <el-dialog v-model="detailVisible" :title="`批次 ${detailTitle}`" width="880px">
      <el-table :data="detailRows" size="small">
        <el-table-column label="类目" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ categoryLabel(row.categoryCode) }}</template>
        </el-table-column>
        <el-table-column label="显示序号" width="90">
          <template #default="{ row }">{{ materialDisplayNo(row) }}</template>
        </el-table-column>
        <el-table-column prop="pageNo" label="页号" width="70" />
        <el-table-column prop="materialName" label="材料名称" min-width="140" />
        <el-table-column label="形成日期" width="110">
          <template #default="{ row }">{{ formatDateDay(row.formDate) }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="上传时间" width="170" />
      </el-table>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { pagePerson } from '@/api/hrams/person';
  import { pageUploadBatch, listBatchMaterials } from '@/api/hrams/material-batch';
  import { listCategories } from '@/api/hrams/archive';
  import { formatDateDay } from '@/utils/hrams-date';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsMaterialBatch' });
  const router = useRouter();
  const tableRef = ref(null);
  const where = ref({});
  const personOptions = ref([]);
  const detailVisible = ref(false);
  const detailTitle = ref('');
  const detailRows = ref([]);
  const detailCategoryNames = ref({});

  const flattenCategoryNames = (nodes) => {
    const map = {};
    const walk = (list) => {
      (list || []).forEach((n) => {
        if (n.code) map[n.code] = n.name || n.code;
        walk(n.children);
      });
    };
    walk(nodes);
    return map;
  };

  const materialDisplayNo = (row) => {
    if (row.displayNo) return row.displayNo;
    const code = row.categoryCode;
    const page = row.pageNo;
    if (code != null && code !== '' && page != null) return `${code}-${page}`;
    return '—';
  };

  const categoryLabel = (code) => {
    if (code == null || code === '') return '—';
    return detailCategoryNames.value[code] || code;
  };

  const columns = ref([
    { prop: 'batchNo', label: '批次号', minWidth: 150 },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'personName', label: '姓名', minWidth: 100 },
    { prop: 'materialCount', label: '材料数', width: 80 },
    { prop: 'createTime', label: '上传时间', width: 170 },
    { columnKey: 'action', label: '操作', width: 80, slot: 'action' }
  ]);

  const datasource = ({ pages }) => pageUploadBatch({ ...where.value, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => {
    where.value = {};
    reload(where.value, 1);
  };

  const showDetail = async (row) => {
    detailTitle.value = row.batchNo || row.id;
    detailCategoryNames.value = {};
    if (row.personId) {
      try {
        const tree = await listCategories(row.personId);
        detailCategoryNames.value = flattenCategoryNames(tree);
      } catch {
        detailCategoryNames.value = {};
      }
    }
    detailRows.value = await listBatchMaterials(row.id);
    detailVisible.value = true;
  };

  const goMaintain = () => router.push('/archive-material/maintain');

  onMounted(async () => {
    const data = await pagePerson({ pageNum: 1, pageSize: 500 });
    personOptions.value = data.rows || [];
  });
</script>
