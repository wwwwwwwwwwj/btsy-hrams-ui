import { mapTree, isExternalLink } from 'ele-admin-plus';
import {
  HIDDEN_TOP_MENU_PATHS,
  LAST_TOP_MENU_PATH
} from '@/config/setting';

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
  input: 'IconProEllipsisOutlined',
  documentation: 'IconProFileOutlined',
  folder: 'IconProFolderOutlined',
  search: 'IconProCityOutlined',
  education: 'IconProBookOutlined',
  download: 'IconProLogOutlined'
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
function isTopMenu(item) {
  const pid = item.parentId ?? item.parent_id;
  return pid === 0 || pid === '0';
}

/** 隐藏无关一级菜单，系统管理置底（与 hrams_mysql 种子一致） */
function adjustTopLevelMenus(list) {
  if (!Array.isArray(list)) {
    return list;
  }
  const hidden = new Set(HIDDEN_TOP_MENU_PATHS);
  let menus = list.filter(
    (item) => !(isTopMenu(item) && hidden.has(item.path))
  );
  const idx = menus.findIndex(
    (m) => isTopMenu(m) && m.path === LAST_TOP_MENU_PATH
  );
  if (idx >= 0) {
    const [sys] = menus.splice(idx, 1);
    menus.push(sys);
  }
  return menus;
}

export function formatUserMenu(userMenu) {
  // 修改图标
  const data = adjustTopLevelMenus(
    mapTree(userMenu, (item) => {
    const meta = parseMenuMeta(item);
    const temp = { ...item, meta: { ...meta, icon: getRuoYiIcon(meta.icon) } };
    // 修改内嵌格式
    if ('monitor/admin/index' === item.component) {
      temp.component = import.meta.env.VITE_APP_MONITOR_ADMIN;
    } else if ('monitor/snailjob/index' === item.component) {
      temp.component = import.meta.env.VITE_APP_SNAILJOB_ADMIN;
    }
    return temp;
    })
  );
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
  // 旧 RuoYi 工作台：侧栏不展示，仅 /index 直链（静态路由亦注册）
  data.unshift({
    path: 'index',
    component: 'index/index',
    hidden: true,
    meta: { title: '工作台', icon: 'IconProAppstoreOutlined' }
  });
  data.push({
    path: '/profile',
    component: 'profile',
    meta: {
      title: '个人中心',
      icon: 'IconProUserOutlined',
      active: '/workbench/dashboard',
      hide: true
    }
  });
  return formatMenus(data);
}
