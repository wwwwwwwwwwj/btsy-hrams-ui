<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <config-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="configId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '参数设置' }"
        cache-key="SystemConfigTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'system:config:add',
                onClick: () => handleEdit()
              },
              {
                preset: 'del',
                permission: 'system:config:remove',
                props: { class: 'hidden-sm-and-down' },
                onClick: () => handleRemove()
              },
              {
                preset: 'export',
                permission: 'system:config:export',
                onClick: () => handleExport()
              },
              {
                title: '刷新缓存',
                icon: SyncOutlined,
                permission: 'system:config:remove',
                props: { type: 'default' },
                onClick: () => handleRefreshCache()
              }
            ]"
          />
        </template>
        <template #configType="{ row }">
          <dict-data
            code="sys_yes_no"
            type="tag"
            :model-value="row.configType"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'edit',
                permission: 'system:config:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'system:config:remove',
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
  import { useDictData } from '@/utils/use-dict-data';
  import ConfigSearch from './components/config-search.vue';
  import {
    pageConfig,
    removeConfig,
    exportConfig,
    refreshConfig
  } from '@/api/system/config';

  defineOptions({ name: 'SystemConfig' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [configTypeDicts] = useDictData(['sys_yes_no']);

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
        prop: 'configName',
        label: '参数名称',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'configKey',
        label: '参数键名',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'configValue',
        label: '参数键值',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'configType',
        label: '系统内置',
        width: 110,
        align: 'center',
        slot: 'configType',
        filters: configTypeDicts.value.map((d) => {
          return { text: d.dictLabel, value: d.dictValue };
        }),
        filterMultiple: false,
        formatter: (row) =>
          configTypeDicts.value.find((d) => d.dictValue == row.configType)
            ?.dictLabel ?? ''
      },
      {
        prop: 'remark',
        label: '备注',
        align: 'center',
        minWidth: 110
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
        width: 156,
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
    return pageConfig({ ...where, ...filters, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/config-edit.vue'),
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
      `是否确认删除参数键名为"${rows.map((d) => d.configKey).join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeConfig(rows.map((d) => d.configId))
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
    tableRef.value?.fetch?.(({ where, orders, pages }) => {
      exportConfig({ ...where, ...orders, ...pages })
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 刷新缓存 */
  const handleRefreshCache = () => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    refreshConfig()
      .then(() => {
        loading.close();
        EleMessage.success({ message: '刷新成功', plain: true });
      })
      .catch((e) => {
        loading.close();
        EleMessage.error({ message: e.message, plain: true });
      });
  };
</script>
