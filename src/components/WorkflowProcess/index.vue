<!-- 工作流审批 -->
<template>
  <div class="ele-workflow-process-wrapper">
    <ele-loading :loading="submitLoading" style="margin-top: -8px">
      <div
        class="ele-workflow-process-detail-label"
        style="margin: 0 0 12px 0; min-height: 32px"
      >
        <div>表单数据</div>
        <div style="margin-left: auto">
          <el-button
            v-if="submitEnable"
            type="primary"
            class="ele-btn-icon"
            :icon="FileOutlined"
            @click="handleSubmit('draft')"
          >
            暂存
          </el-button>
          <el-button
            v-if="submitEnable"
            type="primary"
            class="ele-btn-icon"
            :icon="CheckOutlined"
            @click="handleSubmit('submit')"
          >
            提交
          </el-button>
          <el-button
            v-if="viewType === 'approval' && flowStatus === 'waiting'"
            type="primary"
            class="ele-btn-icon"
            :icon="EditOutlined"
            @click="handleApproval"
          >
            审批
          </el-button>
        </div>
      </div>
      <component
        v-if="formComponent"
        :is="formComponent"
        :businessId="businessId"
        :viewType="viewType"
        :mode="mode"
        ref="formRef"
        @queryDone="handleBusinessQueryDone"
      />
    </ele-loading>
    <template v-if="viewType !== 'add' && flowStatus !== 'draft'">
      <ele-tab-bar
        v-model="tabActive"
        :items="[
          { value: '0', label: '审批进度' },
          { value: '1', label: '流程图' },
          { value: '2', label: '流转记录' }
        ]"
        :item-style="{
          height: '48px',
          lineHeight: '48px',
          margin: '0 28px 0 0'
        }"
        style="margin-top: 6px"
      />
      <ProcessActivities v-if="tabActive === '0'" :data="historyData" />
      <flow-chart v-else-if="tabActive === '1'" :instanceId="instanceId" />
      <history-list
        v-else-if="tabActive === '2'"
        :loading="historyLoading"
        :data="historyData"
      />
    </template>
    <!-- 流程定义选择弹窗 -->
    <ele-modal
      :width="460"
      title="流程定义"
      v-model="showFlowCodePicker"
      :close-on-click-modal="false"
    >
      <el-select v-model="flowCode" placeholder="请选择">
        <el-option
          v-for="item in flowCodeOptions"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
      </el-select>
      <template #footer>
        <el-button @click="handleCancelFlowCodePicker">取消</el-button>
        <el-button
          type="primary"
          class="ele-btn-icon"
          :loading="loading"
          @click="handleStartWorkFlow()"
        >
          确认
        </el-button>
      </template>
    </ele-modal>
    <!-- 审批弹窗 -->
    <approval-modal
      v-model="showApproval"
      :task="task"
      :taskVariables="approvalTaskVariables"
      @done="handleDone"
    />
  </div>
</template>

<script setup>
  import { ref, computed, watch, defineAsyncComponent } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import {
    FileOutlined,
    EditOutlined,
    CheckOutlined
  } from '@/components/icons';
  import HistoryList from './components/history-list.vue';
  import FlowChart from './components/flow-chart.vue';
  import ApprovalModal from './components/approval-modal.vue';
  import ProcessActivities from './components/process-activities.vue';
  import { getInstanceTask } from '@/api/workflow/instance';
  import { getTask, startWorkFlow } from '@/api/workflow/task';
  const modules = import.meta.glob('/src/views/common/**/*.vue');

  defineOptions({ name: 'WorkflowProcess' });

  const props = defineProps({
    /** 业务id */
    businessId: [String, Number],
    /** 待办任务id */
    taskId: [String, Number],
    /** 展示类型 */
    viewType: String,
    /** 审批表单是否自定义 */
    formCustom: String,
    /** 审批表单路径 */
    formPath: String,
    /** 流程状态 */
    status: String,
    /**
     * mode 用于直接后端发起流程, 不同接口实现方式可查看具体后端代码,
     * 默认前端发起, 前端发起更多样性, 比如可以选审批人, 选抄送人, 上传附件等等, 后端发起需要用户自行编写代码传这些参数
     */
    mode: Boolean
  });

  const emit = defineEmits({
    done: () => true
  });

  /** 流程实例id */
  const instanceId = ref();

  /** 当前任务 */
  const task = ref();

  /** 审批记录数据 */
  const historyData = ref([]);

  /** 流程定义编码 */
  const flowCode = ref();

  /** 流程定义选项 */
  const flowCodeOptions = ref([]);

  /** 加载状态 */
  const loading = ref(false);

  /** 审批记录加载状态 */
  const historyLoading = ref(false);

  /** 提交请求状态 */
  const submitLoading = ref(false);

  /** 是否显示审批弹窗 */
  const showApproval = ref(false);

  /** 审批时流程变量 */
  const approvalTaskVariables = ref();

  /** 是否显示流程定义选择弹窗 */
  const showFlowCodePicker = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 业务流程状态 */
  const businessStatus = ref();

  /** 添加成功后的业务id */
  const resultBusinessId = ref();

  /** 选项卡选中 */
  const tabActive = ref('0');

  /** 表单组件 */
  const formComponent = computed(() => {
    const name = props.formPath;
    if (!name) {
      return;
    }
    const path = name.startsWith('/') ? name : `/${name}`;
    const module =
      modules[`/src/views/common${path}.vue`] ||
      modules[`/src/views/common${path}/index.vue`];
    if (!module) {
      return;
    }
    return defineAsyncComponent(module);
  });

  /** 流程当前状态 */
  const flowStatus = computed(() => {
    return props.status ?? task.value?.flowStatus ?? businessStatus.value;
  });

  /** 提交按钮是否可用 */
  const submitEnable = computed(() => {
    return (
      props.viewType === 'add' ||
      (props.viewType === 'update' &&
        (flowStatus.value === 'draft' ||
          flowStatus.value === 'cancel' ||
          flowStatus.value === 'back'))
    );
  });

  /** 业务表单数据查询完成事件 */
  const handleBusinessQueryDone = (data) => {
    businessStatus.value = data?.status;
  };

  /** 打开审批弹窗 */
  const handleApproval = () => {
    showApproval.value = true;
    approvalTaskVariables.value = formRef.value?.getTaskVariables?.();
  };

  /** 关闭弹窗流程定义选择弹窗 */
  const handleCancelFlowCodePicker = () => {
    showFlowCodePicker.value = false;
  };

  /** 审批完成事件 */
  const handleDone = () => {
    submitLoading.value = false;
    emit('done');
  };

  /** 查询当前任务信息 */
  const queryTask = (taskId, callback) => {
    if (!taskId) {
      task.value = void 0;
      callback && callback(false);
      return;
    }
    loading.value = true;
    getTask(taskId)
      .then((data) => {
        loading.value = false;
        task.value = data;
        callback && callback(true);
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
        callback && callback(false);
      });
  };

  /** 启动流程 */
  const handleStartWorkFlow = (data) => {
    const flowData = data || {
      flowCode: flowCode.value,
      businessId: props.businessId ?? resultBusinessId.value,
      variables: formRef.value?.getTaskVariables?.(),
      bizExt: {}
    };
    submitLoading.value = true;
    startWorkFlow(flowData)
      .then((result) => {
        handleCancelFlowCodePicker();
        queryTask(result?.taskId, () => {
          handleApproval();
          submitLoading.value = false;
        });
      })
      .catch((e) => {
        submitLoading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 提交审批 */
  const handleSubmit = (type) => {
    if (!formRef.value) {
      return;
    }
    submitLoading.value = true;
    formRef.value.submit((valid, data) => {
      submitLoading.value = false;
      if (!valid) {
        return;
      }
      if (valid === 'done') {
        handleDone();
        return;
      }
      resultBusinessId.value = data?.id;
      // 暂存
      if (type === 'draft') {
        EleMessage.success({ message: '暂存成功', plain: true });
        handleDone();
        return;
      }
      // 提交
      if (data?.flowSubmitData) {
        handleStartWorkFlow(data.flowSubmitData);
        return;
      }
      // 兼容旧版逻辑
      const flowCodeIsEmpty = flowCode.value == null || flowCode.value === '';
      if (
        (flowStatus.value === 'draft' && flowCodeIsEmpty) ||
        props.viewType === 'add'
      ) {
        flowCodeOptions.value = formRef.value?.getFlowCodeOptions?.() ?? [];
        flowCode.value = flowCodeOptions.value[0]?.value;
        showFlowCodePicker.value = true;
        return;
      }
      if (flowCodeIsEmpty) {
        // 说明启动过先随意传个参数
        flowCode.value = 'xx';
      }
      handleStartWorkFlow();
    }, type);
  };

  /** 查询当前任务 */
  watch(
    () => props.taskId,
    (taskId) => {
      queryTask(taskId);
    },
    { immediate: true }
  );

  /** 查询审批记录 */
  watch(
    [() => props.businessId, flowStatus],
    () => {
      if (!props.businessId || flowStatus.value === 'draft') {
        instanceId.value = void 0;
        historyData.value = [];
        return;
      }
      historyLoading.value = true;
      getInstanceTask(props.businessId)
        .then((result) => {
          historyLoading.value = false;
          instanceId.value = result.instanceId;
          historyData.value = (result.list || []).map((d) => ({
            ...d,
            approver: d.approver ?? '',
            approveName: d.approveName ?? ''
          }));
        })
        .catch((e) => {
          historyLoading.value = false;
          EleMessage.error({ message: e.message, plain: true });
        });
    },
    { immediate: true }
  );
</script>

<style lang="scss">
  @use 'ele-admin-plus/es/style/util.scss' as *;

  .ele-workflow-process-wrapper {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .ele-workflow-process-form-user-select-item > .el-form-item__label {
    height: 42px;
    line-height: 42px;
  }

  /* 标题 */
  .ele-workflow-process-detail-label {
    color: elVar('color-primary');
    font-size: 15px;
    font-weight: bold;
    margin-top: 16px;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      width: 5px;
      height: 15px;
      border-radius: 5px;
      background: elVar('color-primary');
      margin-right: 8px;
    }
  }

  /* 下一步审批节点列表 */
  .ele-workflow-process-node-item {
    width: 100%;
    box-sizing: border-box;
    padding: 0 12px 6px 12px;
    border: 1px solid elVar('border-color', 'light');
    border-radius: elVar('border-radius', 'base');

    & + .ele-workflow-process-node-item {
      margin-top: 12px;
    }
  }

  /* 流程图 */
  .ele-workflow-process-flow-chart {
    flex: 1;
    min-height: 320px;
    position: relative;
    margin-top: 12px;

    & > iframe {
      position: absolute;
      inset: 0;
    }
  }

  /* 审批进度列表 */
  .ele-workflow-process-activities {
    display: flex;
    flex-direction: column-reverse;
    box-sizing: border-box;
    padding: 18px 0 0 0;
  }

  .ele-workflow-process-activity-item {
    display: flex;
    padding: 1px 12px 0 12px;
    box-sizing: border-box;
  }

  .ele-workflow-process-activity-item-left {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    width: 40px;
    padding-top: 3px;
    box-sizing: border-box;
  }

  /* 头像 */
  .ele-workflow-process-activity-item-avatar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: #fff;
    border-radius: 50%;
    background: elVar('color-primary');
    position: relative;

    & > .el-icon {
      font-size: 18px;
    }

    /* 状态图标 */
    .ele-workflow-process-activity-item-icon {
      width: 15px;
      height: 15px;
      font-size: 8px;
      box-sizing: border-box;
      border: 1.5px solid #fff;
      border-radius: 50%;
      position: absolute;
      right: 0;
      bottom: 0;

      &.is-pass,
      &.is-transfer {
        background: elVar('color-success');
      }

      &.is-back,
      &.is-invalid {
        background: elVar('color-danger');
      }

      &.is-waiting {
        background: elVar('color-warning');

        & > svg > circle {
          r: 6;
        }
      }
    }
  }

  .ele-workflow-process-activity-item-body {
    flex: 1;
    padding: 0 0 28px 12px;
    box-sizing: border-box;
    overflow: hidden;
  }

  /* 节点名称 */
  .ele-workflow-process-activity-item-name {
    display: flex;
    align-items: center;
    color: elVar('text-color', 'secondary');
  }

  .ele-workflow-process-activity-item-time {
    color: elVar('text-color', 'placeholder');
    font-size: 13px;
    margin: 0 0 0 auto;
  }

  /* 审批人 */
  .ele-workflow-process-activity-item-text {
    color: elVar('text-color', 'heading');
    margin-top: 2px;
  }

  /* 备注 */
  .ele-workflow-process-activity-item-content {
    padding: 6px;
    margin-top: 8px;
    font-size: 13px;
    background: elVar('fill-color', 'lighter');
    border-radius: elVar('border-radius', 'base');
    box-sizing: border-box;
  }

  /* 连接线 */
  .ele-workflow-process-activity-item-line {
    flex: 1;
    margin: 4px auto 0 auto;
    border-left: 3px solid elVar('border-color', 'light');
  }

  /* 总状态 */
  .ele-workflow-process-activity-item-status {
    padding-top: 0;
  }

  .ele-workflow-process-activity-item-status-icon {
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    & > .el-icon {
      color: #fff;
      width: 16px;
      height: 16px;
      font-size: 12px;
      background: elVar('color-warning');
      border-radius: 50%;

      &.is-pass {
        background: elVar('color-success');
      }

      &.is-stop {
        background: elVar('color-danger');
      }
    }
  }

  .ele-workflow-process-activity-item-status-name {
    line-height: 16px;
    box-sizing: border-box;
    white-space: nowrap;
  }

  /* 审批人列表 */
  .ele-workflow-process-activity-item-users {
    display: flex;
    flex-wrap: wrap;
  }

  .ele-workflow-process-activity-item-user {
    margin: 12px 12px 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: elVar('text-color', 'secondary');
    font-size: 12px;
  }

  .ele-workflow-process-activity-item-user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #fff;
    font-size: 13px;
    border-radius: 50%;
    background: elVar('color-primary');
  }

  .ele-workflow-process-activity-item-user-name {
    margin-top: 6px;
    max-width: 52px;
    line-height: 1.2;
    word-break: break-all;
  }
</style>
