<template>
  <ele-page hide-footer>
    <ele-card header="提醒规则">
      <el-button type="primary" v-permission="'hrams:remind:list'" @click="scan">立即扫描</el-button>
      <el-table :data="rules" style="margin-top:12px">
        <el-table-column prop="remindType" label="类型" width="140">
          <template #default="{ row }">{{ typeLabel(row.remindType) }}</template>
        </el-table-column>
        <el-table-column prop="advanceDays" label="提前天数" width="100" />
        <el-table-column prop="status" label="启用" width="80">
          <template #default="{ row }">{{ row.status === '0' ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" v-permission="'hrams:remind:list'" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </ele-card>
    <ele-card header="提醒记录" style="margin-top:16px">
      <el-table :data="records">
        <el-table-column prop="remindType" label="类型" width="120">
          <template #default="{ row }">{{ typeLabel(row.remindType) }}</template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="200" />
        <el-table-column prop="remindTime" label="时间" width="170" />
      </el-table>
    </ele-card>
    <el-dialog v-model="editVisible" title="编辑规则" width="400px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="提前天数"><el-input-number v-model="editForm.advanceDays" :min="1" :max="365" /></el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editForm.enabled" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { listRemindRules, listRemindRecords, scanRemind, saveRemindRule } from '@/api/hrams/remind';

  defineOptions({ name: 'HramsRemind' });
  const rules = ref([]);
  const records = ref([]);
  const editVisible = ref(false);
  const editForm = ref({});

  const typeLabel = (t) => ({ contract: '合同到期', retire: '退休提醒', borrow: '借阅到期' }[t] || t);

  const load = async () => {
    rules.value = await listRemindRules();
    records.value = await listRemindRecords();
  };

  const scan = async () => {
    await scanRemind();
    EleMessage.success({ message: '扫描完成', plain: true });
    load();
  };

  const openEdit = (row) => {
    editForm.value = {
      id: row.id,
      remindType: row.remindType,
      advanceDays: row.advanceDays,
      enabled: row.status === '0'
    };
    editVisible.value = true;
  };

  const saveEdit = async () => {
    await saveRemindRule({
      id: editForm.value.id,
      remindType: editForm.value.remindType,
      advanceDays: editForm.value.advanceDays,
      status: editForm.value.enabled ? '0' : '1'
    });
    EleMessage.success({ message: '已保存', plain: true });
    editVisible.value = false;
    load();
  };

  onMounted(load);
</script>
