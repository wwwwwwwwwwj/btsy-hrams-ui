<!-- 搜索表单 -->
<template>
  <ele-card bordered search-form>
    <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
      <el-row :gutter="16">
        <el-col :lg="6" :md="12" :sm="12" :xs="24">
          <el-form-item label="公告标题">
            <el-input
              clearable
              v-model.trim="form.noticeTitle"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="12" :sm="12" :xs="24">
          <el-form-item label="创建者">
            <el-input
              clearable
              v-model.trim="form.createBy"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="12" :sm="12" :xs="24">
          <el-form-item label="公告类型">
            <dict-data
              code="sys_notice_type"
              v-model="form.noticeType"
              placeholder="请选择"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="12" :sm="12" :xs="24">
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
  </ele-card>
</template>

<script setup>
  import { useFormData } from '@/utils/use-form-data';

  const emit = defineEmits({
    search: (_where) => true
  });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    noticeTitle: '',
    createBy: '',
    noticeType: void 0
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
