<template>
  <div class="utilize-borrow-workspace">
    <utilize-records-panel ref="recordsRef">
      <template #extra>
        <span class="hrams-v2-filter-actions">
          <el-button type="primary" v-permission="'hrams:borrow:add'" @click="registerVisible = true">发起调阅</el-button>
        </span>
      </template>
    </utilize-records-panel>

    <el-dialog v-model="registerVisible" title="发起调阅" width="720px" destroy-on-close align-center>
      <utilize-register-form ref="registerFormRef" in-dialog @submitted="onRegistered" />
      <template #footer>
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button @click="registerFormRef?.resetForm?.()">重置</el-button>
        <el-button type="primary" v-permission="'hrams:borrow:add'" @click="registerFormRef?.submit?.()">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import UtilizeRegisterForm from './utilize-register-form.vue';
  import UtilizeRecordsPanel from './utilize-records-panel.vue';

  const recordsRef = ref(null);
  const registerFormRef = ref(null);
  const registerVisible = ref(false);

  const onRegistered = () => {
    registerVisible.value = false;
    recordsRef.value?.reloadRecords?.();
  };

  defineExpose({
    reloadRecords: () => recordsRef.value?.reloadRecords?.()
  });
</script>
