<!-- 审批弹窗 -->
<template>
  <ele-modal
    :width="720"
    title="审批"
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
      <el-form-item label="附件">
        <common-upload
          v-model="form.fileId"
          list-type="file"
          :file-limit="20"
          :multiple="true"
          :drag="false"
          style="max-width: 460px"
        />
      </el-form-item>
      <el-form-item
        v-if="buttonObj.copy"
        label="抄送"
        class="ele-workflow-process-form-user-select-item"
      >
        <user-select
          :clearable="true"
          :multiple="true"
          v-model="form.flowCopyList"
          placeholder="请选择抄送人"
          :popper-props="{ title: '选择抄送人', closeOnClickModal: false }"
          :table-props="flowCopyTableProps"
          view-type="avatar"
          :select-style="{ width: '100%', flexWrap: 'wrap' }"
        />
      </el-form-item>
      <el-form-item
        v-if="buttonObj.pop && nestNodeList && nestNodeList.length > 0"
        label="下一步审批人"
      >
        <div
          v-for="item in nestNodeList"
          :key="item.nodeCode"
          class="ele-workflow-process-node-item"
        >
          <div class="ele-workflow-process-node-item-name">
            {{ item.nodeName }}
          </div>
          <user-select
            :clearable="true"
            :multiple="true"
            v-model="item.assignee"
            placeholder="请选择审批人"
            :popper-props="{ title: '选择审批人', closeOnClickModal: false }"
            view-type="avatar"
            :select-style="{ width: '100%', flexWrap: 'wrap' }"
          />
        </div>
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
      <el-button
        v-if="task?.flowStatus === 'waiting' && buttonObj.trust"
        type="primary"
        :icon="UserOutlined"
        class="ele-btn-icon"
        @click="handleDelegate"
      >
        委托
      </el-button>
      <el-button
        v-if="task?.flowStatus === 'waiting' && buttonObj.transfer"
        type="primary"
        :icon="RecoverOutlined"
        class="ele-btn-icon"
        @click="handleTransfer"
      >
        转办
      </el-button>
      <el-button
        v-if="
          task?.flowStatus === 'waiting' &&
          Number(task.nodeRatio) > 0 &&
          buttonObj.addSign
        "
        type="primary"
        :icon="PlusCircleOutlined"
        class="ele-btn-icon"
        @click="handleOpenMulti"
      >
        加签
      </el-button>
      <el-button
        v-if="
          task?.flowStatus === 'waiting' &&
          Number(task.nodeRatio) > 0 &&
          buttonObj.subSign
        "
        type="primary"
        :icon="MinusCircleOutlined"
        class="ele-btn-icon"
        @click="handleOpenDelete"
      >
        减签
      </el-button>
      <el-button
        v-if="task?.flowStatus === 'waiting' && buttonObj.termination"
        type="danger"
        :icon="StopOutlined"
        class="ele-btn-icon"
        @click="handleTermination"
      >
        终止
      </el-button>
      <el-button
        v-if="task?.flowStatus === 'waiting' && buttonObj.back"
        type="danger"
        class="ele-btn-icon"
        @click="handleOpenBack"
      >
        <ElIcon style="margin: 0 -2px; transform: translateY(-1px)">
          <RollbackOutlined />
        </ElIcon>
        <span>退回</span>
      </el-button>
      <el-button
        type="primary"
        :icon="CheckCircleOutlined"
        class="ele-btn-icon"
        @click="handleSubmit"
      >
        提交
      </el-button>
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
    <!-- 退回弹窗 -->
    <ele-modal
      :width="460"
      title="驳回"
      :form="true"
      position="center"
      v-model="showBackModal"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px" @submit.prevent="">
        <el-form-item label="驳回节点">
          <el-select
            :clearable="true"
            v-model="backForm.nodeCode"
            placeholder="请选择驳回节点"
          >
            <el-option
              v-for="item in taskNodeList"
              :key="item.nodeCode"
              :value="item.nodeCode"
              :label="item.nodeName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="消息提醒">
          <el-checkbox-group v-model="backForm.messageType">
            <el-checkbox label="站内信" value="1" disabled />
            <el-checkbox label="邮件" value="2" />
            <el-checkbox label="短信" value="3" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="附件">
          <common-upload
            v-model="backForm.fileId"
            list-type="file"
            :file-limit="20"
            :multiple="true"
            :drag="false"
            style="max-width: 460px"
          />
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            :rows="3"
            type="textarea"
            v-model="backForm.message"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelBack">取消</el-button>
        <el-button type="primary" @click="handleBack">提交</el-button>
      </template>
    </ele-modal>
    <!-- 人员选择弹窗 -->
    <user-select
      v-model:visible="showUserSelect"
      view-type="picker"
      :multiple="userSelectType === 'addSignature'"
      :popper-props="{ title: '选择办理人', closeOnClickModal: false }"
      :beforeConfirm="handleUserSelect"
    />
  </ele-modal>
</template>

<script setup>
  import { ref, computed, watch } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage } from 'ele-admin-plus';
  import {
    CheckCircleOutlined,
    StopOutlined,
    RecoverOutlined,
    RollbackOutlined,
    UserOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined
  } from '@/components/icons';
  import { useFormData } from '@/utils/use-form-data';
  import CommonUpload from '@/components/CommonUpload/index.vue';
  import UserSelect from '@/components/UserSelect/index.vue';
  import {
    completeTask,
    terminationTask,
    operationTask,
    listCurrentTaskAllUser,
    getBackTaskNode,
    backProcess,
    getNextNodeList
  } from '@/api/workflow/task';

  defineOptions({ name: 'ApprovalModal' });

  const props = defineProps({
    /** 当前任务 */
    task: Object,
    /** 流程变量 */
    taskVariables: Object
  });

  const emit = defineEmits({
    done: () => true
  });

  /** 弹窗是否打开 */
  const visible = defineModel({ type: Boolean });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    messageType: ['1'],
    message: '',
    fileId: [],
    flowCopyList: []
  });

  /** 下一节点列表 */
  const nestNodeList = ref([]);

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

  /** 人员选择操作类型 */
  const userSelectType = ref();

  /** 是否显示退回弹窗 */
  const showBackModal = ref(false);

  /** 可驳回的任务节点 */
  const taskNodeList = ref([]);

  /** 退回表单数据 */
  const [backForm, resetBackFormFields] = useFormData({
    nodeCode: void 0,
    messageType: ['1'],
    message: '',
    fileId: [],
    variables: {}
  });

  /** 操作按钮 */
  const buttonObj = computed(() => {
    const obj = {};
    (props.task?.buttonList || []).forEach((d) => {
      obj[d.code] = !!d.show;
    });
    return obj;
  });

  /** 抄送人选择表格属性 */
  const flowCopyTableProps = {
    parseData: (result) => {
      if (result.rows) {
        result.rows = result.rows.map((d) => ({
          ...d,
          userId: JSON.stringify({
            userId: d.userId,
            userName: d.nickName
          })
        }));
      }
      return result;
    }
  };

  /** 关闭退回弹窗 */
  const handleCancelBack = () => {
    showBackModal.value = false;
  };

  /** 关闭弹窗 */
  const handleCancel = () => {
    visible.value = false;
    showDeleteModal.value = false;
    handleCancelBack();
    showUserSelect.value = false;
  };

  /** 提交 */
  const handleSubmit = () => {
    // 附件
    const fileId = form.fileId
      .map((d) => d.response?.ossId)
      .filter((d) => !!d)
      .join();
    // 抄送人
    const flowCopyList = (form.flowCopyList || []).map((d) => JSON.parse(d));
    // 审批人
    const assigneeMap = {};
    if (buttonObj.value.pop && nestNodeList.value?.length) {
      let verify = true;
      nestNodeList.value.forEach((d) => {
        if (!d.assignee?.length) {
          verify = false;
        } else {
          assigneeMap[d.nodeCode] = d.assignee.join();
        }
      });
      if (!verify) {
        EleMessage.error({ message: '请选择审批人', plain: true });
        return;
      }
    }
    const data = {
      ...form,
      fileId,
      assigneeMap,
      flowCopyList,
      taskId: props.task?.id,
      taskVariables: props.taskVariables || {},
      variables: {}
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
        completeTask(data)
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

  /** 打开减签弹窗 */
  const handleOpenDelete = () => {
    deleteUsers.value = [];
    deleteUserLoading.value = true;
    showDeleteModal.value = true;
    listCurrentTaskAllUser(props.task?.id)
      .then((data) => {
        deleteUsers.value = (data || []).map((d) => ({
          ...d,
          nodeName: props.task?.nodeName
        }));
        deleteUserLoading.value = false;
      })
      .catch((e) => {
        deleteUserLoading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 减签 */
  const handleDelete = (row) => {
    const data = {
      userIds: [row.userId],
      taskId: props.task?.id,
      message: form.message,
      messageType: ['1']
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
        operationTask(data, 'reductionSignature')
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
    const data = {
      taskId: props.task?.id,
      comment: form.message
    };
    ElMessageBox.confirm('是否确认终止？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        terminationTask(data)
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

  /** 打开委托选择弹窗 */
  const handleDelegate = () => {
    userSelectType.value = 'delegateTask';
    showUserSelect.value = true;
  };

  /** 打开加签选择弹窗 */
  const handleOpenMulti = () => {
    userSelectType.value = 'addSignature';
    showUserSelect.value = true;
  };

  /** 打开转办选择弹窗 */
  const handleTransfer = () => {
    userSelectType.value = 'transferTask';
    showUserSelect.value = true;
  };

  /** 人员选择完成事件 */
  const handleUserSelect = (selectData) => {
    // 转办
    if (userSelectType.value === 'transferTask') {
      const userId = selectData?.userId;
      if (!userId) {
        EleMessage.error({ message: '请选择用户', plain: true });
        return false;
      }
      const data = {
        userId,
        taskId: props.task?.id,
        message: form.message,
        messageType: ['1']
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
          operationTask(data, 'transferTask')
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
    if (userSelectType.value === 'addSignature') {
      const userId = (selectData || []).map((d) => d.userId);
      if (!userId?.length) {
        EleMessage.error({ message: '请选择用户', plain: true });
        return false;
      }
      const data = {
        userIds: userId,
        taskId: props.task?.id,
        message: form.message,
        messageType: ['1']
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
          operationTask(data, 'addSignature')
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
    // 委托
    if (userSelectType.value === 'delegateTask') {
      const userId = selectData?.userId;
      if (!userId) {
        EleMessage.error({ message: '请选择用户', plain: true });
        return false;
      }
      const data = {
        userId,
        taskId: props.task?.id,
        message: form.message,
        messageType: ['1']
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
          operationTask(data, 'delegateTask')
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
  };

  /** 打开退回弹窗 */
  const handleOpenBack = () => {
    resetBackFormFields();
    taskNodeList.value = [];
    showBackModal.value = true;
    getBackTaskNode(props.task?.id, props.task?.nodeCode)
      .then((data) => {
        taskNodeList.value = data ?? [];
        backForm.nodeCode = data?.[0]?.nodeCode;
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 退回 */
  const handleBack = () => {
    const fileId = backForm.fileId
      .map((d) => d.response?.ossId)
      .filter((d) => !!d)
      .join();
    const data = { ...backForm, fileId, taskId: props.task?.id };
    ElMessageBox.confirm('是否确认驳回到申请人？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        backProcess(data)
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
      nestNodeList.value = [];
      getNextNodeList({
        taskId: props.task?.id,
        variables: props.taskVariables
      })
        .then((data) => {
          nestNodeList.value = data ?? [];
        })
        .catch((e) => {
          EleMessage.error({ message: e.message, plain: true });
        });
    }
  });
</script>
