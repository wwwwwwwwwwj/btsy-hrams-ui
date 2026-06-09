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
            placeholder="输入部门名称搜索"
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
            node-key="deptId"
            :props="{ label: 'deptName' }"
            :expand-on-click-node="false"
            :default-expand-all="true"
            :filter-node-method="filterNode"
            :current-node-key="current?.deptId"
            :style="{
              '--ele-tree-item-height': '34px',
              '--ele-tree-expand-margin':
                '0 2px 0 calc(8px - var(--ele-tree-item-radius))',
              padding: '12px calc(var(--ele-tree-item-radius) * 3)'
            }"
            @node-click="handleNodeClick"
          >
            <template #default="{ node }">
              <span class="el-tree-node__label" :title="node.label">
                <el-icon style="margin-right: 4px; vertical-align: -2px">
                  <CityOutlined />
                </el-icon>
                <span>{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </ele-loading>
        <template #bodyHeader>
          <post-search
            :deptId="current?.deptId"
            @search="(where) => reload(where, 1)"
          />
        </template>
        <template #body>
          <ele-pro-table
            ref="tableRef"
            row-key="postId"
            :columns="columns"
            :datasource="datasource"
            :show-overflow-tooltip="true"
            :highlight-current-row="true"
            v-model:selections="selections"
            :export-config="{ fileName: '岗位' }"
            style="padding-top: 8px"
            cache-key="SystemPostTable"
          >
            <template #toolbar>
              <btn-items
                :items="[
                  {
                    preset: 'add',
                    permission: 'system:post:add',
                    onClick: () => handleEdit()
                  },
                  {
                    preset: 'del',
                    permission: 'system:post:remove',
                    onClick: () => handleRemove()
                  },
                  {
                    preset: 'export',
                    permission: 'system:post:export',
                    onClick: () => handleExport()
                  }
                ]"
              />
            </template>
            <template #status="{ row }">
              <dict-data
                code="sys_normal_disable"
                type="tag"
                :model-value="row.status"
              />
            </template>
            <template #action="{ row }">
              <btn-items
                divider
                type="link"
                :items="[
                  {
                    preset: 'edit',
                    permission: 'system:post:edit',
                    onClick: () => handleEdit(row)
                  },
                  {
                    preset: 'del',
                    permission: 'system:post:remove',
                    onClick: () => handleRemove(row)
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
  import { EleMessage, useModal, toTree } from 'ele-admin-plus';
  import { SearchOutlined, CityOutlined } from '@/components/icons';
  import { useMobile } from '@/utils/use-mobile';
  import { useDictData } from '@/utils/use-dict-data';
  import PostSearch from './components/post-search.vue';
  import { listDept } from '@/api/system/dept';
  import { pagePost, removePost, exportPost } from '@/api/system/post';

  defineOptions({ name: 'SystemPost' });

  const { openModal } = useModal();
  const { mobile } = useMobile();

  /** 字典数据 */
  const [statusDicts] = useDictData(['sys_normal_disable']);

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
    listDept()
      .then((list) => {
        loading.value = false;
        data.value = toTree({
          data: list,
          idField: 'deptId',
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
    if (row && row.deptId) {
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
    if (!value) {
      return true;
    }
    return !!(data.deptName && data.deptName.includes(value));
  };

  /** 树过滤 */
  watch(keywords, (value) => {
    treeRef.value?.filter?.(value);
  });

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = computed(() => {
    const cols = [
      {
        type: 'selection',
        columnKey: 'selection',
        width: 48,
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
        prop: 'postCode',
        label: '岗位编码',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'postCategory',
        label: '类别编码',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'postName',
        label: '岗位名称',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'deptName',
        label: '部门',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'postSort',
        label: '排序',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'status',
        label: '状态',
        width: 90,
        align: 'center',
        minWidth: 110,
        slot: 'status',
        filters: statusDicts.value.map((d) => {
          return { text: d.dictLabel, value: d.dictValue };
        }),
        filterMultiple: false,
        formatter: (row) =>
          statusDicts.value.find((d) => d.dictValue == row.status)?.dictLabel ??
          ''
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
    return pagePost({
      ...where,
      ...filters,
      ...pages,
      belongDeptId: current.value?.deptId
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
      asyncComponent: () => import('./components/post-edit.vue'),
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
      `是否确认删除岗位编码为"${rows.map((d) => d.postCode).join()}"的数据项？`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removePost(rows.map((d) => d.postId))
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
      exportPost({
        ...where,
        ...orders,
        ...pages,
        belongDeptId: current.value?.deptId
      })
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 查询树数据 */
  query();
</script>
