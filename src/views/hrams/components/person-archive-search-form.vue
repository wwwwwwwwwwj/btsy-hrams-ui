<template>
  <el-form :inline="true" :model="model" class="ele-form-search hrams-person-search-form">
    <el-form-item label="档案编号"><el-input v-model="model.archiveNo" clearable /></el-form-item>
    <el-form-item label="姓名"><el-input v-model="model.name" clearable /></el-form-item>
    <template v-if="!simple">
    <el-form-item label="身份证号"><el-input v-model="model.idCard" clearable /></el-form-item>
    <el-form-item label="性别">
      <dict-data v-model="model.gender" code="hrams_gender" type="select" placeholder="全部" style="width:100px" />
    </el-form-item>
    <el-form-item label="出生日期">
      <el-date-picker v-model="model.birthDate" type="date" value-format="YYYY-MM-DD" :disabled-date="disabledBirthDate" />
    </el-form-item>
    <el-form-item label="年龄">
      <el-input-number v-model="model.age" :min="0" :max="120" controls-position="right" />
    </el-form-item>
    <el-form-item label="民族">
      <dict-data v-model="model.nation" code="hrams_nation" type="select" placeholder="全部" filterable clearable style="width:120px" />
    </el-form-item>
    <el-form-item label="政治面貌">
      <dict-data
        v-model="model.politicalStatus"
        code="hrams_political_status"
        type="select"
        placeholder="全部"
        filterable
        clearable
        style="width:140px"
      />
    </el-form-item>
    <el-form-item label="学历">
      <dict-data v-model="model.education" code="hrams_education" type="select" placeholder="全部" filterable clearable style="width:100px" />
    </el-form-item>
    <el-form-item label="当前状态">
      <dict-data v-model="model.personStatus" code="hrams_person_status" type="select" placeholder="全部" clearable style="width:100px" />
    </el-form-item>
    </template>
    <el-form-item v-if="showIntegrity" label="材料完整性">
      <el-select v-model="model.integrityStatus" clearable>
        <el-option label="完整" value="complete" />
        <el-option label="缺项" value="missing" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="showArchiveStatus" label="档案状态">
      <dict-data v-model="model.archiveStatus" code="hrams_archive_status" type="select" placeholder="全部" clearable style="width:120px" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" v-permission="searchPermission" @click="$emit('search')">查询</el-button>
      <el-button @click="$emit('reset')">重置</el-button>
    </el-form-item>
    <el-form-item v-if="slots.extra" class="hrams-search-extra-actions">
      <slot name="extra" />
    </el-form-item>
  </el-form>
</template>

<script setup>
  import { useSlots } from 'vue';
  import DictData from '@/components/DictData/index.vue';

  defineOptions({ name: 'PersonArchiveSearchForm' });

  const slots = useSlots();

  const model = defineModel('model', { type: Object, required: true });

  defineProps({
    simple: { type: Boolean, default: false },
    showIntegrity: { type: Boolean, default: false },
    showArchiveStatus: { type: Boolean, default: false },
    /** 列表查询按钮权限，不传则始终展示 */
    searchPermission: { type: String, default: '' }
  });

  defineEmits(['search', 'reset']);

  /** 出生日期不能晚于当前日期 */
  const disabledBirthDate = (time) => {
    return time.getTime() > Date.now();
  };
</script>

<style scoped>
  .hrams-person-search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 8px;
    width: 100%;
  }

  .hrams-search-extra-actions {
    margin-left: auto;
  }

  .hrams-search-extra-actions :deep(.el-form-item__content) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }
</style>
