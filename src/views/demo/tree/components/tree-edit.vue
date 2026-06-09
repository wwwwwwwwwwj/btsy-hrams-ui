<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改测试树' : '添加测试树'"
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
      <el-form-item label="父id" prop="parentId">
        <tree-select v-model="form.parentId" placeholder="请选择父id" />
      </el-form-item>
      <el-form-item label="部门id" prop="deptId">
        <el-input clearable v-model="form.deptId" placeholder="请输入部门id" />
      </el-form-item>
      <el-form-item label="用户id" prop="userId">
        <el-input clearable v-model="form.userId" placeholder="请输入用户id" />
      </el-form-item>
      <el-form-item label="树节点名" prop="treeName">
        <el-input
          clearable
          v-model="form.treeName"
          placeholder="请输入树节点名"
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
  import TreeSelect from './tree-select.vue';
  import { addTree, updateTree } from '@/api/demo/tree';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object,
    /** 上级id */
    parentId: [Number, String]
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
    parentId: props.parentId,
    deptId: '',
    userId: '',
    treeName: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    parentId: [
      {
        required: true,
        message: '请选择父id',
        trigger: 'change'
      }
    ],
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
    treeName: [
      {
        required: true,
        message: '请输入树节点名',
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
      const saveOrUpdate = isUpdate.value ? updateTree : addTree;
      saveOrUpdate({ ...form, parentId: form.parentId || 0 })
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
    assignFields({
      ...props.data,
      parentId: props.data.parentId || void 0
    });
    isUpdate.value = true;
  }
</script>
