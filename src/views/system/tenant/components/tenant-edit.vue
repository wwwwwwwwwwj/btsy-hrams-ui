<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="720"
    :title="isUpdate ? '修改租户' : '添加租户'"
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
      <el-row :gutter="16">
        <el-col :sm="12" :xs="24">
          <el-form-item label="企业名称" prop="companyName">
            <el-input
              clearable
              v-model="form.companyName"
              placeholder="请输入企业名称"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="联系人" prop="contactUserName">
            <el-input
              clearable
              v-model="form.contactUserName"
              placeholder="请输入联系人"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input
              clearable
              v-model="form.contactPhone"
              placeholder="请输入联系电话"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="!isUpdate" :sm="12" :xs="24">
          <el-form-item
            label="用户名"
            prop="username"
            :rules="[
              {
                required: true,
                message: '请输入用户名',
                type: 'string',
                trigger: 'blur'
              }
            ]"
          >
            <el-input
              clearable
              v-model="form.username"
              placeholder="请输入用户名"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="!isUpdate" :sm="12" :xs="24">
          <el-form-item
            label="用户密码"
            prop="password"
            :rules="[
              {
                required: true,
                message: '请输入用户密码',
                type: 'string',
                trigger: 'blur'
              }
            ]"
          >
            <el-input
              clearable
              v-model="form.password"
              placeholder="请输入用户密码"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="租户套餐" prop="packageId">
            <el-select
              clearable
              v-model="form.packageId"
              :disabled="isUpdate"
              placeholder="请选择租户套餐"
            >
              <el-option
                v-for="item in packageList"
                :key="item.packageId"
                :label="item.packageName"
                :value="item.packageId"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="过期时间" prop="expireTime">
            <el-date-picker
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              v-model="form.expireTime"
              placeholder="请选择过期时间"
              class="ele-fluid"
              :popper-options="{ strategy: 'fixed' }"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="用户数量" prop="accountCount">
            <el-input-number
              :min="0"
              :max="99999"
              v-model="form.accountCount"
              placeholder="请输入用户数量"
              controls-position="right"
              class="ele-fluid"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="绑定域名" prop="domain">
            <el-input
              clearable
              v-model="form.domain"
              placeholder="请输入绑定域名"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="企业代码" prop="licenseNumber">
            <el-input
              clearable
              v-model="form.licenseNumber"
              placeholder="请输入企业代码"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="24" :xs="24">
          <el-form-item label="企业地址" prop="address">
            <el-input
              clearable
              v-model="form.address"
              placeholder="请输入企业地址"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="企业简介" prop="intro">
            <el-input
              :rows="3"
              type="textarea"
              v-model="form.intro"
              placeholder="请输入企业简介"
            />
          </el-form-item>
        </el-col>
        <el-col :sm="12" :xs="24">
          <el-form-item label="备注" prop="remark">
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
  import { ref, reactive } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import { addTenant, updateTenant } from '@/api/system/tenant';
  import { listTenantPackage } from '@/api/system/tenant-package';

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

  /** 套餐数据列表 */
  const packageList = ref([]);

  /** 提交状态 */
  const loading = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const [form, _resetFields, assignFields] = useFormData({
    id: void 0,
    tenantId: void 0,
    companyName: '',
    contactUserName: '',
    contactPhone: '',
    username: '',
    password: '',
    packageId: void 0,
    expireTime: '',
    accountCount: void 0,
    domain: '',
    address: '',
    licenseNumber: '',
    intro: '',
    remark: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    companyName: [
      {
        required: true,
        message: '请输入企业名称',
        type: 'string',
        trigger: 'blur'
      }
    ],
    contactUserName: [
      {
        required: true,
        message: '请输入联系人',
        type: 'string',
        trigger: 'blur'
      }
    ],
    contactPhone: [
      {
        required: true,
        message: '请输入联系电话',
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
      const saveOrUpdate = isUpdate.value ? updateTenant : addTenant;
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

  /** 查询租户套餐数据 */
  const query = () => {
    listTenantPackage()
      .then((data) => {
        packageList.value = data;
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 修改赋值 */
  if (props.data) {
    assignFields(props.data);
    isUpdate.value = true;
  }

  query();
</script>
