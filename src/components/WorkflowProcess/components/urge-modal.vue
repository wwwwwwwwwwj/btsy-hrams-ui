<!-- 催办弹窗 -->
<template>
  <ele-modal
    :width="720"
    title="催办"
    :form="true"
    v-model="visible"
    :destroy-on-close="true"
    :close-on-click-modal="false"
    :body-style="{ paddingLeft: '12px' }"
  >
    <el-form :model="form" label-width="98px" @submit.prevent="">
      <el-form-item label="消息提醒">
        <el-checkbox-group v-model="form.messageType">
          <el-checkbox label="站内信" value="1" disabled />
          <el-checkbox label="邮件" value="2" />
          <el-checkbox label="短信" value="3" />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="审批意见">
        <el-input
          :rows="3"
          type="textarea"
          v-model="form.message"
          placeholder="请输入审批意见"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </template>
  </ele-modal>
</template>

<script setup>
  import { watch } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import { urgeTask } from '@/api/workflow/task';

  defineOptions({ name: 'UrgeModal' });

  const props = defineProps({
    /** 任务id */
    taskIdList: Array
  });

  const emit = defineEmits({
    done: () => true
  });

  /** 弹窗是否打开 */
  const visible = defineModel({ type: Boolean });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    messageType: ['1'],
    message: ''
  });

  /** 关闭弹窗 */
  const handleCancel = () => {
    visible.value = false;
  };

  /** 提交 */
  const handleSubmit = () => {
    const data = {
      ...form,
      taskIdList: props.taskIdList
    };
    ElMessageBox.confirm('是否确认提交？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        urgeTask(data)
          .then(() => {
            loading.close();
            EleMessage.success({ message: '操作成功', plain: true });
            handleCancel();
            emit('done');
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 监听弹窗打开 */
  watch(visible, () => {
    if (visible.value) {
      resetFields();
    }
  });
</script>
