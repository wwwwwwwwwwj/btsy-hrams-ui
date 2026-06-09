<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改部门' : '添加部门'"
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
      <el-form-item label="上级部门" prop="parentId">
        <dept-select v-model="form.parentId" placeholder="请选择上级部门" />
      </el-form-item>
      <el-form-item label="部门名称" prop="deptName">
        <el-input
          clearable
          v-model="form.deptName"
          placeholder="请输入部门名称"
        />
      </el-form-item>
      <el-form-item label="类别编码" prop="deptCategory">
        <el-input
          clearable
          v-model="form.deptCategory"
          placeholder="请输入类别编码"
        />
      </el-form-item>
      <el-form-item label="显示排序" prop="orderNum">
        <el-input-number
          :min="0"
          :max="99999"
          v-model="form.orderNum"
          placeholder="请输入显示排序"
          controls-position="right"
          class="ele-fluid"
        />
      </el-form-item>
      <el-form-item label="负责人" prop="leader">
        <el-input
          clearable
          :maxlength="20"
          v-model="form.leader"
          placeholder="请输入负责人"
        />
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input
          clearable
          v-model="form.phone"
          placeholder="请输入联系电话"
          :maxlength="11"
        />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input
          clearable
          v-model="form.email"
          placeholder="请输入邮箱"
          :maxlength="50"
        />
      </el-form-item>
      <el-form-item label="部门状态" prop="status">
        <dict-data
          code="sys_normal_disable"
          type="radio"
          v-model="form.status"
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
  import { EleMessage, useModal, emailReg, phoneReg } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import DeptSelect from './dept-select.vue';
  import { addDept, updateDept } from '@/api/system/dept';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object,
    /** 上级部门id */
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
    deptId: void 0,
    parentId: props.parentId,
    deptName: '',
    deptCategory: '',
    orderNum: 0,
    leader: '',
    phone: '',
    email: '',
    status: '0'
  });

  /** 表单验证规则 */
  const rules = reactive({
    deptName: [
      {
        required: true,
        message: '请输入部门名称',
        type: 'string',
        trigger: 'blur'
      }
    ],
    orderNum: [
      {
        required: true,
        message: '请输入显示排序',
        type: 'number',
        trigger: 'blur'
      }
    ],
    phone: [
      {
        pattern: phoneReg,
        message: '手机号格式不正确',
        type: 'string',
        trigger: 'blur'
      }
    ],
    email: [
      {
        pattern: emailReg,
        message: '邮箱格式不正确',
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
      const saveOrUpdate = isUpdate.value ? updateDept : addDept;
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
