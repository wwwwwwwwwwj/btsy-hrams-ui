<!-- 搜索表单 -->
<template>
  <ele-card bordered search-form>
    <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
      <el-row :gutter="16">
        <el-col :lg="6" :md="searchExpand ? 8 : 6" :sm="12" :xs="24">
          <el-form-item label="文件名">
            <el-input
              clearable
              v-model.trim="form.fileName"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="searchExpand ? 8 : 6" :sm="12" :xs="24">
          <el-form-item label="原名">
            <el-input
              clearable
              v-model.trim="form.originalName"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="searchExpand ? 8 : 6" :sm="12" :xs="24">
          <el-form-item label="文件后缀">
            <el-input
              clearable
              v-model.trim="form.fileSuffix"
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
          <el-form-item label="服务商">
            <el-input
              clearable
              v-model.trim="form.service"
              placeholder="请输入"
            />
          </el-form-item>
        </el-col>
        <el-col
          v-if="searchExpand"
          :lg="12"
          :md="searchExpand ? 8 : 6"
          :sm="12"
          :xs="24"
        >
          <el-form-item label="创建时间">
            <el-date-picker
              unlink-panels
              type="daterange"
              v-model="dateRange"
              range-separator="-"
              value-format="YYYY-MM-DD"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="ele-fluid"
            />
          </el-form-item>
        </el-col>
        <el-col
          :lg="searchExpand ? 12 : 6"
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
    fileName: '',
    originalName: '',
    fileSuffix: '',
    service: ''
  });

  /** 日期范围 */
  const dateRange = ref(['', '']);

  /** 搜索表单是否展开 */
  const searchExpand = ref(false);

  /** 搜索 */
  const handleSearch = () => {
    const [d1, d2] = dateRange.value || [];
    emit('search', {
      ...form,
      params: { beginCreateTime: d1, endCreateTime: d2 }
    });
  };

  /** 重置 */
  const handleReset = () => {
    resetFields();
    dateRange.value = ['', ''];
    handleSearch();
  };

  /** 搜索展开/收起 */
  const toggleExpand = () => {
    searchExpand.value = !searchExpand.value;
  };
</script>
