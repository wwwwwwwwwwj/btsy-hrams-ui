<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-card utilize-card">
        <div v-if="!singleMode" class="page-head">
          <div><div class="title">档案利用</div><div class="desc">调阅登记 · 调阅记录 · 台账统计</div></div>
        </div>
        <el-tabs v-model="tab" :class="{ 'tabs-single': singleMode }">
          <el-tab-pane label="调阅登记" name="register">
            <utilize-register-form @submitted="onRegistered" />
          </el-tab-pane>
          <el-tab-pane label="调阅记录" name="records">
            <utilize-records-panel ref="recordsRef" />
          </el-tab-pane>
          <el-tab-pane label="台账统计" name="stats">
            <utilize-stats-panel ref="statsRef" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { computed, nextTick, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { HRAMS_UTILIZE_RECORDS } from '@/utils/hrams-routes';
  import UtilizeRegisterForm from './components/utilize-register-form.vue';
  import UtilizeRecordsPanel from './components/utilize-records-panel.vue';
  import UtilizeStatsPanel from './components/utilize-stats-panel.vue';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsUtilize' });
  const route = useRoute();
  const router = useRouter();
  const recordsRef = ref(null);
  const statsRef = ref(null);

  const resolveTab = () => {
    const t = route.query.tab;
    if (t === 'records' || t === 'stats' || t === 'register') return t;
    return 'register';
  };
  const singleMode = computed(() => !!route.query.tab);
  const tab = ref(resolveTab());

  const onRegistered = () => {
    if (singleMode.value) {
      router.push(`${HRAMS_UTILIZE_RECORDS}?tab=records`);
    } else {
      tab.value = 'records';
      nextTick(() => recordsRef.value?.reloadRecords?.());
    }
  };

  watch(tab, (t) => {
    if (t === 'stats') nextTick(() => statsRef.value?.renderStats?.());
    if (t === 'records') nextTick(() => recordsRef.value?.reloadRecords?.());
  });
  watch(
    () => route.query.tab,
    () => {
      tab.value = resolveTab();
      if (tab.value === 'stats') nextTick(() => statsRef.value?.renderStats?.());
      if (tab.value === 'records') nextTick(() => recordsRef.value?.reloadRecords?.());
    }
  );
</script>

<style scoped>
  .tabs-single :deep(.el-tabs__header) { display: none; }
  .utilize-card { padding: 20px 24px; }
  .page-head { margin-bottom: 16px; }
  .title { font-size: 18px; font-weight: 600; }
  .desc { font-size: 13px; color: #666; }
</style>
