<template>
  <ele-modal :width="760" title="人员详情" v-bind="modalProps">
    <el-descriptions v-if="person" :column="2" border size="small">
      <el-descriptions-item label="档案编号">{{ person.archiveNo }}</el-descriptions-item>
      <el-descriptions-item label="姓名">{{ person.name }}</el-descriptions-item>
      <el-descriptions-item label="身份证号">{{ person.idCard }}</el-descriptions-item>
      <el-descriptions-item label="性别">{{ person.gender }}</el-descriptions-item>
      <el-descriptions-item label="出生日期">{{ person.birthDate }}</el-descriptions-item>
      <el-descriptions-item label="年龄">{{ person.age }}</el-descriptions-item>
      <el-descriptions-item label="民族">{{ person.nation }}</el-descriptions-item>
      <el-descriptions-item label="籍贯">{{ person.nativePlace }}</el-descriptions-item>
      <el-descriptions-item label="政治面貌">{{ person.politicalStatus }}</el-descriptions-item>
      <el-descriptions-item label="学历">{{ person.education }}</el-descriptions-item>
      <el-descriptions-item label="专业">{{ person.major }}</el-descriptions-item>
      <el-descriptions-item label="所在部门/单位">{{ person.deptName }}</el-descriptions-item>
      <el-descriptions-item label="职务">{{ person.duty }}</el-descriptions-item>
      <el-descriptions-item label="参加工作时间">{{ person.workStartDate }}</el-descriptions-item>
      <el-descriptions-item label="合同到期日">{{ person.contractEndDate }}</el-descriptions-item>
      <el-descriptions-item label="计划退休日期">{{ person.planRetireDate }}</el-descriptions-item>
      <el-descriptions-item label="当前状态">{{ person.personStatus }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ person.remark }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <btn-items :items="[{ preset: 'cancel', onClick: () => closeModal() }]" />
    </template>
  </ele-modal>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { getPerson } from '@/api/hrams/person';

  const props = defineProps({ personId: [Number, String] });
  const { modalProps, closeModal } = useModal();
  const person = ref(null);

  watch(() => props.personId, async (id) => {
    if (!id) return;
    try {
      person.value = await getPerson(id);
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  }, { immediate: true });
</script>
