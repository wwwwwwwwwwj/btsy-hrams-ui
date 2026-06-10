<template>
  <ele-page hide-footer>
    <ele-card>
      <div class="page-head">
        <div>
          <div class="title">{{ mountType === 'increment' ? '增补挂接' : '批量挂接' }}</div>
          <div class="desc">上传挂接包（目录表 + 分类文件夹），系统自动匹配十大类材料</div>
        </div>
        <el-button @click="$router.back()">返回</el-button>
      </div>
      <div class="type-switch">
        <div :class="['type-card', mountType === 'batch' ? 'active' : '']" @click="setType('batch')">
          <h3>批量挂接</h3>
          <p>含目录 Excel 时，文件须在目录表中有对应项</p>
        </div>
        <div :class="['type-card', mountType === 'increment' ? 'active' : '']" @click="setType('increment')">
          <h3>增补挂接</h3>
          <p>仅新增材料，不强制目录表校验</p>
        </div>
      </div>
      <el-form label-width="100px" style="max-width:640px">
        <el-form-item label="干部" required>
          <el-input :model-value="personLabel" readonly placeholder="请选择干部" style="width:360px;margin-right:8px" />
          <el-button @click="pickPersonVisible = true">选择</el-button>
        </el-form-item>
        <el-form-item label="挂接包" required>
          <el-upload drag :auto-upload="false" :limit="1" :on-change="onFile"><div>拖拽或点击选择 zip</div></el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" :disabled="!personId || !file" @click="submit">开始挂接</el-button>
        </el-form-item>
      </el-form>
      <div v-if="result" class="feedback">
        <div>成功 {{ result.successCount }} 条，失败 {{ result.failCount }} 条</div>
        <el-button link type="primary" @click="$router.push('/hrams/archive/feedback')">查看挂接反馈</el-button>
      </div>
    </ele-card>
    <el-dialog v-model="pickPersonVisible" title="选择干部" width="720px">
      <el-table :data="personList" height="360" @row-click="onPickPerson">
        <el-table-column prop="archiveNo" label="档案编号" width="120" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="status" label="状态" width="90" />
      </el-table>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { mountBatch, mountIncrement, pageArchivePersons } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsArchiveMount' });
  const route = useRoute();
  const router = useRouter();
  const mountType = ref(route.query.mode === 'increment' ? 'increment' : 'batch');
  const personId = ref(route.query.personId ? Number(route.query.personId) : null);
  const personLabel = ref('');
  const file = ref(null);
  const loading = ref(false);
  const result = ref(null);
  const pickPersonVisible = ref(false);
  const personList = ref([]);

  const setType = (t) => { mountType.value = t; result.value = null; };

  const loadPersons = async () => {
    const res = await pageArchivePersons({ pageNum: 1, pageSize: 200 });
    personList.value = res.rows || [];
    syncPersonLabel();
  };

  const syncPersonLabel = () => {
    const p = personList.value.find((x) => x.id === personId.value);
    personLabel.value = p ? `${p.archiveNo} ${p.name}` : '';
  };

  watch(personId, syncPersonLabel);

  const onPickPerson = (row) => {
    personId.value = row.id;
    pickPersonVisible.value = false;
  };

  const onFile = (f) => { file.value = f.raw; };
  const submit = async () => {
    if (!personId.value) return EleMessage.error({ message: '请选择干部', plain: true });
    loading.value = true;
    try {
      result.value = mountType.value === 'increment'
        ? await mountIncrement(personId.value, file.value)
        : await mountBatch(personId.value, file.value);
      EleMessage.success({ message: '挂接完成', plain: true });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      loading.value = false;
    }
  };

  onMounted(loadPersons);
</script>

<style scoped>
  .page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .title { font-size: 18px; font-weight: 600; }
  .desc { font-size: 13px; color: #666; margin-top: 4px; }
  .type-switch { display: flex; gap: 16px; margin-bottom: 20px; }
  .type-card { flex: 1; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; cursor: pointer; }
  .type-card.active { border-color: #2c6e9e; background: #f0f7fc; }
  .type-card h3 { margin: 0 0 8px; font-size: 16px; }
  .type-card p { margin: 0; font-size: 13px; color: #666; }
  .feedback { margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 8px; }
</style>
