<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <menu-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="menuId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        :export-config="{ fileName: '菜单' }"
        :default-expand-all="false"
        :pagination="false"
        cache-key="SystemMenuTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'system:menu:add',
                onClick: () => handleEdit()
              },
              { preset: 'expand', onClick: () => handleExpandAll() },
              { preset: 'fold', onClick: () => handleFoldAll() }
            ]"
          />
        </template>
        <template #menuName="{ row }">
          <menu-icon
            v-if="row.icon"
            :icon="row.icon"
            :component-props="{ size: 15 }"
            :component-style="{ marginRight: '4px', verticalAlign: '-2px' }"
            :img-style="{ marginRight: '2px', verticalAlign: '-5px' }"
          />
          <span>{{ row.menuName }}</span>
        </template>
        <template #menuType="{ row }">
          <el-tag
            v-if="row.isFrame == '0'"
            size="small"
            type="danger"
            :disable-transitions="true"
          >
            外链
          </el-tag>
          <el-tag
            v-else-if="row.menuType === 'M'"
            size="small"
            :disable-transitions="true"
          >
            目录
          </el-tag>
          <el-tag
            v-else-if="row.menuType === 'C'"
            size="small"
            type="success"
            :disable-transitions="true"
          >
            菜单
          </el-tag>
          <el-tag
            v-else-if="row.menuType === 'F'"
            size="small"
            type="info"
            :disable-transitions="true"
          >
            按钮
          </el-tag>
        </template>
        <template #visible="{ row }">
          <dict-data
            code="sys_show_hide"
            type="tag"
            :model-value="row.visible"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'add',
                permission: 'system:menu:add',
                onClick: () => handleEdit(null, row.menuId)
              },
              {
                preset: 'edit',
                permission: 'system:menu:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'system:menu:remove',
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
  import { useDictData } from '@/utils/use-dict-data';
  import MenuSearch from './components/menu-search.vue';
  import { listMenu, removeMenu } from '@/api/system/menu';

  defineOptions({ name: 'SystemMenu' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [visibleDicts] = useDictData(['sys_show_hide']);

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
      prop: 'menuName',
      label: '菜单名称',
      slot: 'menuName',
      minWidth: 160
    },
    {
      prop: 'path',
      label: '路由地址',
      minWidth: 110
    },
    {
      prop: 'orderNum',
      label: '排序',
      align: 'center',
      width: 100
    },
    {
      prop: 'visible',
      label: '状态',
      align: 'center',
      slot: 'visible',
      width: 100,
      formatter: (row) =>
        visibleDicts.value.find((d) => d.dictValue == row.visible)?.dictLabel
    },
    {
      prop: 'menuType',
      label: '类型',
      align: 'center',
      slot: 'menuType',
      width: 100,
      formatter: (row) => ({ M: '目录', C: '菜单', F: '按钮' })[row.menuType]
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
    const data = await listMenu({ ...where });
    return toTree({
      data,
      idField: 'menuId',
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
      asyncComponent: () => import('./components/menu-edit.vue'),
      componentProps: { data: row, parentId: id, onDone: () => reload() }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    ElMessageBox.confirm(
      `是否确认删除名称为“${row.menuName}”的数据项？`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeMenu([row.menuId])
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
