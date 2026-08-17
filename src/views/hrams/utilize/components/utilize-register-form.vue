<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" style="max-width:720px">
    <el-form-item label="档案编号" prop="archiveNo">
      <el-select
        v-model="form.archiveNo"
        filterable
        remote
        clearable
        allow-create
        default-first-option
        placeholder="输入档案编号模糊检索"
        :remote-method="searchByArchiveNo"
        :loading="lookupLoading"
        style="width:100%"
        @change="onArchiveNoChange"
      >
        <el-option
          v-for="p in archiveOptions"
          :key="p.id"
          :label="`${p.archiveNo} ${p.name || ''}`"
          :value="p.archiveNo"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="被查阅人" required>
      <el-select
        v-model="form.personName"
        filterable
        remote
        clearable
        allow-create
        default-first-option
        placeholder="输入姓名模糊检索"
        :remote-method="searchByName"
        :loading="lookupLoading"
        style="width:100%"
        @change="onPersonNameChange"
      >
        <el-option
          v-for="p in nameOptions"
          :key="p.id"
          :label="`${p.name}（${p.archiveNo || ''}）`"
          :value="p.name"
        />
      </el-select>
    </el-form-item>
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
  import { registerBorrowForm, searchBorrowPersons } from '@/api/hrams/borrow';
  import { listCategories } from '@/api/hrams/archive';
  import { formatLocalDateTime } from '@/utils/hrams-date';

  defineProps({
    inDialog: { type: Boolean, default: false }
  });

  const emit = defineEmits(['submitted']);
  const userStore = useUserStore();
  const formRef = ref(null);
  const form = ref({});
  const attachFile = ref(null);
  const scopeCategories = ref([]);
  const archiveOptions = ref([]);
  const nameOptions = ref([]);
  const lookupLoading = ref(false);
  let selectedPerson = null;

  const rules = {
    archiveNo: [{ required: true, message: '请输入档案编号', trigger: ['blur', 'change'] }],
    expectedReturn: [
      { required: true, message: '请选择预计归还时间', trigger: ['blur', 'change'] },
      { validator: (_rule, value, callback) => {
          if (value && form.value.borrowTime) {
            const returnDay = String(value).slice(0, 10);
            const borrowDay = String(form.value.borrowTime).slice(0, 10);
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
      personId: null,
      personName: '',
      archiveNo: '',
      borrowTime: formatLocalDateTime(),
      borrower: nick,
      borrowScope: 'full',
      scopeCategoryCodes: []
    };
    selectedPerson = null;
    scopeCategories.value = [];
    archiveOptions.value = [];
    nameOptions.value = [];
    attachFile.value = null;
    formRef.value?.clearValidate();
  };

  const applyPerson = async (person) => {
    selectedPerson = person || null;
    form.value.personId = person?.id || null;
    form.value.archiveNo = person?.archiveNo || form.value.archiveNo || '';
    form.value.personName = person?.name || form.value.personName || '';
    scopeCategories.value = [];
    if (!person?.id) return;
    try {
      const tree = await listCategories(person.id);
      scopeCategories.value = (tree || []).filter((c) => !c.parentCode || c.parentCode === '0');
    } catch {
      scopeCategories.value = [];
    }
  };

  const searchByArchiveNo = async (keyword) => {
    if (!keyword?.trim()) {
      archiveOptions.value = [];
      return;
    }
    lookupLoading.value = true;
    try {
      archiveOptions.value = await searchBorrowPersons({ archiveNo: keyword.trim() });
    } catch {
      archiveOptions.value = [];
    } finally {
      lookupLoading.value = false;
    }
  };

  const searchByName = async (keyword) => {
    if (!keyword?.trim()) {
      nameOptions.value = [];
      return;
    }
    lookupLoading.value = true;
    try {
      nameOptions.value = await searchBorrowPersons({ name: keyword.trim() });
    } catch {
      nameOptions.value = [];
    } finally {
      lookupLoading.value = false;
    }
  };

  const onArchiveNoChange = async (archiveNo) => {
    const hit = archiveOptions.value.find((p) => p.archiveNo === archiveNo);
    if (hit) {
      await applyPerson(hit);
      return;
    }
    form.value.personId = null;
    selectedPerson = null;
    if (archiveNo) {
      await searchByArchiveNo(archiveNo);
      const exact = archiveOptions.value.find((p) => p.archiveNo === archiveNo);
      if (exact) await applyPerson(exact);
    }
  };

  const onPersonNameChange = async (name) => {
    const hit = nameOptions.value.find((p) => p.name === name);
    if (hit) {
      await applyPerson(hit);
      return;
    }
    form.value.personId = null;
    selectedPerson = null;
    if (name) {
      await searchByName(name);
      const exact = nameOptions.value.find((p) => p.name === name);
      if (exact) await applyPerson(exact);
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
    let personId = form.value.personId || selectedPerson?.id || null;
    if (!personId) {
      try {
        const list = await searchBorrowPersons({
          archiveNo: form.value.archiveNo,
          name: form.value.personName || undefined
        });
        if (list.length === 1) {
          await applyPerson(list[0]);
          personId = list[0].id;
        } else if (list.length > 1) {
          return EleMessage.error({ message: '匹配到多人，请从下拉中选择具体人员', plain: true });
        } else {
          return EleMessage.error({ message: '未找到匹配人员，请检查档案编号或姓名', plain: true });
        }
      } catch (e) {
        return EleMessage.error({ message: e.message || '人员检索失败', plain: true });
      }
    }
    const { scopeCategoryCodes, personName, ...borrowFields } = form.value;
    const fd = toFormData({
      ...borrowFields,
      personId,
      file: attachFile.value
    });
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
