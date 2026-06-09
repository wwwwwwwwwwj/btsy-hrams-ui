import { exceljsExportPlugin } from 'ele-admin-plus/es/ele-pro-table/exceljs-plugin';
import { AMapPlugin } from 'ele-admin-plus/es/ele-map-picker/amap-plugin';

/**
 * 组件全局配置
 */
export function useGlobalConfig() {
  /** 高级表格全局配置 */
  const tableConfig = {
    response: {
      dataName: 'rows',
      countName: 'total'
    },
    request: {
      pageName: 'pageNum',
      limitName: 'pageSize',
      sortName: 'orderByColumn',
      orderName: 'isAsc',
      ascValue: 'ascending',
      descValue: 'descending'
    },
    tools: ['reload', 'export', 'print', 'size', 'columns', 'maximized'],
    pagination: {
      pageSize: 20
    },
    exportConfig: {
      // 使用 exceljs 进行导出
      exportPlugin: exceljsExportPlugin
    }
  };

  return {
    table: tableConfig,
    mapPlugin: AMapPlugin,
    // 地图位置选择默认使用高德地图
    mapKey: import.meta.env.VITE_MAP_KEY,
    license: import.meta.env.VITE_LICENSE
  };
}
