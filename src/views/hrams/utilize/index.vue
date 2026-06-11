<template>
  <ele-page hide-footer>
    <ele-card>
      <div class="page-head">
        <div><div class="title">档案利用</div><div class="desc">调阅登记 · 调阅记录 · 台账统计</div></div>
      </div>
      <el-tabs v-model="tab">
        <el-tab-pane label="调阅登记" name="register">
          <el-form :model="form" label-width="110px" style="max-width:720px">
            <el-form-item label="档案编号" required>
              <el-input v-model="form.archiveNo" @blur="lookupPerson" placeholder="输入后自动带出被查阅人" />
            </el-form-item>
            <el-form-item label="被查阅人"><el-input :model-value="lookup.name" disabled /></el-form-item>
            <el-form-item label="借阅时间"><el-date-picker v-model="form.borrowTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
            <el-form-item label="预计归还" required><el-date-picker v-model="form.expectedReturn" type="date" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
            <el-form-item label="借阅人" required><el-input v-model="form.borrower" /></el-form-item>
            <el-form-item label="借阅事由" required><el-input v-model="form.reason" type="textarea" /></el-form-item>
            <el-form-item label="调阅范围" required>
              <el-radio-group v-model="form.borrowScope">
                <el-radio value="full">整卷</el-radio>
                <el-radio value="partial">指定大类</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="form.borrowScope === 'partial'" label="借阅大类" required>
              <el-select v-model="form.scopeCategoryCodes" multiple placeholder="选择十大类" style="width:100%">
                <el-option v-for="c in scopeCategories" :key="c.code" :label="`${c.name}(${c.code})`" :value="c.code" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
            <el-form-item label="申请表"><input type="file" accept=".pdf,.jpg,.jpeg" @change="onFile" /></el-form-item>
            <el-form-item>
              <el-button @click="resetForm">重置</el-button>
              <el-button type="primary" v-permission="'hrams:borrow:add'" @click="submit">提交</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="调阅记录" name="records">
          <el-form :inline="true" :model="where" class="ele-form-search">
            <el-form-item label="档案编号"><el-input v-model="where.archiveNo" clearable /></el-form-item>
            <el-form-item label="被查阅人"><el-input v-model="where.personName" clearable /></el-form-item>
            <el-form-item label="借阅日期">
              <el-date-picker
                v-model="borrowDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                start-placeholder="开始"
                end-placeholder="结束"
                style="width: 260px"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="where.status" clearable>
                <el-option label="借阅中" value="borrowing" /><el-option label="逾期未还" value="overdue" /><el-option label="已归还" value="returned" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="reloadRecords">查询</el-button>
              <el-button @click="resetRecords">重置</el-button>
            </el-form-item>
          </el-form>
          <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
            <template #borrowScope="{ row }">{{ borrowScopeLabel(row) }}</template>
            <template #status="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template>
            <template #attach="{ row }">
              <el-button v-if="row.ossId" link type="primary" @click="previewAttach(row)">查看附件</el-button>
              <span v-else>-</span>
            </template>
            <template #action="{ row }">
              <el-button v-if="row.status !== 'returned'" link type="primary" v-permission="'hrams:borrow:return'" @click="doReturn(row)">归还</el-button>
            </template>
          </ele-pro-table>
        </el-tab-pane>
        <el-tab-pane label="台账统计" name="stats">
          <el-button v-permission="'hrams:borrow:export'" style="margin-bottom:12px" @click="exportStats">导出统计 CSV</el-button>
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="stats-card">
                <div class="stats-title">按时间维度统计查阅次数（本月）</div>
                <div ref="chartTimeRef" class="chart-box" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="stats-card">
                <div class="stats-title">按人员维度统计被查阅频率</div>
                <div ref="chartPersonRef" class="chart-box" />
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="16" style="margin-top: 16px">
            <el-col :span="12">
              <div class="stats-card">
                <div class="stats-title">调阅状态分布</div>
                <div ref="chartStatusRef" class="chart-box" />
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { nextTick, onMounted, ref, watch } from 'vue';
  import * as echarts from 'echarts';
  import { EleMessage } from 'ele-admin-plus';
  import { toFormData } from '@/utils/common';
  import { useUserStore } from '@/store/modules/user';
  import { pageBorrow, registerBorrowForm, returnBorrow, lookupBorrowPerson, borrowStatistics, exportBorrowStatistics, previewBorrowAttachment } from '@/api/hrams/borrow';
  import { listCategories } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsUtilize' });
  const userStore = useUserStore();
  const tab = ref('register');
  const tableRef = ref(null);
  const where = ref({});
  const borrowDateRange = ref(null);
  const form = ref({});
  const lookup = ref({});
  const attachFile = ref(null);
  const scopeCategories = ref([]);
  const chartTimeRef = ref(null);
  const chartPersonRef = ref(null);
  const chartStatusRef = ref(null);

  const columns = ref([
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'personName', label: '被查阅人', minWidth: 100 },
    { prop: 'borrowTime', label: '借阅时间', minWidth: 160 },
    { prop: 'expectedReturn', label: '预计归还', minWidth: 160 },
    { prop: 'borrower', label: '借阅人', width: 100 },
    { columnKey: 'borrowScope', label: '调阅范围', width: 100, slot: 'borrowScope' },
    { prop: 'reason', label: '借阅事由', minWidth: 120, showOverflowTooltip: true },
    { prop: 'remark', label: '备注', minWidth: 100, showOverflowTooltip: true },
    { columnKey: 'attach', label: '附件', width: 100, slot: 'attach' },
    { prop: 'returnTime', label: '归还时间', minWidth: 160 },
    { columnKey: 'status', label: '借阅状态', width: 100, slot: 'status' },
    { columnKey: 'action', label: '操作', width: 90, slot: 'action' }
  ]);

  const borrowScopeLabel = (row) => {
    if (row.borrowScope === 'partial') {
      const codes = row.scopeCategoryCodes?.length ? row.scopeCategoryCodes.join('、') : '指定大类';
      return `部分：${codes}`;
    }
    return '整卷';
  };
  const statusLabel = (s) => ({ borrowing: '借阅中', overdue: '逾期未还', returned: '已归还' }[s] || s);
  const statusType = (s) => ({ borrowing: 'warning', overdue: 'danger', returned: 'success' }[s] || 'info');

  const buildWhere = (w) => {
    const q = { ...(w || where.value) };
    if (borrowDateRange.value?.length === 2) {
      q.borrowTimeBegin = `${borrowDateRange.value[0]} 00:00:00`;
      q.borrowTimeEnd = `${borrowDateRange.value[1]} 23:59:59`;
    }
    return q;
  };

  const datasource = ({ pages, where: w }) => pageBorrow({ ...buildWhere(w), ...pages });
  const reloadRecords = () => tableRef.value?.reload?.({ where: buildWhere(), page: 1 });
  const resetRecords = () => {
    where.value = {};
    borrowDateRange.value = null;
    reloadRecords();
  };

  const resetForm = () => {
    const nick = userStore.info?.nickName || userStore.info?.userName || '';
    form.value = {
      borrowTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      borrower: nick,
      borrowScope: 'full',
      scopeCategoryCodes: []
    };
    lookup.value = {};
    scopeCategories.value = [];
    attachFile.value = null;
  };

  const lookupPerson = async () => {
    if (!form.value.archiveNo) return;
    try {
      lookup.value = await lookupBorrowPerson(form.value.archiveNo);
      if (lookup.value?.id) {
        const tree = await listCategories(lookup.value.id);
        scopeCategories.value = (tree || []).filter((c) => !c.parentCode || c.parentCode === '0');
      }
    } catch {
      lookup.value = {};
      scopeCategories.value = [];
    }
  };

  const onFile = (e) => { attachFile.value = e.target.files?.[0]; };
  const submit = async () => {
    if (!form.value.archiveNo || !form.value.reason || !form.value.expectedReturn) {
      return EleMessage.error({ message: '请填写档案编号、借阅事由和预计归还时间', plain: true });
    }
    if (form.value.borrowScope === 'partial' && !form.value.scopeCategoryCodes?.length) {
      return EleMessage.error({ message: '指定大类调阅须选择至少一个大类', plain: true });
    }
    const { scopeCategoryCodes, ...borrowFields } = form.value;
    const fd = toFormData({ ...borrowFields, file: attachFile.value });
    (scopeCategoryCodes || []).forEach((c) => fd.append('scopeCategoryCodes', c));
    await registerBorrowForm(fd);
    EleMessage.success({ message: '登记成功', plain: true });
    resetForm();
    tab.value = 'records';
    nextTick(reloadRecords);
  };

  const doReturn = async (row) => {
    await returnBorrow(row.id);
    EleMessage.success({ message: '已归还', plain: true });
    reloadRecords();
  };

  const previewAttach = (row) => {
    previewBorrowAttachment(row.id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const exportStats = () => exportBorrowStatistics('month');

  const renderStats = async () => {
    const data = await borrowStatistics('month');
    const byStatus = data.byStatus || {};
    const byWeek = data.byWeek || [];
    const byPersonTop = data.byPersonTop || [];

    if (chartTimeRef.value) {
      const c = echarts.init(chartTimeRef.value);
      c.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '8%', right: '5%', containLabel: true },
        xAxis: { type: 'category', data: byWeek.map((x) => x.label) },
        yAxis: { type: 'value', name: '查阅次数' },
        series: [{
          type: 'bar',
          data: byWeek.map((x) => x.count),
          itemStyle: { borderRadius: [6, 6, 0, 0], color: '#2c6e9e' },
          label: { show: true, position: 'top' }
        }]
      });
    }
    if (chartPersonRef.value) {
      const c = echarts.init(chartPersonRef.value);
      c.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '8%', right: '5%', bottom: '12%', containLabel: true },
        xAxis: { type: 'category', data: byPersonTop.map((x) => x.personName), axisLabel: { rotate: 15, fontSize: 11 } },
        yAxis: { type: 'value', name: '被查阅次数' },
        series: [{
          type: 'bar',
          data: byPersonTop.map((x) => x.count),
          itemStyle: { borderRadius: [6, 6, 0, 0], color: '#4f9da6' },
          label: { show: true, position: 'top' }
        }]
      });
    }
    if (chartStatusRef.value) {
      const c = echarts.init(chartStatusRef.value);
      c.setOption({
        tooltip: { trigger: 'item' },
        series: [{ type: 'pie', radius: '60%', data: [
          { name: '借阅中', value: byStatus.borrowing || 0 },
          { name: '逾期未还', value: byStatus.overdue || 0 },
          { name: '已归还', value: byStatus.returned || 0 }
        ]}]
      });
    }
  };

  watch(tab, (t) => { if (t === 'stats') nextTick(renderStats); });
  onMounted(() => { resetForm(); });
</script>

<style scoped>
  .page-head { margin-bottom: 16px; }
  .title { font-size: 18px; font-weight: 600; }
  .desc { font-size: 13px; color: #666; }
  .chart-box { height: 300px; width: 100%; }
  .stats-card {
    border: 1px solid #eef2f8;
    border-radius: 12px;
    padding: 12px 16px;
    background: #fff;
  }
  .stats-title { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
</style>
