/** 登录页面的路由地址 */
export const LOGIN_PATH = '/login';

/** 不需要登录的路由地址 */
export const WHITE_LIST = [LOGIN_PATH, '/forget'];

/** 首页路径, 为空则取第一个菜单的地址 */
export const HOME_PATH = void 0;

/** 外层布局的路由地址 */
export const LAYOUT_PATH = '/';

/** 刷新路由的路由地址 */
export const REDIRECT_PATH = '/redirect';

/** 页签最大打开数量 */
export const TAB_MAX_NUM = 15;

/** token本地缓存的名称 */
export const TOKEN_CACHE_NAME = 'token';

/** 主题配置本地缓存的名称 */
export const THEME_CACHE_NAME = 'theme';

/** token请求头名称 */
export const TOKEN_HEADER_NAME = 'Authorization';

/** 客户端请求头名称 */
export const CLIENT_HEADER_NAME = 'clientid';

/** 数据加密请求头名称 */
export const ENCRYPT_HEADER_NAME = 'encrypt-key';

/** 防止重复提交间隔时间 */
export const REPEAT_SUBMIT_INTERVAL = 500;
