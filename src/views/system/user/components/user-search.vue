<!-- 搜索表单 -->
<template>
  <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
    <el-row :gutter="16">
      <el-col :lg="6" :md="12" :sm="24" :xs="24">
        <el-form-item label="用户名称">
          <el-input
            clearable
            v-model.trim="form.userName"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="12" :sm="24" :xs="24">
        <el-form-item label="用户昵称">
          <el-input
            clearable
            v-model.trim="form.nickName"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="12" :sm="24" :xs="24">
        <el-form-item label="手机号码">
          <el-input
            clearable
            v-model.trim="form.phonenumber"
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="searchExpand" :lg="6" :md="12" :sm="24" :xs="24">
        <el-form-item label="状态">
          <dict-data
            code="sys_normal_disable"
            v-model="form.status"
            placeholder="请选择"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="searchExpand" :lg="12" :md="12" :sm="24" :xs="24">
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
      <el-col :lg="searchExpand ? 12 : 6" :md="12" :sm="24" :xs="24">
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
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { useFormData } from '@/utils/use-form-data';

  const props = defineProps({
    /** 部门 id */
    deptId: [Number, String]
  });

  const emit = defineEmits({
    search: (_where) => true
  });

  /** 表单数据 */
  const [form, resetForm] = useFormData({
    userName: '',
    nickName: '',
    phonenumber: '',
    status: void 0
  });

  /** 日期范围 */
  const dateRange = ref(['', '']);

  /** 搜索表单是否展开 */
  const searchExpand = ref(false);

  /** 重置表单数据 */
  const resetFields = () => {
    resetForm();
    dateRange.value = ['', ''];
  };

  /** 搜索 */
  const handleSearch = () => {
    const [d1, d2] = dateRange.value || [];
    emit('search', { ...form, params: { beginTime: d1, endTime: d2 } });
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
    () => props.deptId,
    () => {
      resetFields();
    }
  );
</script>
