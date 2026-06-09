<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <waiting-search @search="(where) => reload(where, 1)" />
    <ele-card
      bordered
      :body-style="{ paddingTop: '6px' }"
      :header-style="{ padding: 0, border: 'none' }"
      flex-table="auto"
    >
      <template #header>
        <ele-tab-bar
          v-model="tabActive"
          :items="[
            { value: 'waiting', label: '待办任务' },
            { value: 'finish', label: '已办任务' }
          ]"
          :item-style="{ height: '48px', lineHeight: '48px', margin: '0 14px' }"
          :style="{ padding: '0 6px' }"
          @change="reload(void 0, 1)"
        />
      </template>
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{
          fileName: tabActive === 'waiting' ? '待办任务' : '已办任务'
        }"
        cache-key="WorkflowTaskAllTaskWaitingTable"
      >
        <template #toolbar>
          <el-button
            type="primary"
            class="ele-btn-icon"
            :icon="FormOutlined"
            :disabled="tabActive !== 'waiting'"
            :style="tabActive === 'waiting' ? void 0 : { visibility: 'hidden' }"
            @click="handleAssignee()"
          >
            修改办理人
          </el-button>
          <el-button
            type="warning"
            class="ele-btn-icon"
            :icon="BellOutlined"
            :disabled="tabActive !== 'waiting'"
            :style="tabActive === 'waiting' ? void 0 : { visibility: 'hidden' }"
            @click="handleUrge()"
          >
            催办
          </el-button>
        </template>
        <template #flowStatus="{ row }">
          <dict-data
            code="wf_business_status"
            type="tag"
            :model-value="row.flowStatus"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              { preset: 'detail', onClick: () => handleDetail(row) },
              {
                title: '流程干预',
                icon: SwapOutlined,
                vIf: () => tabActive === 'waiting',
                onClick: () => handleMeddle(row)
              }
            ]"
          />
        </template>
      </ele-pro-table>
    </ele-card>
    <!-- 催办弹窗 -->
    <urge-modal
      v-model="showUrge"
      :task-id-list="urgeTaskIdList"
      @done="reload()"
    />
    <!-- 流程干预弹窗 -->
    <meddle-modal
      v-model="showMeddle"
      :task-id="meddleTaskId"
      @done="reload()"
    />
    <!-- 人员选择弹窗 -->
    <user-select
      v-model:visible="showAssigneeSelect"
      view-type="picker"
      :popper-props="{ title: '选择办理人', closeOnClickModal: false }"
      :before-confirm="handleAssigneeSelect"
    />
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { FormOutlined, SwapOutlined, BellOutlined } from '@/components/icons';
  import { useDictData } from '@/utils/use-dict-data';
  import MeddleModal from '@/components/WorkflowProcess/components/meddle-modal.vue';
  import UrgeModal from '@/components/WorkflowProcess/components/urge-modal.vue';
  import WaitingSearch from './components/waiting-search.vue';
  import {
    pageAllTaskWait,
    pageAllTaskFinish,
    updateAssignee
  } from '@/api/workflow/task';

  defineOptions({ name: 'WorkflowTaskAllTaskWaiting' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [businessStatusDicts] = useDictData(['wf_business_status']);

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'selection',
      columnKey: 'selection',
      width: 50,
      align: 'center',
      showOverflowTooltip: false
    },
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center'
    },
    {
      prop: 'businessCode',
      label: '业务编码',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'businessTitle',
      label: '业务标题',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'flowName',
      label: '流程定义名称',
      align: 'center',
      minWidth: 120
    },
    {
      prop: 'flowCode',
      label: '流程定义编码',
      align: 'center',
      minWidth: 120
    },
    {
      prop: 'categoryName',
      label: '流程分类',
      align: 'center',
      width: 110
    },
    {
      prop: 'version',
      label: '版本号',
      width: 80,
      align: 'center',
      formatter: (row) => `v${row.version}.0`
    },
    {
      prop: 'nodeName',
      label: '任务名称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'createByName',
      label: '申请人',
      align: 'center',
      width: 110
    },
    {
      prop: 'approveName',
      label: '办理人',
      align: 'center',
      width: 110,
      formatter: (row) =>
        (tabActive.value === 'waiting' ? row.assigneeNames : row.approveName) ||
        '无'
    },
    {
      prop: 'flowStatus',
      label: '流程状态',
      align: 'center',
      width: 90,
      slot: 'flowStatus',
      formatter: (row) =>
        businessStatusDicts.value.find((d) => d.dictValue == row.flowStatus)
          ?.dictLabel ?? ''
    },
    {
      prop: 'createTime',
      label: '创建时间',
      align: 'center',
      width: 180
    },
    {
      columnKey: 'action',
      label: '操作',
      width: 176,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true,
      fixed: 'right'
    }
  ]);

  /** 表格选中数据 */
  const selections = ref([]);

  /** 是否显示流程干预弹窗 */
  const showMeddle = ref(false);

  /** 流程干预任务id */
  const meddleTaskId = ref();

  /** 选项卡选中 */
  const tabActive = ref('waiting');

  /** 是否显示人员选择弹窗 */
  const showAssigneeSelect = ref(false);

  /** 是否显示催办弹窗 */
  const showUrge = ref(false);

  /** 催办任务id */
  const urgeTaskIdList = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    if (tabActive.value === 'waiting') {
      return pageAllTaskWait({ ...where, ...pages });
    }
    return pageAllTaskFinish({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    selections.value = [];
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开详情弹窗 */
  const handleDetail = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/waiting-detail.vue'),
      componentProps: { data: row }
    });
  };

  /** 打开流程干预弹窗 */
  const handleMeddle = (row) => {
    meddleTaskId.value = row.id;
    showMeddle.value = true;
  };

  /** 打开办理人选择弹窗 */
  const handleAssignee = () => {
    const rows = selections.value;
    if (!rows.length) {
      EleMessage.error({ message: '请至少选择一条数据', plain: true });
      return;
    }
    showAssigneeSelect.value = true;
  };

  /** 修改办理人 */
  const handleAssigneeSelect = (selectData) => {
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
        updateAssignee(
          selections.value.map((d) => d.id),
          userId
        )
          .then(() => {
            loading.close();
            EleMessage.success({ message: '操作成功', plain: true });
            reload();
            showAssigneeSelect.value = false;
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
    return false;
  };

  /** 打开催办弹窗 */
  const handleUrge = () => {
    const rows = selections.value;
    if (!rows.length) {
      EleMessage.error({ message: '请至少选择一条数据', plain: true });
      return;
    }
    urgeTaskIdList.value = rows.map((d) => d.id);
    showUrge.value = true;
  };
</script>
