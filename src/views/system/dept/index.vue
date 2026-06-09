<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <dept-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="deptId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        :export-config="{ fileName: '部门' }"
        :default-expand-all="true"
        :pagination="false"
        cache-key="SystemDeptTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'system:dept:add',
                onClick: () => handleEdit()
              },
              { preset: 'expand', onClick: () => handleExpandAll() },
              { preset: 'fold', onClick: () => handleFoldAll() }
            ]"
          />
        </template>
        <template #deptName="{ row }">
          <el-icon :size="15" style="margin-right: 4px; vertical-align: -2px">
            <CityOutlined />
          </el-icon>
          <span>{{ row.deptName }}</span>
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
                preset: 'add',
                permission: 'system:dept:add',
                onClick: () => handleEdit(null, row.deptId)
              },
              {
                preset: 'edit',
                permission: 'system:dept:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'system:dept:remove',
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
  import { CityOutlined } from '@/components/icons';
  import { useDictData } from '@/utils/use-dict-data';
  import DeptSearch from './components/dept-search.vue';
  import { listDept, removeDept } from '@/api/system/dept';

  defineOptions({ name: 'SystemDept' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [statusDicts] = useDictData(['sys_normal_disable']);

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
      prop: 'deptName',
      label: '部门名称',
      slot: 'deptName',
      minWidth: 160
    },
    {
      prop: 'deptCategory',
      label: '类别编码',
      minWidth: 120
    },
    {
      prop: 'orderNum',
      label: '排序',
      align: 'center',
      minWidth: 90
    },
    {
      prop: 'status',
      label: '状态',
      align: 'center',
      slot: 'status',
      minWidth: 90,
      formatter: (row) =>
        statusDicts.value.find((d) => d.dictValue == row.status)?.dictLabel ??
        ''
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
    const data = await listDept({ ...where });
    return toTree({
      data,
      idField: 'deptId',
      parentIdField: 'parentId'
    });
  };

  /** 刷新表格 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row, id) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/dept-edit.vue'),
      componentProps: { data: row, parentId: id, onDone: () => reload() }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    ElMessageBox.confirm(
      `是否确认删除名称为“${row.deptName}”的数据项？`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeDept([row.deptId])
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
