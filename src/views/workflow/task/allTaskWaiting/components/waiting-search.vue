<!-- 搜索表单 -->
<template>
  <ele-card bordered search-form>
    <el-form label-width="100px" @keyup.enter="handleSearch" @submit.prevent="">
      <el-row :gutter="16">
        <el-col :lg="6" :md="6" :sm="12" :xs="24">
          <el-form-item label="申请人">
            <user-select
              :clearable="true"
              :multiple="true"
              :max-tag-count="1"
              :max-tag-text-length="4"
              v-model="form.createByIds"
              placeholder="请选择申请人"
              :popper-props="{ title: '选择申请人', closeOnClickModal: false }"
              :select-tags-style="{ flexWrap: 'nowrap', overflow: 'hidden' }"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="6" :sm="12" :xs="24">
          <el-form-item label="任务名称">
            <el-input
              clearable
              v-model.trim="form.nodeName"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="6" :sm="12" :xs="24">
          <el-form-item label="流程定义名称">
            <el-input
              clearable
              v-model.trim="form.flowName"
              placeholder="请输入"
            />
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
  </ele-card>
</template>

<script setup>
  import { useFormData } from '@/utils/use-form-data';

  const emit = defineEmits({
    search: (_where) => true
  });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    nodeName: '',
    flowName: '',
    createByIds: []
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
