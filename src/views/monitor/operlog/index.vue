<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <operlog-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="operId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '操作日志' }"
        cache-key="MonitorOperlogTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'del',
                permission: 'monitor:operlog:remove',
                onClick: () => handleRemove()
              },
              {
                title: '清空',
                icon: CloseCircleOutlined,
                props: { type: 'danger', plain: true },
                permission: 'monitor:operlog:remove',
                onClick: () => handleClear()
              },
              {
                preset: 'export',
                permission: 'monitor:operlog:export',
                onClick: () => handleExport()
              }
            ]"
          />
        </template>
        <template #status="{ row }">
          <dict-data
            code="sys_common_status"
            type="tag"
            :model-value="row.status"
          />
        </template>
        <template #businessType="{ row }">
          <dict-data
            code="sys_oper_type"
            type="tag"
            :model-value="row.businessType"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[{ preset: 'detail', onClick: () => handleDetail(row) }]"
          />
        </template>
      </ele-pro-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { CloseCircleOutlined } from '@/components/icons';
  import { usePermission } from '@/utils/use-permission';
  import { useDictData } from '@/utils/use-dict-data';
  import OperlogSearch from './components/operlog-search.vue';
  import {
    pageOperlog,
    exportOperlog,
    removeOperlog,
    clearOperlog
  } from '@/api/monitor/operlog';

  defineOptions({ name: 'MonitorOperlog' });

  const { openModal } = useModal();

  const { hasPermission } = usePermission();

  /** 字典数据 */
  const [statusDicts, operTypeDicts] = useDictData([
    'sys_common_status',
    'sys_oper_type'
  ]);

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = computed(() => {
    const cols = [
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
        prop: 'title',
        label: '系统模块',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'businessType',
        label: '操作类型',
        width: 110,
        slot: 'businessType',
        align: 'center',
        filters: operTypeDicts.value.map((d) => {
          return { text: d.dictLabel, value: d.dictValue };
        }),
        filterMultiple: false,
        formatter: (row) =>
          operTypeDicts.value.find((d) => d.dictValue == row.businessType)
            ?.dictLabel ?? ''
      },
      {
        prop: 'operName',
        label: '操作人员',
        sortable: 'custom',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'deptName',
        label: '部门',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'operIp',
        label: '操作地址',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'operLocation',
        label: '操作地点',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'status',
        label: '操作状态',
        width: 110,
        slot: 'status',
        align: 'center',
        filters: statusDicts.value.map((d) => {
          return { text: d.dictLabel, value: d.dictValue };
        }),
        filterMultiple: false,
        formatter: (row) =>
          statusDicts.value.find((d) => d.dictValue == row.status)?.dictLabel ??
          ''
      },
      {
        prop: 'operTime',
        label: '操作日期',
        sortable: 'custom',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'costTime',
        label: '消耗时间',
        sortable: 'custom',
        align: 'center',
        formatter: (row) => `${row.costTime}毫秒`,
        width: 110
      }
    ];
    if (hasPermission('monitor:operlog:query')) {
      cols.push({
        columnKey: 'action',
        label: '操作',
        width: 90,
        align: 'center',
        slot: 'action',
        hideInPrint: true,
        hideInExport: true
      });
    }
    return cols;
  });

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where, orders, filters }) => {
    return pageOperlog({ ...where, ...orders, ...filters, ...pages });
  };

  /** 刷新表格 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 详情 */
  const handleDetail = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/operlog-detail.vue'),
      componentProps: { data: row }
    });
  };

  /** 导出数据 */
  const handleExport = () => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    tableRef.value?.fetch?.(({ where, orders, filters, pages }) => {
      exportOperlog({ ...where, ...orders, ...filters, ...pages })
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 删除 */
  const handleRemove = () => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请至少选择一条数据', plain: true });
      return;
    }
    const ids = selections.value.map((d) => d.operId);
    ElMessageBox.confirm(
      `是否确认删除日志编号为"${ids.join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true, customStyle: { maxWidth: '442px' } }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeOperlog(ids)
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

  /** 清空 */
  const handleClear = () => {
    ElMessageBox.confirm('是否确认清空所有操作日志数据项？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        clearOperlog()
          .then(() => {
            loading.close();
            EleMessage.success({ message: '清空成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };
</script>
