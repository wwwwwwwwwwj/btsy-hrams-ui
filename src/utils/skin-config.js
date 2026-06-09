import wallpaper01 from '@/assets/wallpaper-01.jpg';
import wallpaper01Cover from '@/assets/wallpaper-01-cover.jpg';
import wallpaper01Dark from '@/assets/wallpaper-01-dark.jpg';
import wallpaper01DarkCover from '@/assets/wallpaper-01-dark-cover.jpg';
import wallpaper02 from '@/assets/wallpaper-02.jpg';
import wallpaper02Cover from '@/assets/wallpaper-02-cover.jpg';
import wallpaper02Dark from '@/assets/wallpaper-02-dark.jpg';
import wallpaper02DarkCover from '@/assets/wallpaper-02-dark-cover.jpg';
import wallpaper03 from '@/assets/wallpaper-03.jpg';
import wallpaper03Cover from '@/assets/wallpaper-03-cover.jpg';
import wallpaper04 from '@/assets/wallpaper-04.jpg';
import wallpaper04Cover from '@/assets/wallpaper-04-cover.jpg';

/**
 * 预设常用布局
 */
export const PREDEFINED_LAYOUTS = [
  {
    name: 'default',
    title: '常规布局',
    cover: 'CoverDefault',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'default',
      headerStyle: 'light',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'light',
      tabStyle: 'simple',
      fixedBody: true,
      fluid: true,
      logoInHeader: false,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: {
        '--ele-tab-button-shadow':
          '0 0 0 0.8px var(--el-border-color-extra-light) inset',
        '--ele-tab-button-hover-shadow':
          '0 0 0 0.8px var(--el-border-color-extra-light) inset',
        '--ele-tab-button-active-shadow':
          '0 0 4px 2px rgba(0, 0, 0, .04), 0 0 0 0.8px var(--el-border-color-extra-light) inset'
      },
      contentCustomStyle: null,
      layoutCustomStyle: {
        '--ele-header-shadow':
          '0 1px 4px rgba(0, 21, 41, .08), 0 0 0 0.8px var(--el-border-color-extra-light)',
        '--ele-header-dark-shadow': '0 1px 4px rgba(0, 0, 0, .1)',
        '--ele-sidebar-shadow':
          '1px 0 3px rgba(0, 21, 41, .08), 0 0 0 0.8px var(--el-border-color-extra-light)',
        '--ele-sidebar-dark-shadow': '0 0 4px rgba(0, 0, 0, .35)'
      },
      layoutCustomClass: null
    }
  },
  {
    name: 'mixedSidebar',
    title: '双侧栏布局',
    cover: 'CoverMixedSidebar',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'mix',
      headerStyle: 'light',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'light',
      tabStyle: 'simple',
      fixedBody: true,
      fluid: true,
      logoInHeader: false,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'compactMixSidebar',
    title: '紧凑双侧栏',
    cover: 'CoverCompactMixSidebar',
    config: {
      collapse: false,
      compact: true,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'mix',
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'tag',
      fixedBody: true,
      fluid: true,
      logoInHeader: false,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: {
        '--ele-tab-height': '36px',
        '--ele-tab-padding': '12px'
      },
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'compactSidebar',
    title: '紧凑侧栏布局',
    cover: 'CoverCompactSidebar',
    config: {
      collapse: true,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'mix',
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      fixedBody: true,
      fluid: true,
      logoInHeader: false,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: {
        '--ele-tab-height': '44px',
        '--ele-tab-button-padding': '12px'
      },
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'colorfulSidebar',
    title: '侧栏彩色图标',
    cover: 'CoverColorfulSidebar',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: true,
      layout: 'default',
      sidebarLayout: 'default',
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'indicator',
      fixedBody: true,
      fluid: true,
      logoInHeader: false,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'tabInHeader',
    title: '页签位于顶栏',
    cover: 'CoverTabInHeader',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'default',
      headerStyle: 'primary',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'simple',
      fixedBody: true,
      fluid: true,
      logoInHeader: true,
      tabInHeader: true,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: {
        '--el-bg-color': 'var(--ele-layout-bg)'
      },
      contentCustomStyle: null,
      layoutCustomStyle: {
        '--ele-header-height': '46px',
        '--ele-header-primary-bg': 'var(--el-color-primary)'
      },
      layoutCustomClass: null
    },
    traditionalThemeConfig: {
      headerStyle: 'light'
    }
  },
  {
    name: 'plainHeader',
    title: '透明顶栏背景',
    cover: 'CoverPlainHeader',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'mix',
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      fixedBody: true,
      fluid: true,
      logoInHeader: false,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: {
        '--ele-tab-height': '38px',
        '--ele-tab-button-padding': '4px',
        '--ele-tab-button-space': '10px'
      },
      contentCustomStyle: null,
      layoutCustomStyle: {
        '--ele-header-height': '48px',
        '--ele-header-bg': 'transparent',
        '--ele-header-shadow': 'none',
        '--ele-layout-button-tab-page-pt': '12px'
      },
      layoutCustomClass: null
    }
  },
  {
    name: 'plainCompactHeader',
    title: '透明紧凑顶栏',
    cover: 'CoverPlainCompactHeader',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'mix',
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      fixedBody: false,
      fluid: true,
      logoInHeader: false,
      tabInHeader: true,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: {
        '--ele-header-ghost-bg': 'transparent',
        '--ele-header-shadow': 'none',
        '--ele-layout-ghost-header-page-pt': '6px'
      },
      layoutCustomClass: null
    }
  },
  {
    name: 'cardLayout',
    title: '卡片风格布局',
    cover: 'CoverCardLayout',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'mix',
      headerStyle: 'primary',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'light',
      tabStyle: 'simple',
      fixedBody: true,
      fluid: true,
      logoInHeader: false,
      tabInHeader: true,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: {
        margin: '16px 0 16px 16px',
        borderRadius: '8px'
      },
      sideboxCustomStyle: {
        margin: '16px 0 16px 16px',
        borderRadius: '8px'
      },
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: {
        '--ele-header-height': '46px',
        '--ele-header-primary-bg': 'var(--el-color-primary)',
        '--ele-header-divider-shadow':
          '0 0 0 0.8px var(--el-border-color-lighter'
      },
      layoutCustomClass: 'layout-card-style'
    },
    traditionalThemeConfig: {
      headerStyle: 'dark'
    }
  },
  {
    name: 'cardSidebar',
    title: '卡片侧栏布局',
    cover: 'CoverCardSidebar',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'default',
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      fixedBody: true,
      fluid: true,
      logoInHeader: true,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: {
        margin: '16px 0 16px 16px',
        borderRadius: '8px'
      },
      sideboxCustomStyle: {
        margin: '16px 0 16px 16px',
        borderRadius: '8px'
      },
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: {
        '--ele-tab-height': '46px',
        '--ele-tab-button-padding': '14px',
        '--ele-tab-button-space': '10px'
      },
      contentCustomStyle: null,
      layoutCustomStyle: {
        '--ele-header-divider-shadow':
          '0 0 0 0.8px var(--el-border-color-lighter'
      },
      layoutCustomClass: 'layout-card-style'
    }
  },
  {
    name: 'cardMixedSidebar',
    title: '卡片双侧栏',
    cover: 'CoverCardMixedSidebar',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'mix',
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      fixedBody: true,
      fluid: true,
      logoInHeader: false,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: {
        marginTop: '16px',
        marginBottom: '16px',
        borderRadius: '8px'
      },
      sideboxCustomStyle: {
        margin: '16px 0 16px 16px',
        borderRadius: '8px'
      },
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: {
        '--ele-tab-height': '44px',
        '--ele-tab-button-padding': '12px'
      },
      contentCustomStyle: null,
      layoutCustomStyle: {
        '--ele-header-height': '46px',
        '--ele-header-divider-shadow':
          '0 0 0 0.8px var(--el-border-color-lighter'
      },
      layoutCustomClass: 'layout-card-style layout-mix-card-style'
    }
  },
  {
    name: 'verticalLayout',
    title: '上下布局',
    cover: 'CoverVerticalLayout',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'default',
      sidebarLayout: 'default',
      headerStyle: 'primary',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'tag',
      fixedBody: true,
      fluid: true,
      logoInHeader: true,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: {
        '--ele-tab-height': '36px',
        '--ele-tab-padding': '12px'
      },
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'topBarLayout',
    title: '顶栏布局',
    cover: 'CoverTopBarLayout',
    config: {
      collapse: false,
      compact: false,
      tabBar: true,
      colorfulIcon: false,
      layout: 'top',
      sidebarLayout: 'default',
      headerStyle: 'dark',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      fixedBody: true,
      fluid: true,
      logoInHeader: true,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: {
        '--ele-header-primary-bg': 'var(--el-color-primary)'
      },
      layoutCustomClass: null
    }
  },
  {
    name: 'limitedWidth',
    title: '内容固定宽度',
    cover: 'CoverLimitedWidth',
    config: {
      collapse: false,
      compact: false,
      tabBar: false,
      colorfulIcon: false,
      layout: 'top',
      sidebarLayout: 'default',
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      fixedBody: true,
      fluid: false,
      logoInHeader: true,
      tabInHeader: false,
      sidebarMenuProps: null,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  }
];

/**
 * 简约主题的预设常用布局
 */
export const SIMPLE_LAYOUTS = [
  {
    name: 'default',
    title: '常规布局',
    cover: 'CoverDefault',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'default',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: false,
      fixedBody: true,
      fluid: true,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'mixedSidebar',
    title: '双侧栏布局',
    cover: 'CoverMixedSidebar',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'mix',
      tabBar: true,
      colorfulIcon: true,
      logoInHeader: false,
      tabInHeader: false,
      fixedBody: true,
      fluid: true,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'compactMixSidebar',
    title: '紧凑双侧栏',
    cover: 'CoverCompactMixSidebar',
    config: {
      collapse: false,
      compact: true,
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'mix',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: false,
      tabInHeader: false,
      fixedBody: true,
      fluid: true,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'compactSidebar',
    title: '紧凑侧栏布局',
    cover: 'CoverCompactSidebar',
    config: {
      collapse: true,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'mix',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: false,
      tabInHeader: false,
      fixedBody: true,
      fluid: true,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'tabInHeader',
    title: '页签位于顶栏',
    cover: 'CoverTabInHeader',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'default',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: true,
      fixedBody: true,
      fluid: true,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'compactLayout',
    title: '紧凑布局',
    cover: 'CoverCompactLayout',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'mix',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: true,
      fixedBody: true,
      fluid: true,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'colorfulSidebar',
    title: '侧栏彩色图标',
    cover: 'CoverColorfulSidebar',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'default',
      tabBar: true,
      colorfulIcon: true,
      logoInHeader: true,
      tabInHeader: false,
      fixedBody: true,
      fluid: true,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'topBarLayout',
    title: '顶栏布局',
    cover: 'CoverTopBarLayout',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'light',
      mixSidebarStyle: 'light',
      tabStyle: 'button',
      layout: 'top',
      sidebarLayout: 'default',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: false,
      fixedBody: true,
      fluid: true,
      sideboxMenuProps: null,
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  }
];

/**
 * 现代主题的预设常用布局
 */
export const MODERN_LAYOUTS = [
  {
    name: 'default',
    title: '常规布局',
    cover: 'CoverModernDefault',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'primary',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'dark',
      tabStyle: 'simple',
      layout: 'default',
      sidebarLayout: 'default',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: true,
      fixedBody: true,
      fluid: true,
      sidebarMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sideboxMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    },
    traditionalThemeConfig: {
      tabStyle: 'button'
    }
  },
  {
    name: 'mixedSidebar',
    title: '双侧栏布局',
    cover: 'CoverModernMixedSidebar',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'primary',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'dark',
      tabStyle: 'simple',
      layout: 'default',
      sidebarLayout: 'mix',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: true,
      fixedBody: true,
      fluid: true,
      sidebarMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sideboxMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    },
    traditionalThemeConfig: {
      tabStyle: 'button'
    }
  },
  {
    name: 'compactMixSidebar',
    title: '紧凑双侧栏',
    cover: 'CoverModernCompactMixed',
    config: {
      collapse: false,
      compact: true,
      headerStyle: 'primary',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'dark',
      tabStyle: 'simple',
      layout: 'default',
      sidebarLayout: 'mix',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: true,
      fixedBody: true,
      fluid: true,
      sidebarMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sideboxMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    },
    traditionalThemeConfig: {
      tabStyle: 'button'
    }
  },
  {
    name: 'compactSidebar',
    title: '紧凑侧栏布局',
    cover: 'CoverModernCompactSidebar',
    config: {
      collapse: true,
      compact: false,
      headerStyle: 'primary',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'dark',
      tabStyle: 'simple',
      layout: 'default',
      sidebarLayout: 'mix',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: true,
      fixedBody: true,
      fluid: true,
      sidebarMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sideboxMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    },
    traditionalThemeConfig: {
      tabStyle: 'button'
    }
  },
  {
    name: 'cardTabStyle',
    title: '页签卡片风格',
    cover: 'CoverModernCardTab',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'primary',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'dark',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'default',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: true,
      tabInHeader: true,
      fixedBody: true,
      fluid: true,
      sidebarMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sideboxMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    }
  },
  {
    name: 'rowLayout',
    title: '左右布局',
    cover: 'CoverModernRow',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'dark',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'default',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: false,
      tabInHeader: false,
      fixedBody: true,
      fluid: true,
      sidebarMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sideboxMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    },
    traditionalThemeConfig: {
      tabStyle: 'button'
    }
  },
  {
    name: 'rowMixedSidebar',
    title: '左右双侧栏',
    cover: 'CoverModernRowMixed',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'light',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'dark',
      tabStyle: 'button',
      layout: 'default',
      sidebarLayout: 'mix',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: false,
      tabInHeader: false,
      fixedBody: true,
      fluid: true,
      sidebarMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sideboxMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    },
    traditionalThemeConfig: {
      tabStyle: 'button'
    }
  },
  {
    name: 'rowCompactHeader',
    title: '左右紧凑顶栏',
    cover: 'CoverModernRowHeader',
    config: {
      collapse: false,
      compact: false,
      headerStyle: 'primary',
      sidebarStyle: 'dark',
      mixSidebarStyle: 'dark',
      tabStyle: 'simple',
      layout: 'default',
      sidebarLayout: 'default',
      tabBar: true,
      colorfulIcon: false,
      logoInHeader: false,
      tabInHeader: true,
      fixedBody: true,
      fluid: true,
      sidebarMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sideboxMenuProps: { popupTheme: 'light', popperEffect: 'light' },
      sidebarCustomStyle: null,
      sideboxCustomStyle: null,
      sideCustomStyle: null,
      headerCustomStyle: null,
      tabsCustomStyle: null,
      contentCustomStyle: null,
      layoutCustomStyle: null,
      layoutCustomClass: null
    },
    traditionalThemeConfig: {
      tabStyle: 'button'
    }
  }
];

/**
 * 皮肤背景的预设常用布局
 */
export const SKIN_LAYOUTS = PREDEFINED_LAYOUTS.map((item) => ({
  ...item,
  config: {
    ...item.config,
    headerStyle: 'light',
    sidebarStyle: 'light',
    mixSidebarStyle: 'light',
    tabStyle: item.name === 'cardLayout' ? 'tag' : item.config.tabStyle,
    layoutCustomStyle:
      item.name === 'default'
        ? {
            ...(item.config.layoutCustomStyle || {}),
            '--ele-header-shadow': void 0,
            '--ele-header-dark-shadow': void 0,
            '--ele-sidebar-shadow': void 0,
            '--ele-sidebar-dark-shadow': void 0
          }
        : item.config.layoutCustomStyle,
    tabsCustomStyle:
      item.name === 'default'
        ? {
            ...(item.config.tabsCustomStyle || {}),
            '--ele-tab-button-filter': 'blur(14573px)',
            '--ele-tab-button-shadow': void 0,
            '--ele-tab-button-hover-shadow': void 0,
            '--ele-tab-button-active-shadow': void 0
          }
        : item.config.tabsCustomStyle
  }
}));

/**
 * 预设皮肤背景
 */
export const PREDEFINED_SKINS = [
  {
    name: 'simple',
    title: '清新主题',
    color: '#2f54eb',
    cover: 'CoverSimple',
    themeClass: 'ele-theme-simple',
    darkConfig: {
      color: '#2f54eb',
      cover: 'CoverSimpleDark',
      themeClass: 'ele-theme-simple-dark'
    },
    layouts: SIMPLE_LAYOUTS
  },
  {
    name: 'modern',
    title: '现代主题',
    color: '#1ab394',
    cover: 'CoverModernDefault',
    themeClass: 'ele-theme-modern',
    darkConfig: {
      color: '#1ab394',
      cover: 'CoverModernDefault',
      themeClass: 'ele-theme-modern-dark'
    },
    layouts: MODERN_LAYOUTS,
    defaultLayout: 'rowCompactHeader'
  },
  {
    name: 'gradient',
    title: '彩色渐变',
    color: '#1677ff',
    cover: `url(${wallpaper01Cover}) center / 100% 100%`,
    wallpaper: `url(${wallpaper01}) center / 100% 100%`,
    maskColor: 'rgba(222, 242, 249, 0.4)',
    headerBg: 'rgba(255, 255, 255, 0.4)',
    sidebarBg: 'rgba(255, 255, 255, 0.4)',
    cardBg: 'rgba(255, 255, 255, 0.68)',
    overlayBg: `url(${wallpaper01}) center / 100% 100%`,
    overlayMaskColor:
      'linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0), rgba(255, 255, 255, 0.8)) center / 102% 102%',
    darkConfig: {
      color: '#1677ff',
      cover: `url(${wallpaper01DarkCover}) center / 100% 100%`,
      wallpaper: `url(${wallpaper01Dark}) center / 100% 100%`,
      maskColor: 'rgba(25, 25, 25, 0.5)',
      headerBg: 'rgba(20, 24, 38, 0.58)',
      sidebarBg: 'rgba(20, 24, 38, 0.58)',
      cardBg: 'rgba(20, 24, 38, 0.58)',
      overlayBg: `url(${wallpaper01Dark}) center / 100% 100%`,
      overlayMaskColor:
        'linear-gradient(90deg, rgba(255, 255, 255, 0.08) 8%, rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.08) 92%) center / 102% 102%'
    },
    layouts: SKIN_LAYOUTS,
    defaultLayout: 'cardMixedSidebar'
  },
  {
    name: 'technology',
    title: '蓝色科技',
    color: '#1677ff',
    cover: `url(${wallpaper02Cover}) center / 100% 100%`,
    wallpaper: `url(${wallpaper02}) center / 100% 100%`,
    maskColor: 'rgba(214, 227, 250, 0.4)',
    headerBg: 'rgba(255, 255, 255, 0.4)',
    sidebarBg: 'rgba(255, 255, 255, 0.4)',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    overlayBg: `url(${wallpaper02}) center / 100% 100%`,
    overlayMaskColor:
      'linear-gradient(0deg, rgba(255, 255, 255, 0.8), rgba(214, 227, 250, 0.4), rgba(255, 255, 255, 0.8)) center / 102% 102%',
    darkConfig: {
      color: '#13c2c2',
      cover: `url(${wallpaper02DarkCover}) center / 100% 100%`,
      wallpaper: `url(${wallpaper02Dark}) center / 100% 100%`,
      maskColor: 'rgba(0, 0, 0, 0)',
      headerBg: 'rgba(22, 44, 78, 0.8)',
      sidebarBg: 'rgba(22, 44, 78, 0.8)',
      cardBg: 'rgba(22, 44, 78, 0.68)',
      overlayBg: `url(${wallpaper02Dark}) center / 100% 100%`,
      overlayMaskColor:
        'linear-gradient(0deg, rgba(18, 44, 82, 0.8), rgba(22, 44, 78, 0.4), rgba(18, 44, 82, 0.8)) center / 102% 102%'
    },
    layouts: SKIN_LAYOUTS,
    defaultLayout: 'cardMixedSidebar'
  },
  {
    name: 'aesthetic',
    title: '唯美意境',
    color: '#5f80c7',
    cover: `url(${wallpaper03Cover}) bottom center / cover`,
    wallpaper: `url(${wallpaper03}) bottom center / cover`,
    maskColor:
      'linear-gradient(22deg, rgba(240, 242, 245, 0.08) 0%, rgba(240, 242, 245, 0.88) 100%) center / 100% 100%',
    headerBg: 'rgba(255, 255, 255, 0.48)',
    sidebarBg: 'rgba(255, 255, 255, 0.48)',
    cardBg: 'rgba(255, 255, 255, 0.68)',
    overlayBg: `url(${wallpaper03}) bottom center / cover`,
    overlayMaskColor: 'rgba(255, 255, 255, 0.8)',
    darkConfig: {
      color: '#0ea5e9',
      cover: `url(${wallpaper03Cover}) bottom center / cover`,
      wallpaper: `url(${wallpaper03}) bottom center / cover`,
      maskColor: 'rgba(0, 0, 0, 0.68)',
      headerBg: 'rgba(0, 0, 0, 0.2)',
      sidebarBg: 'rgba(0, 0, 0, 0.2)',
      cardBg: 'rgba(0, 0, 0, 0.38)',
      overlayBg: `url(${wallpaper03}) bottom center / cover`,
      overlayMaskColor: 'rgba(0, 0, 0, 0.8)'
    },
    layouts: SKIN_LAYOUTS,
    defaultLayout: 'cardMixedSidebar'
  },
  {
    name: 'cartoon',
    title: '可爱卡通',
    color: '#0ea5e9',
    cover: `url(${wallpaper04Cover}) top center / cover`,
    wallpaper: `url(${wallpaper04}) top center / cover`,
    maskColor: 'rgba(255, 255, 255, 0.48)',
    headerBg: 'rgba(255, 255, 255, 0.48)',
    sidebarBg: 'rgba(255, 255, 255, 0.48)',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    overlayBg: 'linear-gradient(238deg, #fff1eb 0%, #ace0f9 120%)',
    darkConfig: {
      color: '#32a2d4',
      cover: `url(${wallpaper04Cover}) top center / cover`,
      wallpaper: `url(${wallpaper04}) top center / cover`,
      maskColor: 'rgba(0, 0, 0, 0.8)',
      headerBg: 'rgba(0, 0, 0, 0.2)',
      sidebarBg: 'rgba(0, 0, 0, 0.2)',
      cardBg: 'rgba(0, 0, 0, 0.28)',
      overlayBg: 'linear-gradient(238deg, #372406 0%, #04293a 120%)'
    },
    layouts: SKIN_LAYOUTS,
    defaultLayout: 'cardMixedSidebar'
  }
];

/**
 * 预设主题色
 */
export const PREDEFINE_THEMES = [
  { name: '拂晓蓝', color: '#2f54eb' },
  { name: '极客蓝', value: '#1677ff' },
  { name: '极光绿', value: '#1ab394' },
  { name: '酱紫', value: '#9333ea' },
  { name: '火山', value: '#f5686f' },
  { name: '日暮', value: '#f59b00' },
  { name: '薄暮', value: '#5f80c7' }
];

/**
 * 主题颜色选择器预设颜色
 */
export const PREDEFINE_COLORS = [
  '#0073e6',
  '#0057c3',
  '#2a49b5',
  '#4562bd',
  '#1cad70',
  '#16a34a',
  '#eb4646',
  '#32a2d4',
  '#0ea5e9',
  '#13c2c2'
];
