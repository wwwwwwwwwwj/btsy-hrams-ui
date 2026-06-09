<template>
  <ele-drawer
    :size="980"
    :title="`[${data?.roleName}]分配用户`"
    :body-style="{ padding: '14px 16px' }"
    flex-table="auto"
    v-bind="modalProps"
  >
    <role-user-search
      style="margin-bottom: -8px"
      @search="(where) => reload(where, 1)"
    />
    <ele-pro-table
      ref="tableRef"
      row-key="userId"
      :columns="columns"
      :datasource="datasource"
      :show-overflow-tooltip="true"
      :highlight-current-row="true"
      v-model:selections="selections"
      :export-config="{ fileName: '角色用户' }"
      cache-key="SystemRoleUserTable"
    >
      <template #toolbar>
        <btn-items
          :items="[
            {
              preset: 'add',
              title: '添加用户',
              permission: 'system:role:add',
              onClick: () => handleEdit()
            },
            {
              preset: 'del',
              title: '批量取消',
              permission: 'system:role:remove',
              onClick: () => handleRemove()
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
      <template #action="{ row }">
        <btn-items
          :divider="true"
          type="link"
          :items="[
            {
              preset: 'del',
              title: '取消授权',
              onClick: () => handleRemove(row)
            }
          ]"
        />
      </template>
    </ele-pro-table>
  </ele-drawer>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { usePermission } from '@/utils/use-permission';
  import { useDictData } from '@/utils/use-dict-data';
  import RoleUserSearch from './role-user-search.vue';
  import { listRoleUser, removeRoleUser } from '@/api/system/role';

  const props = defineProps({
    /** 角色 */
    data: Object
  });

  const { openModal, modalProps } = useModal();

  const { hasPermission } = usePermission();

  /** 字典数据 */
  const [statusDicts] = useDictData(['sys_common_status']);

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
        prop: 'userName',
        label: '用户名称',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'nickName',
        label: '用户昵称',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'email',
        label: '邮箱',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'phonenumber',
        label: '手机号码',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'status',
        label: '状态',
        width: 90,
        align: 'center',
        slot: 'status',
        formatter: (row) =>
          statusDicts.value.find((d) => d.dictValue == row.status)?.dictLabel ??
          ''
      },
      {
        prop: 'createTime',
        label: '创建时间',
        align: 'center',
        width: 180
      }
    ];
    if (hasPermission('system:role:remove')) {
      cols.push({
        columnKey: 'action',
        label: '操作',
        width: 112,
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
  const datasource = ({ pages, where }) => {
    return listRoleUser({ ...where, ...pages, roleId: props.data?.roleId });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 添加用户 */
  const handleEdit = () => {
    openModal({
      custom: true,
      asyncComponent: () => import('./role-user-select.vue'),
      componentProps: { roleId: props.data?.roleId, onDone: () => reload() }
    });
  };

  /** 批量取消 */
  const handleRemove = (row) => {
    const rows = row == null ? selections.value : [row];
    if (!rows.length) {
      EleMessage.error({ message: '请至少选择一条数据', plain: true });
      return;
    }
    ElMessageBox.confirm(
      `确认要取消该用户“${rows.map((d) => d.userName).join()}”的角色吗?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeRoleUser({
          roleId: props.data?.roleId,
          userIds: rows.map((d) => d.userId).join()
        })
          .then(() => {
            loading.close();
            EleMessage.success({ message: '取消授权成功', plain: true });
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
