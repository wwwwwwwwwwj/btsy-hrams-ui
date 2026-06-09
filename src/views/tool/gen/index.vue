<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <gen-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="tableId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '代码生成' }"
        cache-key="ToolGenTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                title: '生成',
                icon: DownloadOutlined,
                permission: 'tool:gen:code',
                onClick: () => handleGenerate()
              },
              {
                preset: 'del',
                permission: 'tool:gen:remove',
                onClick: () => handleRemove()
              },
              {
                preset: 'import',
                permission: 'tool:gen:import',
                onClick: () => handleImport()
              }
            ]"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                title: '预览',
                icon: EyeOutlined,
                permission: 'tool:gen:preview',
                onClick: () => handlePreview(row)
              },
              {
                title: '生成',
                icon: DownloadOutlined,
                permission: 'tool:gen:code',
                onClick: () => handleGenerate(row)
              },
              {
                preset: 'more',
                dropdownItems: [
                  {
                    title: '同步',
                    icon: SyncOutlined,
                    permission: 'tool:gen:edit',
                    onClick: () => handleSync(row)
                  },
                  {
                    preset: 'edit',
                    permission: 'tool:gen:edit',
                    onClick: () => handleEdit(row)
                  },
                  {
                    preset: 'del',
                    permission: 'tool:gen:remove',
                    divided: true,
                    danger: true,
                    onClick: () => handleRemove(row)
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
  import { ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import {
    DownloadOutlined,
    EyeOutlined,
    SyncOutlined
  } from '@/components/icons';
  import GenSearch from './components/gen-search.vue';
  import {
    pageGen,
    removeGen,
    synchDb,
    genCode,
    genCodeZipPro
  } from '@/api/tool/gen';

  defineOptions({ name: 'ToolGen' });

  const { openModal } = useModal();

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
      prop: 'tableName',
      label: '表名称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'tableComment',
      label: '表描述',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'className',
      label: '实体',
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
      prop: 'updateTime',
      label: '更新时间',
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

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    return pageGen({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/gen-edit.vue'),
      componentProps: { data: row, onDone: () => reload() }
    });
  };

  /** 打开导入弹窗 */
  const handleImport = () => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/gen-import.vue'),
      componentProps: { onDone: () => reload() }
    });
  };

  /** 打开预览弹窗 */
  const handlePreview = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/gen-preview.vue'),
      componentProps: { data: row }
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
      `是否确认删除表名称为"${rows.map((d) => d.tableName).join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeGen(rows.map((d) => d.tableId))
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

  /** 同步 */
  const handleSync = (row) => {
    ElMessageBox.confirm(
      '确认要强制同步“' + row.tableName + '”的表结构吗？',
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        synchDb(row.tableId)
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

  /** 生成 */
  const handleGenerate = (row) => {
    if (!row && !selections.value.length) {
      EleMessage.error({ message: '请选择要生成的数据', plain: true });
      return;
    }
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    if (row && row.genType == '1') {
      genCode(row.tableId)
        .then(() => {
          loading.close();
          EleMessage.success({
            message: '成功生成到自定义路径:' + row.genPath,
            plain: true
          });
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    } else {
      const ids = selections.value.map((d) => d.tableId).join();
      genCodeZipPro(
        { tableIdStr: row ? row.tableId : ids },
        row ? [row.tableId] : selections.value.map((d) => d.tableId)
      )
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    }
  };
</script>
