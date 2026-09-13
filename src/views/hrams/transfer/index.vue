<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <el-form :inline="true" :model="where" class="ele-form-search">
          <el-form-item label="方向">
            <el-select v-model="where.direction" clearable style="width: 120px">
              <el-option label="调出" value="outbound" />
              <el-option label="调入" value="inbound" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="where.businessStatus" clearable style="width: 160px">
              <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="reload">查询</el-button>
            <el-button v-permission="'hrams:transfer:add'" @click="openCreate('outbound')">调出申请</el-button>
            <el-button v-permission="'hrams:transfer:add'" @click="openCreate('inbound')">登记调入</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
        <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
          <template #direction="{ row }">{{ row.direction === 'inbound' ? '调入' : '调出' }}</template>
          <template #status="{ row }">{{ statusLabel(row.businessStatus) }}</template>
          <template #action="{ row }">
            <el-button v-if="row.businessStatus === 'draft'" link type="primary" v-permission="'hrams:transfer:add'" @click="act(() => submitTransfer(row.id))">提交</el-button>
            <el-button v-if="row.businessStatus === 'pending_approve'" link type="primary" v-permission="'hrams:transfer:approve'" @click="approve(row, true)">通过</el-button>
            <el-button v-if="row.businessStatus === 'pending_approve'" link type="danger" v-permission="'hrams:transfer:approve'" @click="approve(row, false)">驳回</el-button>
            <el-button v-if="row.businessStatus === 'inventory'" link type="primary" v-permission="'hrams:transfer:inventory'" @click="act(() => inventoryTransfer(row.id))">清点</el-button>
            <el-button v-if="row.businessStatus === 'sealing'" link type="primary" v-permission="'hrams:transfer:seal'" @click="doSeal(row)">密封</el-button>
            <el-button v-if="row.businessStatus === 'sealing'" link type="primary" v-permission="'hrams:transfer:send'" @click="doSend(row)">发出</el-button>
            <el-button v-if="row.businessStatus === 'in_transit'" link type="primary" v-permission="'hrams:transfer:receive'" @click="doReceive(row)">签收</el-button>
            <el-button v-if="['in_transit','sealing','inventory'].includes(row.businessStatus)" link type="danger" v-permission="'hrams:transfer:return'" @click="doReturn(row)">退回</el-button>
            <el-button v-if="row.businessStatus === 'inbound_registered'" link type="primary" v-permission="'hrams:transfer:receive'" @click="act(() => checkInbound(row.id))">核对</el-button>
            <el-button v-if="row.businessStatus === 'inbound_checked'" link type="primary" v-permission="'hrams:transfer:receive'" @click="act(() => archiveInbound(row.id))">归档</el-button>
          </template>
        </ele-pro-table>
      </div>
    </div>

    <el-dialog v-model="formVisible" :title="form.direction === 'inbound' ? '登记调入' : '调出申请'" width="560px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="档案编号" required>
          <el-select
            v-model="form.archiveNo"
            filterable
            remote
            clearable
            placeholder="输入档案编号检索"
            :remote-method="searchByArchiveNo"
            :loading="lookupLoading"
            style="width:100%"
            @change="onArchiveNoChange"
          >
            <el-option
              v-for="p in archiveOptions"
              :key="p.id"
              :label="`${p.archiveNo} ${p.name || ''}`"
              :value="p.archiveNo"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-select
            v-model="form.personName"
            filterable
            remote
            clearable
            placeholder="输入姓名检索"
            :remote-method="searchByName"
            :loading="lookupLoading"
            style="width:100%"
            @change="onPersonNameChange"
          >
            <el-option
              v-for="p in nameOptions"
              :key="p.id"
              :label="`${p.name}（${p.archiveNo || ''}）`"
              :value="p.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="转出单位"><el-input v-model="form.fromUnit" /></el-form-item>
        <el-form-item label="转入单位"><el-input v-model="form.toUnit" /></el-form-item>
        <el-form-item label="经办人"><el-input v-model="form.handlerName" /></el-form-item>
        <el-form-item label="联系方式"><el-input v-model="form.handlerPhone" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="doCreate">确定</el-button>
      </template>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { ElMessageBox } from 'element-plus';
  import {
    approveTransfer,
    archiveInbound,
    checkInbound,
    createOutbound,
    inventoryTransfer,
    pageTransfer,
    receiveTransfer,
    registerInbound,
    returnTransfer,
    sealTransfer,
    searchTransferPersons,
    sendTransfer,
    submitTransfer
  } from '@/api/hrams/transfer';
  // cancel 在列表操作中按状态走退回/驳回，不单独暴露按钮
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsTransfer' });

  const tableRef = ref(null);
  const where = ref({});
  const formVisible = ref(false);
  const form = ref({});
  const archiveOptions = ref([]);
  const nameOptions = ref([]);
  const lookupLoading = ref(false);
  const statusOptions = [
    { value: 'draft', label: '拟稿' },
    { value: 'pending_approve', label: '待审批' },
    { value: 'inventory', label: '待清点' },
    { value: 'sealing', label: '待密封/发出' },
    { value: 'in_transit', label: '在途' },
    { value: 'transferred_out', label: '已转出' },
    { value: 'inbound_registered', label: '调入已登记' },
    { value: 'inbound_checked', label: '调入已核对' },
    { value: 'inbound_archived', label: '调入已归档' },
    { value: 'rejected', label: '已驳回' },
    { value: 'returned', label: '已退回' },
    { value: 'cancelled', label: '已取消' }
  ];

  const columns = [
    { prop: 'transferNo', label: '转递单号', minWidth: 170 },
    { columnKey: 'direction', label: '方向', width: 70, slot: 'direction' },
    { prop: 'archiveNo', label: '档案编号', width: 120 },
    { prop: 'personName', label: '姓名', width: 90 },
    { prop: 'fromUnit', label: '转出单位', minWidth: 120 },
    { prop: 'toUnit', label: '转入单位', minWidth: 120 },
    { columnKey: 'status', label: '状态', width: 120, slot: 'status' },
    { prop: 'trackingNo', label: '运单/机要号', minWidth: 120 },
    { columnKey: 'action', label: '操作', width: 260, slot: 'action', fixed: 'right' }
  ];

  const statusLabel = (s) => statusOptions.find((o) => o.value === s)?.label || s;
  const datasource = ({ pages, where: w }) => pageTransfer({ ...w, ...pages });
  const reload = () => tableRef.value?.reload?.({ where: where.value, page: 1 });

  const applyPerson = (person) => {
    form.value.personId = person?.id || null;
    form.value.archiveNo = person?.archiveNo || form.value.archiveNo || '';
    form.value.personName = person?.name || form.value.personName || '';
  };

  const searchByArchiveNo = async (keyword) => {
    if (!keyword?.trim()) {
      archiveOptions.value = [];
      return;
    }
    lookupLoading.value = true;
    try {
      archiveOptions.value = await searchTransferPersons({ archiveNo: keyword.trim() });
    } catch {
      archiveOptions.value = [];
    } finally {
      lookupLoading.value = false;
    }
  };

  const searchByName = async (keyword) => {
    if (!keyword?.trim()) {
      nameOptions.value = [];
      return;
    }
    lookupLoading.value = true;
    try {
      nameOptions.value = await searchTransferPersons({ name: keyword.trim() });
    } catch {
      nameOptions.value = [];
    } finally {
      lookupLoading.value = false;
    }
  };

  const onArchiveNoChange = async (archiveNo) => {
    const hit = archiveOptions.value.find((p) => p.archiveNo === archiveNo);
    if (hit) {
      applyPerson(hit);
      return;
    }
    form.value.personId = null;
    if (archiveNo) {
      await searchByArchiveNo(archiveNo);
      const exact = archiveOptions.value.find((p) => p.archiveNo === archiveNo);
      if (exact) applyPerson(exact);
    }
  };

  const onPersonNameChange = async (name) => {
    const hit = nameOptions.value.find((p) => p.name === name);
    if (hit) {
      applyPerson(hit);
      return;
    }
    form.value.personId = null;
    if (name) {
      await searchByName(name);
      const exact = nameOptions.value.find((p) => p.name === name);
      if (exact) applyPerson(exact);
    }
  };

  const openCreate = (direction) => {
    form.value = { direction, personId: null, personName: '', archiveNo: '', fromUnit: '', toUnit: '', handlerName: '', handlerPhone: '', remark: '' };
    archiveOptions.value = [];
    nameOptions.value = [];
    formVisible.value = true;
  };

  const doCreate = async () => {
    if (!form.value.personId) {
      EleMessage.error({ message: '请选择人员', plain: true });
      return;
    }
    try {
      const payload = { ...form.value, personId: Number(form.value.personId) };
      if (form.value.direction === 'inbound') {
        await registerInbound(payload);
      } else {
        await createOutbound(payload);
      }
      formVisible.value = false;
      EleMessage.success({ message: '已保存', plain: true });
      reload();
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const act = async (fn) => {
    try {
      await fn();
      EleMessage.success({ message: '已处理', plain: true });
      reload();
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const approve = (row, pass) => act(() => approveTransfer(row.id, pass, pass ? '同意' : '驳回'));

  const doSeal = (row) => {
    ElMessageBox.prompt('密封说明', '密封交接', { confirmButtonText: '确定', cancelButtonText: '取消' })
      .then(({ value }) => act(() => sealTransfer(row.id, value)))
      .catch(() => {});
  };

  const doSend = (row) => {
    ElMessageBox.prompt('运单/机要编号', '发出', { confirmButtonText: '确定', cancelButtonText: '取消' })
      .then(({ value }) => act(() => sendTransfer(row.id, value)))
      .catch(() => {});
  };

  const doReceive = (row) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) act(() => receiveTransfer(row.id, file));
    };
    input.click();
  };

  const doReturn = (row) => {
    ElMessageBox.prompt('退回原因', '异常退回', { confirmButtonText: '退回', cancelButtonText: '取消' })
      .then(({ value }) => act(() => returnTransfer(row.id, value || '退回')))
      .catch(() => {});
  };

</script>
