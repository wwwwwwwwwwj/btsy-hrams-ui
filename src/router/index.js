/**
 * 路由配置
 */
import NProgress from 'nprogress';
import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { LOGIN_PATH, REDIRECT_PATH, LAYOUT_PATH } from '@/config/setting';
import { useUserStore } from '@/store/modules/user';
import { useThemeStore } from '@/store/modules/theme';
import { useTabStore, parseRouteTabKey } from '@/store/modules/tab';
import { getToken } from '@/utils/token-util';
import { setPageTitle } from '@/utils/page-title-util';
import { routes, getMenuRoutes, isWhiteList } from './routes';
let nprogressTimer;

NProgress.configure({
  speed: 200,
  minimum: 0.02,
  trickleSpeed: 200,
  showSpinner: false
});

const router = createRouter({
  routes,
  history: createWebHistory(),
  scrollBehavior: () => {
    return { top: 0 };
  }
});

/**
 * 路由守卫
 */
router.beforeEach(async (to) => {
  // 显示顶部加载进度条
  if (!to.path.includes(REDIRECT_PATH)) {
    nprogressTimer && clearTimeout(nprogressTimer);
    const nprogressEl = document.getElementById('nprogress');
    nprogressEl && nprogressEl.classList.remove('is-error');
    NProgress.start();
  }

  // 未登录跳转登录界面
  if (!getToken()) {
    if (!isWhiteList(to.path)) {
      const query = { from: encodeURIComponent(to.fullPath) };
      return { path: LOGIN_PATH, query: to.path === LAYOUT_PATH ? {} : query };
    }
    return;
  }

  // 注册动态路由
  const userStore = useUserStore();
  if (!userStore.menus) {
    const { menus, homePath } = await userStore.fetchUserInfo(to);
    if (menus) {
      getMenuRoutes(menus, homePath).forEach((r) => {
        router.addRoute(r);
      });
      return { ...to, replace: true };
    }
  }
});

router.afterEach((to, from, failure) => {
  // 记录上一个页签滚动位置
  const tabStore = useTabStore();
  const themeStore = useThemeStore();
  if (
    !failure &&
    from.path !== LOGIN_PATH &&
    from.path !== LAYOUT_PATH &&
    !from.path.includes(REDIRECT_PATH) &&
    tabStore.pageKeepAlive
  ) {
    tabStore.tabSetItem({
      key: parseRouteTabKey(from),
      meta: {
        tabScrollTop: themeStore.getBodyScrollEl().scrollTop
      }
    });
  }
  if (!to.path.includes(REDIRECT_PATH)) {
    // 关闭路由切换动画时在这里恢复页签滚动位置
    if (
      tabStore.pageKeepAlive &&
      (!themeStore.transitionName || themeStore.transitionName === 'none')
    ) {
      nextTick(() => {
        const tabKey = parseRouteTabKey(to);
        const top =
          tabStore.tabs.find((d) => d.key === tabKey)?.meta?.tabScrollTop ?? 0;
        themeStore.getBodyScrollEl().scrollTo({
          top,
          behavior: 'instant'
        });
      });
    }

    // 更新浏览器标题
    if (!failure || to.path === LOGIN_PATH) {
      setPageTitle(to.meta?.title);
    }

    // 结束顶部加载进度条
    if (NProgress.isStarted()) {
      nprogressTimer = setTimeout(() => {
        // 页签数量限制打开时进度条改为错误颜色
        if (failure && to.path !== LOGIN_PATH && from.path !== LAYOUT_PATH) {
          const nprogressEl = document.getElementById('nprogress');
          nprogressEl && nprogressEl.classList.add('is-error');
        }
        NProgress.done(true);
      }, 200);
    }
  }
});

export default router;
