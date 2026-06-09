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
          <user-search
            :deptId="current?.deptId"
            @search="(where) => reload(where, 1)"
          />
        </template>
        <template #body>
          <ele-pro-table
            ref="tableRef"
            row-key="userId"
            :columns="columns"
            :datasource="datasource"
            :show-overflow-tooltip="true"
            :highlight-current-row="true"
            v-model:selections="selections"
            :export-config="{ fileName: '用户' }"
            style="padding-top: 8px"
            cache-key="SystemUserTable"
          >
            <template #toolbar>
              <btn-items
                :items="[
                  {
                    preset: 'add',
                    permission: 'system:user:add',
                    onClick: () => handleEdit()
                  },
                  {
                    preset: 'del',
                    permission: 'system:user:remove',
                    props: { class: 'hidden-sm-and-down' },
                    onClick: () => handleRemove()
                  },
                  {
                    preset: 'import',
                    permission: 'system:user:import',
                    onClick: () => handleImport()
                  },
                  {
                    preset: 'export',
                    permission: 'system:user:export',
                    onClick: () => handleExport()
                  }
                ]"
              />
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
                v-if="row.userId !== 1"
                divider
                type="link"
                :items="[
                  {
                    preset: 'edit',
                    permission: 'system:user:edit',
                    onClick: () => handleEdit(row)
                  },
                  {
                    preset: 'del',
                    permission: 'system:user:remove',
                    onClick: () => handleRemove(row)
                  },
                  {
                    preset: 'more',
                    dropdownItems: [
                      {
                        title: '重置密码',
                        icon: LockOutlined,
                        permission: 'system:user:resetPwd',
                        onClick: () => handleOpenPassword(row)
                      },
                      {
                        title: '分配角色',
                        icon: IdcardOutlined,
                        permission: 'system:user:edit',
                        divided: true,
                        onClick: () => handleOpenRole(row)
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
  import { EleMessage, useModal, toTree } from 'ele-admin-plus';
  import {
    SearchOutlined,
    CityOutlined,
    LockOutlined,
    IdcardOutlined
  } from '@/components/icons';
  import { useMobile } from '@/utils/use-mobile';
  import { useDictData } from '@/utils/use-dict-data';
  import UserSearch from './components/user-search.vue';
  import { listDept } from '@/api/system/dept';
  import {
    pageUser,
    removeUser,
    updateUserStatus,
    updateUserPassword,
    exportUser
  } from '@/api/system/user';

  defineOptions({ name: 'SystemUser' });

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

  /** 查询 */
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

  /** 树选中指定数据 */
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
  const columns = ref([
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
      prop: 'userName',
      label: '用户名称',
      align: 'center',
      minWidth: 100
    },
    {
      prop: 'nickName',
      label: '用户昵称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'deptName',
      label: '部门',
      align: 'center',
      minWidth: 100
    },
    {
      prop: 'phonenumber',
      label: '手机号码',
      align: 'center',
      minWidth: 110
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
      prop: 'createTime',
      label: '创建时间',
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
  const datasource = ({ pages, where, filters }) => {
    return pageUser({
      ...where,
      ...filters,
      ...pages,
      deptId: current.value?.deptId
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
      asyncComponent: () => import('./components/user-edit.vue'),
      componentProps: {
        data: row,
        deptId: current.value?.deptId,
        onDone: () => reload()
      }
    });
  };

  /** 打开分配角色弹窗 */
  const handleOpenRole = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/user-role.vue'),
      componentProps: { data: row, onDone: () => reload() }
    });
  };

  /** 打开导入弹窗 */
  const handleImport = () => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/user-import.vue'),
      componentProps: { onDone: () => reload() }
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
      `是否确认删除用户名称为"${rows.map((d) => d.userName).join()}"的数据项？`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeUser(rows.map((d) => d.userId))
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
      exportUser({
        ...where,
        ...orders,
        ...pages,
        deptId: current.value?.deptId
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

  /** 修改用户状态 */
  const handleEditStatus = (checked, row) => {
    const status = checked ? '0' : '1';
    updateUserStatus(row.userId, status)
      .then((msg) => {
        row.status = status;
        EleMessage.success({ message: msg, plain: true });
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 重置密码 */
  const handleOpenPassword = (row) => {
    ElMessageBox.prompt(`请输入"${row.userName}"的新密码:`, '重置密码', {
      inputPlaceholder: '请输入5-18位非空白字符',
      inputPattern: /^[\S]{5,18}$/,
      inputErrorMessage: '密码必须为5-18位非空白字符',
      draggable: true
    })
      .then(({ value }) => {
        updateUserPassword(row.userId, value)
          .then((msg) => {
            EleMessage.success({ message: msg, plain: true });
          })
          .catch((e) => {
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 查询树数据 */
  query();
</script>
