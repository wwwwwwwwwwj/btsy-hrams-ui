<template>
  <div>
    <div class="career-head">
      <span>履历段</span>
      <el-button v-if="!disabled" type="primary" link @click="addRow">新增履历段</el-button>
    </div>
    <el-table v-if="modelValue?.length" :data="modelValue" size="small" border>
      <el-table-column label="起止" min-width="220">
        <template #default="{ row }">
          <div v-if="disabled">{{ day(row.startDate) }} 至 {{ day(row.endDate) || '今' }}</div>
          <div v-else class="date-pair">
            <el-date-picker v-model="row.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:118px" />
            <el-date-picker v-model="row.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:118px" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="单位" min-width="140">
        <template #default="{ row }">
          <span v-if="disabled">{{ row.unitName || '—' }}</span>
          <el-input v-else v-model="row.unitName" />
        </template>
      </el-table-column>
      <el-table-column label="部门" min-width="110">
        <template #default="{ row }">
          <span v-if="disabled">{{ row.deptName || '—' }}</span>
          <el-input v-else v-model="row.deptName" />
        </template>
      </el-table-column>
      <el-table-column label="职务" min-width="110">
        <template #default="{ row }">
          <span v-if="disabled">{{ row.duty || '—' }}</span>
          <el-input v-else v-model="row.duty" />
        </template>
      </el-table-column>
      <el-table-column label="职级" width="100">
        <template #default="{ row }">
          <span v-if="disabled">{{ row.jobLevel || '—' }}</span>
          <el-input v-else v-model="row.jobLevel" />
        </template>
      </el-table-column>
      <el-table-column label="在职学习" width="88" align="center">
        <template #default="{ row }">
          <span v-if="disabled">{{ row.onJobStudy === '1' ? '是' : '否' }}</span>
          <el-switch v-else v-model="row.onJobStudy" active-value="1" inactive-value="0" />
        </template>
      </el-table-column>
      <el-table-column label="材料齐全" width="88" align="center">
        <template #default="{ row }">
          <span v-if="disabled">{{ row.materialComplete === '1' ? '是' : '否' }}</span>
          <el-switch v-else v-model="row.materialComplete" active-value="1" inactive-value="0" />
        </template>
      </el-table-column>
      <el-table-column label="排序" width="72">
        <template #default="{ row }">
          <span v-if="disabled">{{ row.sortNo ?? '' }}</span>
          <el-input-number v-else v-model="row.sortNo" :controls="false" :min="0" style="width:56px" />
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="120">
        <template #default="{ row }">
          <span v-if="disabled">{{ row.remark || '—' }}</span>
          <el-input v-else v-model="row.remark" />
        </template>
      </el-table-column>
      <el-table-column v-if="!disabled" label="" width="64">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!modelValue?.length" description="暂无履历段，不影响开审" :image-size="48" />
  </div>
</template>

<script setup>
  const props = defineProps({
    modelValue: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false }
  });
  const emit = defineEmits(['update:modelValue']);

  const day = (v) => {
    if (!v) return '';
    return String(v).slice(0, 10);
  };

  const addRow = () => {
    emit('update:modelValue', [
      ...(props.modelValue || []),
      { startDate: '', endDate: '', unitName: '', deptName: '', duty: '', jobLevel: '', onJobStudy: '0', materialComplete: '0', sortNo: (props.modelValue || []).length, remark: '' }
    ]);
  };

  const removeRow = (index) => {
    const next = [...(props.modelValue || [])];
    next.splice(index, 1);
    emit('update:modelValue', next);
  };
</script>

<style scoped>
  .career-head { display:flex; justify-content:space-between; align-items:center; margin:8px 0; font-weight:600; }
  .date-pair { display:flex; gap:6px; }
</style>
