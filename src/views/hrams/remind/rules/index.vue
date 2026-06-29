<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div>
          <div class="hrams-v2-title">提醒规则</div>
          <div class="hrams-v2-desc">到期扫描与提前提醒天数配置</div>
        </div>
        <div class="hrams-v2-actions">
          <el-button type="primary" v-permission="'hrams:remind:list'" @click="scan">立即扫描</el-button>
        </div>
      </div>
      <div class="hrams-v2-card" style="padding: 16px 20px">
        <el-table :data="rules">
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
      </div>
    </div>
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
  import { listRemindRules, scanRemind, saveRemindRule } from '@/api/hrams/remind';
  import { remindTypeLabel } from '../remind-shared';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsRemindRules' });
  const rules = ref([]);
  const editVisible = ref(false);
  const editForm = ref({});

  const typeLabel = remindTypeLabel;

  const load = async () => {
    rules.value = await listRemindRules();
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
