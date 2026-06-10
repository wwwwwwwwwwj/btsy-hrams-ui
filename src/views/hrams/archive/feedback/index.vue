<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <div class="page-head">
        <div>
          <div class="title">挂接反馈</div>
          <div class="desc">查看历史挂接记录及失败明细</div>
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
          <el-button v-if="row.failCount" link type="primary" @click="showDetail(row)">失败明细</el-button>
          <span v-else class="muted">—</span>
        </template>
      </ele-pro-table>
    </ele-card>
    <el-dialog v-model="visible" title="失败明细" width="800px">
      <el-table :data="details" size="small">
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="errorType" label="错误类型" width="130">
          <template #default="{ row }">
            <el-tag size="small" type="danger" effect="plain">{{ row.errorType || '其他' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="错误信息" min-width="220" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';

  import { pageMountBatches, listMountDetails } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsArchiveFeedback' });
  const tableRef = ref(null);
  const visible = ref(false);
  const details = ref([]);
  const where = ref({});
  const dateRange = ref(null);

  const mountLabel = (t) => ({ batch: '批量挂接', increment: '增补挂接' }[t] || t);

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
    const list = await listMountDetails(row.id);
    details.value = (list || []).filter((d) => d.status === '0' || d.errorType);
    visible.value = true;
  };
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
  .muted {
    color: #999;
  }
</style>
