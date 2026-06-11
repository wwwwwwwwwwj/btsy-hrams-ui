<template>
  <ele-page hide-footer>
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6"><ele-card><div class="stat-title">在职</div><div class="stat-num">{{ summary.onJob ?? 0 }}</div></ele-card></el-col>
      <el-col :span="6"><ele-card><div class="stat-title">离职</div><div class="stat-num">{{ summary.leaveJob ?? 0 }}</div></ele-card></el-col>
      <el-col :span="6"><ele-card><div class="stat-title">退休</div><div class="stat-num">{{ summary.retired ?? 0 }}</div></ele-card></el-col>
      <el-col :span="6"><ele-card><div class="stat-title">本月归档材料</div><div class="stat-num">{{ summary.monthArchive ?? 0 }}</div></ele-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12"><ele-card header="年龄分布"><div ref="ageChartRef" class="chart-box" /></ele-card></el-col>
      <el-col :span="12"><ele-card header="档案状态分布"><div ref="statusChartRef" class="chart-box" /></ele-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <ele-card header="调阅概况">
          <div class="borrow-line">借出中：{{ summary.borrowSummary?.borrowing ?? 0 }}</div>
          <div class="borrow-line">已逾期：{{ summary.borrowSummary?.overdue ?? 0 }}</div>
          <div class="borrow-line">已归还：{{ summary.borrowSummary?.returned ?? 0 }}</div>
        </ele-card>
      </el-col>
      <el-col :span="12">
        <ele-card header="近期提醒">
          <el-table :data="reminds" size="small" max-height="280">
            <el-table-column prop="remindType" label="类型" width="100" />
            <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
            <el-table-column prop="remindTime" label="时间" width="160" />
          </el-table>
        </ele-card>
      </el-col>
    </el-row>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import * as echarts from 'echarts';
  import { getDashboardSummary, getDashboardReminds } from '@/api/hrams/dashboard';
  import { useDictData } from '@/utils/use-dict-data';

  const [archiveStatusDict] = useDictData(['hrams_archive_status']);

  defineOptions({ name: 'HramsDashboard' });
  const summary = ref({});
  const reminds = ref([]);
  const ageChartRef = ref(null);
  const statusChartRef = ref(null);

  const statusLabel = (code) =>
    archiveStatusDict.value?.find((d) => d.value === code)?.label || code || '未知';

  const mapToChart = (obj, labelFn) =>
    Object.entries(obj || {}).map(([name, value]) => ({
      name: labelFn ? labelFn(name) : name,
      value
    }));

  const renderCharts = () => {
    if (ageChartRef.value) {
      const c = echarts.init(ageChartRef.value);
      c.setOption({
        tooltip: { trigger: 'item' },
        series: [{ type: 'pie', radius: ['40%', '70%'], data: mapToChart(summary.value.ageChart) }]
      });
    }
    if (statusChartRef.value) {
      const c = echarts.init(statusChartRef.value);
      const chart = summary.value.archiveStatusChart || {};
      c.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: Object.keys(chart).map(statusLabel) },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{ type: 'bar', data: Object.values(chart), itemStyle: { color: '#2c6e9e', borderRadius: [6, 6, 0, 0] } }]
      });
    }
  };

  onMounted(async () => {
    summary.value = await getDashboardSummary();
    reminds.value = await getDashboardReminds();
    renderCharts();
  });
</script>

<style scoped>
  .stat-title { color: #666; font-size: 14px; }
  .stat-num { font-size: 32px; font-weight: 700; margin-top: 8px; }
  .chart-box { height: 280px; width: 100%; }
  .borrow-line { line-height: 2; font-size: 14px; }
</style>
