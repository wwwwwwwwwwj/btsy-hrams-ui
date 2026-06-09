<!-- 搜索表单 -->
<template>
  <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
    <el-row :gutter="16">
      <el-col :lg="6" :md="6" :sm="12" :xs="24">
        <el-form-item label="配置key">
          <el-input
            clearable
            v-model.trim="form.configKey"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="24">
        <el-form-item label="桶名称">
          <el-input
            clearable
            v-model.trim="form.bucketName"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="24">
        <el-form-item label="是否默认">
          <el-select clearable v-model="form.status" placeholder="请选择">
            <el-option label="是" value="0" />
            <el-option label="否" value="1" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="24">
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
  import { useFormData } from '@/utils/use-form-data';

  const emit = defineEmits({
    search: (_where) => true
  });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    configKey: '',
    bucketName: ''
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
</script>
