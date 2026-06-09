<template>
  <ele-drawer
    :size="1320"
    title="文件配置管理"
    :body-style="{ padding: '14px 16px' }"
    flex-table="auto"
    v-bind="modalProps"
  >
    <oss-config-search
      style="margin-bottom: -8px"
      @search="(where) => reload(where, 1)"
    />
    <ele-pro-table
      ref="tableRef"
      row-key="ossConfigId"
      :columns="columns"
      :datasource="datasource"
      :show-overflow-tooltip="true"
      :highlight-current-row="true"
      v-model:selections="selections"
      :export-config="{ fileName: '文件配置' }"
      cache-key="SystemOssConfigTable"
    >
      <template #toolbar>
        <btn-items
          :items="[
            {
              preset: 'add',
              permission: 'system:ossConfig:add',
              onClick: () => handleEdit()
            },
            {
              preset: 'del',
              permission: 'system:ossConfig:remove',
              onClick: () => handleRemove()
            }
          ]"
        />
      </template>
      <template #accessPolicy="{ row }">
        <el-tag
          v-if="row.accessPolicy == 0"
          type="warning"
          size="small"
          :disable-transitions="true"
        >
          private
        </el-tag>
        <el-tag
          v-if="row.accessPolicy == 1"
          type="success"
          size="small"
          :disable-transitions="true"
        >
          public
        </el-tag>
        <el-tag
          v-if="row.accessPolicy == 2"
          type="info"
          size="small"
          :disable-transitions="true"
        >
          custom
        </el-tag>
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
              permission: 'system:ossConfig:edit',
              onClick: () => handleEdit(row)
            },
            {
              preset: 'del',
              permission: 'system:ossConfig:remove',
              onClick: () => handleRemove(row)
            }
          ]"
        />
      </template>
    </ele-pro-table>
  </ele-drawer>
</template>

<script setup>
  import { ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import OssConfigSearch from './oss-config-search.vue';
  import {
    pageOssConfig,
    removeOssConfig,
    updateOssConfigStatus
  } from '@/api/system/oss-config';

  const { modalProps, openModal } = useModal();

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
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
      prop: 'configKey',
      label: '配置key',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'endpoint',
      label: '访问站点',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'domain',
      label: '自定义域名',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'bucketName',
      label: '桶名称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'prefix',
      label: '前缀',
      align: 'center',
      width: 90
    },
    {
      prop: 'region',
      label: '域',
      align: 'center',
      width: 110
    },
    {
      prop: 'accessPolicy',
      label: '桶权限类型',
      width: 110,
      align: 'center',
      slot: 'accessPolicy',
      formatter: (row) => ['private', 'public', 'custom'][row.accessPolicy]
    },
    {
      prop: 'status',
      label: '是否默认',
      width: 90,
      align: 'center',
      slot: 'status',
      formatter: (row) => (row.status == 0 ? '是' : '否')
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
    return pageOssConfig({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开添加弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./oss-config-edit.vue'),
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
      `是否确认删除配置key为“${rows.map((d) => d.configKey).join()}”的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeOssConfig(rows.map((d) => d.ossConfigId))
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

  /** 修改是否默认 */
  const handleEditStatus = (checked, row) => {
    const status = checked ? '0' : '1';
    updateOssConfigStatus({
      ossConfigId: row.ossConfigId,
      configKey: row.configKey,
      status
    })
      .then((msg) => {
        row.status = status;
        EleMessage.success({ message: msg, plain: true });
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };
</script>
