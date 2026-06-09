<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <client-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="id"
        :columns="columns"
        :datasource="datasource"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '客户端' }"
        cache-key="SystemClientTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'system:client:add',
                onClick: () => handleEdit()
              },
              {
                preset: 'del',
                permission: 'system:client:remove',
                onClick: () => handleRemove()
              },
              {
                preset: 'export',
                permission: 'system:client:export',
                onClick: () => handleExport()
              }
            ]"
          />
        </template>
        <template #grantTypeList="{ row }">
          <div
            style="
              display: inline-flex;
              gap: 4px;
              flex-wrap: wrap;
              justify-content: center;
            "
          >
            <dict-data
              code="sys_grant_type"
              type="tag"
              :model-value="row.grantTypeList"
            />
          </div>
        </template>
        <template #deviceType="{ row }">
          <dict-data
            code="sys_device_type"
            type="text"
            :model-value="row.deviceType"
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
                permission: 'system:client:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'system:client:remove',
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
  import ClientSearch from './components/client-search.vue';
  import {
    pageClient,
    removeClient,
    exportClient,
    updateClientStatus
  } from '@/api/system/client';

  defineOptions({ name: 'SystemClient' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [grantTypeDicts, deviceTypeDicts, statusDicts] = useDictData([
    'sys_grant_type',
    'sys_device_type',
    'sys_normal_disable'
  ]);

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'selection',
      columnKey: 'selection',
      width: 50,
      align: 'center'
    },
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center'
    },
    {
      prop: 'clientId',
      label: '客户端id',
      align: 'center',
      width: 160
    },
    {
      prop: 'clientKey',
      label: '客户端key',
      align: 'center',
      width: 100
    },
    {
      prop: 'clientSecret',
      label: '客户端秘钥',
      align: 'center',
      width: 110
    },
    {
      prop: 'grantTypeList',
      label: '授权类型',
      minWidth: 140,
      align: 'center',
      slot: 'grantTypeList',
      formatter: (row) =>
        (row.grantTypeList || [])
          .map(
            (g) =>
              grantTypeDicts.value.find((d) => d.dictValue == g)?.dictLabel ?? g
          )
          .join()
    },
    {
      prop: 'deviceType',
      label: '设备类型',
      width: 100,
      align: 'center',
      slot: 'deviceType',
      formatter: (row) =>
        deviceTypeDicts.value.find((d) => d.dictValue == row.deviceType)
          ?.dictLabel ?? ''
    },
    {
      prop: 'activeTimeout',
      label: 'Token活跃超时',
      align: 'center',
      minWidth: 128
    },
    {
      prop: 'timeout',
      label: 'Token固定超时',
      align: 'center',
      minWidth: 128
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
    return pageClient({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/client-edit.vue'),
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
      `是否确认删除客户端id为"${rows.map((d) => d.clientId).join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeClient(rows.map((d) => d.id))
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
    updateClientStatus(row.clientId, status)
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
      exportClient({ ...where, ...orders, ...pages })
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
