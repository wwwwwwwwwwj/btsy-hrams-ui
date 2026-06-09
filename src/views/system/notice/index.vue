<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <notice-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="noticeId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '通知公告' }"
        cache-key="SystemNoticeTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: 'system:notice:add',
                onClick: () => handleEdit()
              },
              {
                preset: 'del',
                permission: 'system:notice:remove',
                onClick: () => handleRemove()
              }
            ]"
          />
        </template>
        <template #status="{ row }">
          <dict-data
            code="sys_notice_status"
            type="tag"
            :model-value="row.status"
          />
        </template>
        <template #noticeType="{ row }">
          <dict-data
            code="sys_notice_type"
            type="tag"
            :model-value="row.noticeType"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'edit',
                permission: 'system:notice:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: 'system:notice:remove',
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
  import NoticeSearch from './components/notice-search.vue';
  import { pageNotice, removeNotice } from '@/api/system/notice';

  defineOptions({ name: 'SystemNotice' });

  const { openModal } = useModal();

  /** 字典数据 */
  const [typeDicts, statusDicts] = useDictData([
    'sys_notice_type',
    'sys_notice_status'
  ]);

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
      prop: 'noticeTitle',
      label: '公告标题',
      minWidth: 160
    },
    {
      prop: 'noticeType',
      label: '公告类型',
      width: 90,
      align: 'center',
      slot: 'noticeType',
      formatter: (row) =>
        typeDicts.value.find((d) => d.dictValue == row.noticeType)?.dictLabel ??
        ''
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
      prop: 'createByName',
      label: '创建者',
      width: 100,
      align: 'center'
    },
    {
      prop: 'createTime',
      label: '创建时间',
      width: 180,
      align: 'center'
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
    return pageNotice({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/notice-edit.vue'),
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
    const ids = rows.map((d) => d.noticeId);
    ElMessageBox.confirm(
      `是否确认删除公告编号为"${ids.join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeNotice(ids)
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
</script>
