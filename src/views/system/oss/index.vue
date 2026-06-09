<template>
  <ele-page hide-footer flex-table="auto">
    <!-- 搜索表单 -->
    <oss-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }" flex-table="auto">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="ossId"
        :columns="columns"
        :datasource="datasource"
        :highlight-current-row="true"
        v-model:selections="selections"
        :pagination="{ pageSize: 10 }"
        :export-config="{ fileName: '文件' }"
        cache-key="SystemOssTable"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'upload',
                permission: 'system:oss:upload',
                onClick: () => handleOpenUpload()
              },
              {
                preset: 'del',
                permission: 'system:oss:remove',
                props: { class: 'hidden-sm-and-down' },
                onClick: () => handleRemove()
              },
              {
                title: `预览开关:${previewListResource ? '禁用' : '启用'}`,
                permission: 'system:oss:edit',
                props: {
                  plain: true,
                  type: previewListResource ? 'danger' : 'success',
                  style: { paddingLeft: '8px', paddingRight: '8px' }
                },
                onClick: () => handlePreviewListResource()
              },
              {
                title: '配置管理',
                icon: ControlOutlined,
                permission: 'system:ossConfig:list',
                props: { type: 'default' },
                onClick: () => handleOpenOssConfig()
              }
            ]"
          />
        </template>
        <template #url="{ row }">
          <img
            v-if="previewListResource && isImageUrl(row.fileSuffix)"
            :src="row.url"
            class="oss-preview-img"
            @click="handlePreview(row)"
          />
          <span v-else>{{ row.url }}</span>
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'download',
                permission: 'system:oss:download',
                onClick: () => handleDownload(row)
              },
              {
                preset: 'del',
                permission: 'system:oss:remove',
                onClick: () => handleRemove(row)
              }
            ]"
          />
        </template>
      </ele-pro-table>
    </ele-card>
    <!-- 图片查看器 -->
    <ele-image-viewer v-model="showImageViewer" :url-list="imageViewerList" />
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { ControlOutlined } from '@/components/icons';
  import { isImageUrl } from '@/utils/common';
  import OssSearch from './components/oss-search.vue';
  import { pageOss, removeOss, downloadOss } from '@/api/system/oss';
  import { updateConfigByKey, getConfigKey } from '@/api/system/config';

  defineOptions({ name: 'SystemConfig' });

  const { openModal } = useModal();

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'selection',
      columnKey: 'selection',
      width: 50,
      align: 'center',
      showOverflowTooltip: false
    },
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center'
    },
    {
      prop: 'fileName',
      label: '文件名',
      align: 'center',
      minWidth: 220
    },
    {
      prop: 'originalName',
      label: '原名',
      align: 'center',
      minWidth: 220
    },
    {
      prop: 'fileSuffix',
      label: '文件后缀',
      align: 'center',
      width: 90
    },
    {
      prop: 'url',
      label: '文件展示',
      align: 'center',
      width: 220,
      slot: 'url'
    },
    {
      prop: 'createTime',
      label: '创建时间',
      align: 'center',
      width: 180,
      sortable: 'custom'
    },
    {
      prop: 'createByName',
      label: '上传人',
      align: 'center',
      width: 90
    },
    {
      prop: 'service',
      label: '服务商',
      align: 'center',
      width: 90,
      sortable: 'custom'
    },
    {
      columnKey: 'action',
      label: '操作',
      width: 156,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true
    }
  ]);

  /** 表格选中数据 */
  const selections = ref([]);

  /** 预览开关状态 */
  const previewListResource = ref(true);

  /** 是否打开图片预览组件 */
  const showImageViewer = ref(false);

  /** 图片预览列表 */
  const imageViewerList = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where, orders }) => {
    getConfigKey('sys.oss.previewListResource')
      .then((val) => {
        previewListResource.value = Boolean(val);
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
    return pageOss({ ...where, ...orders, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开上传弹窗 */
  const handleOpenUpload = () => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/oss-upload.vue'),
      componentProps: { onDone: () => reload() }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    const rows = row == null ? selections.value : [row];
    if (!rows.length) {
      EleMessage.error({ message: '请至少选择一条数据', plain: true });
      return;
    }
    ElMessageBox.confirm(
      `是否确认删除文件名为"${rows.map((d) => d.fileName).join()}"的数据项?`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        removeOss(rows.map((d) => d.ossId))
          .then(() => {
            loading.close();
            EleMessage.success({ message: '删除成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 下载 */
  const handleDownload = (row) => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    downloadOss(row.ossId)
      .then(() => {
        loading.close();
      })
      .catch((e) => {
        loading.close();
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 预览开关按钮  */
  const handlePreviewListResource = () => {
    const preview = !previewListResource.value;
    const text = preview ? '启用' : '停用';
    ElMessageBox.confirm(`确认要"${text}""预览列表图片"配置吗?`, '系统提示', {
      type: 'warning',
      draggable: true
    })
      .then(() => {
        const loading = EleMessage.loading({
          message: '请求中..',
          plain: true
        });
        updateConfigByKey('sys.oss.previewListResource', preview)
          .then(() => {
            loading.close();
            EleMessage.success({ message: `${text}成功`, plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 预览图片  */
  const handlePreview = (row) => {
    imageViewerList.value = [row.url];
    showImageViewer.value = true;
  };

  /** 打开配置管理  */
  const handleOpenOssConfig = () => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/oss-config.vue')
    });
  };
</script>

<style lang="scss" scoped>
  .oss-preview-img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    display: block;
    margin: 0 auto;
    cursor: zoom-in;
  }
</style>
