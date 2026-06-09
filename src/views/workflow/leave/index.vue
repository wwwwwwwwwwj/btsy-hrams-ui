<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <leave-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="id"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        :export-config="{ fileName: '请假申请' }"
        cache-key="WorkflowLeaveTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'workflow:leave:add',
                onClick: () => handleEdit()
              },
              {
                preset: 'export',
                permission: 'workflow:leave:export',
                onClick: () => handleExport()
              }
            ]"
          />
        </template>
        <template #status="{ row }">
          <dict-data
            code="wf_business_status"
            type="tag"
            :model-value="row.status"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'detail',
                onClick: () => handleDetail(row)
              },
              {
                preset: 'edit',
                permission: 'workflow:leave:edit',
                vIf: () =>
                  row.status === 'draft' ||
                  row.status === 'cancel' ||
                  row.status === 'back',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'workflow:leave:remove',
                vIf: () =>
                  row.status === 'draft' ||
                  row.status === 'cancel' ||
                  row.status === 'back',
                onClick: () => handleRemove(row)
              },
              {
                title: '撤销',
                icon: RollbackOutlined,
                props: { type: 'danger' },
                vIf: () => row.status === 'waiting',
                onClick: () => handleCancel(row)
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
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { RollbackOutlined } from '@/components/icons';
  import { useDictData } from '@/utils/use-dict-data';
  import LeaveSearch from './components/leave-search.vue';
  import { pageLeave, removeLeave, exportLeave } from '@/api/workflow/leave';
  import { cancelProcessApply } from '@/api/workflow/instance';

  defineOptions({ name: 'WorkflowLeave' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [businessStatusDicts] = useDictData(['wf_business_status']);

  /** 请假类型选项 */
  const options = [
    { value: '1', label: '事假' },
    { value: '2', label: '调休' },
    { value: '3', label: '病假' },
    { value: '4', label: '婚假' }
  ];

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center'
    },
    {
      prop: 'leaveType',
      label: '请假类型',
      align: 'center',
      minWidth: 110,
      formatter: (row) =>
        options.find((d) => d.value == row.leaveType)?.label ?? ''
    },
    {
      prop: 'startDate',
      label: '开始时间',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'endDate',
      label: '结束时间',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'leaveDays',
      label: '请假天数',
      width: 90,
      align: 'center'
    },
    {
      prop: 'remark',
      label: '请假原因',
      minWidth: 100,
      align: 'center'
    },
    {
      prop: 'status',
      label: '流程状态',
      minWidth: 90,
      align: 'center',
      slot: 'status',
      formatter: (row) =>
        businessStatusDicts.value.find((d) => d.dictValue == row.status)
          ?.dictLabel ?? ''
    },
    {
      columnKey: 'action',
      label: '操作',
      width: 220,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true
    }
  ]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    return pageLeave({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/leave-edit.vue'),
      componentProps: { data: row, onDone: () => reload() }
    });
  };

  /** 打开详情弹窗 */
  const handleDetail = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/leave-detail.vue'),
      componentProps: { data: row }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    ElMessageBox.confirm(
      `是否确认删除请假编号为"${row.id}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeLeave([row.id])
          .then(() => {
            loading.close();
            EleMessage.success({ message: '删除成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 撤销 */
  const handleCancel = (row) => {
    ElMessageBox.confirm('是否确认撤销当前单据？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        cancelProcessApply({
          businessId: row.id,
          message: '申请人撤销流程！'
        })
          .then(() => {
            loading.close();
            EleMessage.success({ message: '撤销成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 导出数据 */
  const handleExport = () => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    tableRef.value?.fetch?.(({ where, pages }) => {
      exportLeave({ ...where, ...pages })
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };
</script>
