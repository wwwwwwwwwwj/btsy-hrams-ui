<!-- 流程干预弹窗 -->
<template>
  <ele-modal
    :width="980"
    title="流程干预"
    v-model="visible"
    :close-on-click-modal="false"
  >
    <ele-loading :loading="loading">
      <div class="ele-workflow-process-detail-title">
        {{ task?.flowName }}({{ task?.flowCode }})
      </div>
      <el-descriptions
        :border="true"
        :column="mobile ? 1 : 2"
        class="ele-workflow-process-detail"
      >
        <el-descriptions-item label="任务名称" :span="2">
          {{ task?.nodeName }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ task?.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="版本号">
          {{ task?.version }}.0
        </el-descriptions-item>
        <el-descriptions-item label="业务ID">
          {{ task?.businessId }}
        </el-descriptions-item>
        <el-descriptions-item label="流程实例ID">
          {{ task?.instanceId }}
        </el-descriptions-item>
        <el-descriptions-item label="节点编码" :span="2">
          {{ task?.nodeCode }}
        </el-descriptions-item>
      </el-descriptions>
    </ele-loading>
    <template #footer>
      <div class="ele-workflow-process-buttons">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          v-if="task?.flowStatus === 'waiting'"
          type="primary"
          :icon="RecoverOutlined"
          class="ele-btn-icon"
          :disabled="loading"
          @click="handleTransfer"
        >
          转办
        </el-button>
        <el-button
          v-if="task?.flowStatus === 'waiting' && Number(task.nodeRatio) > 0"
          type="primary"
          :icon="PlusCircleOutlined"
          class="ele-btn-icon"
          :disabled="loading"
          @click="handleOpenMulti"
        >
          加签
        </el-button>
        <el-button
          v-if="task?.flowStatus === 'waiting' && Number(task.nodeRatio) > 0"
          type="primary"
          :icon="MinusCircleOutlined"
          class="ele-btn-icon"
          :disabled="loading"
          @click="handleOpenDelete"
        >
          减签
        </el-button>
        <el-button
          v-if="task?.flowStatus === 'waiting'"
          type="danger"
          :icon="StopOutlined"
          class="ele-btn-icon"
          :disabled="loading"
          @click="handleTermination"
        >
          终止
        </el-button>
      </div>
    </template>
    <!-- 减签弹窗 -->
    <ele-modal
      :width="720"
      title="减签人员"
      v-model="showDeleteModal"
      :close-on-click-modal="false"
    >
      <ele-pro-table
        :columns="deleteColumns"
        :datasource="deleteUsers"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        :pagination="false"
        :toolbar="false"
        :loading="deleteUserLoading"
      >
        <template #action="{ row }">
          <el-link type="danger" underline="never" @click="handleDelete(row)">
            删除
          </el-link>
        </template>
      </ele-pro-table>
    </ele-modal>
    <!-- 人员选择弹窗 -->
    <user-select
      v-model:visible="showUserSelect"
      view-type="picker"
      :multiple="!isTransfer"
      :popper-props="{ title: '选择办理人', closeOnClickModal: false }"
      :beforeConfirm="handleUserSelect"
    />
  </ele-modal>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage } from 'ele-admin-plus';
  import {
    StopOutlined,
    RecoverOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined
  } from '@/components/icons';
  import UserSelect from '@/components/UserSelect/index.vue';
  import { useMobile } from '@/utils/use-mobile';
  import {
    getTask,
    terminationTask,
    operationTask,
    listCurrentTaskAllUser
  } from '@/api/workflow/task';

  defineOptions({ name: 'MeddleModal' });

  const props = defineProps({
    /** 当前任务id */
    taskId: [String, Number]
  });

  const emit = defineEmits({
    done: () => true
  });

  /** 弹窗是否打开 */
  const visible = defineModel({ type: Boolean });

  /** 是否是移动端 */
  const { mobile } = useMobile();

  /** 当前任务 */
  const task = ref();

  /** 提交状态 */
  const loading = ref(false);

  /** 是否显示减签弹窗 */
  const showDeleteModal = ref(false);

  /** 减签表格列 */
  const deleteColumns = ref([
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center'
    },
    {
      prop: 'nodeName',
      label: '任务名称',
      minWidth: 110,
      align: 'center'
    },
    {
      prop: 'nickName',
      label: '办理人',
      minWidth: 110,
      align: 'center'
    },
    {
      columnKey: 'action',
      label: '操作',
      width: 80,
      align: 'center',
      slot: 'action'
    }
  ]);

  /** 减签表格数据 */
  const deleteUsers = ref([]);

  /** 减签表格数据请求状态 */
  const deleteUserLoading = ref(false);

  /** 是否显示人员选择弹窗 */
  const showUserSelect = ref(false);

  /** 是否是转办选择人员 */
  const isTransfer = ref(true);

  /** 关闭弹窗 */
  const handleCancel = () => {
    visible.value = false;
    showDeleteModal.value = false;
    showUserSelect.value = false;
  };

  /** 打开减签弹窗 */
  const handleOpenDelete = () => {
    showDeleteModal.value = true;
    deleteUserLoading.value = true;
    listCurrentTaskAllUser(props.taskId)
      .then((data) => {
        deleteUserLoading.value = false;
        deleteUsers.value = (data || []).map((d) => ({
          ...d,
          nodeName: task.value?.nodeName
        }));
      })
      .catch((e) => {
        deleteUserLoading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 减签 */
  const handleDelete = (row) => {
    ElMessageBox.confirm('是否确认提交？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        operationTask(
          {
            userIds: [row.userId],
            taskId: props.taskId,
            message: '',
            messageType: ['1']
          },
          'reductionSignature'
        )
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

  /** 终止 */
  const handleTermination = () => {
    ElMessageBox.confirm('是否确认终止？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        loading.value = true;
        terminationTask({
          taskId: props.taskId,
          comment: ''
        })
          .then(() => {
            loading.value = false;
            EleMessage.success({ message: '操作成功', plain: true });
            handleCancel();
            emit('done');
          })
          .catch((e) => {
            loading.value = false;
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 打开加签选择弹窗 */
  const handleOpenMulti = () => {
    isTransfer.value = false;
    showUserSelect.value = true;
  };

  /** 打开转办选择弹窗 */
  const handleTransfer = () => {
    isTransfer.value = true;
    showUserSelect.value = true;
  };

  /** 人员选择完成事件 */
  const handleUserSelect = (selectData) => {
    // 转办
    if (isTransfer.value) {
      const userId = selectData?.userId;
      if (!userId) {
        EleMessage.error({ message: '请选择用户', plain: true });
        return false;
      }
      ElMessageBox.confirm('是否确认提交？', '系统提示', {
        type: 'warning',
        draggable: true
      })
        .then(() => {
          const loading = EleMessage.loading({
            message: '请求中..',
            plain: true
          });
          operationTask(
            {
              userId,
              taskId: props.taskId,
              message: '',
              messageType: ['1']
            },
            'transferTask'
          )
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
      return false;
    }
    // 加签
    const userId = (selectData || []).map((d) => d.userId);
    if (!userId?.length) {
      EleMessage.error({ message: '请选择用户', plain: true });
      return false;
    }
    ElMessageBox.confirm('是否确认提交？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        operationTask(
          {
            userIds: userId,
            taskId: props.taskId,
            message: '',
            messageType: ['1']
          },
          'addSignature'
        )
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
    return false;
  };

  /** 查询当前任务 */
  watch(
    () => props.taskId,
    (taskId) => {
      task.value = void 0;
      showDeleteModal.value = false;
      deleteUsers.value = [];
      if (!taskId) {
        return;
      }
      loading.value = true;
      getTask(taskId)
        .then((data) => {
          loading.value = false;
          task.value = data;
        })
        .catch((e) => {
          loading.value = false;
          EleMessage.error({ message: e.message, plain: true });
        });
    },
    { immediate: true }
  );
</script>

<style lang="scss">
  .ele-workflow-process-detail td.el-descriptions__label.el-descriptions__cell {
    width: 120px;
    text-align: right;
  }

  .ele-workflow-process-detail-title {
    font-weight: bold;
    margin-bottom: 16px;
    line-height: 1;
  }

  div.ele-workflow-process-buttons {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 12px;

    .el-button {
      margin: 0;
    }
  }
</style>
