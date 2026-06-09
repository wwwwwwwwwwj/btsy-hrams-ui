import {
  reactive,
  provide,
  watch,
  onActivated,
  onDeactivated,
  nextTick
} from 'vue';
import { storeToRefs } from 'pinia';
import { THEME_KEY } from 'vue-echarts';
import { merge as mergeValue } from 'lodash-es';
import {
  ChartTheme,
  ChartThemeDark,
  ChartThemeTransparent,
  ChartThemeDarkTransparent
} from 'ele-admin-plus';
import { useThemeStore } from '@/store/modules/theme';
import { useBodyResize } from './use-body-resize';

/**
 * 根据主题色生成图表配置
 * @param colorLevels 色阶
 * @param config 图表配置
 */
function getThemeConfig(colorLevels, config) {
  const chartColors = (config.color || []).slice(1);
  return mergeValue({}, config, {
    color: [colorLevels.colorL, ...chartColors],
    bar: {
      color: [
        {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 1, color: colorLevels.colorL },
            { offset: 0.4, color: colorLevels.colorXL },
            { offset: 0, color: colorLevels.colorXXL }
          ]
        },
        ...chartColors
      ]
    },
    line: {
      areaStyle: {
        opacity: 0.58,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: colorLevels.colorXL },
            { offset: 1, color: colorLevels.colorXXXXL }
          ]
        }
      }
    },
    visualMap: {
      color: [colorLevels.colorL, colorLevels.colorXXL, colorLevels.colorXXXXL]
    }
  });
}

/**
 * echarts 自动切换主题/重置尺寸 hook
 * @param refs 图表 ref
 * @param autoColor 是否跟随主题色
 */
export function useEcharts(refs, autoColor) {
  /** 是否是暗黑主题 */
  const themeStore = useThemeStore();
  const { darkMode, colors } = storeToRefs(themeStore);

  /** 当前图表主题 */
  const chartsTheme = reactive({});

  /** 当前图表是否是暗黑主题 */
  let isDark;

  /** 当前图表使用的主色 */
  let primaryColor;

  /** 是否为 deactivated 状态 */
  let deactivated = false;

  /** 更改图表主题 */
  const changeTheme = () => {
    isDark = darkMode.value;
    let colorLevels = colors.value;
    primaryColor = colorLevels?.color;
    if (!colorLevels) {
      if (isDark) {
        colorLevels = {
          color: '#0052d9',
          colorL: '#07419f',
          colorXL: '#0c3579',
          colorXXL: '#112952',
          colorXXXL: '#13243f',
          colorXXXXL: '#161e2b',
          colorD: '#3375e1',
          isTransparent: false
        };
      } else {
        colorLevels = {
          color: '#2f54eb',
          colorL: '#6d87f1',
          colorXL: '#97aaf5',
          colorXXL: '#c1ccf9',
          colorXXXL: '#d5ddfb',
          colorXXXXL: '#eaeefd',
          colorD: '#2643bc',
          isTransparent: false
        };
      }
    }
    const isTransparent = colorLevels.isTransparent;
    const chartThemeConfig = isDark
      ? isTransparent
        ? ChartThemeDarkTransparent
        : ChartThemeDark
      : isTransparent
        ? ChartThemeTransparent
        : ChartTheme;
    if (!autoColor) {
      Object.assign(chartsTheme, chartThemeConfig);
      return;
    }
    Object.assign(chartsTheme, getThemeConfig(colorLevels, chartThemeConfig));
  };

  watch(
    [darkMode, colors],
    () => {
      if (!deactivated) {
        changeTheme();
      }
    },
    { immediate: true }
  );

  /** 设置图表主题 */
  provide(THEME_KEY, chartsTheme);

  /** 重置图表尺寸 */
  const resizeCharts = () => {
    refs.forEach((chartRef) => {
      chartRef.value?.resize?.();
    });
  };

  /** 屏幕尺寸变化监听 */
  useBodyResize(() => {
    if (!deactivated) {
      resizeCharts();
    }
  });

  /** 适配 KeepAlive */
  onActivated(() => {
    deactivated = false;
    nextTick(() => {
      if (
        isDark !== darkMode.value ||
        (autoColor && primaryColor !== colors.value?.color)
      ) {
        changeTheme();
      } else {
        resizeCharts();
      }
    });
  });

  onDeactivated(() => {
    deactivated = true;
  });
}
