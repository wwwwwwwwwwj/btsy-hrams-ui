<!-- 搜索表单 -->
<template>
  <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
    <el-row :gutter="16">
      <el-col :lg="6" :md="12" :sm="24" :xs="24">
        <el-form-item label="岗位编码">
          <el-input
            clearable
            v-model.trim="form.postCode"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="12" :sm="24" :xs="24">
        <el-form-item label="类别编码">
          <el-input
            clearable
            v-model.trim="form.postCategory"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="12" :sm="24" :xs="24">
        <el-form-item label="岗位名称">
          <el-input
            clearable
            v-model.trim="form.postName"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="12" :sm="24" :xs="24">
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
    /** 部门 id */
    deptId: [Number, String]
  });

  const emit = defineEmits({
    search: (_where) => true
  });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    postCode: '',
    postCategory: '',
    postName: ''
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
    () => props.deptId,
    () => {
      resetFields();
    }
  );
</script>
