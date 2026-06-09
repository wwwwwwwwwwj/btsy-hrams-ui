import { mapTree, isExternalLink } from 'ele-admin-plus';

/** 若依默认菜单图标名称转换 */
const ruoYiIcons = {
  system: 'IconProSettingOutlined',
  user: 'IconProUserOutlined',
  peoples: 'IconProIdcardOutlined',
  'tree-table': 'IconProAppstoreOutlined',
  tree: 'IconProClusterOutlined',
  post: 'IconProSuitcaseOutlined',
  dict: 'IconProBookOutlined',
  edit: 'IconProControlOutlined',
  message: 'IconProMessageOutlined',
  log: 'IconProLogOutlined',
  form: 'IconProFileOutlined',
  logininfor: 'IconProCalendarOutlined',
  monitor: 'IconProFundOutlined',
  online: 'IconProConnectionOutlined',
  job: 'IconProTimerOutlined',
  druid: 'IconProFundOutlined',
  server: 'IconProAnalysisOutlined',
  redis: 'IconProDatabaseOutlined',
  'redis-list': 'IconProDatabaseOutlined',
  tool: 'IconProAppstoreAddOutlined',
  build: 'IconProFormOutlined',
  code: 'IconProCodeOutlined',
  swagger: 'IconProLinkOutlined',
  guide: 'IconElPosition',
  upload: 'IconProFolderOutlined',
  international: 'IconProDesktopOutlined',
  list: 'IconProCityOutlined',
  chart: 'IconProCityOutlined',
  dashboard: 'IconProAnalysisOutlined',
  waiting: 'IconProFileOutlined',
  finish: 'IconProCheckCircleOutlined',
  'my-copy': 'IconProCopyOutlined',
  'my-task': 'IconProLogOutlined',
  'process-definition': 'IconProAppstoreAddOutlined',
  category: 'IconProApplicationOutlined',
  workflow: 'IconProClusterOutlined',
  input: 'IconProEllipsisOutlined'
};

/**
 * 菜单图标名称转换以兼容若依
 * @param icon 图标名称
 */
export function getRuoYiIcon(icon) {
  if (!icon) {
    return;
  }
  if (icon.startsWith('Icon')) {
    return icon;
  }
  return ruoYiIcons[icon] ?? 'IconProLinkOutlined';
}

/**
 * 组件路径处理以兼容若依
 * @param component 组件路径
 */
function formatComponent(component) {
  if (!component || component === 'Layout' || component === '#') {
    return;
  }
  if (isExternalLink(component)) {
    return component;
  }
  return component.startsWith('/') ? component : `/${component}`;
}

/**
 * 菜单地址处理以兼容若依
 * @param mPath 菜单地址
 * @param pPath 父级菜单地址
 * @param query 路由参数
 */
function formatPath(mPath, pPath, query) {
  if (!mPath || isExternalLink(mPath)) {
    return { path: mPath };
  }
  const path = !pPath || mPath.startsWith('/') ? mPath : `${pPath}/${mPath}`;
  if (query) {
    try {
      const params = new URLSearchParams(JSON.parse(query)).toString();
      if (params) {
        return { path: `${path}?${params}`, rPath: path };
      }
    } catch (e) {
      console.error(e);
    }
  }
  return { path };
}

/**
 * 菜单数据处理为 EleProLayout 所需要的格式
 * @param data 菜单数据
 * @param childField 子级的字段名称
 */
function formatMenus(data, childField = 'children') {
  let homePath;
  let homeTitle;
  const menus = mapTree(
    data,
    (item, _index, parent) => {
      const meta = parseMenuMeta(item);
      const { path, rPath } = formatPath(item.path, parent?.path, item.query);
      const menu = {
        path,
        component: formatComponent(item.component),
        redirect: meta.routeRedirect,
        name: meta.routeName,
        meta: {
          hide: !!item.hidden,
          keepAlive: !meta.noCache,
          routePath: rPath,
          ...meta
        }
      };
      // 记录主页地址
      if (
        !homePath &&
        menu.path &&
        meta.openType !== 'external' &&
        !isExternalLink(menu.path) &&
        (menu.component || meta.openType === 'iframe')
      ) {
        homePath = menu.path;
        homeTitle = menu.meta?.title;
      }
      // 目录未指定 redirect 时自动添加
      const childPath = item[childField]?.find?.((child) => {
        if (!child.path || isExternalLink(child.path)) {
          return false;
        }
        const { openType, hide } = parseMenuMeta(child);
        return openType !== 'external' && !(hide ?? child.hidden);
      })?.path;
      if (childPath) {
        if (
          !menu.redirect &&
          !menu.component &&
          meta.openType !== 'iframe' &&
          meta.openType !== 'external' &&
          !isExternalLink(menu.path)
        ) {
          menu.redirect = childPath;
        }
        // 目录未指定 path 时自动添加
        if (!menu.path) {
          menu.path = childPath.substring(0, childPath.lastIndexOf('/'));
        }
      }
      if (!menu.path) {
        console.error('菜单path不能为空且要唯一:', item);
        return;
      }
      return menu;
    },
    childField
  );
  return { menus, homePath, homeTitle };
}

/**
 * 菜单元数据格式处理
 * @param item 菜单数据
 */
function parseMenuMeta(item) {
  const { meta } = item;
  const result = {};
  try {
    const obj = meta && typeof meta === 'string' ? JSON.parse(meta) : meta;
    if (obj && typeof obj === 'object') {
      Object.assign(result, obj);
    }
  } catch (e) {
    console.error(e);
  }
  return result;
}

/**
 * 处理用户菜单数据以兼容若依
 * @param userMenu 用户菜单
 */
export function formatUserMenu(userMenu) {
  // 修改图标
  const data = mapTree(userMenu, (item) => {
    const meta = parseMenuMeta(item);
    const temp = { ...item, meta: { ...meta, icon: getRuoYiIcon(meta.icon) } };
    // 修改内嵌格式
    if ('monitor/admin/index' === item.component) {
      temp.component = import.meta.env.VITE_APP_MONITOR_ADMIN;
    } else if ('monitor/snailjob/index' === item.component) {
      temp.component = import.meta.env.VITE_APP_SNAILJOB_ADMIN;
    }
    return temp;
  });
  // 一级菜单去掉父级
  data.forEach((item, i) => {
    if (item.path === '/' && item.children && item.children.length) {
      const child = item.children[0];
      data[i] = {
        ...child,
        path:
          child.path?.startsWith?.('/') || isExternalLink(child.path)
            ? child.path
            : `/${child.path}`
      };
    }
  });
  // 增加首页
  data.unshift({
    path: '/index',
    component: 'index',
    meta: { title: '首页', icon: 'IconProHomeOutlined' }
  });
  // 增加个人中心
  data.push({
    path: '/profile',
    component: 'profile',
    meta: {
      title: '个人中心',
      icon: 'IconProUserOutlined',
      active: '/index',
      hide: true
    }
  });
  // 增加EleAdmin链接
  data.push({
    path: 'https://plus.eleadmin.com',
    meta: { title: 'EleAdmin', icon: 'IconProLinkOutlined' }
  });
  return formatMenus(data);
}
