<!-- 搜索表单 -->
<template>
  <ele-card bordered search-form>
    <el-form label-width="56px" @keyup.enter="handleSearch" @submit.prevent="">
      <el-row :gutter="16">
        <el-col :lg="6" :md="searchExpand ? 8 : 6" :sm="12" :xs="24">
          <el-form-item label="部门id">
            <el-input
              clearable
              v-model.trim="form.deptId"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="searchExpand ? 8 : 6" :sm="12" :xs="24">
          <el-form-item label="用户id">
            <el-input
              clearable
              v-model.trim="form.userId"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="searchExpand ? 8 : 6" :sm="12" :xs="24">
          <el-form-item label="排序号">
            <el-input
              clearable
              v-model.trim="form.orderNum"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col
          v-if="searchExpand"
          :lg="6"
          :md="searchExpand ? 8 : 6"
          :sm="12"
          :xs="24"
        >
          <el-form-item label="key键">
            <el-input
              clearable
              v-model.trim="form.testKey"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col
          v-if="searchExpand"
          :lg="6"
          :md="searchExpand ? 8 : 6"
          :sm="12"
          :xs="24"
        >
          <el-form-item label="值">
            <el-input
              clearable
              v-model.trim="form.value"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col
          :lg="searchExpand ? 18 : 6"
          :md="searchExpand ? 8 : 6"
          :sm="12"
          :xs="24"
        >
          <el-form-item label-width="0px">
            <btn-items
              :wrap="false"
              :items="[
                { preset: 'search', onClick: () => handleSearch() },
                { preset: 'reset', onClick: () => handleReset() },
                {
                  preset: searchExpand ? 'searchFold' : 'searchExpand',
                  type: 'link',
                  onClick: () => toggleExpand(),
                  props: { style: { marginLeft: '10px', whiteSpace: 'nowrap' } }
                }
              ]"
              :style="{ marginLeft: searchExpand ? 'auto' : void 0 }"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </ele-card>
</template>

<script setup>
  import { ref } from 'vue';
  import { useFormData } from '@/utils/use-form-data';

  const emit = defineEmits({
    search: (_where) => true
  });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    deptId: '',
    userId: '',
    orderNum: '',
    testKey: '',
    value: ''
  });

  /** 搜索表单是否展开 */
  const searchExpand = ref(false);

  /** 搜索 */
  const handleSearch = () => {
    emit('search', { ...form });
  };

  /**  重置 */
  const handleReset = () => {
    resetFields();
    handleSearch();
  };

  /** 搜索展开/收起 */
  const toggleExpand = () => {
    searchExpand.value = !searchExpand.value;
  };
</script>
