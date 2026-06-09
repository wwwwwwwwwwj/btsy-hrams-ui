<!-- 搜索表单 -->
<template>
  <el-form label-width="100px" @keyup.enter="handleSearch" @submit.prevent="">
    <el-row :gutter="16">
      <el-col :lg="8" :md="12" :sm="24" :xs="24">
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
      <el-col :lg="8" :md="12" :sm="24" :xs="24">
        <el-form-item label="流程定义名称">
          <el-input
            clearable
            v-model.trim="form.flowName"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="searchExpand" :lg="8" :md="12" :sm="24" :xs="24">
        <el-form-item label="流程定义编码">
          <el-input
            clearable
            v-model.trim="form.flowCode"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="searchExpand" :lg="8" :md="12" :sm="24" :xs="24">
        <el-form-item label="任务名称">
          <el-input
            clearable
            v-model.trim="form.nodeName"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col
        :lg="searchExpand ? 16 : 8"
        :md="searchExpand ? 24 : 12"
        :sm="24"
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
                props: { style: { marginLeft: '10px' } }
              }
            ]"
            :style="{ marginLeft: searchExpand ? 'auto' : void 0 }"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { useFormData } from '@/utils/use-form-data';

  const props = defineProps({
    /** 分类 id */
    categoryId: [Number, String]
  });

  const emit = defineEmits({
    search: (_where) => true
  });

  /** 表单数据 */
  const [form, resetFields] = useFormData({
    flowName: '',
    flowCode: '',
    nodeName: '',
    createByIds: []
  });

  /** 搜索表单是否展开 */
  const searchExpand = ref(false);

  /** 搜索 */
  const handleSearch = () => {
    emit('search', { ...form });
  };

  /** 重置 */
  const handleReset = () => {
    resetFields();
    handleSearch();
  };

  /** 搜索展开/收起 */
  const toggleExpand = () => {
    searchExpand.value = !searchExpand.value;
  };

  /** 重置表单数据 */
  watch(
    () => props.categoryId,
    () => {
      resetFields();
    }
  );
</script>
