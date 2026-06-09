<template>
  <ele-modal
    :width="980"
    :height="720"
    title="导入表"
    flex-table="auto"
    :body-style="{ padding: '12px 16px' }"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form label-width="58px" @keyup.enter="handleSearch" @submit.prevent="">
      <el-row :gutter="16">
        <el-col :lg="6" :md="6" :sm="12" :xs="24">
          <el-form-item label="数据源">
            <el-select v-model="form.dataName" placeholder="请选择">
              <el-option
                v-for="item in dataNameList"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="6" :sm="12" :xs="24">
          <el-form-item label="表名称">
            <el-input
              clearable
              v-model.trim="form.tableName"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="6" :sm="12" :xs="24">
          <el-form-item label="表描述">
            <el-input
              clearable
              v-model.trim="form.tableComment"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="6" :sm="12" :xs="24">
          <el-form-item label-width="0px">
            <btn-items
              :wrap="false"
              :items="[
                { preset: 'search', onClick: () => handleSearch() },
                { preset: 'reset', onClick: () => handleReset() }
              ]"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <ele-pro-table
      ref="tableRef"
      row-key="tableName"
      :columns="columns"
      :datasource="datasource"
      :show-overflow-tooltip="true"
      :highlight-current-row="true"
      v-model:selections="selections"
      :toolbar="false"
      :pagination="{ pageSize: 6, pageSizes: [6, 10, 20, 40, 100] }"
      :load-on-created="false"
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
  import { ref } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import { pageGenDb, importTable } from '@/api/tool/gen';
  import { listDataName } from '@/api/tool/gen';

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 搜索表单数据 */
  const [form, resetFields] = useFormData({
    dataName: '',
    tableName: '',
    tableComment: ''
  });

  /** 数据源列表 */
  const dataNameList = ref([]);

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
      prop: 'createTime',
      label: '创建时间',
      align: 'center',
      minWidth: 110
    },
    {
      prop: 'updateTime',
      label: '更新时间',
      align: 'center',
      minWidth: 110
    }
  ]);

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    return pageGenDb({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where) => {
    tableRef.value?.reload?.({ page: 1, where });
  };

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 搜索按钮点击事件 */
  const handleSearch = () => {
    if (!form.dataName) {
      return;
    }
    reload({ ...form });
  };

  /** 重置按钮点击事件 */
  const handleReset = () => {
    resetFields();
    form.dataName = dataNameList.value[0];
    handleSearch();
  };

  /** 导入 */
  const handleSave = () => {
    if (!selections.value.length) {
      EleMessage.error({ message: '请选择要导入的表', plain: true });
      return;
    }
    loading.value = true;
    const tables = selections.value.map((d) => d.tableName).join();
    importTable({ tables, dataName: form.dataName })
      .then((msg) => {
        loading.value = false;
        EleMessage.success({ message: msg, plain: true });
        handleCancel();
        emit('done');
      })
      .catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 查询数据源下拉数据 */
  loading.value = true;
  listDataName().then((data) => {
    loading.value = false;
    dataNameList.value = data;
    form.dataName = dataNameList.value[0];
    handleSearch();
  });
</script>
