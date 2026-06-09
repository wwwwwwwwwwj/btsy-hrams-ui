<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="720"
    :title="isUpdate ? '修改对象存储配置' : '添加对象存储配置'"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="96px"
      @submit.prevent=""
    >
      <el-row>
        <el-col :sm="12" :xs="24">
          <el-form-item label="配置key" prop="configKey">
            <el-input
              clearable
              v-model="form.configKey"
              placeholder="请输入配置key"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="是否https" prop="isHttps">
            <dict-data code="sys_yes_no" type="radio" v-model="form.isHttps" />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="访问站点" prop="endpoint">
            <el-input
              clearable
              v-model="form.endpoint"
              placeholder="请输入访问站点"
            >
              <template #prepend>{{ protocol }}</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="自定义域名" prop="domain">
            <el-input
              clearable
              v-model="form.domain"
              placeholder="请输入自定义域名"
            >
              <template #prepend>{{ protocol }}</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="accessKey" prop="accessKey">
            <el-input
              clearable
              v-model="form.accessKey"
              placeholder="请输入accessKey"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="secretKey" prop="secretKey">
            <el-input
              clearable
              v-model="form.secretKey"
              placeholder="请输入secretKey"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="桶名称" prop="bucketName">
            <el-input
              clearable
              v-model="form.bucketName"
              placeholder="请输入桶名称"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="前缀" prop="prefix">
            <el-input
              clearable
              v-model="form.prefix"
              placeholder="请输入前缀"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="桶权限类型" prop="accessPolicy">
            <el-radio-group v-model="form.accessPolicy">
              <el-radio value="0">private</el-radio>
              <el-radio value="1">public</el-radio>
              <el-radio value="2">custom</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="域" prop="region">
            <el-input clearable v-model="form.region" placeholder="请输入域" />
          </el-form-item>
        </el-col>
        <el-col :sm="24" :xs="24">
          <el-form-item label="备注">
            <el-input
              :rows="3"
              type="textarea"
              v-model="form.remark"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
      </el-row>
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
  import { ref, reactive, computed } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import { addOssConfig, updateOssConfig } from '@/api/system/oss-config';

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
    ossConfigId: void 0,
    configKey: '',
    endpoint: '',
    domain: '',
    accessKey: '',
    secretKey: '',
    bucketName: '',
    prefix: '',
    isHttps: 'N',
    accessPolicy: '1',
    region: '',
    remark: '',
    status: '1'
  });

  /** 表单验证规则 */
  const rules = reactive({
    configKey: [
      {
        required: true,
        message: '请输入配置key',
        type: 'string',
        trigger: 'blur'
      }
    ],
    endpoint: [
      {
        required: true,
        message: '请输入访问站点',
        type: 'string',
        trigger: 'blur'
      }
    ],
    accessKey: [
      {
        required: true,
        message: '请输入accessKey',
        type: 'string',
        trigger: 'blur'
      }
    ],
    secretKey: [
      {
        required: true,
        message: '请输入secretKey',
        type: 'string',
        trigger: 'blur'
      }
    ],
    bucketName: [
      {
        required: true,
        message: '请输入桶名称',
        type: 'string',
        trigger: 'blur'
      }
    ],
    isHttps: [
      {
        required: true,
        message: '请选择是否HTTPS',
        type: 'string',
        trigger: 'change'
      }
    ],
    accessPolicy: [
      {
        required: true,
        message: '请选择桶权限类型',
        type: 'string',
        trigger: 'change'
      }
    ]
  });

  /** 协议 */
  const protocol = computed(() =>
    form.isHttps === 'Y' ? 'https://' : 'http://'
  );

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
      const saveOrUpdate = isUpdate.value ? updateOssConfig : addOssConfig;
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
