<template>
  <ele-modal
    :width="720"
    title="详情"
    :body-style="{ paddingTop: '6px' }"
    v-bind="modalProps"
  >
    <el-descriptions
      v-if="data"
      size="large"
      :border="true"
      :column="mobile ? 1 : 2"
      class="detail-table"
    >
      <el-descriptions-item label="操作模块">
        <div>
          <span>{{ data.title }} / </span>
          <dict-data
            code="sys_oper_type"
            type="text"
            :model-value="data.businessType"
          />
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="请求地址">
        <div>{{ data.operUrl }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="请求方式">
        <div>{{ data.requestMethod }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="操作时间">
        <div>{{ data.operTime }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="登录信息" :span="2">
        <div style="word-break: break-all">
          {{ data.operName }} / {{ data.deptName }} / {{ data.operIp }} /
          {{ data.operLocation }}
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="操作方法" :span="2">
        <div style="word-break: break-all">{{ data.method }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="请求参数" :span="2">
        <ele-ellipsis :max-line="4" :tooltip="ellipsisTooltipProps">
          {{ data.operParam }}
        </ele-ellipsis>
      </el-descriptions-item>
      <el-descriptions-item label="返回参数" :span="2">
        <ele-ellipsis :max-line="4" :tooltip="ellipsisTooltipProps">
          {{ data.jsonResult }}
        </ele-ellipsis>
      </el-descriptions-item>
      <el-descriptions-item label="操作状态">
        <dict-data
          code="sys_common_status"
          type="tag"
          :model-value="data.status"
        />
      </el-descriptions-item>
      <el-descriptions-item label="消耗时间">
        <div>{{ data.costTime }}毫秒</div>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.status === 1" label="异常信息" :span="2">
        <ele-ellipsis :max-line="4" :tooltip="ellipsisTooltipProps">
          {{ data.errorMsg }}
        </ele-ellipsis>
      </el-descriptions-item>
    </el-descriptions>
  </ele-modal>
</template>

<script setup>
  import { reactive } from 'vue';
  import { useModal } from 'ele-admin-plus';
  import { useMobile } from '@/utils/use-mobile';

  defineProps({
    /** 数据 */
    data: Object
  });

  const { modalProps } = useModal();

  /** 文字省略组件的提示组件的属性 */
  const ellipsisTooltipProps = reactive({
    popperStyle: {
      width: '580px',
      maxWidth: '90%',
      wordBreak: 'break-all'
    },
    bodyStyle: {
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '252px',
      overflowY: 'auto',
      '--ele-scrollbar-color': '#5e5e5e',
      '--ele-scrollbar-hover-color': '#707070',
      '--ele-scrollbar-size': '8px'
    },
    offset: 4,
    placement: 'top'
  });

  /** 是否是移动端 */
  const { mobile } = useMobile();
</script>

<style lang="scss" scoped>
  .detail-table :deep(td.el-descriptions__label.el-descriptions__cell) {
    width: 100px;
    text-align: right;
    font-weight: normal;
  }

  @media screen and (max-width: 767.99px) {
    .detail-table :deep(td.el-descriptions__label.el-descriptions__cell) {
      width: 88px;
    }
  }
</style>
