<template>
  <ele-page hide-footer flex-table="auto">
    <div class="hrams-v2-page">
      <div class="hrams-v2-card hrams-v2-filter">
        <el-form :inline="true" :model="where" class="ele-form-search">
          <el-form-item label="状态">
            <el-select v-model="where.status" clearable placeholder="全部" style="width: 160px">
              <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" v-permission="'hrams:archive:upload'" @click="reload(where, 1)">查询</el-button>
            <el-button @click="resetWhere">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="hrams-v2-card hrams-v2-table-card">
        <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
          <template #status="{ row }">
            <el-tag :type="intakeStatusTagType(row.status)">{{ intakeStatusLabel(row.status) }}</el-tag>
          </template>
          <template #recommendPerson="{ row }">
            <span>{{ row.recommendArchiveNo || '—' }} {{ row.recommendPersonName || '' }}</span>
            <div v-if="row.recognizeMessage" class="hint">{{ row.recognizeMessage }}</div>
          </template>
          <template #recommendCategory="{ row }">
            {{ row.recommendCategoryName || row.recommendCategoryCode || '—' }}
          </template>
          <template #action="{ row }">
            <el-button
              link
              type="primary"
              v-permission="'hrams:archive:upload'"
              :disabled="row.status !== 'pending_confirm'"
              :loading="actingId === row.id"
              @click="openReview(row)"
            >
              审核
            </el-button>
          </template>
        </ele-pro-table>
      </div>
    </div>

    <el-dialog v-model="reviewVisible" title="确认材料归属" width="720px" destroy-on-close>
      <el-form v-if="reviewRow" label-width="88px">
        <el-form-item label="文件">{{ reviewRow.originalFileName }}</el-form-item>
        <el-form-item label="人员">
          <el-select v-model="reviewForm.personId" filterable clearable style="width:100%">
            <el-option
              v-for="p in personOptions"
              :key="p.id"
              :label="`${p.archiveNo || ''} ${p.name || ''}`.trim()"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目录">
          <el-select v-model="reviewForm.categoryCode" filterable clearable style="width:100%">
            <el-option v-for="c in categoryOptions" :key="c.code" :label="c.name" :value="c.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="材料名称"><el-input v-model="reviewForm.materialName" /></el-form-item>
        <el-form-item label="形成日期">
          <el-date-picker v-model="reviewForm.formDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="页号"><el-input-number v-model="reviewForm.pageNo" :min="1" /></el-form-item>
        <el-form-item label="页数"><el-input-number v-model="reviewForm.pageCount" :min="1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="danger" :loading="actingId != null" @click="doReject">驳回</el-button>
        <el-button type="primary" :loading="actingId != null" @click="doConfirm">确认归档</el-button>
      </template>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import {
    pageMaterialIntake,
    confirmMaterialIntake,
    rejectMaterialIntake,
    getMaterialIntake
  } from '@/api/hrams/archive';
  import { pagePerson } from '@/api/hrams/person';
  import { listCategoryConfig } from '@/api/hrams/material-category';
  import { intakeStatusLabel, intakeStatusTagType, intakeVoToRow } from '@/utils/hrams-material-intake';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsMaterialIntakePending' });

  const tableRef = ref(null);
  const where = ref({ status: 'pending_confirm' });
  const personOptions = ref([]);
  const categoryOptions = ref([]);
  const reviewVisible = ref(false);
  const reviewRow = ref(null);
  const reviewForm = ref({});
  const actingId = ref(null);

  const statusOptions = [
    { value: 'pending_confirm', label: '待确认' },
    { value: 'ocr_processing', label: 'OCR 中' },
    { value: 'ai_processing', label: 'AI 中' },
    { value: 'recognize_failed', label: '识别失败' },
    { value: 'archived', label: '已归档' },
    { value: 'rejected', label: '已驳回' }
  ];

  const columns = ref([
    { prop: 'originalFileName', label: '文件', minWidth: 160, showOverflowTooltip: true },
    { prop: 'status', label: '状态', width: 108, slot: 'status' },
    { columnKey: 'recommendPerson', label: '推荐人员', minWidth: 140, slot: 'recommendPerson' },
    { columnKey: 'recommendCategory', label: '推荐目录', minWidth: 120, slot: 'recommendCategory' },
    { prop: 'recommendMaterialName', label: '材料名称', minWidth: 120, showOverflowTooltip: true },
    {
      prop: 'createTime',
      label: '提交时间',
      width: 170,
      formatter: (row) => row.createTime || '—'
    },
    { columnKey: 'action', label: '操作', width: 88, slot: 'action', fixed: 'right' }
  ]);

  const datasource = ({ pages }) => {
    const params = { ...where.value, ...pages };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });
    return pageMaterialIntake(params);
  };

  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => {
    where.value = { status: 'pending_confirm' };
    reload(where.value, 1);
  };

  const loadOptions = async () => {
    try {
      const data = await pagePerson({ pageNum: 1, pageSize: 500 });
      personOptions.value = data.rows || [];
    } catch {
      personOptions.value = [];
    }
    try {
      categoryOptions.value = await listCategoryConfig();
    } catch {
      categoryOptions.value = [];
    }
  };

  const openReview = async (row) => {
    actingId.value = row.id;
    try {
      const vo = await getMaterialIntake(row.id);
      const mapped = intakeVoToRow(vo, null, {
        uploadPersonOptions: personOptions.value,
        flatCategories: categoryOptions.value
      });
      reviewRow.value = vo;
      reviewForm.value = {
        personId: mapped.personId,
        categoryCode: mapped.categoryCode,
        materialName: mapped.materialName,
        formDate: mapped.formDate,
        pageNo: mapped.pageNo,
        pageCount: mapped.pageCount
      };
      reviewVisible.value = true;
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      actingId.value = null;
    }
  };

  const doConfirm = async () => {
    if (!reviewRow.value?.id) return;
    actingId.value = reviewRow.value.id;
    try {
      await confirmMaterialIntake(reviewRow.value.id, { ...reviewForm.value });
      EleMessage.success({ message: '已确认归档', plain: true });
      reviewVisible.value = false;
      reload(where.value);
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      actingId.value = null;
    }
  };

  const doReject = async () => {
    if (!reviewRow.value?.id) return;
    actingId.value = reviewRow.value.id;
    try {
      await rejectMaterialIntake(reviewRow.value.id, '管理员驳回');
      EleMessage.success({ message: '已驳回', plain: true });
      reviewVisible.value = false;
      reload(where.value);
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      actingId.value = null;
    }
  };

  onMounted(loadOptions);
</script>

<style scoped>
  .hint {
    font-size: 12px;
    color: #888;
    line-height: 1.4;
  }
</style>
