<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改客户端' : '添加客户端'"
    :body-style="{ paddingLeft: '10px' }"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="126px"
      @submit.prevent=""
    >
      <el-form-item label="客户端key" prop="clientKey">
        <el-input
          clearable
          v-model="form.clientKey"
          placeholder="请输入客户端key"
        />
      </el-form-item>
      <el-form-item label="客户端秘钥" prop="clientSecret">
        <el-input
          clearable
          v-model="form.clientSecret"
          placeholder="请输入客户端秘钥"
        />
      </el-form-item>
      <el-form-item label="授权类型" prop="grantTypeList">
        <dict-data
          type="multipleSelect"
          code="sys_grant_type"
          v-model="form.grantTypeList"
          placeholder="请选择授权类型"
        />
      </el-form-item>
      <el-form-item label="设备类型" prop="deviceType">
        <dict-data
          code="sys_device_type"
          v-model="form.deviceType"
          placeholder="请选择设备类型"
        />
      </el-form-item>
      <el-form-item prop="activeTimeout">
        <template #label>
          <ele-tooltip
            content="指定时间无操作则过期（单位：秒），默认30分钟（1800秒）"
            placement="top-start"
            :popper-options="{
              modifiers: [{ name: 'offset', options: { offset: [-12, 10] } }]
            }"
          >
            <el-icon
              :size="13"
              style="align-self: center; margin-right: 2px; cursor: help"
            >
              <QuestionCircleOutlined style="opacity: 0.6" />
            </el-icon>
          </ele-tooltip>
          <span>Token活跃超时</span>
        </template>
        <el-input
          clearable
          v-model="form.activeTimeout"
          placeholder="请输入Token活跃超时时间"
        />
      </el-form-item>
      <el-form-item label="Token固定超时时间" prop="timeout">
        <template #label>
          <ele-tooltip
            content="指定时间必定过期（单位：秒），默认七天（604800秒）"
            placement="top-start"
            :popper-options="{
              modifiers: [{ name: 'offset', options: { offset: [-12, 10] } }]
            }"
          >
            <el-icon
              :size="13"
              style="align-self: center; margin-right: 2px; cursor: help"
            >
              <QuestionCircleOutlined style="opacity: 0.6" />
            </el-icon>
          </ele-tooltip>
          <span>Token固定超时</span>
        </template>
        <el-input
          clearable
          v-model="form.timeout"
          placeholder="请输入Token固定超时时间"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <dict-data
          type="radio"
          code="sys_normal_disable"
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
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { QuestionCircleOutlined } from '@/components/icons';
  import { useFormData } from '@/utils/use-form-data';
  import { addClient, updateClient } from '@/api/system/client';

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
    clientId: void 0,
    clientKey: '',
    clientSecret: '',
    grantTypeList: [],
    deviceType: void 0,
    activeTimeout: '',
    timeout: '',
    status: void 0
  });

  /** 表单验证规则 */
  const rules = reactive({
    clientKey: [
      {
        required: true,
        message: '请输入客户端key',
        type: 'string',
        trigger: 'blur'
      }
    ],
    clientSecret: [
      {
        required: true,
        message: '请输入客户端秘钥',
        type: 'string',
        trigger: 'blur'
      }
    ],
    grantTypeList: [
      {
        required: true,
        message: '请选择授权类型',
        type: 'array',
        trigger: 'blur'
      }
    ],
    deviceType: [
      {
        required: true,
        message: '请选择设备类型',
        type: 'string',
        trigger: 'blur'
      }
    ],
    status: [
      {
        required: true,
        message: '请选择状态',
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
      const saveOrUpdate = isUpdate.value ? updateClient : addClient;
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
