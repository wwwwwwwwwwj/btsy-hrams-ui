<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <logininfor-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="infoId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '登录日志' }"
        cache-key="MonitorLogininforTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                title: '解锁',
                icon: UnlockOutlined,
                permission: 'monitor:logininfor:unlock',
                onClick: () => handleUnlock()
              },
              {
                preset: 'del',
                permission: 'monitor:logininfor:remove',
                onClick: () => handleRemove()
              },
              {
                title: '清空',
                icon: CloseCircleOutlined,
                props: {
                  type: 'danger',
                  plain: true,
                  class: 'hidden-sm-and-down'
                },
                permission: 'monitor:logininfor:remove',
                onClick: () => handleClear()
              },
              {
                preset: 'export',
                permission: 'monitor:logininfor:export',
                onClick: () => handleExport()
              }
            ]"
          />
        </template>
        <template #deviceType="{ row }">
          <dict-data
            code="sys_device_type"
            type="text"
            :model-value="row.deviceType"
          />
        </template>
        <template #status="{ row }">
          <dict-data
            code="sys_common_status"
            type="tag"
            :model-value="row.status"
          />
        </template>
      </ele-pro-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage } from 'ele-admin-plus';
  import { UnlockOutlined, CloseCircleOutlined } from '@/components/icons';
  import { useDictData } from '@/utils/use-dict-data';
  import LogininforSearch from './components/logininfor-search.vue';
  import {
    pageLogininfor,
    exportLogininfor,
    removeLogininfor,
    clearLogininfor,
    unlockLogininfor
  } from '@/api/monitor/logininfor';

  defineOptions({ name: 'MonitorLogininfor' });

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
        sortable: 'custom',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'clientKey',
        label: '客户端',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'deviceType',
        label: '设备类型',
        align: 'center',
        minWidth: 110,
        slot: 'deviceType'
      },
      {
        prop: 'ipaddr',
        label: '登录地址',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'loginLocation',
        label: '登录地点',
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
        prop: 'os',
        label: '操作系统',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'status',
        label: '登录状态',
        width: 110,
        slot: 'status',
        align: 'center',
        filters: statusDicts.value.map((d) => {
          return { text: d.dictLabel, value: d.dictValue };
        }),
        filterMultiple: false,
        formatter: (row) =>
          statusDicts.value.find((d) => d.dictValue == row.status)?.dictLabel ??
          ''
      },
      {
        prop: 'msg',
        label: '操作信息',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'loginTime',
        label: '登录日期',
        sortable: 'custom',
        align: 'center',
        width: 180
      }
    ];

    return cols;
  });

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where, orders, filters }) => {
    return pageLogininfor({ ...where, ...orders, ...filters, ...pages });
  };

  /** 刷新表格 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 导出数据 */
  const handleExport = () => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    tableRef.value?.fetch?.(({ where, orders, filters, pages }) => {
      exportLogininfor({ ...where, ...orders, ...filters, ...pages })
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 删除 */
  const handleRemove = () => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请至少选择一条数据', plain: true });
      return;
    }
    const ids = selections.value.map((d) => d.infoId);
    ElMessageBox.confirm(
      `是否确认删除访问编号为"${ids.join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true, customStyle: { maxWidth: '442px' } }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeLogininfor(ids)
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

  /** 清空 */
  const handleClear = () => {
    ElMessageBox.confirm('是否确认清空所有登录日志数据项？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        clearLogininfor()
          .then(() => {
            loading.close();
            EleMessage.success({ message: '清空成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 解锁 */
  const handleUnlock = () => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请选择一条数据', plain: true });
      return;
    }
    if (selections.value.length !== 1) {
      EleMessage.error({ message: '只能选择一条数据', plain: true });
      return;
    }
    const userName = selections.value[0].userName;
    ElMessageBox.confirm(`是否确认解锁用户"${userName}"数据项?`, '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        unlockLogininfor(userName)
          .then(() => {
            loading.close();
            EleMessage.success({
              message: `用户${userName}解锁成功`,
              plain: true
            });
            selections.value = [];
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
