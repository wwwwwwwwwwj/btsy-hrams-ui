<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <div class="page-head">
        <div>
          <div class="title">扫描接收</div>
          <div class="desc">配置扫描仪输出目录，定时或手动扫描入待归档材料池</div>
        </div>
        <el-button @click="$router.push('/hrams/archive')">返回档案管理</el-button>
      </div>
      <div class="toolbar">
        <el-button type="primary" v-permission="'hrams:scan:edit'" @click="openConfig()">新增目录</el-button>
        <el-button v-permission="'hrams:scan:run'" @click="runAll">扫描全部启用目录</el-button>
      </div>
      <el-table :data="configs" style="margin-top:12px" size="small">
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="dirPath" label="目录路径" min-width="240" show-overflow-tooltip />
        <el-table-column label="递归" width="70">
          <template #default="{ row }">{{ row.recursive === '1' ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="启用" width="70">
          <template #default="{ row }">{{ row.enabled === '1' ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button link type="primary" v-permission="'hrams:scan:edit'" @click="openConfig(row)">编辑</el-button>
            <el-button link type="primary" v-permission="'hrams:scan:run'" @click="runOne(row)">扫描</el-button>
            <el-button link type="danger" v-permission="'hrams:scan:edit'" @click="removeConfig(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </ele-card>

    <ele-card bordered style="margin-top:16px">
      <div class="sub-title">扫描日志</div>
      <ele-pro-table ref="logRef" row-key="id" :columns="logColumns" :datasource="logDatasource" />
    </ele-card>

    <el-dialog v-model="configVisible" :title="configForm.id ? '编辑目录' : '新增目录'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="名称" required><el-input v-model="configForm.name" /></el-form-item>
        <el-form-item label="目录路径" required><el-input v-model="configForm.dirPath" placeholder="/path/to/scan" /></el-form-item>
        <el-form-item label="递归子目录">
          <el-switch v-model="configForm.recursive" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="configForm.enabled" active-value="1" inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfigForm">保存</el-button>
      </template>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';

  import {
    listScanConfigs, saveScanConfig, deleteScanConfig, runScanConfig, runAllScanConfigs, pageScanLogs
  } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsArchiveScan' });
  const configs = ref([]);
  const configVisible = ref(false);
  const configForm = ref({});
  const logRef = ref(null);

  const logColumns = ref([
    { type: 'index', width: 55, label: '序号' },
    { prop: 'filePath', label: '文件路径', minWidth: 240, showOverflowTooltip: true },
    { prop: 'action', label: '动作', width: 100 },
    { prop: 'message', label: '说明', minWidth: 180, showOverflowTooltip: true },
    { prop: 'createTime', label: '时间', minWidth: 160 }
  ]);

  const loadConfigs = async () => {
    configs.value = await listScanConfigs();
  };

  const openConfig = (row) => {
    configForm.value = row
      ? { ...row }
      : { name: '', dirPath: '', recursive: '1', enabled: '1' };
    configVisible.value = true;
  };

  const saveConfigForm = async () => {
    try {
      await saveScanConfig(configForm.value);
      EleMessage.success({ message: '已保存', plain: true });
      configVisible.value = false;
      loadConfigs();
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const removeConfig = async (row) => {
    await deleteScanConfig(row.id);
    EleMessage.success({ message: '已删除', plain: true });
    loadConfigs();
  };

  const runOne = async (row) => {
    try {
      await runScanConfig(row.id);
      EleMessage.success({ message: '扫描完成', plain: true });
      logRef.value?.reload?.({ page: 1 });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const runAll = async () => {
    try {
      await runAllScanConfigs();
      EleMessage.success({ message: '扫描完成', plain: true });
      logRef.value?.reload?.({ page: 1 });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const logDatasource = ({ pages }) => pageScanLogs(pages);

  onMounted(loadConfigs);
</script>

<style scoped>
  .page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .title { font-size: 18px; font-weight: 600; }
  .desc { font-size: 13px; color: #666; margin-top: 4px; }
  .toolbar { display: flex; gap: 8px; }
  .sub-title { font-weight: 600; margin-bottom: 8px; }
</style>
