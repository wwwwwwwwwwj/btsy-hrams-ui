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
            placeholder="输入字典名称搜索"
            :prefix-icon="SearchOutlined"
          />
        </template>
        <btn-items
          :wrap="false"
          :items="[
            {
              preset: 'add',
              permission: 'system:dict:add',
              onClick: () => handleTreeEdit()
            },
            {
              preset: 'edit',
              permission: 'system:dict:edit',
              props: { disabled: !current },
              onClick: () => handleTreeEdit(current)
            },
            {
              preset: 'del',
              permission: 'system:dict:remove',
              props: { disabled: !current },
              onClick: () => handleTreeRemove()
            }
          ]"
          style="padding: 12px 0 12px 12px"
        />
        <ele-loading
          :loading="loading"
          :style="{ flex: '1 1 60px', padding: '0 0 12px 0', overflow: 'auto' }"
        >
          <el-tree
            ref="treeRef"
            :data="data"
            highlight-current
            node-key="dictId"
            :props="{ label: 'dictName' }"
            :expand-on-click-node="false"
            :default-expand-all="true"
            :filter-node-method="filterNode"
            :current-node-key="current?.dictId"
            :style="{
              '--ele-tree-item-height': '34px',
              padding: '0 calc(var(--ele-tree-item-radius) * 3)'
            }"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data: d }">
              <div
                class="el-tree-node__label"
                :title="`${node.label}(${d.dictType})`"
                style="overflow: visible"
              >
                <el-icon
                  :style="{
                    margin:
                      '0 4px 0 calc(-10px - var(--ele-tree-item-radius) / 2)',
                    verticalAlign: '-2px'
                  }"
                >
                  <BookOutlined />
                </el-icon>
                <span style="margin-right: 4px">{{ node.label }}</span>
                <span
                  style="font-size: 12px; opacity: 0.8; font-weight: normal"
                >
                  ({{ d.dictType }})
                </span>
              </div>
            </template>
          </el-tree>
        </ele-loading>
        <template #bodyHeader>
          <dict-data-search
            :dictId="current?.dictId"
            @search="(where) => reload(where, 1)"
          />
        </template>
        <template #body>
          <ele-pro-table
            ref="tableRef"
            row-key="dictCode"
            :columns="columns"
            :datasource="datasource"
            :show-overflow-tooltip="true"
            :highlight-current-row="true"
            v-model:selections="selections"
            :export-config="{ fileName: '字典' }"
            :load-on-created="false"
            cache-key="SystemDictDataTable"
          >
            <template #toolbar>
              <btn-items
                :items="[
                  {
                    preset: 'add',
                    permission: 'system:dict:add',
                    onClick: () => handleEdit()
                  },
                  {
                    preset: 'del',
                    permission: 'system:dict:remove',
                    props: { class: 'hidden-sm-and-down' },
                    onClick: () => handleRemove()
                  },
                  {
                    preset: 'export',
                    permission: 'system:dict:export',
                    onClick: () => handleExport()
                  },
                  {
                    title: '刷新缓存',
                    icon: SyncOutlined,
                    permission: 'system:dict:remove',
                    props: { type: 'default' },
                    onClick: () => handleRefreshCache()
                  }
                ]"
              />
            </template>
            <template #action="{ row }">
              <btn-items
                divider
                type="link"
                :items="[
                  {
                    preset: 'edit',
                    permission: 'system:dict:edit',
                    onClick: () => handleEdit(row)
                  },
                  {
                    preset: 'del',
                    permission: 'system:dict:remove',
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
  import { ref, watch } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import {
    SearchOutlined,
    BookOutlined,
    SyncOutlined
  } from '@/components/icons';
  import { useMobile } from '@/utils/use-mobile';
  import DictDataSearch from './components/dict-data-search.vue';
  import { listDict, removeDict } from '@/api/system/dict';
  import {
    pageDictData,
    removeDictData,
    exportDictData
  } from '@/api/system/dict-data';
  import { refreshDict } from '@/api/system/dict';
  import { useDictStore } from '@/store/modules/dict';

  defineOptions({ name: 'SystemDict' });

  const { openModal } = useModal();
  const { mobile } = useMobile();

  const dictStore = useDictStore();

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

  /** 查询 */
  const query = () => {
    loading.value = true;
    listDict()
      .then((list) => {
        loading.value = false;
        data.value = (list ?? []).sort((a, b) =>
          a.createTime == b.createTime
            ? a.dictId == b.dictId
              ? 0
              : a.dictId < b.dictId
                ? -1
                : 1
            : a.createTime < b.createTime
              ? -1
              : 1
        );
        handleNodeClick(data.value[0]);
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 树选中指定数据 */
  const handleNodeClick = (row) => {
    if (row && row.dictId) {
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
    return !!(data.dictName && data.dictName.includes(value));
  };

  /** 树过滤 */
  watch(keywords, (value) => {
    treeRef.value?.filter?.(value);
  });

  /** 打开树编辑弹窗 */
  const handleTreeEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/dict-edit.vue'),
      componentProps: { data: row, onDone: () => query() }
    });
  };

  /** 删除树 */
  const handleTreeRemove = () => {
    const id = current.value?.dictId;
    const name = current.value?.dictType;
    ElMessageBox.confirm(
      `是否确认删除字典类型为"${name}"的数据项？`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeDict([id])
          .then(() => {
            loading.close();
            EleMessage.success({ message: '删除成功', plain: true });
            query();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

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
      prop: 'dictLabel',
      label: '数据标签',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'dictValue',
      label: '数据键值',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'dictSort',
      label: '显示排序',
      width: 110,
      align: 'center'
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
  ]);

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where, orders }) => {
    return pageDictData({
      ...where,
      ...orders,
      ...pages,
      dictType: current.value?.dictType
    });
  };

  /** 刷新表格 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/dict-data-edit.vue'),
      componentProps: {
        data: row,
        dictType: current.value?.dictType,
        onDone: () => reload()
      }
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
      `是否确认删除数据标签为"${rows.map((d) => d.dictLabel).join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeDictData(rows.map((d) => d.dictCode))
          .then((msg) => {
            loading.close();
            EleMessage.success({ message: msg, plain: true });
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
    const loading = EleMessage.loading({ message: '请求中..', plain: true });
    tableRef.value?.fetch?.(({ where, orders, pages }) => {
      exportDictData({
        ...where,
        ...orders,
        ...pages,
        dictType: current.value?.dictType
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

  /** 刷新缓存 */
  const handleRefreshCache = () => {
    const loading = EleMessage.loading({ message: '请求中..', plain: true });
    refreshDict()
      .then(() => {
        dictStore.clearDicts();
        loading.close();
        EleMessage.success({ message: '刷新成功', plain: true });
      })
      .catch((e) => {
        loading.close();
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 查询树数据 */
  query();
</script>
