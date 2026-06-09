<template>
  <div style="padding: 16px 20px 24px 20px">
    <ele-pro-table
      ref="tableRef"
      row-key="id"
      :columns="columns"
      :datasource="datasource"
      :show-overflow-tooltip="true"
      :loading="loading"
      highlight-current-row
      :pagination="false"
      :export-config="{ fileName: '第三方应用' }"
      cache-key="ProfileAccountTable"
      @refresh="reload()"
    >
      <template #avatar="{ row }">
        <img :src="row.avatar" style="width: 45px; height: 45px" />
      </template>
      <template #action="{ row }">
        <btn-items
          :divider="true"
          type="link"
          :items="[
            {
              title: '解绑',
              icon: MinusCircleOutlined,
              props: { type: 'danger' },
              onClick: () => handleUnlock(row)
            }
          ]"
        />
      </template>
    </ele-pro-table>
    <div>
      <div class="auth-app-title">你可以绑定以下第三方帐号</div>
      <div class="auth-app-list">
        <div
          v-for="item in authApps"
          :key="item.type"
          :title="item.tip"
          class="auth-app-item"
          @click="authUrl(item.type)"
        >
          <el-icon class="auth-app-item-icon" :style="item.iconStyle">
            <component :is="item.icon" />
          </el-icon>
          <div class="auth-app-item-name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import dayjs from 'dayjs';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage } from 'ele-admin-plus';
  import { MinusCircleOutlined } from '@/components/icons';
  import { listAuth, unbindAuth, bindAuth } from '@/api/system/social/auth';

  const props = defineProps({
    data: Object
  });

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center'
    },
    {
      prop: 'source',
      label: '绑定账号平台',
      align: 'center',
      minWidth: 140
    },
    {
      prop: 'avatar',
      label: '头像',
      slot: 'avatar',
      align: 'center',
      minWidth: 120
    },
    {
      prop: 'userName',
      label: '系统账号',
      align: 'center',
      minWidth: 180
    },
    {
      prop: 'createTime',
      label: '绑定时间',
      align: 'center',
      width: 180,
      formatter: (row) => dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      columnKey: 'action',
      label: '操作',
      width: 90,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true
    }
  ]);

  /** 表格数据源 */
  const datasource = ref([]);

  /** 请求状态 */
  const loading = ref(false);

  /** 搜索 */
  const reload = () => {
    loading.value = true;
    listAuth()
      .then((data) => {
        loading.value = false;
        datasource.value = data;
      })
      .catch((e) => {
        loading.value = false;
        console.error(e);
      });
  };

  /** 解绑 */
  const handleUnlock = (row) => {
    ElMessageBox.confirm(
      '您确定要解除"' + row.source + '"的账号绑定吗？',
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        unbindAuth(row.id)
          .then(() => {
            loading.close();
            EleMessage.success({ message: '解绑成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  reload();

  /** 支持的第三方应用 */
  const authApps = ref([
    {
      name: 'WeiXin',
      tip: '使用 微信 账号授权登录',
      type: 'wechat',
      icon: 'IconProWechatFilled',
      iconStyle: { transform: 'scale(1.1)', color: '#4daf29' }
    },
    {
      name: 'MaxKey',
      tip: '使用 MaxKey 账号授权登录',
      type: 'maxkey',
      icon: 'IconProMaxkeyLogo',
      iconStyle: { transform: 'scale(1.58)', filter: 'saturate(2.6)' }
    },
    {
      name: 'TopIam',
      tip: '使用 TopIam 账号授权登录',
      type: 'topiam',
      icon: 'IconProTopiamLogo'
    },
    {
      name: 'Gitee',
      tip: '使用 Gitee 账号授权登录',
      type: 'gitee',
      icon: 'IconProGiteeLogo'
    },
    {
      name: 'GitHub',
      tip: '使用 GitHub 账号授权登录',
      type: 'github',
      icon: 'IconProGithubLogo'
    }
  ]);

  /** 绑定第三方应用 */
  const authUrl = (type) => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    bindAuth(type, props.data?.tenantId)
      .then((url) => {
        location.href = url;
      })
      .catch((e) => {
        loading.close();
        EleMessage.error({ message: e.message, plain: true });
      });
  };
</script>

<style lang="scss" scoped>
  .auth-app-title {
    font-size: 16px;
    margin-top: 20px;
  }

  .auth-app-list {
    display: flex;
    align-items: center;
  }

  .auth-app-item {
    margin: 16px 20px 0 0;
    text-align: center;
    cursor: pointer;
  }

  .auth-app-item-icon {
    font-size: 22px;
  }

  .auth-app-item-name {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    transition: color 0.2s;
  }

  .auth-app-item:hover .auth-app-item-name {
    color: var(--el-color-primary);
  }
</style>
