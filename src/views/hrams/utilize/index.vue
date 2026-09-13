<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page utilize-page">
      <el-tabs v-model="active">
        <el-tab-pane label="发起申请" name="apply">
          <div class="hrams-v2-card">
            <utilize-register-form @submitted="onSubmitted" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="待我审批" name="approve">
          <utilize-records-panel
            ref="approveRef"
            mode="approve"
            :fixed-query="{ approveStatus: 'pending' }"
          />
        </el-tab-pane>
        <el-tab-pane label="我的查阅" name="mine">
          <utilize-records-panel
            ref="mineRef"
            mode="mine"
            :fixed-query="{ utilizeType: 'electronic', mine: '1' }"
          />
        </el-tab-pane>
        <el-tab-pane label="纸质借还" name="paper">
          <utilize-records-panel
            ref="paperRef"
            mode="paper"
            :fixed-query="{ utilizeType: 'paper' }"
          />
        </el-tab-pane>
        <el-tab-pane label="利用台账" name="ledger">
          <utilize-records-panel ref="ledgerRef" mode="ledger" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </ele-page>
</template>

<script setup>
  import { onActivated, ref } from 'vue';
  import UtilizeRegisterForm from './components/utilize-register-form.vue';
  import UtilizeRecordsPanel from './components/utilize-records-panel.vue';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsUtilize' });

  const active = ref('apply');
  const approveRef = ref(null);
  const mineRef = ref(null);
  const paperRef = ref(null);
  const ledgerRef = ref(null);

  const reloadAll = () => {
    approveRef.value?.reloadRecords?.();
    mineRef.value?.reloadRecords?.();
    paperRef.value?.reloadRecords?.();
    ledgerRef.value?.reloadRecords?.();
  };

  const onSubmitted = () => {
    active.value = 'approve';
    reloadAll();
  };

  onActivated(reloadAll);
</script>
