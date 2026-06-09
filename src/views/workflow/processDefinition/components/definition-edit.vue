<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改流程' : '添加流程'"
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
      <el-form-item label="流程类别" prop="category">
        <category-select
          v-model="form.category"
          placeholder="请选择流程类别"
          value-type="string"
        />
      </el-form-item>
      <el-form-item label="流程编码" prop="flowCode">
        <el-input
          clearable
          v-model="form.flowCode"
          placeholder="请输入流程编码"
        />
      </el-form-item>
      <el-form-item label="流程名称" prop="flowName">
        <el-input
          clearable
          v-model="form.flowName"
          placeholder="请输入流程名称"
        />
      </el-form-item>
      <el-form-item label="表单路径" prop="formPath">
        <el-input
          clearable
          v-model="form.formPath"
          placeholder="请输入表单路径"
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
  import CategorySelect from '@/views/workflow/category/components/category-select.vue';
  import { addDefinition, updateDefinition } from '@/api/workflow/definition';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object,
    /** 流程分类id */
    categoryId: [Number, String]
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
    category:
      props.categoryId == null ? props.categoryId : String(props.categoryId),
    flowCode: '',
    flowName: '',
    formPath: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    category: [
      {
        required: true,
        message: '请选择流程类别',
        trigger: 'change'
      }
    ],
    flowCode: [
      {
        required: true,
        message: '请输入流程编码',
        trigger: 'blur'
      }
    ],
    flowName: [
      {
        required: true,
        message: '请输入流程名称',
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
      const saveOrUpdate = isUpdate.value ? updateDefinition : addDefinition;
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
