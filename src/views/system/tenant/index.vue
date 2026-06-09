<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <tenant-search @search="(where) => reload(where, 1)" />
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
        :export-config="{ fileName: '租户' }"
        cache-key="SystemTenantTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'system:tenant:add',
                onClick: () => handleEdit()
              },
              {
                preset: 'del',
                permission: 'system:tenant:remove',
                props: { class: 'hidden-sm-and-down' },
                onClick: () => handleRemove()
              },
              {
                preset: 'export',
                permission: 'system:tenant:export',
                onClick: () => handleExport()
              },
              {
                title: '同步租户字典',
                icon: SyncOutlined,
                vIf: () => loginUser.userId === 1,
                props: { type: 'default' },
                onClick: () => handleSyncTenantDict()
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
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'edit',
                permission: 'system:tenant:edit',
                onClick: () => handleEdit(row)
              },
              {
                title: '同步套餐',
                icon: SyncOutlined,
                permission: 'system:tenant:edit',
                onClick: () => handleSyncTenantPackage(row)
              },
              {
                preset: 'del',
                permission: 'system:tenant:remove',
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
  import { ref, computed } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { SyncOutlined } from '@/components/icons';
  import { useUserStore } from '@/store/modules/user';
  import { useDictData } from '@/utils/use-dict-data';
  import TenantSearch from './components/tenant-search.vue';
  import {
    pageTenant,
    removeTenant,
    exportTenant,
    updateTenantStatus,
    syncTenantDict,
    syncTenantPackage
  } from '@/api/system/tenant';

  defineOptions({ name: 'SystemTenant' });

  const { openModal } = useModal();

  const userStore = useUserStore();

  /** 当前登录用户 */
  const loginUser = computed(() => userStore.info ?? {});

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
        prop: 'tenantId',
        label: '租户编号',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'contactUserName',
        label: '联系人',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'contactPhone',
        label: '联系电话',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'companyName',
        label: '企业名称',
        minWidth: 110,
        align: 'center'
      },
      {
        prop: 'licenseNumber',
        label: '社会信用代码',
        minWidth: 110,
        align: 'center'
      },
      {
        prop: 'expireTime',
        label: '过期时间',
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
        columnKey: 'action',
        label: '操作',
        width: 240,
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
  const datasource = ({ pages, where }) => {
    return pageTenant({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/tenant-edit.vue'),
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
      `是否确认删除租户编号为"${rows.map((d) => d.tenantId).join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeTenant(rows.map((d) => d.id))
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

  /** 修改状态 */
  const handleEditStatus = (checked, row) => {
    const status = checked ? '0' : '1';
    updateTenantStatus(row.id, row.tenantId, status)
      .then((msg) => {
        row.status = status;
        EleMessage.success({ message: msg, plain: true });
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 导出数据 */
  const handleExport = () => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    tableRef.value?.fetch?.(({ where, orders, pages }) => {
      exportTenant({ ...where, ...orders, ...pages })
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 同步租户字典 */
  const handleSyncTenantDict = () => {
    ElMessageBox.confirm('确认要同步所有租户字典吗？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        syncTenantDict()
          .then((msg) => {
            loading.close();
            EleMessage.success({ message: msg, plain: true });
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 同步套餐 */
  const handleSyncTenantPackage = (row) => {
    ElMessageBox.confirm(
      `是否确认同步租户套餐租户编号为"${row.tenantId}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        syncTenantPackage(row)
          .then(() => {
            loading.close();
            EleMessage.success({ message: '同步成功', plain: true });
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
