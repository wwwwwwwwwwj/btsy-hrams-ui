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
          <instance-search
            :categoryId="current?.categoryId"
            @search="(where) => reload(where, 1)"
          />
        </template>
        <template #body>
          <ele-tab-bar
            v-model="tabActive"
            :items="[
              { value: 'running', label: '进行中' },
              { value: 'finish', label: '已完成' }
            ]"
            :item-style="{
              height: '48px',
              lineHeight: '48px',
              margin: '0 26px 0 0'
            }"
            :style="{
              padding: 'var(--ele-split-panel-table-padding)',
              paddingTop: 0,
              paddingBottom: 0
            }"
            @change="reload()"
          />
          <ele-pro-table
            ref="tableRef"
            row-key="id"
            :columns="columns"
            :datasource="datasource"
            :show-overflow-tooltip="true"
            :highlight-current-row="true"
            v-model:selections="selections"
            :export-config="{
              fileName:
                tabActive === 'running' ? '进行中流程实例' : '已完成流程实例'
            }"
            style="padding: var(--ele-split-panel-table-padding)"
            cache-key="WorkflowProcessInstanceTable"
          >
            <template #toolbar>
              <btn-items
                :items="[
                  {
                    preset: 'del',
                    permission: 'workflow:instance:remove',
                    onClick: () => handleRemove()
                  }
                ]"
              />
            </template>
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
                  {
                    title: '作废',
                    icon: CloseCircleOutlined,
                    props: { type: 'danger' },
                    vIf: () => tabActive === 'running',
                    onClick: () => handleOpenInvalid(row)
                  },
                  {
                    preset: 'del',
                    permission: 'workflow:instance:remove',
                    onClick: () => handleRemove(row)
                  },
                  {
                    preset: 'detail',
                    permission: 'workflow:instance:query',
                    onClick: () => handleDetail(row)
                  },
                  {
                    title: '变量',
                    permission: 'workflow:instance:variableQuery',
                    icon: FileOutlined,
                    onClick: () => handleVariable(row)
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
  import { ref, watch, computed } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, toTree, useModal } from 'ele-admin-plus';
  import {
    SearchOutlined,
    CloseCircleOutlined,
    FileOutlined
  } from '@/components/icons';
  import { useMobile } from '@/utils/use-mobile';
  import { useDictData } from '@/utils/use-dict-data';
  import InstanceSearch from './components/instance-search.vue';
  import { listCategory } from '@/api/workflow/category';
  import {
    pageInstanceRunning,
    pageInstanceFinish,
    removeInstance
  } from '@/api/workflow/instance';

  defineOptions({ name: 'WorkflowProcessInstance' });

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

  /** 选项卡选中 */
  const tabActive = ref('running');

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
        width: 48,
        align: 'center'
      },
      {
        prop: 'businessCode',
        label: '业务编码',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'businessTitle',
        label: '业务标题',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'flowName',
        label: '流程定义名称',
        align: 'center',
        minWidth: 120
      },
      {
        prop: 'nodeName',
        label: '任务名称',
        align: 'center',
        minWidth: 110
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
        prop: 'createByName',
        label: '申请人',
        align: 'center',
        width: 110
      },
      {
        prop: 'version',
        label: '版本号',
        width: 80,
        align: 'center',
        formatter: (row) => `v${row.version}.0`
      }
    ];
    if (tabActive.value === 'running') {
      cols.push({
        prop: 'isSuspended',
        label: '状态',
        align: 'center',
        width: 90,
        slot: 'isSuspended',
        formatter: (row) => (row.isSuspended ? '挂起' : '激活')
      });
    }
    cols.push({
      prop: 'flowStatus',
      label: '流程状态',
      align: 'center',
      width: 90,
      slot: 'flowStatus',
      formatter: (row) =>
        businessStatusDicts.value.find((d) => d.dictValue == row.flowStatus)
          ?.dictLabel ?? ''
    });
    cols.push({
      prop: 'createTime',
      label: '启动时间',
      align: 'center',
      width: 180
    });
    if (tabActive.value === 'finish') {
      cols.push({
        prop: 'updateTime',
        label: '结束时间',
        align: 'center',
        width: 180
      });
    }
    cols.push({
      columnKey: 'action',
      label: '操作',
      width: 272,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true,
      fixed: 'right'
    });
    return cols;
  });

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    if (tabActive.value === 'running') {
      return pageInstanceRunning({
        ...where,
        ...pages,
        category: current.value?.categoryId
      });
    }
    return pageInstanceFinish({
      ...where,
      ...pages,
      category: current.value?.categoryId
    });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开详情弹窗 */
  const handleDetail = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/instance-detail.vue'),
      componentProps: { data: row }
    });
  };

  /** 打开作废弹窗 */
  const handleOpenInvalid = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/instance-invalid.vue'),
      componentProps: { id: row?.id, onDone: () => reload() }
    });
  };

  /** 打开变量弹窗 */
  const handleVariable = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/instance-variable.vue'),
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
    ElMessageBox.confirm('是否确认删除？', '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeInstance(rows.map((d) => d.id))
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

  /** 查询树数据 */
  query();
</script>
