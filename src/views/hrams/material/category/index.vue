<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-card" style="padding: 16px 20px">
        <div class="hrams-v2-card-toolbar">
          <el-button type="primary" v-permission="'hrams:material:category:config'" @click="save">保存</el-button>
        </div>
        <el-table :data="rows" size="small" v-loading="loading">
          <el-table-column prop="name" label="大类" min-width="280" />
          <el-table-column label="启用" width="80">
            <template #default="{ row }">
              <el-switch v-model="row.enabledFlag" active-value="1" inactive-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="必备(完整性)" width="120">
            <template #default="{ row }">
              <el-switch v-model="row.requiredFlag" active-value="1" inactive-value="0" :disabled="row.enabledFlag !== '1'" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { listCategoryConfig, saveCategoryConfig } from '@/api/hrams/material-category';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsMaterialCategory' });
  const rows = ref([]);
  const loading = ref(false);

  const load = async () => {
    loading.value = true;
    try {
      rows.value = await listCategoryConfig();
    } finally {
      loading.value = false;
    }
  };

  const save = async () => {
    const items = rows.value.map((r) => ({
      code: r.code,
      enabledFlag: r.enabledFlag,
      requiredFlag: r.requiredFlag
    }));
    await saveCategoryConfig(items);
    EleMessage.success({ message: '已保存', plain: true });
    load();
  };

  onMounted(load);
</script>
