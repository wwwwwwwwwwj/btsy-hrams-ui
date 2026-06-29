<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page dashboard-page">
      <div class="stats-grid">
        <div class="hrams-v2-card stat-card">
          <div class="stat-title">在职人数</div>
          <div class="stat-num">{{ summary.onJob ?? 0 }}</div>
          <div class="stat-desc">当前在职干部总数</div>
        </div>
        <div class="hrams-v2-card stat-card">
          <div class="stat-title">离职人数</div>
          <div class="stat-num">{{ summary.leaveJob ?? 0 }}</div>
          <div class="stat-desc">历史离职干部</div>
        </div>
        <div class="hrams-v2-card stat-card">
          <div class="stat-title">退休人数</div>
          <div class="stat-num">{{ summary.retired ?? 0 }}</div>
          <div class="stat-desc">已办理退休</div>
        </div>
        <div class="hrams-v2-card stat-card">
          <div class="stat-title">本月新增档案材料</div>
          <div class="stat-num">{{ summary.monthArchive ?? 0 }}</div>
          <div class="stat-desc">本自然月入库有效材料</div>
        </div>
      </div>

      <div class="charts-row">
        <div class="hrams-v2-card chart-card">
          <div class="chart-title">干部年龄段统计图</div>
          <div ref="ageChartRef" class="chart-box" />
        </div>
        <div class="hrams-v2-card chart-card">
          <div class="chart-title">干部学历分布图</div>
          <div ref="eduChartRef" class="chart-box" />
        </div>
      </div>

      <div class="hrams-v2-card stats-footer">
        <div>
          <span class="footer-title">本月档案利用台账</span>
          <span>借阅中: {{ summary.borrowSummary?.borrowing ?? 0 }}卷</span>
          <span class="divider">|</span>
          <span>逾期未还: {{ summary.borrowSummary?.overdue ?? 0 }}卷</span>
          <span class="divider">|</span>
          <span>已完成归还: {{ summary.borrowSummary?.returned ?? 0 }}卷</span>
        </div>
        <span class="badge">实时统计</span>
      </div>

      <div class="hrams-v2-card remind-card">
        <div class="chart-title">近期提醒</div>
        <el-table :data="summary.recentReminds || []" size="small" border empty-text="暂无提醒">
          <el-table-column prop="remindTime" label="时间" width="170" />
          <el-table-column prop="remindType" label="类型" width="120" />
          <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
        </el-table>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue';
  import * as echarts from 'echarts';
  import { getDashboardSummary } from '@/api/hrams/dashboard';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsDashboard' });
  const summary = ref({});
  const ageChartRef = ref(null);
  const eduChartRef = ref(null);
  let ageChart;
  let eduChart;
  let chartMounted = false;

  const mapToChart = (obj) =>
    Object.entries(obj || {}).map(([name, value]) => ({
      name,
      value
    }));

  const resizeCharts = () => {
    ageChart?.resize();
    eduChart?.resize();
  };

  const renderCharts = () => {
    if (ageChartRef.value) {
      ageChart?.dispose();
      ageChart = echarts.init(ageChartRef.value);
      const chart = summary.value.ageChart || {};
      const keys = Object.keys(chart);
      ageChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '8%', right: '5%', top: '15%', bottom: '8%', containLabel: true },
        xAxis: { type: 'category', data: keys },
        yAxis: { type: 'value', minInterval: 1, name: '人数' },
        graphic: keys.length
          ? undefined
          : [{ type: 'text', left: 'center', top: 'middle', style: { text: '暂无数据', fill: '#999', fontSize: 14 } }],
        series: [{
          name: '干部数量',
          type: 'bar',
          data: Object.values(chart),
          itemStyle: { color: '#397faa', borderRadius: [8, 8, 0, 0] },
          label: { show: true, position: 'top', fontWeight: 'bold' }
        }]
      });
    }
    if (eduChartRef.value) {
      eduChart?.dispose();
      eduChart = echarts.init(eduChartRef.value);
      const pieData = mapToChart(summary.value.educationChart);
      eduChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {d}% ({c}人)' },
        legend: { orient: 'vertical', left: 'left', textStyle: { fontSize: 12 } },
        graphic: pieData.length
          ? undefined
          : [{ type: 'text', left: 'center', top: 'middle', style: { text: '暂无数据', fill: '#999', fontSize: 14 } }],
        series: [{
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '55%'],
          data: pieData,
          label: { show: true, formatter: '{b}: {d}%', fontSize: 11 }
        }]
      });
    }
  };

  onMounted(async () => {
    chartMounted = true;
    summary.value = await getDashboardSummary();
    if (!chartMounted) {
      return;
    }
    renderCharts();
    window.addEventListener('resize', resizeCharts);
  });

  onBeforeUnmount(() => {
    chartMounted = false;
    window.removeEventListener('resize', resizeCharts);
    ageChart?.dispose();
    eduChart?.dispose();
    ageChart = undefined;
    eduChart = undefined;
  });
</script>

<style scoped>
  .dashboard-page {
    overflow-y: auto;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 28px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-title {
    margin-bottom: 12px;
    font-size: 14px;
    color: #6c7a91;
  }

  .stat-num {
    font-size: 38px;
    font-weight: 700;
    line-height: 1.2;
    color: #1e2f41;
  }

  .stat-desc {
    margin-top: 6px;
    font-size: 12px;
    color: #8a99b0;
  }

  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }

  .chart-card,
  .remind-card {
    display: flex;
    flex-direction: column;
    padding: 20px 18px 14px;
  }

  .remind-card {
    margin-bottom: 24px;
  }

  .chart-title {
    padding-left: 10px;
    margin-bottom: 14px;
    font-size: 16px;
    font-weight: 600;
    border-left: 4px solid #2c6e9e;
  }

  .chart-box {
    width: 100%;
    height: 320px;
  }

  .stats-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    margin-bottom: 24px;
  }

  .footer-title {
    margin-right: 16px;
    font-weight: 600;
  }

  .divider {
    margin: 0 12px;
    color: #c6d2df;
  }

  .badge {
    padding: 4px 12px;
    font-size: 12px;
    color: #2c6e9e;
    background: #ecf5fc;
    border-radius: 30px;
  }
</style>
