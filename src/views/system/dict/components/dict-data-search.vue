<!-- 搜索表单 -->
<template>
  <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
    <el-row :gutter="16">
      <el-col :lg="8" :md="10" :sm="24" :xs="24">
        <el-form-item label="数据标签">
          <el-input
            clearable
            v-model.trim="form.dictLabel"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="16" :md="14" :sm="24" :xs="24">
        <el-form-item label-width="0px">
          <btn-items
            :wrap="false"
            :items="[
              { preset: 'search', onClick: () => handleSearch() },
              { preset: 'reset', onClick: () => handleReset() }
            ]"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
  import { watch } from 'vue';
  import { useFormData } from '@/utils/use-form-data';

  const props = defineProps({
    /** 字典 id */
    dictId: [Number, String]
  });

  const emit = defineEmits({
    search: (_where) => true
  });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    dictLabel: ''
  });

  /** 搜索 */
  const handleSearch = () => {
    emit('search', { ...form });
  };

  /** 重置 */
  const handleReset = () => {
    resetFields();
    handleSearch();
  };

  /** 重置表单数据 */
  watch(
    () => props.dictId,
    () => {
      resetFields();
    }
  );
</script>
