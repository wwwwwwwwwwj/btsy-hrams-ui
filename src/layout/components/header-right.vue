<template>
  <menu-search />
  <!-- 租户切换 -->
  <layout-tool v-if="loginUser.userId === 1 && tenantEnabled">
    <ele-dropdown
      trigger="click"
      v-model="tenantSelected"
      :items="tenantList"
      max-height="calc(100vh - 80px)"
      :popper-options="{
        strategy: 'fixed',
        modifiers: [{ name: 'offset', options: { offset: [0, 5] } }]
      }"
    >
      <template #default="{ selected }">
        <div
          :style="{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            lineHeight: '1.5'
          }"
        >
          <el-icon style="margin: 0 4px 0 -2px">
            <CityOutlined style="transform: scale(1.14)" />
          </el-icon>
          <div v-if="selected?.command">{{ selected.title }}</div>
          <div v-else>选择租户</div>
          <el-icon :size="13" style="margin: 0 -4px 0 2px">
            <ArrowDown />
          </el-icon>
        </div>
      </template>
    </ele-dropdown>
  </layout-tool>
  <!-- 全屏切换 -->
  <layout-tool class="hidden-sm-and-down" @click="toggleFullscreen">
    <el-icon style="transform: scale(1.18)">
      <CompressOutlined v-if="isFullscreen" style="stroke-width: 4" />
      <ExpandOutlined v-else style="stroke-width: 4" />
    </el-icon>
  </layout-tool>
  <!-- 消息通知 -->
  <layout-tool :class="{ 'hidden-sm-and-down': tabBar && tabInHeader }">
    <header-notice />
  </layout-tool>
  <!-- 用户信息 -->
  <layout-tool>
    <header-user />
  </layout-tool>
  <!-- 夜间模式 -->
  <layout-tool class="ele-dark-switch hidden-sm-and-down">
    <dark-switch />
  </layout-tool>
  <!-- 主题设置 -->
  <layout-tool @click="openSetting" style="position: relative">
    <el-icon>
      <MoreOutlined />
    </el-icon>
    <div v-if="themeTip" class="ele-theme-setting-tip">
      <IconOutline />
      <div>
        <div>试试切换布局或主题~</div>
        <IconOutline :width="152" :height="34" />
      </div>
    </div>
  </layout-tool>
</template>

<script setup>
  import { ref, computed, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import {
    LayoutTool,
    requestFullscreen,
    exitFullscreen,
    useModal,
    EleMessage
  } from 'ele-admin-plus';
  import {
    ExpandOutlined,
    CompressOutlined,
    MoreOutlined,
    CityOutlined,
    ArrowDown
  } from '@/components/icons';
  import { usePageTab } from '@/utils/use-page-tab';
  import { useThemeStore } from '@/store/modules/theme';
  import { useUserStore } from '@/store/modules/user';
  import HeaderUser from './header-user.vue';
  import HeaderNotice from './header-notice.vue';
  import DarkSwitch from './dark-switch.vue';
  import MenuSearch from './menu-search.vue';
  import IconOutline from './covers/icon-outline.vue';
  import { getTenantList } from '@/api/login';
  import { dynamicTenant, dynamicClear } from '@/api/system/tenant';

  const props = defineProps({
    /** 是否全屏状态 */
    isFullscreen: Boolean
  });

  const emit = defineEmits({
    'update:isFullscreen': (_isFullscreen) => true
  });

  const { openModal } = useModal();

  const { removeOtherPageTab, reloadPageTab, getRouteTabKey } = usePageTab();
  const themeStore = useThemeStore();
  const { tabBar, tabInHeader, themeTip } = storeToRefs(themeStore);
  const userStore = useUserStore();
  const loginUser = computed(() => userStore.info ?? {});

  /** 全屏切换 */
  const toggleFullscreen = () => {
    if (props.isFullscreen) {
      exitFullscreen();
      emit('update:isFullscreen', false);
      return;
    }
    try {
      requestFullscreen();
      emit('update:isFullscreen', true);
    } catch (e) {
      console.error(e);
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  /** 打开主题设置抽屉 */
  const openSetting = () => {
    themeStore.setValue('themeTip', false);
    openModal({
      modalId: 'theme-setting-drawer',
      type: 'drawer',
      asyncComponent: () => import('./setting-drawer.vue'),
      props: {
        size: 268,
        title: '主题风格设置',
        zIndex: 199999,
        bodyStyle: { padding: 0, height: '100%' },
        modalClass: 'ele-setting-drawer'
      },
      keepAlive: true
    });
  };

  /** 选中的租户 */
  const tenantSelected = ref(null);

  /** 租户开关 */
  const tenantEnabled = ref(true);

  /** 租户列表 */
  const tenantList = ref([]);

  /** 获取租户 */
  getTenantList(true)
    .then((result) => {
      tenantEnabled.value = result.tenantEnabled ?? true;
      if (tenantEnabled.value) {
        tenantList.value = [
          { title: '未选择', command: null },
          ...(result.voList || []).map((d) => ({
            title: d.companyName,
            command: d.tenantId
          }))
        ];
      }
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });

  /** 切换租户 */
  watch(tenantSelected, (tenantId) => {
    const api = tenantId ? dynamicTenant : dynamicClear;
    api(tenantId)
      .then(() => {
        removeOtherPageTab({ key: getRouteTabKey() }, false);
        reloadPageTab();
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  });
</script>
