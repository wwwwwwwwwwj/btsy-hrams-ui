<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <div class="page-head">
        <div>
          <div class="title">挂接反馈</div>
          <div class="desc">查看历史挂接记录、成功追溯与失败处理</div>
        </div>
        <el-button @click="$router.push('/hrams/archive')">返回档案管理</el-button>
      </div>
      <el-form :inline="true" :model="where" class="ele-form-search">
        <el-form-item label="上传文件夹名">
          <el-input v-model="where.folderName" clearable placeholder="例如：20260003王芳" style="width: 180px" />
        </el-form-item>
        <el-form-item label="挂接类型">
          <el-select v-model="where.mountType" clearable style="width: 140px">
            <el-option label="批量挂接" value="batch" />
            <el-option label="增补挂接" value="increment" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reload">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
        <template #mountType="{ row }">{{ mountLabel(row.mountType) }}</template>
        <template #result="{ row }">
          <span v-if="!row.failCount" class="badge ok">全部成功 ({{ row.successCount || 0 }})</span>
          <span v-else class="badge fail">成功 {{ row.successCount || 0 }} / 失败 {{ row.failCount }}</span>
        </template>
        <template #action="{ row }">
          <el-button link type="primary" @click="showDetail(row)">明细</el-button>
        </template>
      </ele-pro-table>
    </ele-card>
    <el-dialog v-model="visible" :title="dialogTitle" width="920px">
      <el-table :data="details" size="small">
        <el-table-column prop="fileName" label="文件名" min-width="180" show-overflow-tooltip />
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status === '1'" size="small" type="success">成功</el-tag>
            <el-tag v-else size="small" type="danger">失败</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorType" label="错误类型" width="120">
          <template #default="{ row }">
            <span v-if="row.status === '1'">—</span>
            <el-tag v-else size="small" type="danger" effect="plain">{{ row.errorType || '其他' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="说明" min-width="160" show-overflow-tooltip />
        <el-table-column label="处理" width="90">
          <template #default="{ row }">
            <span v-if="row.status === '1'">—</span>
            <el-tag v-else-if="row.handleStatus === '1'" size="small" type="info">已处理</el-tag>
            <el-tag v-else size="small">待处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.materialId" link type="primary" @click="goMaterial(row)">查看材料</el-button>
            <el-button
              v-if="row.status !== '1' && row.handleStatus !== '1'"
              link
              type="primary"
              v-permission="'hrams:archive:feedback:handle'"
              @click="markHandled(row)"
            >标记已处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';

  import { pageMountBatches, listMountDetails, handleMountDetail } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsArchiveFeedback' });
  const route = useRoute();
  const router = useRouter();
  const tableRef = ref(null);
  const visible = ref(false);
  const details = ref([]);
  const currentBatch = ref(null);
  const where = ref({});
  const dateRange = ref(null);

  const mountLabel = (t) => ({ batch: '批量挂接', increment: '增补挂接' }[t] || t);
  const dialogTitle = ref('挂接明细');

  const columns = ref([
    { type: 'index', width: 55, label: '序号' },
    { prop: 'folderName', label: '上传文件夹名', minWidth: 180 },
    { columnKey: 'mountType', label: '挂接类型', width: 110, slot: 'mountType' },
    { prop: 'createTime', label: '上传时间', minWidth: 160 },
    { columnKey: 'result', label: '上传结果', minWidth: 160, slot: 'result' },
    { columnKey: 'action', label: '操作', width: 100, slot: 'action' }
  ]);

  const buildParams = (pages) => {
    const p = { ...pages, ...where.value };
    if (dateRange.value?.length === 2) {
      p.createTimeBegin = dateRange.value[0];
      p.createTimeEnd = `${dateRange.value[1]} 23:59:59`;
    }
    return p;
  };

  const datasource = ({ pages }) => pageMountBatches(buildParams(pages));
  const reload = () => tableRef.value?.reload?.({ page: 1 });
  const reset = () => {
    where.value = {};
    dateRange.value = null;
    reload();
  };

  const showDetail = async (row) => {
    currentBatch.value = row;
    dialogTitle.value = `挂接明细：${row.folderName || row.id}`;
    details.value = await listMountDetails(row.id);
    visible.value = true;
  };

  const goMaterial = (row) => {
    if (!row.personId || !row.materialId) return;
    router.push({
      path: '/hrams/archive/material',
      query: {
        personId: row.personId,
        archiveNo: row.archiveNo,
        name: row.personName,
        materialId: row.materialId
      }
    });
  };

  const markHandled = async (row) => {
    try {
      await handleMountDetail(row.id);
      EleMessage.success({ message: '已标记', plain: true });
      if (currentBatch.value) {
        details.value = await listMountDetails(currentBatch.value.id);
      }
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  onMounted(async () => {
    const batchId = route.query.batchId;
    if (batchId) {
      await showDetail({ id: batchId, folderName: route.query.folderName || batchId });
    }
  });
</script>

<style scoped>
  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .title {
    font-size: 18px;
    font-weight: 600;
  }
  .desc {
    font-size: 13px;
    color: #666;
    margin-top: 4px;
  }
  .badge {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 20px;
  }
  .badge.ok {
    background: #e6f7e6;
    color: #2b6e3b;
  }
  .badge.fail {
    background: #ffebee;
    color: #c0392b;
  }
</style>
