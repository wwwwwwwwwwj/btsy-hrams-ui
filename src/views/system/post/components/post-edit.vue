<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改岗位' : '添加岗位'"
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
      <el-form-item label="岗位名称" prop="postName">
        <el-input
          clearable
          v-model="form.postName"
          placeholder="请输入岗位名称"
        />
      </el-form-item>
      <el-form-item label="部门" prop="deptId">
        <dept-select v-model="form.deptId" placeholder="请选择部门" />
      </el-form-item>
      <el-form-item label="岗位编码" prop="postCode">
        <el-input
          clearable
          v-model="form.postCode"
          placeholder="请输入岗位编码"
        />
      </el-form-item>
      <el-form-item label="类别编码" prop="postCategory">
        <el-input
          clearable
          v-model="form.postCategory"
          placeholder="请输入类别编码"
        />
      </el-form-item>
      <el-form-item label="岗位排序" prop="postSort">
        <el-input-number
          :min="0"
          :max="99999"
          v-model="form.postSort"
          placeholder="请输入岗位排序"
          controls-position="right"
          class="ele-fluid"
        />
      </el-form-item>
      <el-form-item label="岗位状态" prop="status">
        <dict-data
          code="sys_normal_disable"
          type="radio"
          v-model="form.status"
        />
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
  import DeptSelect from '../../dept/components/dept-select.vue';
  import { addPost, updatePost } from '@/api/system/post';

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
    postId: void 0,
    postName: '',
    deptId: void 0,
    postCode: '',
    postSort: 0,
    status: '0',
    remark: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    postName: [
      {
        required: true,
        message: '请输入岗位名称',
        type: 'string',
        trigger: 'blur'
      }
    ],
    deptId: [
      {
        required: true,
        message: '请选择部门',
        trigger: 'blur'
      }
    ],
    postCode: [
      {
        required: true,
        message: '请输入岗位编码',
        type: 'string',
        trigger: 'blur'
      }
    ],
    postSort: [
      {
        required: true,
        message: '请输入岗位排序',
        type: 'number',
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
      const saveOrUpdate = isUpdate.value ? updatePost : addPost;
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
