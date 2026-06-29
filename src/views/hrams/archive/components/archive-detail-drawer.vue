<template>
  <el-drawer :model-value="modelValue" title="档案详情" size="58%" @update:model-value="(v) => emit('update:modelValue', v)">
    <template v-if="detail.person">
      <div class="drawer-actions">
        <el-button v-permission="'hrams:archive:download'" type="primary" @click="exportMaterials">导出档案材料</el-button>
        <el-button v-permission="'hrams:archive:catalog:export'" @click="exportCatalogFile">导出档案目录</el-button>
      </div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="档案编号">{{ detail.person.archiveNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.person.name }}</el-descriptions-item>
        <el-descriptions-item label="档案状态">{{ archiveStatusLabel(detail.person.archiveStatus) }}</el-descriptions-item>
        <el-descriptions-item label="材料数量">{{ detail.person.materialCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="完整性">{{ integrityLabel(detail.person.integrityStatus) }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">{{ detail.person.personStatus }}</el-descriptions-item>
      </el-descriptions>
      <el-row :gutter="12" style="margin-top:16px">
        <el-col :span="8">
          <el-menu :default-active="detailCat" @select="(c) => { detailCat = c; filterMaterials(); }">
            <el-menu-item v-for="c in flatCats" :key="c.code" :index="c.code">{{ c.name }} ({{ c.fileCount || 0 }})</el-menu-item>
          </el-menu>
        </el-col>
        <el-col :span="16">
          <el-table :data="detailMaterials" size="small" border>
            <el-table-column prop="displayNo" label="序号" width="90" />
            <el-table-column prop="materialName" label="材料名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="formDate" label="形成时间" width="110" />
            <el-table-column prop="pageCount" label="页数" width="70" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button v-if="row.fileStatus === 'uploaded'" v-permission="'hrams:archive:preview'" link @click="previewMaterial(row.id)">预览</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </template>
  </el-drawer>
</template>

<script setup>
  import { computed, ref, watch } from 'vue';
  import { useDictData } from '@/utils/use-dict-data';
  import { getPerson } from '@/api/hrams/person';
  import { getMaterialPanel, listMaterials, previewMaterial, downloadMaterialsZip, exportCatalog } from '@/api/hrams/archive';

  const props = defineProps({
    modelValue: Boolean,
    personId: [Number, String]
  });
  const emit = defineEmits(['update:modelValue']);

  const detail = ref({});
  const detailCat = ref('1');
  const detailMaterials = ref([]);
  const [, , archiveStatusDicts] = useDictData(['hrams_person_status', 'hrams_education', 'hrams_archive_status']);

  const flatCats = computed(() => {
    const list = [];
    const walk = (nodes) => (nodes || []).forEach((n) => { list.push(n); if (n.children?.length) walk(n.children); });
    walk(detail.value.categories);
    return list;
  });

  const archiveStatusLabel = (code) => archiveStatusDicts.value?.find((x) => x.value === code)?.label || code || '—';
  const integrityLabel = (s) => (s === 'complete' ? '完整' : s === 'missing' ? '缺项' : '—');

  const filterMaterials = () => {
    detailMaterials.value = (detail.value.materials || []).filter((m) => m.categoryCode === detailCat.value);
  };

  const loadDetail = async () => {
    if (!props.personId) return;
    const person = await getPerson(props.personId);
    const panel = await getMaterialPanel(props.personId);
    const materials = await listMaterials(props.personId, {});
    detail.value = { person, categories: panel?.categories || [], materials };
    detailCat.value = flatCats.value[0]?.code || '1';
    filterMaterials();
  };

  watch(() => [props.modelValue, props.personId], ([open]) => {
    if (open && props.personId) loadDetail();
  });

  const exportMaterials = () => {
    const p = detail.value.person;
    const ids = (detail.value.materials || []).filter((m) => m.fileStatus === 'uploaded').map((m) => m.id);
    if (p?.id && ids.length) downloadMaterialsZip(p.id, ids);
  };

  const exportCatalogFile = () => {
    const p = detail.value.person;
    if (p?.id) exportCatalog(p.id);
  };
</script>

<style scoped>
  .drawer-actions { margin-bottom: 12px; }
</style>
