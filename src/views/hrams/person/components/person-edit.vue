<template>
  <ele-modal :form="true" :width="640" :title="isUpdate ? '编辑人员' : '新增人员'" :loading="loading" v-bind="modalProps">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent="">
      <el-form-item v-if="isUpdate" label="档案编号"><el-input :model-value="form.archiveNo" disabled /></el-form-item>
      <el-form-item label="姓名" prop="name"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="性别">
        <el-select v-model="form.gender" style="width:100%"><el-option label="男" value="男" /><el-option label="女" value="女" /></el-select>
      </el-form-item>
      <el-form-item label="出生年月"><el-date-picker v-model="form.birthDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="民族"><el-input v-model="form.nation" /></el-form-item>
      <el-form-item label="政治面貌"><el-input v-model="form.politicalStatus" /></el-form-item>
      <el-form-item label="身份证号" prop="idCard"><el-input v-model="form.idCard" maxlength="18" /></el-form-item>
      <el-form-item label="部门"><el-input v-model="form.deptName" /></el-form-item>
      <el-form-item label="职务"><el-input v-model="form.duty" /></el-form-item>
      <el-form-item label="参加工作时间"><el-date-picker v-model="form.workStartDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="人员状态" prop="personStatus">
        <el-select v-model="form.personStatus" style="width:100%">
          <el-option label="在职" value="在职" /><el-option label="离职" value="离职" /><el-option label="退休" value="退休" />
        </el-select>
      </el-form-item>
      <el-form-item label="合同到期"><el-date-picker v-model="form.contractEndDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="计划退休"><el-date-picker v-model="form.planRetireDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      <el-divider v-if="fieldDefs.length">扩展字段</el-divider>
      <el-form-item v-for="f in fieldDefs" :key="f.fieldKey" :label="f.fieldLabel">
        <el-date-picker v-if="f.fieldType === 'date'" v-model="customFields[f.fieldKey]" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        <el-input v-else v-model="customFields[f.fieldKey]" />
      </el-form-item>
      <el-form-item>
        <el-button link type="primary" @click="showAddField = true">+ 新增自定义字段</el-button>
      </el-form-item>
    </el-form>
    <el-dialog v-model="showAddField" title="新增自定义字段" width="400px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="newField.fieldLabel" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newField.fieldType"><el-option label="文本" value="text" /><el-option label="日期" value="date" /></el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddField=false">取消</el-button>
        <el-button type="primary" @click="createField">确定</el-button>
      </template>
    </el-dialog>
    <template #footer>
      <btn-items :items="[
        { preset: 'cancel', onClick: () => closeModal() },
        { preset: 'save', onClick: () => handleSave() }
      ]" />
    </template>
  </ele-modal>
</template>

<script setup>
  import { onMounted, reactive, ref, watch } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { addPerson, updatePerson, getPerson, listPersonFieldDefs, addPersonFieldDef } from '@/api/hrams/person';

  const props = defineProps({ data: Object, onDone: Function });
  const { modalProps, closeModal } = useModal();
  const isUpdate = ref(false);
  const loading = ref(false);
  const formRef = ref(null);
  const form = ref({});
  const customFields = ref({});
  const fieldDefs = ref([]);
  const showAddField = ref(false);
  const newField = ref({ fieldLabel: '', fieldType: 'text' });

  const idCardRule = (_r, v, cb) => {
    if (!v) return cb();
    if (!/^\d{17}[\dXx]$/.test(v)) return cb(new Error('身份证号格式不正确'));
    cb();
  };

  const rules = reactive({
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    personStatus: [{ required: true, message: '请选择人员状态', trigger: 'change' }],
    idCard: [{ validator: idCardRule, trigger: 'blur' }]
  });

  const loadDefs = async () => { fieldDefs.value = await listPersonFieldDefs(); };

  const loadPerson = async (id) => {
    const p = await getPerson(id);
    form.value = { ...p };
    customFields.value = { ...(p.customFields || {}) };
    isUpdate.value = true;
  };

  watch(() => props.data, async (d) => {
    await loadDefs();
    if (d?.id) {
      await loadPerson(d.id);
    } else {
      form.value = { personStatus: '在职', ...(d || {}) };
      customFields.value = {};
      isUpdate.value = false;
    }
  }, { immediate: true });

  const createField = async () => {
    await addPersonFieldDef(newField.value);
    showAddField.value = false;
    newField.value = { fieldLabel: '', fieldType: 'text' };
    await loadDefs();
    EleMessage.success({ message: '字段已添加', plain: true });
  };

  const handleSave = () => {
    formRef.value?.validate?.(async (valid) => {
      if (!valid) return;
      loading.value = true;
      const payload = { ...form.value, customFields: customFields.value };
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

  onMounted(loadDefs);
</script>
