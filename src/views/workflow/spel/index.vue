<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <spel-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="id"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '流程表达式' }"
        cache-key="WorkflowSpelTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'workflow:spel:add',
                onClick: () => handleEdit()
              },
              {
                preset: 'del',
                permission: 'workflow:spel:remove',
                onClick: () => handleRemove()
              }
            ]"
          />
        </template>
        <template #status="{ row }">
          <dict-data
            :model-value="row.status"
            type="tag"
            code="sys_normal_disable"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'edit',
                permission: 'workflow:spel:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'workflow:spel:remove',
                onClick: () => handleRemove(row)
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
  import { useDictData } from '@/utils/use-dict-data';
  import SpelSearch from './components/spel-search.vue';
  import { pageSpel, removeSpel } from '@/api/workflow/spel';

  defineOptions({ name: 'WorkflowSpel' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [statusDicts] = useDictData(['sys_normal_disable']);

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
      prop: 'componentName',
      label: '组件名称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'methodName',
      label: '方法名称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'methodParams',
      label: '参数名称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'viewSpel',
      label: 'SPEL表达式',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      align: 'center',
      slot: 'status',
      formatter: (row) =>
        statusDicts.value.find((d) => d.dictValue == row.status)?.dictLabel ??
        ''
    },
    {
      prop: 'remark',
      label: '备注',
      align: 'center',
      minWidth: 110
    },
    {
      columnKey: 'action',
      label: '操作',
      width: 156,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true
    }
  ]);

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    return pageSpel({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/spel-edit.vue'),
      componentProps: { data: row, onDone: () => reload() }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    const rows = row == null ? selections.value : [row];
    if (!rows.length) {
      EleMessage.error({ message: '请至少选择一条数据', plain: true });
      return;
    }
    const ids = rows.map((d) => d.id);
    ElMessageBox.confirm(
      `是否确认删除流程spel表达式定义编号为"${ids.join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeSpel(ids)
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
</script>
