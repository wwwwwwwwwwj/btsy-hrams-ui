<template>
  <div>
    <el-button v-permission="'hrams:borrow:export'" class="export-btn" @click="exportStats">导出统计 Excel</el-button>
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
  </div>
</template>

<script setup>
  import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
  import * as echarts from 'echarts';
  import { borrowStatistics, exportBorrowStatistics } from '@/api/hrams/borrow';

  const chartTimeRef = ref(null);
  const chartPersonRef = ref(null);
  const chartStatusRef = ref(null);
  const charts = [];
  let renderGeneration = 0;

  const exportStats = () => exportBorrowStatistics('month');

  const resizeCharts = () => charts.forEach((c) => c?.resize());

  const disposeCharts = () => {
    charts.forEach((c) => c?.dispose());
    charts.length = 0;
  };

  const renderStats = async () => {
    const gen = ++renderGeneration;
    disposeCharts();
    const data = await borrowStatistics('month');
    if (gen !== renderGeneration) {
      return;
    }
    const byStatus = data.byStatus || {};
    const byWeek = data.byWeek || [];
    const byPersonTop = data.byPersonTop || [];

    if (chartTimeRef.value) {
      const c = echarts.init(chartTimeRef.value);
      charts.push(c);
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
      charts.push(c);
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
      charts.push(c);
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

  onMounted(() => {
    nextTick(renderStats);
    window.addEventListener('resize', resizeCharts);
  });

  onBeforeUnmount(() => {
    renderGeneration += 1;
    window.removeEventListener('resize', resizeCharts);
    disposeCharts();
  });

  defineExpose({ renderStats });
</script>

<style scoped>
  .export-btn { margin-bottom: 12px; }
  .chart-box { height: 300px; width: 100%; }
  .stats-card {
    border: 1px solid #eef2f8;
    border-radius: 12px;
    padding: 12px 16px;
    background: #fff;
  }
  .stats-title { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
</style>
