<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <category-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="categoryId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        :export-config="{ fileName: '流程分类' }"
        :default-expand-all="true"
        :pagination="false"
        cache-key="WorkflowCategoryTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'workflow:category:add',
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
                permission: 'workflow:category:add',
                onClick: () => handleEdit(null, row.categoryId)
              },
              {
                preset: 'edit',
                permission: 'workflow:category:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'workflow:category:remove',
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
  import CategorySearch from './components/category-search.vue';
  import { listCategory, removeCategory } from '@/api/workflow/category';

  defineOptions({ name: 'WorkflowCategory' });

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
      prop: 'categoryName',
      label: '分类名称',
      minWidth: 160
    },
    {
      prop: 'orderNum',
      label: '显示顺序',
      minWidth: 90,
      align: 'center'
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
      width: 220,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true
    }
  ]);

  /** 表格数据源 */
  const datasource = async ({ where }) => {
    const data = await listCategory({ ...where });
    return toTree({
      data,
      idField: 'categoryId',
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
      asyncComponent: () => import('./components/category-edit.vue'),
      componentProps: { data: row, parentId: id, onDone: () => reload() }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    ElMessageBox.confirm(
      `是否确认删除"${row.categoryName}"的分类?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeCategory([row.categoryId])
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
