<template>
  <ele-modal
    :width="980"
    :height="720"
    title="选择用户"
    flex-table="auto"
    :body-style="{ padding: '12px 16px' }"
    :loading="loading"
    v-bind="modalProps"
  >
    <role-user-search @search="(where) => reload(where, 1)" />
    <ele-pro-table
      ref="tableRef"
      row-key="userId"
      :columns="columns"
      :datasource="datasource"
      :show-overflow-tooltip="true"
      :highlight-current-row="true"
      v-model:selections="selections"
      :row-click-checked="true"
      :toolbar="false"
    >
      <template #status="{ row }">
        <dict-data
          code="sys_common_status"
          type="tag"
          :model-value="row.status"
        />
      </template>
    </ele-pro-table>
    <template #footer>
      <btn-items
        :items="[
          { preset: 'cancel', onClick: () => handleCancel() },
          { preset: 'save', onClick: () => handleSave() }
        ]"
      />
    </template>
  </ele-modal>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import RoleUserSearch from './role-user-search.vue';
  import { listUnallocatedUser, addRoleUser } from '@/api/system/role';

  const props = defineProps({
    /** 角色id */
    roleId: [Number, String]
  });

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 提交状态 */
  const loading = ref(false);

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
      prop: 'userName',
      label: '用户名称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'nickName',
      label: '用户昵称',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'email',
      label: '邮箱',
      align: 'center',
      minWidth: 110
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
      slot: 'status'
    },
    {
      prop: 'createTime',
      label: '创建时间',
      align: 'center',
      width: 168
    }
  ]);

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    return listUnallocatedUser({ ...where, ...pages, roleId: props.roleId });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 保存编辑 */
  const handleSave = () => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请选择要分配的用户', plain: true });
      return;
    }
    loading.value = true;
    const userIds = selections.value.map((d) => d.userId).join();
    addRoleUser({ roleId: props.roleId, userIds })
      .then((msg) => {
        loading.value = false;
        EleMessage.success({ message: msg, plain: true });
        emit('done');
        handleCancel();
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };
</script>
