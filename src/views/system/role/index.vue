<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <role-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="roleId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '角色' }"
        cache-key="SystemRoleTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'system:role:add',
                onClick: () => handleEdit()
              },
              {
                preset: 'del',
                permission: 'system:role:remove',
                onClick: () => handleRemove()
              },
              {
                preset: 'export',
                permission: 'system:role:export',
                onClick: () => handleExport()
              }
            ]"
          />
        </template>
        <template #status="{ row }">
          <el-switch
            size="small"
            :model-value="row.status == 0"
            @change="(checked) => handleEditStatus(checked, row)"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            v-if="row.roleId !== 1"
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'edit',
                permission: 'system:role:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'system:role:remove',
                onClick: () => handleRemove(row)
              },
              {
                preset: 'more',
                dropdownItems: [
                  {
                    title: '数据权限',
                    icon: ProtectOutlined,
                    permission: 'system:role:edit',
                    onClick: () => handleOpenAuth(row)
                  },
                  {
                    title: '分配用户',
                    icon: UserOutlined,
                    permission: 'system:role:edit',
                    divided: true,
                    onClick: () => handleOpenUser(row)
                  }
                ],
                dropdownProps: { trigger: 'click' }
              }
            ]"
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
  import { ProtectOutlined, UserOutlined } from '@/components/icons';
  import { useDictData } from '@/utils/use-dict-data';
  import RoleSearch from './components/role-search.vue';
  import {
    pageRole,
    removeRole,
    exportRole,
    updateRoleStatus
  } from '@/api/system/role';

  defineOptions({ name: 'SystemRole' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [statusDicts] = useDictData(['sys_normal_disable']);

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
        prop: 'roleName',
        label: '角色名称',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'roleKey',
        label: '权限字符',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'roleSort',
        label: '显示顺序',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'status',
        label: '状态',
        width: 90,
        align: 'center',
        slot: 'status',
        filters: statusDicts.value.map((d) => {
          return { text: d.dictLabel, value: d.dictValue };
        }),
        filterMultiple: false,
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
    ];
    return cols;
  });

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where, filters }) => {
    return pageRole({ ...where, ...filters, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/role-edit.vue'),
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
    ElMessageBox.confirm(
      `是否确认删除角色名称为"${rows.map((d) => d.roleName).join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeRole(rows.map((d) => d.roleId))
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

  /** 导出数据 */
  const handleExport = () => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    tableRef.value?.fetch?.(({ where, pages }) => {
      exportRole({ ...where, ...pages })
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 修改角色状态 */
  const handleEditStatus = (checked, row) => {
    const status = checked ? '0' : '1';
    updateRoleStatus(row.roleId, status)
      .then((msg) => {
        row.status = status;
        EleMessage.success({ message: msg, plain: true });
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 打开数据权限弹窗 */
  const handleOpenAuth = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/role-auth.vue'),
      componentProps: { data: row, onDone: () => reload() }
    });
  };

  /** 打开分配用户弹窗 */
  const handleOpenUser = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/role-user.vue'),
      componentProps: { data: row }
    });
  };
</script>
