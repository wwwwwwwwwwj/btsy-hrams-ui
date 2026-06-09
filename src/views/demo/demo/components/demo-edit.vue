<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改测试单' : '添加测试单'"
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
      <el-form-item label="部门id" prop="deptId">
        <el-input clearable v-model="form.deptId" placeholder="请输入部门id" />
      </el-form-item>
      <el-form-item label="用户id" prop="userId">
        <el-input clearable v-model="form.userId" placeholder="请输入用户id" />
      </el-form-item>
      <el-form-item label="排序号" prop="orderNum">
        <el-input
          clearable
          v-model="form.orderNum"
          placeholder="请输入排序号"
        />
      </el-form-item>
      <el-form-item label="key键" prop="testKey">
        <el-input clearable v-model="form.testKey" placeholder="请输入key键" />
      </el-form-item>
      <el-form-item label="值" prop="value">
        <el-input clearable v-model="form.value" placeholder="请输入值" />
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
  import { addDemo, updateDemo } from '@/api/demo/demo';

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
    id: void 0,
    deptId: '',
    userId: '',
    orderNum: '',
    testKey: '',
    value: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    deptId: [
      {
        required: true,
        message: '请输入部门id',
        trigger: 'blur'
      }
    ],
    userId: [
      {
        required: true,
        message: '请输入用户id',
        trigger: 'blur'
      }
    ],
    orderNum: [
      {
        required: true,
        message: '请输入排序号',
        trigger: 'blur'
      }
    ],
    testKey: [
      {
        required: true,
        message: '请输入key键',
        trigger: 'blur'
      }
    ],
    value: [
      {
        required: true,
        message: '请输入值',
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
      const saveOrUpdate = isUpdate.value ? updateDemo : addDemo;
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
