<!-- 修改密码弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="420"
    title="修改密码"
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
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input
          show-password
          type="password"
          v-model="form.oldPassword"
          placeholder="请输入旧密码"
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          show-password
          type="password"
          v-model="form.newPassword"
          placeholder="请输入新密码"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          show-password
          type="password"
          v-model="form.confirmPassword"
          placeholder="请再次输入新密码"
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
  import { updatePassword } from '@/api/layout';

  const { modalProps, closeModal } = useModal();

  /** 提交状态 */
  const loading = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const form = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    oldPassword: [
      {
        required: true,
        message: '请输入旧密码',
        type: 'string',
        trigger: 'blur'
      }
    ],
    newPassword: [
      {
        required: true,
        message: '请输入新密码',
        type: 'string',
        trigger: 'blur'
      },
      {
        type: 'string',
        trigger: 'blur',
        pattern: /^[\S]{5,18}$/,
        message: '密码必须为5-18位非空白字符'
      }
    ],
    confirmPassword: [
      {
        required: true,
        message: '请再次输入新密码',
        type: 'string',
        trigger: 'blur'
      },
      {
        type: 'string',
        trigger: 'blur',
        validator: (_rule, value, callback) => {
          if (value && value !== form.newPassword) {
            return callback(new Error('两次输入密码不一致'));
          }
          callback();
        }
      }
    ]
  });

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 保存修改 */
  const handleSave = () => {
    formRef.value?.validate?.((valid) => {
      if (!valid) {
        return;
      }
      loading.value = true;
      updatePassword(form)
        .then(() => {
          loading.value = false;
          EleMessage.success({ message: '修改成功', plain: true });
          handleCancel();
        })
        .catch((e) => {
          loading.value = false;
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };
</script>
