<template>
  <ele-modal :form="true" :width="720" :title="isUpdate ? '编辑人员' : '新增人员'" :loading="loading" v-bind="modalProps">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" @submit.prevent="">
      <el-form-item v-if="isUpdate" label="档案编号"><el-input :model-value="form.archiveNo" disabled /></el-form-item>
      <el-form-item label="身份证号" prop="idCard">
        <el-input
          v-model="form.idCard"
          maxlength="18"
          placeholder="请输入身份证号"
          @blur="fillFromIdCard"
        />
      </el-form-item>
      <el-form-item label="姓名" prop="name"><el-input v-model="form.name" placeholder="请输入姓名" /></el-form-item>
      <el-form-item label="性别">
        <dict-data v-model="form.gender" code="hrams_gender" type="select" placeholder="请选择性别" style="width:100%" />
      </el-form-item>
      <el-form-item label="出生日期"><el-date-picker v-model="form.birthDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="民族">
        <dict-data v-model="form.nation" code="hrams_nation" type="select" placeholder="请选择民族" filterable style="width:100%" />
      </el-form-item>
      <el-form-item label="籍贯"><el-input v-model="form.nativePlace" placeholder="省/市" /></el-form-item>
      <el-form-item label="政治面貌">
        <dict-data v-model="form.politicalStatus" code="hrams_political_status" type="select" placeholder="请选择政治面貌" filterable style="width:100%" />
      </el-form-item>
      <el-form-item label="学历">
        <dict-data v-model="form.education" code="hrams_education" type="select" placeholder="请选择学历" style="width:100%" />
      </el-form-item>
      <el-form-item label="专业"><el-input v-model="form.major" placeholder="请输入专业" /></el-form-item>
      <el-form-item label="所在部门">
        <dept-select v-model="selectedDeptId" placeholder="请选择所在部门" />
      </el-form-item>
      <el-form-item label="职务"><el-input v-model="form.duty" placeholder="请输入职务" /></el-form-item>
      <el-form-item label="参加工作时间"><el-date-picker v-model="form.workStartDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="合同到期日"><el-date-picker v-model="form.contractEndDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="计划退休日期"><el-date-picker v-model="form.planRetireDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="人员状态" prop="personStatus">
        <dict-data v-model="form.personStatus" code="hrams_person_status" type="select" placeholder="请选择人员状态" style="width:100%" />
      </el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
    </el-form>
    <template #footer>
      <btn-items :items="[
        { preset: 'cancel', onClick: () => closeModal() },
        { preset: 'save', onClick: () => handleSave() }
      ]" />
    </template>
  </ele-modal>
</template>

<script setup>
  import { reactive, ref, watch } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import DictData from '@/components/DictData/index.vue';
  import DeptSelect from '@/views/system/dept/components/dept-select.vue';
  import { listDept } from '@/api/system/dept';
  import { addPerson, updatePerson, getPerson } from '@/api/hrams/person';
  import { parseIdCardInfo } from '@/utils/hrams-id-card';

  const props = defineProps({ data: Object, onDone: Function });
  const { modalProps, closeModal } = useModal();
  const isUpdate = ref(false);
  const loading = ref(false);
  const formRef = ref(null);
  const form = ref({});
  const selectedDeptId = ref();
  const deptList = ref([]);

  const deptNameById = (id) => {
    if (id == null || id === '') return '';
    const row = deptList.value.find((d) => String(d.deptId) === String(id));
    return row?.deptName ?? '';
  };

  const syncDeptIdFromName = () => {
    const name = form.value.deptName;
    if (!name) {
      selectedDeptId.value = undefined;
      return;
    }
    const row = deptList.value.find((d) => d.deptName === name);
    selectedDeptId.value = row?.deptId;
  };

  listDept()
    .then((data) => {
      deptList.value = data || [];
      syncDeptIdFromName();
    })
    .catch((e) => EleMessage.error({ message: e.message, plain: true }));

  watch(selectedDeptId, (id) => {
    form.value.deptName = deptNameById(id);
  });

  const idCardRule = (_r, v, cb) => {
    if (!v) return cb();
    if (!/^\d{17}[\dXx]$/.test(v)) return cb(new Error('身份证号格式不正确'));
    cb();
  };

  const rules = reactive({
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    personStatus: [{ required: true, message: '请选择人员状态', trigger: 'change' }],
    idCard: [
      { required: true, message: '请输入身份证号', trigger: 'blur' },
      { validator: idCardRule, trigger: 'blur' }
    ]
  });

  const loadPerson = async (id) => {
    const p = await getPerson(id);
    form.value = { ...p };
    syncDeptIdFromName();
    isUpdate.value = true;
  };

  watch(() => props.data, async (d) => {
    if (d?.id) {
      await loadPerson(d.id);
    } else {
      form.value = { personStatus: '在职', ...(d || {}) };
      selectedDeptId.value = undefined;
      syncDeptIdFromName();
      isUpdate.value = false;
    }
  }, { immediate: true });

  const fillFromIdCard = () => {
    const parsed = parseIdCardInfo(form.value.idCard);
    if (!parsed) return;
    form.value.birthDate = parsed.birthDate;
    form.value.gender = parsed.gender;
  };

  const handleSave = () => {
    formRef.value?.validate?.(async (valid) => {
      if (!valid) return;
      loading.value = true;
      const payload = { ...form.value };
      try {
        if (isUpdate.value) await updatePerson(payload);
        else await addPerson(payload);
        EleMessage.success({ message: '保存成功', plain: true });
        props.onDone?.();
        closeModal();
      } catch (e) {
        EleMessage.error({ message: e.message, plain: true });
      } finally {
        loading.value = false;
      }
    });
  };
</script>
