<template>
  <el-form :model="form" label-width="110px" style="max-width:720px">
    <el-form-item label="档案编号" required>
      <el-input v-model="form.archiveNo" placeholder="输入后自动带出被查阅人" @blur="lookupPerson" />
    </el-form-item>
    <el-form-item label="被查阅人"><el-input :model-value="lookup.name" disabled /></el-form-item>
    <el-form-item label="借阅时间">
      <el-date-picker v-model="form.borrowTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
    </el-form-item>
    <el-form-item label="预计归还" required>
      <el-date-picker v-model="form.expectedReturn" type="date" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
    </el-form-item>
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
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { toFormData } from '@/utils/common';
  import { useUserStore } from '@/store/modules/user';
  import { registerBorrowForm, lookupBorrowPerson } from '@/api/hrams/borrow';
  import { listCategories } from '@/api/hrams/archive';

  const emit = defineEmits(['submitted']);
  const userStore = useUserStore();
  const form = ref({});
  const lookup = ref({});
  const attachFile = ref(null);
  const scopeCategories = ref([]);

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
    emit('submitted');
  };

  onMounted(resetForm);
</script>
