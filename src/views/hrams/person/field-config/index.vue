<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-header">
        <div>
          <div class="hrams-v2-title">人员扩展字段</div>
          <div class="hrams-v2-desc">自定义人员信息项定义</div>
        </div>
      </div>
      <div class="hrams-v2-card" style="padding: 20px 24px">
        <el-table :data="defs" size="small">
          <el-table-column prop="fieldKey" label="字段键" width="140" />
          <el-table-column prop="fieldLabel" label="显示名" min-width="160" />
          <el-table-column prop="fieldType" label="类型" width="100" />
          <el-table-column prop="sortNum" label="排序" width="80" />
        </el-table>
        <el-divider />
        <el-form :inline="true" :model="form" @submit.prevent="">
          <el-form-item label="字段键"><el-input v-model="form.fieldKey" placeholder="英文键" /></el-form-item>
          <el-form-item label="显示名"><el-input v-model="form.fieldLabel" /></el-form-item>
          <el-form-item label="类型">
            <el-select v-model="form.fieldType" style="width:120px">
              <el-option label="文本" value="text" />
              <el-option label="数字" value="number" />
              <el-option label="日期" value="date" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" v-permission="'hrams:person:edit'" @click="add">新增字段</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { listPersonFieldDefs, addPersonFieldDef } from '@/api/hrams/person';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsPersonFieldConfig' });
  const defs = ref([]);
  const form = ref({ fieldKey: '', fieldLabel: '', fieldType: 'text', sortNum: 0 });

  const load = async () => {
    defs.value = await listPersonFieldDefs();
  };

  const add = async () => {
    if (!form.value.fieldKey || !form.value.fieldLabel) {
      return EleMessage.error({ message: '请填写字段键和显示名', plain: true });
    }
    await addPersonFieldDef({ ...form.value });
    EleMessage.success({ message: '已新增', plain: true });
    form.value = { fieldKey: '', fieldLabel: '', fieldType: 'text', sortNum: 0 };
    load();
  };

  onMounted(load);
</script>
