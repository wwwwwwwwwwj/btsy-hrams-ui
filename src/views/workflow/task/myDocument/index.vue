<template>
  <ele-page hide-footer :multi-card="false" flex-table="auto">
    <ele-card bordered :body-style="{ padding: 0 }" flex-table="auto">
      <ele-split-panel
        :space="0"
        :size="258"
        allow-collapse
        :collapse-btn-offset="2"
        v-model:collapse="collapse"
        :custom-style="{ borderWidth: '0 1px 0 0' }"
        flex-table="auto"
      >
        <template #sideHeader>
          <el-input
            clearable
            v-model="keywords"
            placeholder="输入流程分类名称搜索"
            :prefix-icon="SearchOutlined"
          />
        </template>
        <ele-loading
          :loading="loading"
          :style="{ flex: '1 1 60px', overflow: 'auto' }"
        >
          <el-tree
            ref="treeRef"
            :data="data"
            highlight-current
            node-key="categoryId"
            :props="{ label: 'categoryName' }"
            :expand-on-click-node="false"
            :default-expand-all="true"
            :filter-node-method="filterNode"
            :current-node-key="current?.categoryId"
            :style="{
              '--ele-tree-item-height': '34px',
              '--ele-tree-expand-margin':
                '0 2px 0 calc(8px - var(--ele-tree-item-radius))',
              padding: '12px calc(var(--ele-tree-item-radius) * 3)'
            }"
            @node-click="handleNodeClick"
          />
        </ele-loading>
        <template #bodyHeader>
          <document-search
            :categoryId="current?.categoryId"
            @search="(where) => reload(where, 1)"
          />
        </template>
        <template #body>
          <ele-pro-table
            ref="tableRef"
            row-key="id"
            :columns="columns"
            :datasource="datasource"
            :show-overflow-tooltip="true"
            :highlight-current-row="true"
            :export-config="{ fileName: '我发起的' }"
            style="padding-top: 8px"
            cache-key="WorkflowTaskMyDocumentTable"
          >
            <template #isSuspended="{ row }">
              <el-tag
                v-if="!row.isSuspended"
                type="success"
                size="small"
                :disable-transitions="true"
              >
                激活
              </el-tag>
              <el-tag
                v-else
                type="danger"
                size="small"
                :disable-transitions="true"
              >
                挂起
              </el-tag>
            </template>
            <template #flowStatus="{ row }">
              <dict-data
                code="wf_business_status"
                type="tag"
                :model-value="row.flowStatus"
              />
            </template>
            <template #action="{ row }">
              <btn-items
                divider
                type="link"
                :items="[
                  { preset: 'detail', onClick: () => handleDetail(row) },
                  {
                    preset: 'edit',
                    vIf: () =>
                      row.flowStatus === 'draft' ||
                      row.flowStatus === 'cancel' ||
                      row.flowStatus === 'back',
                    onClick: () => handleEdit(row)
                  },
                  {
                    preset: 'del',
                    vIf: () =>
                      row.flowStatus === 'draft' ||
                      row.flowStatus === 'cancel' ||
                      row.flowStatus === 'back',
                    onClick: () => handleRemove(row)
                  },
                  {
                    title: '撤销',
                    icon: RollbackOutlined,
                    props: { type: 'danger' },
                    vIf: () => row.flowStatus === 'waiting',
                    onClick: () => handleCancel(row)
                  }
                ]"
              />
            </template>
          </ele-pro-table>
        </template>
      </ele-split-panel>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal, toTree } from 'ele-admin-plus';
  import { SearchOutlined, RollbackOutlined } from '@/components/icons';
  import { useMobile } from '@/utils/use-mobile';
  import { useDictData } from '@/utils/use-dict-data';
  import DocumentSearch from './components/document-search.vue';
  import { listCategory } from '@/api/workflow/category';
  import {
    pageInstanceMy,
    removeInstance,
    cancelProcessApply
  } from '@/api/workflow/instance';

  defineOptions({ name: 'WorkflowTaskMyDocument' });

  const { openModal } = useModal();
  const { mobile } = useMobile();

  /** 字典数据 */
  const [businessStatusDicts] = useDictData(['wf_business_status']);

  /** 分割面板是否折叠 */
  const collapse = ref(mobile.value);

  /** 树组件 */
  const treeRef = ref(null);

  /** 加载状态 */
  const loading = ref(true);

  /** 树形数据 */
  const data = ref([]);

  /** 树选中数据 */
  const current = ref(null);

  /** 树搜索关键字 */
  const keywords = ref('');

  /** 查询树数据 */
  const query = () => {
    loading.value = true;
    listCategory()
      .then((list) => {
        loading.value = false;
        data.value = toTree({
          data: list,
          idField: 'categoryId',
          parentIdField: 'parentId'
        });
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 树选中数据 */
  const handleNodeClick = (row) => {
    if (row && row.categoryId) {
      current.value = row;
    } else {
      current.value = null;
    }
    reload({}, 1);
    // 移动端自动收起左侧
    if (current.value != null && mobile.value) {
      collapse.value = true;
    }
  };

  /** 树过滤方法 */
  const filterNode = (value, data) => {
    if (value) {
      return !!(data.categoryName && data.categoryName.includes(value));
    }
    return true;
  };

  /** 树过滤 */
  watch(keywords, (value) => {
    treeRef.value?.filter?.(value);
  });

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'index',
      columnKey: 'index',
      width: 48,
      align: 'center'
    },
    {
      prop: 'flowName',
      label: '流程定义名称',
      align: 'center',
      minWidth: 120
    },
    {
      prop: 'flowCode',
      label: '流程定义编码',
      align: 'center',
      minWidth: 120
    },
    {
      prop: 'categoryName',
      label: '流程分类',
      align: 'center',
      width: 110
    },
    {
      prop: 'version',
      label: '版本号',
      width: 80,
      align: 'center',
      formatter: (row) => `v${row.version}.0`
    },
    {
      prop: 'isSuspended',
      label: '状态',
      align: 'center',
      width: 68,
      slot: 'isSuspended',
      formatter: (row) => (row.isSuspended ? '挂起' : '激活')
    },
    {
      prop: 'flowStatus',
      label: '流程状态',
      align: 'center',
      width: 90,
      slot: 'flowStatus',
      formatter: (row) =>
        businessStatusDicts.value.find((d) => d.dictValue == row.flowStatus)
          ?.dictLabel ?? ''
    },
    {
      prop: 'createTime',
      label: '启动时间',
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

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    return pageInstanceMy({
      ...where,
      ...pages,
      category: current.value?.categoryId
    });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/document-edit.vue'),
      componentProps: { data: row, onDone: () => reload() }
    });
  };

  /** 打开详情弹窗 */
  const handleDetail = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/document-detail.vue'),
      componentProps: { data: row }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    ElMessageBox.confirm('是否确认删除？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeInstance([row.id])
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

  /** 撤销 */
  const handleCancel = (row) => {
    ElMessageBox.confirm('是否确认撤销当前单据？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        cancelProcessApply({
          businessId: row.businessId,
          message: '申请人撤销流程！'
        })
          .then(() => {
            loading.close();
            EleMessage.success({ message: '撤销成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 查询树数据 */
  query();
</script>
