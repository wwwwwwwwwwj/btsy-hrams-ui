<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <el-form :inline="true" :model="where" class="ele-form-search">
          <el-form-item label="状态">
            <el-select v-model="where.status" clearable placeholder="全部" style="width: 140px">
              <el-option label="草稿" value="draft" />
              <el-option label="已提交" value="submitted" />
              <el-option label="已作废" value="void" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="reload">查询</el-button>
            <el-button v-permission="'hrams:accept:pass'" @click="openCreate">从待验生成</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
        <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
          <template #status="{ row }">{{ statusLabel(row.status) }}</template>
          <template #action="{ row }">
            <el-button link type="primary" @click="openDetail(row)">明细</el-button>
            <el-button link type="primary" v-permission="'hrams:accept:export'" @click="onExport(row)">导出C.1</el-button>
            <el-button
              v-if="row.status !== 'void'"
              link
              type="danger"
              v-permission="'hrams:accept:reject'"
              @click="onVoid(row)"
            >作废</el-button>
          </template>
        </ele-pro-table>
      </div>
    </div>

    <el-dialog v-model="createVisible" title="选择待验收人员" width="760px" destroy-on-close>
      <p class="hint">一人一行出表 C.1。混合批次按行分流，不强制拆批。</p>
      <el-table :data="pending" row-key="personId" @selection-change="onPendingSelect" max-height="360">
        <el-table-column type="selection" width="44" />
        <el-table-column prop="archiveNo" label="档案编号" width="120" />
        <el-table-column prop="personName" label="姓名" width="90" />
        <el-table-column prop="personKind" label="类型" width="100">
          <template #default="{ row }">{{ kindLabel(row.personKind) }}</template>
        </el-table-column>
        <el-table-column prop="materialCount" label="待验份数" width="90" />
      </el-table>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="doCreate">生成验收单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" :title="`表 C.1 ${detail?.batchNo || ''}`" width="1100px" destroy-on-close>
      <el-descriptions v-if="detail" :column="3" border size="small">
        <el-descriptions-item label="批次号">{{ detail.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="批次说明" :span="3">{{ detail.remark }}</el-descriptions-item>
        <el-descriptions-item label="验收人">{{ detail.acceptorName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="验收时间">{{ detail.acceptTime || '—' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail?.items || []" size="small" class="c1-table" max-height="420">
        <el-table-column prop="seqNo" label="序号" width="60" />
        <el-table-column prop="personName" label="档案姓名" width="90" />
        <el-table-column label="人员建库情况" min-width="180">
          <template #default="{ row }">
            <el-input v-if="detail.status === 'draft'" v-model="row.personDbStatus" type="textarea" :rows="2" />
            <span v-else>{{ row.personDbStatus }}</span>
          </template>
        </el-table-column>
        <el-table-column label="目录建库情况" min-width="160">
          <template #default="{ row }">
            <el-input v-if="detail.status === 'draft'" v-model="row.catalogStatus" type="textarea" :rows="2" />
            <span v-else>{{ row.catalogStatus }}</span>
          </template>
        </el-table-column>
        <el-table-column label="原始图像情况" min-width="160">
          <template #default="{ row }">
            <el-input v-if="detail.status === 'draft'" v-model="row.originalImageStatus" type="textarea" :rows="2" />
            <span v-else>{{ row.originalImageStatus }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="optimizedImageStatus" label="优化图像情况" min-width="140" />
        <el-table-column label="是否合格" width="80">
          <template #default="{ row }">{{ row.qualified === '1' ? '√' : '×' }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">
            <el-input v-if="detail.status === 'draft'" v-model="row.remark" type="textarea" :rows="2" />
            <span v-else>{{ row.remark }}</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="detail?.status === 'draft'" v-permission="'hrams:accept:pass'" @click="doSave">保存</el-button>
        <el-button v-if="detail?.status === 'draft'" type="primary" v-permission="'hrams:accept:pass'" @click="doSubmit">提交验收</el-button>
      </template>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { ElMessageBox } from 'element-plus';
  import {
    createAcceptance,
    exportAcceptance,
    getAcceptance,
    pageAcceptance,
    pendingAcceptance,
    saveAcceptanceItems,
    submitAcceptance,
    voidAcceptance
  } from '@/api/hrams/accept';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsAcceptance' });

  const tableRef = ref(null);
  const where = ref({});
  const createVisible = ref(false);
  const creating = ref(false);
  const pending = ref([]);
  const selectedIds = ref([]);
  const detailVisible = ref(false);
  const detail = ref(null);

  const columns = [
    { prop: 'batchNo', label: '批次号', minWidth: 180 },
    { prop: 'sourceType', label: '来源', width: 90 },
    { prop: 'newcomerCount', label: '新进/变更', width: 100 },
    { prop: 'stockCount', label: '存量增量', width: 90 },
    { columnKey: 'status', label: '状态', width: 90, slot: 'status' },
    { prop: 'acceptorName', label: '验收人', width: 100 },
    { prop: 'acceptTime', label: '验收时间', minWidth: 160 },
    { columnKey: 'action', label: '操作', width: 200, slot: 'action', fixed: 'right' }
  ];

  const statusLabel = (s) => ({ draft: '草稿', submitted: '已提交', void: '已作废' }[s] || s);
  const kindLabel = (k) => ({ newcomer: '新进', changed: '五项变更', stock: '存量增量' }[k] || k);

  const datasource = ({ pages, where: w }) => pageAcceptance({ ...w, ...pages });
  const reload = () => tableRef.value?.reload?.({ where: where.value, page: 1 });

  const openCreate = async () => {
    pending.value = await pendingAcceptance();
    selectedIds.value = [];
    createVisible.value = true;
  };

  const onPendingSelect = (rows) => {
    selectedIds.value = rows.map((r) => r.personId);
  };

  const doCreate = async () => {
    if (!selectedIds.value.length) {
      EleMessage.warning({ message: '请选择人员', plain: true });
      return;
    }
    creating.value = true;
    try {
      const vo = await createAcceptance(selectedIds.value);
      createVisible.value = false;
      EleMessage.success({ message: '已生成验收单', plain: true });
      reload();
      detail.value = vo;
      detailVisible.value = true;
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      creating.value = false;
    }
  };

  const openDetail = async (row) => {
    detail.value = await getAcceptance(row.id);
    detailVisible.value = true;
  };

  const doSave = async () => {
    try {
      detail.value = await saveAcceptanceItems(detail.value.id, detail.value.items);
      EleMessage.success({ message: '已保存，结论由四栏派生不可手改', plain: true });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const doSubmit = async () => {
    try {
      detail.value = await submitAcceptance(detail.value.id);
      EleMessage.success({ message: '已提交，台账只可追加或作废', plain: true });
      reload();
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const onExport = (row) => {
    exportAcceptance(row.id).catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const onVoid = (row) => {
    ElMessageBox.prompt('作废须留原因', '作废验收单', { confirmButtonText: '作废', cancelButtonText: '取消' })
      .then(async ({ value }) => {
        await voidAcceptance(row.id, value || '作废');
        EleMessage.success({ message: '已作废', plain: true });
        reload();
      })
      .catch(() => {});
  };
</script>

<style scoped>
  .hint {
    margin: 0 0 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  .c1-table {
    margin-top: 12px;
  }
</style>
