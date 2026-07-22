<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" style="max-width:720px">
    <el-form-item label="档案编号" prop="archiveNo">
      <el-input v-model="form.archiveNo" placeholder="输入后自动带出被查阅人" @blur="lookupPerson" />
    </el-form-item>
    <el-form-item label="被查阅人"><el-input :model-value="lookup.name" disabled /></el-form-item>
    <el-form-item label="借阅时间" prop="borrowTime">
      <el-date-picker v-model="form.borrowTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
    </el-form-item>
    <el-form-item label="预计归还" prop="expectedReturn">
      <el-date-picker v-model="form.expectedReturn" type="date" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
    </el-form-item>
    <el-form-item label="借阅人" prop="borrower">
      <el-input v-model="form.borrower" />
    </el-form-item>
    <el-form-item label="借阅事由" prop="reason">
      <el-input v-model="form.reason" type="textarea" />
    </el-form-item>
    <el-form-item label="调阅范围" prop="borrowScope">
      <el-radio-group v-model="form.borrowScope">
        <el-radio value="full">整卷</el-radio>
        <el-radio value="partial">指定大类</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="form.borrowScope === 'partial'" label="借阅大类" prop="scopeCategoryCodes">
      <el-select v-model="form.scopeCategoryCodes" multiple placeholder="选择十大类" style="width:100%">
        <el-option v-for="c in scopeCategories" :key="c.code" :label="`${c.name}(${c.code})`" :value="c.code" />
      </el-select>
    </el-form-item>
    <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
    <el-form-item label="申请表"><input type="file" accept=".pdf,.jpg,.jpeg" @change="onFile" /></el-form-item>
    <el-form-item v-if="!inDialog">
      <el-button @click="resetForm">重置</el-button>
      <el-button type="primary" v-permission="'hrams:borrow:add'" @click="submit">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
  import { onMounted, ref, watch } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { toFormData } from '@/utils/common';
  import { useUserStore } from '@/store/modules/user';
  import { registerBorrowForm, lookupBorrowPerson } from '@/api/hrams/borrow';
  import { listCategories } from '@/api/hrams/archive';

  defineProps({
    inDialog: { type: Boolean, default: false }
  });

  const emit = defineEmits(['submitted']);
  const userStore = useUserStore();
  const formRef = ref(null);
  const form = ref({});
  const lookup = ref({});
  const attachFile = ref(null);
  const scopeCategories = ref([]);

  const rules = {
    archiveNo: [{ required: true, message: '请输入档案编号', trigger: ['blur', 'change'] }],
    expectedReturn: [
      { required: true, message: '请选择预计归还时间', trigger: ['blur', 'change'] },
      { validator: (_rule, value, callback) => {
          if (value && form.value.borrowTime) {
            const returnDay = new Date(value).toISOString().slice(0, 10);
            const borrowDay = new Date(form.value.borrowTime).toISOString().slice(0, 10);
            if (returnDay < borrowDay) {
              callback(new Error('预计归还时间必须大于借阅时间'));
            } else {
              callback();
            }
          } else {
            callback();
          }
        }, trigger: ['blur', 'change'] }
    ],
    borrower: [{ required: true, message: '请填写借阅人', trigger: ['blur', 'change'] }],
    reason: [{ required: true, message: '请填写借阅事由', trigger: ['blur', 'change'] }],
    borrowScope: [{ required: true, message: '请选择调阅范围', trigger: ['blur', 'change'] }],
    scopeCategoryCodes: [{ required: true, message: '请至少选择一个大类', trigger: ['blur', 'change'] }]
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
    formRef.value?.clearValidate();
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
    // 双重校验：先走 el-form validate，再手动兜底必填字段
    let passed = true;
    try {
      const result = await formRef.value?.validate();
      passed = result !== false;
    } catch {
      passed = false;
    }
    if (!passed) return;

    const f = form.value;
    const emptyMsg = (label) => EleMessage.warning({ message: `请填写${label}`, plain: true });
    if (!f.archiveNo?.trim()) return emptyMsg('档案编号');
    if (!f.borrower?.trim()) return emptyMsg('借阅人');
    if (!f.reason?.trim()) return emptyMsg('借阅事由');
    if (!f.expectedReturn) return emptyMsg('预计归还时间');
    if (f.borrowScope === 'partial' && (!f.scopeCategoryCodes || f.scopeCategoryCodes.length === 0)) {
      return EleMessage.warning({ message: '指定大类调阅须选择至少一个大类', plain: true });
    }

    const { scopeCategoryCodes, ...borrowFields } = f;
    const fd = toFormData({ ...borrowFields, file: attachFile.value });
    (scopeCategoryCodes || []).forEach((c) => fd.append('scopeCategoryCodes', c));
    try {
      await registerBorrowForm(fd);
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
      return;
    }
    EleMessage.success({ message: '登记成功', plain: true });
    resetForm();
    emit('submitted');
  };

  watch(() => form.value.borrowTime, () => {
    if (form.value.expectedReturn) {
      formRef.value?.validateField('expectedReturn');
    }
  });

  onMounted(resetForm);

  defineExpose({ submit, resetForm });
</script>
