<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <ele-card bordered search-form>
      <el-form
        label-width="72px"
        @keyup.enter="handleSearch"
        @submit.prevent=""
      >
        <el-row :gutter="16">
          <el-col :lg="6" :md="8" :sm="9" :xs="24">
            <el-form-item label="登录地址">
              <el-input
                clearable
                v-model.trim="form.ipaddr"
                placeholder="请输入"
              />
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="8" :sm="9" :xs="24">
            <el-form-item label="登录名称">
              <el-input
                clearable
                v-model.trim="form.userName"
                placeholder="请输入"
              />
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="8" :sm="6" :xs="24">
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
    </ele-card>
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="tokenId"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="{ popperClass: 'online-table-tooltip' }"
        :highlight-current-row="true"
        :loading="loading"
        :export-config="{
          fileName: '在线用户',
          datasource: async () => datasource
        }"
        :print-config="{ datasource: async () => datasource }"
        cache-key="MonitorOnlineTable"
        @refresh="reload"
      >
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                title: '强退',
                icon: LogoutOutlined,
                props: { type: 'danger' },
                onClick: () => handleKickout(row)
              }
            ]"
          />
        </template>
      </ele-pro-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import dayjs from 'dayjs';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage } from 'ele-admin-plus';
  import { LogoutOutlined } from '@/components/icons';
  import { usePermission } from '@/utils/use-permission';
  import { useFormData } from '@/utils/use-form-data';
  import { pageOnline, kickoutOnline } from '@/api/monitor/online';

  defineOptions({ name: 'MonitorOnline' });

  const { hasPermission } = usePermission();

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = computed(() => {
    const cols = [
      {
        type: 'index',
        columnKey: 'index',
        width: 50,
        align: 'center'
      },
      {
        prop: 'tokenId',
        label: '会话编号',
        align: 'center',
        minWidth: 160
      },
      {
        prop: 'userName',
        label: '登录名称',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'deptName',
        label: '部门名称',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'ipaddr',
        label: '登录地址',
        align: 'center',
        minWidth: 140
      },
      {
        prop: 'loginLocation',
        label: '登录地点',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'browser',
        label: '浏览器',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'os',
        label: '操作系统',
        align: 'center',
        minWidth: 110
      },
      {
        prop: 'loginTime',
        label: '登录时间',
        align: 'center',
        width: 180,
        formatter: (row) => dayjs(row.loginTime).format('YYYY-MM-DD HH:mm:ss')
      }
    ];
    if (hasPermission('monitor:online:forceLogout')) {
      cols.push({
        columnKey: 'action',
        label: '操作',
        width: 90,
        align: 'center',
        slot: 'action',
        hideInPrint: true,
        hideInExport: true
      });
    }
    return cols;
  });

  /** 表格数据源 */
  const datasource = ref([]);

  /** 请求状态 */
  const loading = ref(false);

  /** 搜索表单数据 */
  const [form, resetFields] = useFormData({
    ipaddr: '',
    userName: ''
  });

  /** 刷新表格数据 */
  const reload = () => {
    loading.value = true;
    pageOnline(form)
      .then((res) => {
        loading.value = false;
        datasource.value = res.rows;
        tableRef.value?.reload?.({ page: 1 });
      })
      .catch((e) => {
        loading.value = false;
        console.error(e);
      });
  };

  /** 强退 */
  const handleKickout = (row) => {
    ElMessageBox.confirm(
      '是否确认强退名称为“' + row.userName + '”的用户？',
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        kickoutOnline(row.tokenId)
          .then(() => {
            loading.close();
            EleMessage.success({ message: '强退成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 搜索 */
  const handleSearch = () => {
    reload();
  };

  /**  重置 */
  const handleReset = () => {
    resetFields();
    handleSearch();
  };

  reload();
</script>

<style>
  .online-table-tooltip {
    max-width: calc(100vw - 48px);
  }
</style>
