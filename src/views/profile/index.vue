<template>
  <ele-page :multi-card="false">
    <div class="user-wrapper">
      <user-card :data="loginUser" @done="updateLoginUser" class="user-side" />
      <ele-card
        bordered
        :header-style="{ padding: '0 20px' }"
        :body-style="{ padding: 0 }"
        class="user-body"
      >
        <template #header>
          <ele-tabs
            type="plain"
            size="large"
            :items="[
              { name: 'info', label: '基本资料' },
              { name: 'account', label: '第三方应用' },
              { name: 'devices', label: '在线设备' }
            ]"
            :modelValue="active"
            @update:modelValue="handleUpdateModelValue"
          />
        </template>
        <transition name="slide-right" mode="out-in">
          <user-form
            v-if="active === 'info'"
            :data="loginUser"
            @done="updateLoginUser"
          />
          <user-account v-else-if="active === 'account'" :data="loginUser" />
          <user-devices v-else-if="active === 'devices'" />
        </transition>
      </ele-card>
    </div>
  </ele-page>
</template>

<script setup>
  import { computed, ref, unref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { useUserStore } from '@/store/modules/user';
  import UserCard from './components/user-card.vue';
  import UserForm from './components/user-form.vue';
  import UserAccount from './components/user-account.vue';
  import UserDevices from './components/user-devices.vue';
  import { getUserProfile } from '@/api/profile';
  const pagePath = '/profile';

  defineOptions({ name: 'Profile' });

  const { currentRoute, push } = useRouter();

  const userStore = useUserStore();

  /** 登录用户信息 */
  const loginUser = computed(() => userStore.info ?? {});

  /** 更新登录用户信息 */
  const updateLoginUser = (data) => {
    userStore.setInfo({ ...loginUser.value, ...data });
  };

  // 查询数据
  getUserProfile()
    .then((res) => {
      const info = res.user || {};
      updateLoginUser({
        ...info,
        postGroup: res.postGroup,
        roleGroup: res.roleGroup
      });
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });

  /** 选项卡选中 */
  const active = ref('info');

  /** 切换选项卡 */
  const handleUpdateModelValue = (modelValue) => {
    push({ path: pagePath, query: { type: modelValue } });
  };

  watch(
    currentRoute,
    (route) => {
      const { path, query } = unref(route);
      if (path === pagePath) {
        active.value =
          (query.type
            ? typeof query.type === 'string'
              ? query.type
              : query.type?.[0]
            : void 0) || 'info';
      }
    },
    { immediate: true }
  );
</script>

<style lang="scss" scoped>
  .user-wrapper {
    display: flex;

    .user-side {
      width: 320px;
      margin: 0 16px 0 0;
      flex-shrink: 0;
    }

    .user-body {
      flex: 1;
      overflow: hidden;
    }
  }

  @media screen and (max-width: 928px) {
    .user-wrapper .user-side {
      width: 240px;
    }
  }

  @media screen and (max-width: 768px) {
    .user-wrapper {
      display: block;

      .user-side {
        width: auto;
        margin: 0 0 16px 0;
      }
    }
  }

  .user-body :deep(.ele-card-header .ele-tabs .el-tabs__header) {
    .el-tabs__item + .el-tabs__item {
      margin-left: 20px;
    }
  }
</style>
