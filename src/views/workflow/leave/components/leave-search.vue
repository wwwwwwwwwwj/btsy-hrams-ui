<!-- 搜索表单 -->
<template>
  <ele-card bordered search-form>
    <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
      <el-row :gutter="16">
        <el-col :lg="8" :md="12" :sm="14" :xs="24">
          <el-form-item label="请假天数">
            <div style="width: 100%; display: flex; align-items: center">
              <el-input-number
                :min="0"
                :max="99999"
                v-model="form.startLeaveDays"
                placeholder="请输入"
                controls-position="right"
                class="ele-fluid"
                style="flex: 1"
              />
              <div style="padding: 0 12px; flex-shrink: 0">至</div>
              <el-input-number
                el-input-number
                v-model="form.endLeaveDays"
                placeholder="请输入"
                controls-position="right"
                class="ele-fluid"
                style="flex: 1"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :lg="16" :md="12" :sm="10" :xs="24">
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
    startLeaveDays: void 0,
    endLeaveDays: void 0
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
