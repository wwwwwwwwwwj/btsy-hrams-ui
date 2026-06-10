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
      <el-col :span="12"><ele-card header="学历分布"><div ref="eduChartRef" class="chart-box" /></ele-card></el-col>
    </el-row>
    <ele-card header="近期提醒" style="margin-top:16px">
      <el-table :data="reminds">
        <el-table-column prop="remindType" label="类型" width="120" />
        <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
        <el-table-column prop="remindTime" label="时间" width="170" />
      </el-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import * as echarts from 'echarts';
  import { getDashboardSummary, getDashboardReminds } from '@/api/hrams/dashboard';

  defineOptions({ name: 'HramsDashboard' });
  const summary = ref({});
  const reminds = ref([]);
  const ageChartRef = ref(null);
  const eduChartRef = ref(null);

  const mapToChart = (obj) => Object.entries(obj || {}).map(([name, value]) => ({ name, value }));

  const renderCharts = () => {
    if (ageChartRef.value) {
      const c = echarts.init(ageChartRef.value);
      c.setOption({
        tooltip: { trigger: 'item' },
        series: [{ type: 'pie', radius: ['40%', '70%'], data: mapToChart(summary.value.ageChart) }]
      });
    }
    if (eduChartRef.value) {
      const c = echarts.init(eduChartRef.value);
      c.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: Object.keys(summary.value.educationChart || {}) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: Object.values(summary.value.educationChart || {}), itemStyle: { color: '#2c6e9e', borderRadius: [6, 6, 0, 0] } }]
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
</style>
