<!-- 请假表单 -->
<template>
  <ele-loading :loading="loading">
    <el-form
      v-if="viewType !== 'view'"
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @submit.prevent=""
    >
      <el-form-item v-if="viewType === 'add'" label="流程定义">
        <el-select
          v-model="flowCode"
          placeholder="请选择流程定义"
          class="ele-fluid"
        >
          <el-option
            v-for="item in flowCodeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="请假类型" prop="leaveType">
        <el-select
          v-model="form.leaveType"
          placeholder="请选择请假类型"
          class="ele-fluid"
        >
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="请假时间" prop="dateRange">
        <el-date-picker
          v-model="form.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="-"
          :unlink-panels="true"
          class="ele-fluid"
        />
      </el-form-item>
      <el-form-item label="请假天数">{{ form.leaveDays }}天</el-form-item>
      <el-form-item label="请假原因" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          :maxlength="800"
          :show-word-limit="true"
          placeholder="请输入请假原因"
        />
      </el-form-item>
    </el-form>
    <el-descriptions v-else :border="true" :column="1" class="detail-table">
      <el-descriptions-item label="请假类型">
        {{
          options.find((d) => d.value == form.leaveType)?.label ??
          form.leaveType
        }}
      </el-descriptions-item>
      <el-descriptions-item label="请假时间">
        {{ (form.dateRange ?? []).join(' - ') }}
      </el-descriptions-item>
      <el-descriptions-item label="请假天数">
        {{ form.leaveDays }}天
      </el-descriptions-item>
      <el-descriptions-item label="请假原因">
        {{ form.remark }}
      </el-descriptions-item>
    </el-descriptions>
  </ele-loading>
</template>

<script setup>
  import { ref, reactive, watch } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import dayjs from 'dayjs';
  import {
    getLeave,
    addLeave,
    updateLeave,
    submitAndFlowStart
  } from '@/api/workflow/leave';

  const props = defineProps({
    /** 业务流程id */
    businessId: String,
    /** 展示类型 */
    viewType: String,
    /**
     * mode 用于直接后端发起流程, 不同接口实现方式可查看具体后端代码,
     * 默认前端发起, 前端发起更多样性, 比如可以选审批人, 选抄送人, 上传附件等等, 后端发起需要用户自行编写代码传这些参数
     */
    mode: Boolean
  });

  const emit = defineEmits({
    queryDone: (_data) => true
  });

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const form = reactive({
    leaveType: void 0,
    leaveDays: void 0,
    remark: '',
    dateRange: []
  });

  /** 表单验证规则 */
  const rules = reactive({
    leaveType: [
      {
        required: true,
        message: '请选择请假类型',
        type: 'string',
        trigger: 'change'
      }
    ],
    dateRange: [
      {
        required: true,
        message: '请选择请假时间',
        type: 'array',
        trigger: 'blur'
      }
    ]
  });

  /** 请假类型选项数据 */
  const options = [
    { value: '1', label: '事假' },
    { value: '2', label: '调休' },
    { value: '3', label: '病假' },
    { value: '4', label: '婚假' }
  ];

  /** 请求状态 */
  const loading = ref(false);

  /** 自定义流程可不选择, 直接填写 flowCode 例如 'leave1' */
  const flowCode = ref('leave1');

  /** 计算请假天数 */
  const getLeaveDays = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return 0;
    }
    const start = dayjs(`${startDate} 00:00:00`, 'YYYY-MM-DD HH:mm:ss');
    const end = dayjs(`${endDate} 23:59:59`, 'YYYY-MM-DD HH:mm:ss');
    return Math.ceil(end.diff(start, 'day', true));
  };

  /** 自动计算请假天数 */
  watch(
    () => form.dateRange,
    (date) => {
      const [startDate, endDate] = date || [];
      form.leaveDays = getLeaveDays(startDate, endDate);
    },
    { immediate: true }
  );

  /** 赋值表单 */
  watch(
    () => props.businessId,
    (businessId) => {
      if (
        (props.viewType !== 'update' &&
          props.viewType !== 'approval' &&
          props.viewType !== 'view') ||
        !businessId
      ) {
        return;
      }
      loading.value = true;
      getLeave(businessId)
        .then((data) => {
          loading.value = false;
          form.leaveType = data?.leaveType;
          form.remark = data?.remark;
          form.dateRange = [data?.startDate ?? '', data?.endDate ?? ''];
          form.leaveDays = getLeaveDays(data?.startDate, data?.endDate);
          emit('queryDone', data);
        })
        .catch((e) => {
          loading.value = false;
          EleMessage.error({ message: e.message, plain: true });
        });
    },
    { immediate: true }
  );

  /** 获取流程定义编码选项 */
  const flowCodeOptions = [
    {
      value: 'leave1',
      label: '请假申请-普通'
    },
    {
      value: 'leave2',
      label: '请假申请-排他网关'
    },
    {
      value: 'leave3',
      label: '请假申请-并行网关'
    },
    {
      value: 'leave4',
      label: '请假申请-会签'
    },
    {
      value: 'leave5',
      label: '请假申请-并行会签网关'
    },
    {
      value: 'leave6',
      label: '请假申请-排他并行会签'
    }
  ];

  /** 获取流程变量 */
  const getTaskVariables = () => {
    return {
      // leave2/6 使用的流程变量
      leaveDays: form.leaveDays,
      // leave4/5 使用的流程变量
      userList: ['1', '3', '4']
    };
  };

  /** 提交表单 */
  const submit = (callback, type) => {
    formRef.value?.validate?.((valid) => {
      if (!valid) {
        callback && callback(false);
        return;
      }
      const [startDate, endDate] = form.dateRange || [];
      const data = {
        ...form,
        dateRange: void 0,
        startDate,
        endDate,
        leaveDays: getLeaveDays(startDate, endDate),
        id: props.businessId
      };
      // 设置后端发起和不等于草稿状态, 直接走流程发起
      if (props.mode && type != 'draft') {
        submitAndFlowStart(data)
          .then(() => {
            EleMessage.success({ message: '操作成功', plain: true });
            callback && callback('done');
          })
          .catch((e) => {
            EleMessage.error({ message: e.message, plain: true });
            callback && callback(false);
          });
        return;
      }
      const saveOrUpdate = props.businessId ? updateLeave : addLeave;
      saveOrUpdate(data)
        .then((result) => {
          callback &&
            callback(true, {
              flowSubmitData: {
                flowCode: flowCode.value,
                businessId: result?.id,
                variables: getTaskVariables(),
                bizExt: {
                  businessTitle: '请假申请',
                  businessCode: result?.applyCode
                }
              }
            });
        })
        .catch((e) => {
          EleMessage.error({ message: e.message, plain: true });
          callback && callback(false);
        });
    });
  };

  const getFlowCodeOptions = () => {
    return flowCodeOptions;
  };

  defineExpose({
    submit,
    getTaskVariables,
    getFlowCodeOptions
  });
</script>

<style lang="scss" scoped>
  .detail-table :deep(td.el-descriptions__label.el-descriptions__cell) {
    width: 100px;
    text-align: right;
  }
</style>
