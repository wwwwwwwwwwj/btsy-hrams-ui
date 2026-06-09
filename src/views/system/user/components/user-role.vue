<template>
  <ele-modal
    :width="720"
    :height="520"
    title="分配角色"
    :body-style="{ padding: '12px 16px' }"
    flex-table="auto"
    :loading="loading"
    v-bind="modalProps"
  >
    <ele-pro-table
      ref="tableRef"
      row-key="roleId"
      :columns="columns"
      :datasource="datasource"
      :show-overflow-tooltip="true"
      v-model:selections="selections"
      highlight-current-row
      :pagination="false"
      :toolbar="false"
      :row-click-checked="true"
    />
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
  import { ref, nextTick } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { getUserRole, setUserRole } from '@/api/system/user';

  const props = defineProps({
    /** 用户 */
    data: Object
  });

  const { modalProps, closeModal } = useModal();

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
      prop: 'roleName',
      label: '角色名称',
      minWidth: 110
    },
    {
      prop: 'roleKey',
      label: '权限字符',
      minWidth: 110
    },
    {
      prop: 'createTime',
      label: '创建时间',
      align: 'center',
      width: 180
    }
  ]);

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ref([]);

  /** 提交状态 */
  const loading = ref(false);

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 保存编辑 */
  const handleSave = () => {
    loading.value = true;
    const roleIds = selections.value.map((d) => d.roleId).join();
    setUserRole({ userId: props.data?.userId, roleIds })
      .then(() => {
        loading.value = false;
        EleMessage.success({ message: '授权成功', plain: true });
        handleCancel();
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 查询 */
  const query = () => {
    loading.value = true;
    getUserRole(props.data?.userId)
      .then((result) => {
        loading.value = false;
        datasource.value = result.roles;
        nextTick(() => {
          tableRef.value?.setSelectedRows?.(result.roles.filter((d) => d.flag));
        });
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 查询数据 */
  if (props.data) {
    query();
  }
</script>
