<template>
  <ele-modal :width="720" title="人员详情" v-bind="modalProps">
    <el-descriptions v-if="person" :column="2" border size="small">
      <el-descriptions-item label="档案编号">{{ person.archiveNo }}</el-descriptions-item>
      <el-descriptions-item label="姓名">{{ person.name }}</el-descriptions-item>
      <el-descriptions-item label="性别">{{ person.gender }}</el-descriptions-item>
      <el-descriptions-item label="出生年月">{{ person.birthDate }}</el-descriptions-item>
      <el-descriptions-item label="年龄">{{ person.age }}</el-descriptions-item>
      <el-descriptions-item label="民族">{{ person.nation }}</el-descriptions-item>
      <el-descriptions-item label="政治面貌">{{ person.politicalStatus }}</el-descriptions-item>
      <el-descriptions-item label="部门">{{ person.deptName }}</el-descriptions-item>
      <el-descriptions-item label="职务">{{ person.duty }}</el-descriptions-item>
      <el-descriptions-item label="人员状态">{{ person.personStatus }}</el-descriptions-item>
      <el-descriptions-item label="档案状态">
        <dict-data code="hrams_archive_status" type="text" :model-value="person.archiveStatus" />
      </el-descriptions-item>
      <el-descriptions-item label="材料份数">{{ person.materialCount }}</el-descriptions-item>
      <el-descriptions-item label="合同到期">{{ person.contractEndDate }}</el-descriptions-item>
      <el-descriptions-item label="计划退休">{{ person.planRetireDate }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ person.remark }}</el-descriptions-item>
      <el-descriptions-item v-for="(val, key) in person.customFields || {}" :key="key" :label="key">{{ val }}</el-descriptions-item>
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
  import { useDictData } from '@/utils/use-dict-data';

  useDictData(['hrams_archive_status']);

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
