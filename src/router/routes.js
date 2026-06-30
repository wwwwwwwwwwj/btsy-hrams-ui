import { menuToRoutes, eachTree } from 'ele-admin-plus';
import {
  HRAMS_ARCHIVE_ATTACH,
  HRAMS_LEGACY_REDIRECTS,
  HRAMS_MATERIAL_MAINTAIN_PATH,
  HRAMS_UTILIZE_REGISTER
} from '@/utils/hrams-routes';
import {
  LOGIN_PATH,
  HOME_PATH,
  LAYOUT_PATH,
  REDIRECT_PATH,
  WHITE_LIST
} from '@/config/setting';
import Layout from '@/layout/index.vue';
import RedirectLayout from '@/components/RedirectLayout/index.vue';
const modules = import.meta.glob('/src/views/**/index.vue');

/**
 * 静态路由
 */
export const routes = [
  {
    path: LOGIN_PATH,
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  // 404
  {
    path: '/:path(.*)*',
    component: () => import('@/views/exception/404/index.vue')
  }
];

/**
 * 根据菜单生成动态路由
 * @param menus 菜单数据
 * @param homePath 主页地址
 */
export function getMenuRoutes(menus, homePath) {
  const childRoutes = [
    // 用于刷新的路由
    {
      path: REDIRECT_PATH + '/:path(.*)',
      component: RedirectLayout,
      meta: { hideFooter: true }
    },
  // 旧首页 / 看板地址兼容
    {
      path: '/dashboard',
      redirect: HOME_PATH,
      meta: { hide: true, hideFooter: true }
    },
    {
      path: '/index',
      component: () => import('@/views/index/index.vue'),
      meta: { title: '工作台', hide: true, hideFooter: true }
    },
    {
      path: '/hrams/dashboard',
      redirect: '/workbench/dashboard',
      meta: { hide: true, hideFooter: true }
    },
    { path: '/person', redirect: '/person-archive/person', meta: { hide: true, hideFooter: true } },
    { path: '/archive', redirect: '/person-archive/archive', meta: { hide: true, hideFooter: true } },
    { path: '/material', redirect: '/person-archive/archive', meta: { hide: true, hideFooter: true } },
    { path: '/query', redirect: '/query-search/person-query', meta: { hide: true, hideFooter: true } },
    { path: '/utilize', redirect: `${HRAMS_UTILIZE_REGISTER}?tab=register`, meta: { hide: true, hideFooter: true } },
    { path: '/system/hrams-remind', redirect: HRAMS_LEGACY_REDIRECTS['/system/hrams-remind'], meta: { hide: true, hideFooter: true } },
    { path: '/system/hrams-backup', redirect: '/hrams-ops/backup', meta: { hide: true, hideFooter: true } },
    { path: '/system/hrams-access-log', redirect: '/hrams-ops/access-log', meta: { hide: true, hideFooter: true } },
    {
      path: HRAMS_MATERIAL_MAINTAIN_PATH,
      component: () => import('@/views/hrams/archive/material/index.vue'),
      meta: { title: '材料维护', hide: true, hideFooter: true }
    },
    {
      path: HRAMS_ARCHIVE_ATTACH,
      component: () => import('@/views/hrams/archive/attach/index.vue'),
      meta: { title: '材料挂接', hide: true, hideFooter: true }
    },
    { path: '/hrams/person', redirect: '/person-archive/person', meta: { hide: true, hideFooter: true } },
    { path: '/hrams/archive/material', redirect: HRAMS_MATERIAL_MAINTAIN_PATH, meta: { hide: true, hideFooter: true } },
    { path: '/archive-material/category', redirect: '/system/hrams-catalog', meta: { hide: true, hideFooter: true } },
    { path: '/hrams/archive', redirect: '/person-archive/archive', meta: { hide: true, hideFooter: true } },
    { path: '/hrams/query', redirect: '/query-search/person-query', meta: { hide: true, hideFooter: true } },
    { path: '/hrams/utilize', redirect: `${HRAMS_UTILIZE_REGISTER}?tab=register`, meta: { hide: true, hideFooter: true } },
    { path: '/hrams/remind', redirect: HRAMS_LEGACY_REDIRECTS['/hrams/remind'], meta: { hide: true, hideFooter: true } },
    { path: '/hrams/backup', redirect: '/hrams-ops/backup', meta: { hide: true, hideFooter: true } }
  ];
  const layoutRoutes = [
    {
      path: LAYOUT_PATH,
      component: Layout,
      redirect: HOME_PATH ?? homePath,
      children: childRoutes
    }
  ];
  // 路由铺平处理
  eachTree(menuToRoutes(menus, getComponent, routes), (route) => {
    const temp = Object.assign({}, route, { children: void 0 });
    if (route.children?.length && !route.component) {
      temp.redirect = route.children[0].path; // 重设 redirect 以兼容若依菜单数据
    }
    if (!temp.component && !temp.redirect) {
      // 没有对应组件的路由页面使用 404 组件
      temp.component = () => import('@/views/exception/404/index.vue');
    }
    if (temp.meta?.layout === false) {
      layoutRoutes.push(temp); // 不需要外层布局的路由
    } else {
      childRoutes.push(temp); // 需要外层布局的路由
    }
  });
  return layoutRoutes;
}

/**
 * 判断是否是白名单路由
 * @param path 路由地址
 */
export function isWhiteList(path) {
  if (!path) {
    return false;
  }
  return WHITE_LIST.some((whitePath) => {
    if (whitePath === path) {
      return true;
    }
    if (whitePath.endsWith('*') && path.startsWith(whitePath.slice(0, -1))) {
      return true;
    }
    return false;
  });
}

/**
 * 解析路由组件
 * @param component 组件名称
 */
function getComponent(component) {
  if (component) {
    const module = modules[`/src/views${component}.vue`];
    if (!module) {
      return modules[`/src/views${component}/index.vue`];
    }
    return module;
  }
}
