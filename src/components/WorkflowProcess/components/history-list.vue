<!-- 审批记录 -->
<template>
  <div style="padding-top: 12px">
    <ele-pro-table
      row-key="id"
      :columns="columns"
      :datasource="data"
      :highlight-current-row="true"
      :export-config="{ fileName: '审批信息' }"
      :pagination="false"
      :tools="['export', 'print', 'size', 'columns', 'maximized']"
      :cell-style="{ '--ele-table-line-height': '1.2' }"
      :loading="historyLoading"
    >
      <template #approveName="{ row }">
        <div
          v-if="row.approveName"
          :style="{
            display: 'inline-flex',
            gap: '4px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }"
        >
          <el-tag
            v-for="item in row.approveName.split(',')"
            :key="item"
            type="info"
            size="small"
            :disable-transitions="true"
          >
            {{ item }}
          </el-tag>
        </div>
        <span v-else>无</span>
      </template>
      <template #flowStatus="{ row }">
        <dict-data
          code="wf_task_status"
          type="tag"
          :model-value="row.flowStatus"
        />
      </template>
      <template #ext="{ row }">
        <el-link
          v-if="row.ext"
          type="primary"
          underline="never"
          @click="handleAttachment(row)"
        >
          查看
        </el-link>
      </template>
    </ele-pro-table>
    <ele-modal
      :width="460"
      title="附件"
      v-model="showAttachment"
      :destroy-on-close="true"
    >
      <ele-loading :loading="attachmentLoading" :style="{ minHeight: '220px' }">
        <ele-upload-list
          :readonly="true"
          v-model="files"
          list-type="file"
          :item-style="{ height: '32px', padding: '0 14px' }"
        >
          <template #itemExtra="{ item }">
            <el-link
              type="primary"
              underline="never"
              @click.stop="handleDownload(item)"
            >
              下载
            </el-link>
          </template>
        </ele-upload-list>
      </ele-loading>
    </ele-modal>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { isImageUrl } from '@/utils/common';
  import { useDictData } from '@/utils/use-dict-data';
  import { listOssById, downloadOss } from '@/api/system/oss';

  defineOptions({ name: 'HistoryList' });

  defineProps({
    /** 数据 */
    data: Array,
    /** 请求状态 */
    historyLoading: Boolean
  });

  /** 字典数据 */
  const [taskStatusDicts] = useDictData(['wf_task_status']);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center'
    },
    {
      prop: 'nodeName',
      label: '任务名称',
      align: 'center',
      minWidth: 100
    },
    {
      prop: 'approveName',
      label: '办理人',
      align: 'center',
      minWidth: 168,
      slot: 'approveName',
      formatter: (row) => row.approveName || '无'
    },
    {
      prop: 'flowStatus',
      label: '状态',
      align: 'center',
      width: 90,
      slot: 'flowStatus',
      formatter: (row) =>
        taskStatusDicts.value.find((d) => d.dictValue == row.flowStatus)
          ?.dictLabel ?? ''
    },
    {
      prop: 'message',
      label: '审批意见',
      minWidth: 100,
      align: 'center'
    },
    {
      prop: 'createTime',
      label: '开始时间',
      align: 'center',
      minWidth: 100
    },
    {
      prop: 'updateTime',
      label: '结束时间',
      align: 'center',
      minWidth: 100
    },
    {
      prop: 'runDuration',
      label: '耗时',
      minWidth: 100,
      align: 'center'
    },
    {
      prop: 'ext',
      label: '附件',
      width: 80,
      align: 'center',
      slot: 'ext',
      hideInPrint: true,
      hideInExport: true
    }
  ]);

  /** 是否显示附件查看弹窗 */
  const showAttachment = ref(false);

  /** 附件列表 */
  const files = ref([]);

  /** 请求状态 */
  const attachmentLoading = ref(false);

  /** 查看附件 */
  const handleAttachment = (row) => {
    files.value = [];
    showAttachment.value = true;
    attachmentLoading.value = true;
    listOssById(row.ext)
      .then((data) => {
        attachmentLoading.value = false;
        files.value = (data || []).map((d) => ({
          key: d.ossId,
          url: d.url,
          name: d.originalName,
          thumbnail: isImageUrl(d.url)
        }));
      })
      .catch((e) => {
        attachmentLoading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 下载附件 */
  const handleDownload = (item) => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    downloadOss(item.key)
      .then(() => {
        loading.close();
      })
      .catch((e) => {
        loading.close();
        EleMessage.error({ message: e.message, plain: true });
      });
  };
</script>
