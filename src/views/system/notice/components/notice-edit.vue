<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="1320"
    :title="isUpdate ? '修改公告' : '添加公告'"
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
        <el-col :lg="14" :md="12" :sm="24" :xs="24">
          <el-form-item label="公告标题" prop="noticeTitle">
            <el-input
              clearable
              v-model="form.noticeTitle"
              placeholder="请输入公告标题"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="5" :md="6" :sm="12" :xs="24">
          <el-form-item label="公告类型" prop="noticeType">
            <dict-data
              code="sys_notice_type"
              v-model="form.noticeType"
              placeholder="请选择公告类型"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="5" :md="6" :sm="12" :xs="24">
          <el-form-item label="状态" prop="status">
            <dict-data
              code="sys_notice_status"
              type="radio"
              v-model="form.status"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="内容">
        <div style="width: 100%">
          <tinymce-editor :init="config" v-model="form.noticeContent" />
        </div>
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
  import { addNotice, updateNotice } from '@/api/system/notice';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object
  });

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 编辑器配置 */
  const config = ref({
    height: 600,
    menubar: false
  });

  /** 是否是修改 */
  const isUpdate = ref(false);

  /** 提交状态 */
  const loading = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const [form, _resetFields, assignFields] = useFormData({
    noticeId: void 0,
    noticeTitle: '',
    noticeType: void 0,
    status: '0',
    noticeContent: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    noticeTitle: [
      {
        required: true,
        message: '请输入公告标题',
        type: 'string',
        trigger: 'blur'
      }
    ],
    noticeType: [
      {
        required: true,
        message: '请选择公告类型',
        type: 'string',
        trigger: 'change'
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
      const saveOrUpdate = isUpdate.value ? updateNotice : addNotice;
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
