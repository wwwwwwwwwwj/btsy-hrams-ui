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
          <definition-search
            :categoryId="current?.categoryId"
            @search="(where) => reload(where, 1)"
          />
        </template>
        <template #body>
          <ele-tab-bar
            v-model="tabActive"
            :items="[
              { value: '0', label: '已发布' },
              { value: '1', label: '未发布' }
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
            @change="reload(void 0, 1)"
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
              fileName: tabActive === '0' ? '已发布流程定义' : '未发布流程定义'
            }"
            style="padding: var(--ele-split-panel-table-padding)"
            cache-key="WorkflowProcessDefinitionTable"
          >
            <template #toolbar>
              <btn-items
                :items="[
                  {
                    preset: 'add',
                    permission: 'workflow:definition:add',
                    onClick: () => handleEdit()
                  },
                  {
                    preset: 'del',
                    permission: 'workflow:definition:remove',
                    onClick: () => handleRemove()
                  },
                  {
                    preset: 'import',
                    permission: 'workflow:definition:import',
                    title: '部署流程文件',
                    onClick: () => handleDeploy()
                  }
                ]"
              />
            </template>
            <template #activityStatus="{ row }">
              <el-switch
                :disabled="!hasPermission('workflow:definition:active')"
                size="small"
                :model-value="row.activityStatus == 1"
                @change="(checked) => handleEditStatus(checked, row)"
              />
            </template>
            <template #isPublish="{ row }">
              <el-tag
                v-if="row.isPublish == 0"
                type="danger"
                size="small"
                :disable-transitions="true"
              >
                未发布
              </el-tag>
              <el-tag
                v-else-if="row.isPublish == 1"
                type="success"
                size="small"
                :disable-transitions="true"
              >
                已发布
              </el-tag>
              <el-tag
                v-else
                type="info"
                size="small"
                :disable-transitions="true"
              >
                失效
              </el-tag>
            </template>
            <template #action="{ row }">
              <btn-items
                divider
                type="link"
                :items="[
                  {
                    title: '发布',
                    permission: 'workflow:definition:publish',
                    icon: CheckCircleOutlined,
                    props: { type: 'success' },
                    vIf: () => row.isPublish == 0,
                    onClick: () => handlePublish(row)
                  },
                  {
                    preset: 'detail',
                    permission: 'workflow:definition:query',
                    vIf: () => !(row.isPublish == 0),
                    onClick: () => handleDesign(row, true)
                  },
                  { preset: 'edit', onClick: () => handleEdit(row) },
                  {
                    preset: 'more',
                    dropdownItems: [
                      {
                        title: '设计',
                        permission: 'workflow:definition:query',
                        icon: FormOutlined,
                        vIf: () => row.isPublish == 0,
                        onClick: () => handleDesign(row, false)
                      },
                      {
                        title: '复制',
                        permission: 'workflow:definition:copy',
                        icon: CopyOutlined,
                        divided: row.isPublish == 0,
                        onClick: () => handleCopy(row)
                      },
                      {
                        title: '导出',
                        permission: 'workflow:definition:export',
                        icon: DownloadOutlined,
                        onClick: () => handleExport(row)
                      },
                      {
                        preset: 'del',
                        permission: 'workflow:definition:remove',
                        danger: true,
                        divided: true,
                        onClick: () => handleRemove(row)
                      }
                    ],
                    dropdownProps: { trigger: 'click' }
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
  import { EleMessage, toTree, useModal } from 'ele-admin-plus';
  import {
    SearchOutlined,
    CheckCircleOutlined,
    DownloadOutlined,
    CopyOutlined,
    FormOutlined
  } from '@/components/icons';
  import { useMobile } from '@/utils/use-mobile';
  import DefinitionSearch from './components/definition-search.vue';
  import { listCategory } from '@/api/workflow/category';
  import {
    listDefinition,
    listUnPublish,
    removeDefinition,
    updateDefinitionStatus,
    exportDefinition,
    copyDefinition,
    publishDefinition
  } from '@/api/workflow/definition';
  import { usePermission } from '@/utils/use-permission';

  defineOptions({ name: 'WorkflowProcesseDefinition' });

  const { openModal } = useModal();
  const { mobile } = useMobile();
  const { hasPermission } = usePermission();

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
  const tabActive = ref('0');

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
      prop: 'activityStatus',
      label: '激活状态',
      align: 'center',
      width: 90,
      slot: 'activityStatus',
      formatter: (row) => (row.activityStatus == 1 ? '已激活' : '未激活')
    },
    {
      prop: 'isPublish',
      label: '发布状态',
      align: 'center',
      width: 90,
      slot: 'isPublish',
      formatter: (row) =>
        row.isPublish == 0 ? '未发布' : row.isPublish == 1 ? '已发布' : '失效'
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
    if (tabActive.value === '0') {
      return listDefinition({
        ...where,
        ...pages,
        category: current.value?.categoryId
      });
    }
    return listUnPublish({
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
      asyncComponent: () => import('./components/definition-edit.vue'),
      componentProps: {
        data: row,
        categoryId: current.value?.categoryId,
        onDone: () => reload()
      }
    });
  };

  /** 打开设计弹窗 */
  const handleDesign = (row, isView) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/definition-design.vue'),
      componentProps: { data: row, readonly: isView, onDone: () => reload() }
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
        removeDefinition(rows.map((d) => d.id))
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

  /** 修改激活状态 */
  const handleEditStatus = (checked, row) => {
    ElMessageBox.confirm(
      checked
        ? `启动后，此流程下的所有任务都允许往后流转，您确定激活【${row.flowName || row.flowCode}】吗？`
        : `暂停后，此流程下的所有任务都不允许往后流转，您确定挂起【${row.flowName || row.flowCode}】吗？`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        updateDefinitionStatus(row.id, checked)
          .then((msg) => {
            row.activityStatus = checked ? '1' : '0';
            loading.close();
            EleMessage.success({ message: msg, plain: true });
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 导出数据 */
  const handleExport = (row) => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    exportDefinition(row.id, row.flowCode)
      .then(() => {
        loading.close();
      })
      .catch((e) => {
        loading.close();
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 复制 */
  const handleCopy = (row) => {
    ElMessageBox.confirm(
      `是否确认复制【${row.flowCode}】版本为【${row.version}】的流程定义？`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        copyDefinition(row.id)
          .then((msg) => {
            reload();
            loading.close();
            EleMessage.success({ message: msg, plain: true });
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 发布 */
  const handlePublish = (row) => {
    ElMessageBox.confirm(
      `是否确认发布流程定义编码为【${row.flowCode}】版本为【${row.version}】的流程定义？发布后会将已发布流程定义改为失效！`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        publishDefinition(row.id)
          .then((msg) => {
            reload();
            loading.close();
            EleMessage.success({ message: msg, plain: true });
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 部署流程文件 */
  const handleDeploy = () => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/definition-deploy.vue'),
      componentProps: {
        onDone: () => {
          tabActive.value = '1';
          reload();
        }
      }
    });
  };

  /** 查询树数据 */
  query();
</script>
