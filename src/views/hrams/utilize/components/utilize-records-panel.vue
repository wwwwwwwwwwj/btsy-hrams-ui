<template>
  <div class="utilize-records">
    <div class="hrams-v2-card hrams-v2-filter">
      <el-form :inline="true" :model="where" class="ele-form-search">
        <el-form-item label="档案编号"><el-input v-model="where.archiveNo" clearable /></el-form-item>
        <el-form-item label="被查阅人"><el-input v-model="where.personName" clearable /></el-form-item>
        <el-form-item label="借阅日期">
          <el-date-picker
            v-model="borrowDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="where.status" clearable placeholder="全部" style="width: 140px">
            <el-option label="借阅中" value="borrowing" />
            <el-option label="逾期未还" value="overdue" />
            <el-option label="已归还" value="returned" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reloadRecords">查询</el-button>
          <el-button @click="resetRecords">重置</el-button>
          <slot name="extra" />
        </el-form-item>
      </el-form>
    </div>
    <div class="hrams-v2-card hrams-v2-table-card">
      <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
      <template #borrowScope="{ row }">{{ borrowScopeLabel(row) }}</template>
      <template #status="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template>
      <template #attach="{ row }">
        <el-button v-if="row.ossId" link type="primary" @click="previewAttach(row)">查看附件</el-button>
        <span v-else>-</span>
      </template>
      <template #action="{ row }">
        <el-button v-if="row.status !== 'returned'" link type="primary" v-permission="'hrams:borrow:return'" @click="openReturn(row)">归还</el-button>
        <el-button v-if="row.status === 'returned'" link type="danger" v-permission="'hrams:borrow:remove'" @click="handleDelete(row)">删除</el-button>
      </template>
      </ele-pro-table>
    </div>
    <el-dialog v-model="returnVisible" title="确认归还" width="420px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="归还日期" required>
          <el-date-picker
            v-model="returnTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择归还时间"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnVisible = false">取消</el-button>
        <el-button type="primary" :loading="returnSubmitting" @click="confirmReturn">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
import { ElMessageBox } from 'element-plus';
  import { pageBorrow, returnBorrow, deleteBorrow, previewBorrowAttachment } from '@/api/hrams/borrow';
  import { formatLocalDateTime } from '@/utils/hrams-date';

  const tableRef = ref(null);
  const where = ref({});
  const borrowDateRange = ref(null);
  const returnVisible = ref(false);
  const returnSubmitting = ref(false);
  const returnTime = ref('');
  const returningRow = ref(null);

  const columns = ref([
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'personName', label: '被查阅人', minWidth: 100 },
    { prop: 'borrowTime', label: '借阅时间', minWidth: 160 },
    { prop: 'expectedReturn', label: '预计归还', minWidth: 160 },
    { prop: 'borrower', label: '借阅人', width: 100 },
    { columnKey: 'borrowScope', label: '调阅范围', width: 100, slot: 'borrowScope' },
    { prop: 'reason', label: '借阅事由', minWidth: 120, showOverflowTooltip: true },
    { prop: 'remark', label: '备注', minWidth: 100, showOverflowTooltip: true },
    { columnKey: 'attach', label: '附件', width: 100, slot: 'attach' },
    { prop: 'returnTime', label: '归还时间', minWidth: 160 },
    { columnKey: 'status', label: '借阅状态', width: 100, slot: 'status' },
    { columnKey: 'action', label: '操作', width: 90, slot: 'action' }
  ]);

  const borrowScopeLabel = (row) => {
    if (row.borrowScope === 'partial') {
      const codes = row.scopeCategoryCodes?.length ? row.scopeCategoryCodes.join('、') : '指定大类';
      return `部分：${codes}`;
    }
    return '整卷';
  };
  const statusLabel = (s) => ({ borrowing: '借阅中', overdue: '逾期未还', returned: '已归还' }[s] || s);
  const statusType = (s) => ({ borrowing: 'warning', overdue: 'danger', returned: 'success' }[s] || 'info');

  const buildWhere = (w) => {
    const q = { ...(w || where.value) };
    if (borrowDateRange.value?.length === 2) {
      q.borrowTimeBegin = `${borrowDateRange.value[0]} 00:00:00`;
      q.borrowTimeEnd = `${borrowDateRange.value[1]} 23:59:59`;
    }
    return q;
  };

  const datasource = ({ pages, where: w }) => pageBorrow({ ...buildWhere(w), ...pages });
  const reloadRecords = () => tableRef.value?.reload?.({ where: buildWhere(), page: 1 });
  const resetRecords = () => {
    where.value = {};
    borrowDateRange.value = null;
    reloadRecords();
  };

  const openReturn = (row) => {
    returningRow.value = row;
    returnTime.value = formatLocalDateTime();
    returnVisible.value = true;
  };

  const confirmReturn = async () => {
    if (!returningRow.value?.id) return;
    if (!returnTime.value) {
      EleMessage.error({ message: '请选择归还日期', plain: true });
      return;
    }
    returnSubmitting.value = true;
    try {
      await returnBorrow(returningRow.value.id, returnTime.value);
      EleMessage.success({ message: '已归还', plain: true });
      returnVisible.value = false;
      reloadRecords();
    } catch (e) {
      EleMessage.error({ message: e.message || '归还失败', plain: true });
    } finally {
      returnSubmitting.value = false;
    }
  };

  const handleDelete = (row) => {
    ElMessageBox.confirm(
      `确认删除【${row.personName || ''}】的借阅记录吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    ).then(async () => {
      try {
        await deleteBorrow(row.id);
        EleMessage.success({ message: '已删除', plain: true });
        reloadRecords();
      } catch (e) {
        EleMessage.error({ message: e.message || '删除失败', plain: true });
      }
    }).catch(() => {});
  };

  const previewAttach = (row) => {
    previewBorrowAttachment(row.id, row.attachFileName).catch((e) =>
      EleMessage.error({ message: e.message, plain: true })
    );
  };

  defineExpose({ reloadRecords });
</script>
