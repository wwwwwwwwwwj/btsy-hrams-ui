<!-- 搜索表单 -->
<template>
  <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
    <el-row :gutter="16">
      <el-col :lg="8" :md="8" :sm="9" :xs="24">
        <el-form-item label="用户名称">
          <el-input
            clearable
            v-model.trim="form.userName"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="8" :md="8" :sm="9" :xs="24">
        <el-form-item label="手机号码">
          <el-input
            clearable
            v-model.trim="form.phonenumber"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="8" :md="8" :sm="6" :xs="24">
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
    userName: '',
    phonenumber: ''
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
