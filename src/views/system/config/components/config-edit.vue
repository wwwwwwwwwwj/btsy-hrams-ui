<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改参数' : '添加参数'"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @submit.prevent=""
    >
      <el-form-item label="参数名称" prop="configName">
        <el-input
          clearable
          v-model="form.configName"
          placeholder="请输入参数名称"
        />
      </el-form-item>
      <el-form-item label="参数键名" prop="configKey">
        <el-input
          clearable
          v-model="form.configKey"
          placeholder="请输入参数键名"
        />
      </el-form-item>
      <el-form-item label="参数键值" prop="configValue">
        <el-input
          clearable
          v-model="form.configValue"
          placeholder="请输入参数键值"
        />
      </el-form-item>
      <el-form-item label="系统内置" prop="configType">
        <dict-data code="sys_yes_no" type="radio" v-model="form.configType" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          :rows="4"
          type="textarea"
          v-model="form.remark"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <btn-items
        :items="[
          { preset: 'cancel', onClick: () => handleCancel() },
          { preset: 'save', onClick: () => handleSave() }
        ]"
      />
    </template>
  </ele-modal>
</template>

<script setup>
  import { ref, reactive } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import { addConfig, updateConfig } from '@/api/system/config';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object
  });

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 是否是修改 */
  const isUpdate = ref(false);

  /** 提交状态 */
  const loading = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const [form, _resetFields, assignFields] = useFormData({
    configId: void 0,
    configName: '',
    configKey: '',
    configValue: '',
    configType: 'Y',
    remark: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    configName: [
      {
        required: true,
        message: '请输入参数名称',
        type: 'string',
        trigger: 'blur'
      }
    ],
    configKey: [
      {
        required: true,
        message: '请输入参数键名',
        type: 'string',
        trigger: 'blur'
      }
    ],
    configValue: [
      {
        required: true,
        message: '请输入参数键值',
        type: 'string',
        trigger: 'blur'
      }
    ]
  });

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 保存编辑 */
  const handleSave = () => {
    formRef.value?.validate?.((valid) => {
      if (!valid) {
        return;
      }
      loading.value = true;
      const saveOrUpdate = isUpdate.value ? updateConfig : addConfig;
      saveOrUpdate(form)
        .then((msg) => {
          loading.value = false;
          EleMessage.success({ message: msg, plain: true });
          emit('done');
          handleCancel();
        })
        .catch((e) => {
          loading.value = false;
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 修改赋值 */
  if (props.data) {
    assignFields(props.data);
    isUpdate.value = true;
  }
</script>
