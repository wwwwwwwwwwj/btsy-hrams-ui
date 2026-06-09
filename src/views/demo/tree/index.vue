<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <tree-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="id"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        :export-config="{ fileName: '测试树' }"
        :default-expand-all="true"
        :pagination="false"
        cache-key="DemoTreeTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'demo:tree:add',
                onClick: () => handleEdit()
              },
              { preset: 'expand', onClick: () => handleExpandAll() },
              { preset: 'fold', onClick: () => handleFoldAll() }
            ]"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'add',
                permission: 'demo:tree:add',
                onClick: () => handleEdit(null, row.id)
              },
              {
                preset: 'edit',
                permission: 'demo:tree:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'demo:tree:remove',
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
  import { EleMessage, useModal, toTree } from 'ele-admin-plus';
  import TreeSearch from './components/tree-search.vue';
  import { listTree, removeTree } from '@/api/demo/tree';

  defineOptions({ name: 'DemoTree' });

  const { openModal } = useModal();

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
      prop: 'parentId',
      label: '父id',
      minWidth: 110
    },
    {
      prop: 'deptId',
      label: '部门id',
      minWidth: 110,
      align: 'center'
    },
    {
      prop: 'userId',
      label: '用户id',
      minWidth: 110,
      align: 'center'
    },
    {
      prop: 'treeName',
      label: '树节点名',
      minWidth: 110,
      align: 'center'
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
  const datasource = async ({ where }) => {
    const data = await listTree({ ...where });
    return toTree({
      data,
      idField: 'id',
      parentIdField: 'parentId'
    });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row, id) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/tree-edit.vue'),
      componentProps: { data: row, parentId: id, onDone: () => reload() }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    ElMessageBox.confirm(
      `是否确认删除测试树编号为"${row.id}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeTree([row.id])
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

  /** 展开全部 */
  const handleExpandAll = () => {
    tableRef.value?.toggleRowExpansionAll?.(true);
  };

  /** 折叠全部 */
  const handleFoldAll = () => {
    tableRef.value?.toggleRowExpansionAll?.(false);
  };
</script>
