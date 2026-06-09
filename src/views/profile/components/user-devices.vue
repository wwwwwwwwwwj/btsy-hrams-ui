<template>
  <div style="padding: 16px 20px 24px 20px">
    <ele-pro-table
      ref="tableRef"
      row-key="tokenId"
      :columns="columns"
      :datasource="datasource"
      :show-overflow-tooltip="true"
      :loading="loading"
      highlight-current-row
      :pagination="false"
      :export-config="{ fileName: '在线设备' }"
      cache-key="ProfileDeviceTable"
      @refresh="reload()"
    >
      <template #deviceType="{ row }">
        <dict-data
          code="sys_device_type"
          type="text"
          :model-value="row.deviceType"
        />
      </template>
      <template #action="{ row }">
        <btn-items
          :divider="true"
          type="link"
          :items="[
            {
              title: '下线',
              icon: LogoutOutlined,
              props: { type: 'danger' },
              onClick: () => handleKickout(row)
            }
          ]"
        />
      </template>
    </ele-pro-table>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import dayjs from 'dayjs';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage } from 'ele-admin-plus';
  import { LogoutOutlined } from '@/components/icons';
  import { listUserDevice, kickoutDevice } from '@/api/monitor/online';

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center'
    },
    {
      prop: 'deviceType',
      label: '设备类型',
      align: 'center',
      slot: 'deviceType',
      minWidth: 110
    },
    {
      prop: 'ipaddr',
      label: '主机',
      align: 'center',
      minWidth: 140
    },
    {
      prop: 'loginLocation',
      label: '登录地点',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'os',
      label: '操作系统',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'browser',
      label: '浏览器',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'loginTime',
      label: '登录时间',
      align: 'center',
      width: 180,
      formatter: (row) => dayjs(row.loginTime).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      columnKey: 'action',
      label: '操作',
      width: 90,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true
    }
  ]);

  /** 表格数据源 */
  const datasource = ref([]);

  /** 请求状态 */
  const loading = ref(false);

  /** 搜索 */
  const reload = () => {
    loading.value = true;
    listUserDevice()
      .then((res) => {
        loading.value = false;
        datasource.value = res.rows;
      })
      .catch((e) => {
        loading.value = false;
        console.error(e);
      });
  };

  /** 强退 */
  const handleKickout = (row) => {
    ElMessageBox.confirm(
      '删除设备后，在该设备登录需要重新进行验证',
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        kickoutDevice(row.tokenId)
          .then(() => {
            loading.close();
            EleMessage.success({ message: '下线成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  reload();
</script>
