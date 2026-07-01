<template>
  <div v-loading="defsLoading" class="person-custom-fields">
    <el-empty v-if="!defs.length" description="暂无扩展字段，可在「字段配置」中维护" :image-size="64" />
    <el-row v-else :gutter="16">
      <el-col v-for="def in defs" :key="def.fieldKey" :span="12">
        <el-form-item :label="def.fieldLabel">
          <el-input
            v-if="def.fieldType !== 'date'"
            v-model="model[def.fieldKey]"
            :placeholder="'请输入' + def.fieldLabel"
          />
          <el-date-picker
            v-else
            v-model="model[def.fieldKey]"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import { listPersonFieldDefs } from '@/api/hrams/person';

  const model = defineModel({ type: Object, default: () => ({}) });
  const defs = ref([]);
  const defsLoading = ref(false);

  onMounted(async () => {
    defsLoading.value = true;
    try {
      defs.value = await listPersonFieldDefs();
      const next = { ...(model.value || {}) };
      defs.value.forEach((d) => {
        if (next[d.fieldKey] === undefined) {
          next[d.fieldKey] = '';
        }
      });
      model.value = next;
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      defsLoading.value = false;
    }
  });
</script>
