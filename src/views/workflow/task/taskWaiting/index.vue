<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <waiting-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="id"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        :export-config="{ fileName: '我的待办' }"
        cache-key="WorkflowTaskTaskWaitingTable"
      >
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
              {
                title: '办理',
                icon: FormOutlined,
                onClick: () => handleApproval(row)
              }
            ]"
          />
        </template>
      </ele-pro-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { useModal } from 'ele-admin-plus';
  import { FormOutlined } from '@/components/icons';
  import { useDictData } from '@/utils/use-dict-data';
  import WaitingSearch from './components/waiting-search.vue';
  import { pageTaskWait } from '@/api/workflow/task';

  defineOptions({ name: 'WorkflowTaskTaskWaiting' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [businessStatusDicts] = useDictData(['wf_business_status']);

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center',
      fixed: 'left'
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
      prop: 'assigneeNames',
      label: '办理人',
      align: 'center',
      width: 110,
      formatter: (row) => row.assigneeNames || '无'
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
      width: 90,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true,
      fixed: 'right'
    }
  ]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    return pageTaskWait({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开办理弹窗 */
  const handleApproval = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/waiting-approval.vue'),
      componentProps: { data: row, onDone: () => reload() }
    });
  };
</script>
