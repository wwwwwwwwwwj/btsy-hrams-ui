<template>
  <ele-modal :width="960" title="人员详情" class="person-detail-modal" v-bind="modalProps">
    <div v-loading="loading" class="person-edit-layout person-detail-layout">
      <aside class="person-edit-aside">
        <div class="photo-label">证件照</div>
        <div class="person-photo-frame">
          <img v-if="photoUrl" :src="photoUrl" class="person-photo-img" alt="照片" />
          <div v-else class="person-photo-placeholder">
            <span>暂无照片</span>
          </div>
        </div>
        <div class="aside-meta">
          <span class="meta-label">档案编号</span>
          <span>{{ person?.archiveNo || '—' }}</span>
        </div>
        <div v-if="person?.personNo" class="aside-meta">
          <span class="meta-label">人员编号</span>
          <span>{{ person.personNo }}</span>
        </div>
      </aside>
      <div class="person-edit-main" v-if="person">
        <el-tabs v-model="activeTab" class="person-edit-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border size="small" class="person-detail-desc">
              <el-descriptions-item label="姓名">{{ dash(person.name) }}</el-descriptions-item>
              <el-descriptions-item label="身份证号">{{ dash(person.idCard) }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ dash(person.gender) }}</el-descriptions-item>
              <el-descriptions-item label="出生日期">{{ formatDateDay(person.birthDate) || '—' }}</el-descriptions-item>
              <el-descriptions-item label="年龄">{{ dash(person.age) }}</el-descriptions-item>
              <el-descriptions-item label="民族">{{ dash(person.nation) }}</el-descriptions-item>
              <el-descriptions-item label="籍贯">{{ dash(person.nativePlace) }}</el-descriptions-item>
              <el-descriptions-item label="出生地">{{ dash(person.birthPlace) }}</el-descriptions-item>
              <el-descriptions-item label="婚姻状况">{{ dash(person.marriageStatus) }}</el-descriptions-item>
              <el-descriptions-item label="健康状况">{{ dash(person.health) }}</el-descriptions-item>
              <el-descriptions-item label="政治面貌">{{ dash(person.politicalStatus) }}</el-descriptions-item>
              <el-descriptions-item label="入党时间">{{ formatDateDay(person.partyJoinDate) || '—' }}</el-descriptions-item>
              <el-descriptions-item label="干部身份" :span="2">{{ dash(person.cadreIdentity) }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="组织与岗位" name="org">
            <el-descriptions :column="2" border size="small" class="person-detail-desc">
              <el-descriptions-item label="人员编号">{{ dash(person.personNo) }}</el-descriptions-item>
              <el-descriptions-item label="人员类型">{{ dash(person.personType) }}</el-descriptions-item>
              <el-descriptions-item label="所在部门">{{ dash(person.deptName) }}</el-descriptions-item>
              <el-descriptions-item label="人员状态">{{ dash(person.personStatus) }}</el-descriptions-item>
              <el-descriptions-item label="主岗">{{ dash(person.primaryPost) }}</el-descriptions-item>
              <el-descriptions-item label="副岗">{{ dash(person.secondaryPost) }}</el-descriptions-item>
              <el-descriptions-item label="职务">{{ dash(person.duty) }}</el-descriptions-item>
              <el-descriptions-item label="职务级别">{{ dash(person.jobLevel) }}</el-descriptions-item>
              <el-descriptions-item label="任现职日期">{{ formatDateDay(person.dutyStartDate) || '—' }}</el-descriptions-item>
              <el-descriptions-item label="专业技术职务">{{ dash(person.techTitle) }}</el-descriptions-item>
              <el-descriptions-item label="熟悉专业/专长">{{ dash(person.specialty) }}</el-descriptions-item>
              <el-descriptions-item label="参加工作时间">{{ formatDateDay(person.workStartDate) || '—' }}</el-descriptions-item>
              <el-descriptions-item label="进本单位时间">{{ formatDateDay(person.enterOrgDate) || '—' }}</el-descriptions-item>
              <el-descriptions-item label="合同到期日">{{ formatDateDay(person.contractEndDate) || '—' }}</el-descriptions-item>
              <el-descriptions-item label="计划退休日">{{ formatDateDay(person.planRetireDate) || '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="学历学位" name="edu">
            <div class="tab-section-title">全日制</div>
            <el-descriptions :column="3" border size="small" class="person-detail-desc">
              <el-descriptions-item label="最高学历">{{ dash(person.educationFulltime) }}</el-descriptions-item>
              <el-descriptions-item label="最高学位">{{ dash(person.degreeFulltime) }}</el-descriptions-item>
              <el-descriptions-item label="专业">{{ dash(person.majorFulltime) }}</el-descriptions-item>
              <el-descriptions-item label="毕业院校" :span="3">{{ dash(person.schoolFulltime) }}</el-descriptions-item>
            </el-descriptions>
            <div class="tab-section-title">在职教育</div>
            <el-descriptions :column="3" border size="small" class="person-detail-desc">
              <el-descriptions-item label="最高学历">{{ dash(person.educationJob) }}</el-descriptions-item>
              <el-descriptions-item label="最高学位">{{ dash(person.degreeJob) }}</el-descriptions-item>
              <el-descriptions-item label="专业">{{ dash(person.majorJob) }}</el-descriptions-item>
              <el-descriptions-item label="毕业院校" :span="3">{{ dash(person.schoolJob) }}</el-descriptions-item>
            </el-descriptions>
            <div class="tab-section-title">汇总</div>
            <el-descriptions :column="2" border size="small" class="person-detail-desc">
              <el-descriptions-item label="学历">{{ dash(person.education) }}</el-descriptions-item>
              <el-descriptions-item label="专业">{{ dash(person.major) }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="履历与发展" name="career">
            <div class="detail-text-block">
              <div class="detail-text-label">工作履历</div>
              <div class="detail-text-body">{{ dash(person.careerSummary) }}</div>
            </div>
            <div class="detail-text-block">
              <div class="detail-text-label">考核奖惩</div>
              <div class="detail-text-body">{{ dash(person.assessmentSummary) }}</div>
            </div>
            <div class="detail-text-block">
              <div class="detail-text-label">培训特长</div>
              <div class="detail-text-body">{{ dash(person.trainingSummary) }}</div>
            </div>
            <div class="detail-text-block">
              <div class="detail-text-label">家庭关系</div>
              <div class="detail-text-body">{{ dash(person.familySummary) }}</div>
            </div>
            <div class="detail-text-block">
              <div class="detail-text-label">其他说明</div>
              <div class="detail-text-body">{{ dash(person.extraSummary) }}</div>
            </div>
            <div class="detail-text-block">
              <div class="detail-text-label">备注</div>
              <div class="detail-text-body">{{ dash(person.remark) }}</div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="扩展字段" name="extra">
            <el-empty v-if="!extraRows.length" description="暂无扩展字段数据" :image-size="64" />
            <el-descriptions v-else :column="2" border size="small" class="person-detail-desc">
              <el-descriptions-item v-for="row in extraRows" :key="row.key" :label="row.label">
                {{ dash(row.value) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <template #footer>
      <btn-items :items="[{ preset: 'cancel', onClick: () => closeModal() }]" />
    </template>
  </ele-modal>
</template>

<script setup>
  import { computed, ref, watch } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { getPerson, listPersonFieldDefs } from '@/api/hrams/person';
  import { listOssById } from '@/api/system/oss';
  import { formatDateDay } from '@/utils/hrams-date';

  const props = defineProps({ personId: [Number, String] });
  const { modalProps, closeModal } = useModal();
  const person = ref(null);
  const loading = ref(false);
  const activeTab = ref('basic');
  const photoUrl = ref('');
  const fieldDefs = ref([]);

  const dash = (v) => (v === 0 ? '0' : v ? String(v) : '—');

  const extraRows = computed(() => {
    const map = person.value?.customFields || {};
    const defs = fieldDefs.value || [];
    if (defs.length) {
      return defs.map((d) => ({
        key: d.fieldKey,
        label: d.fieldLabel,
        value: map[d.fieldKey]
      }));
    }
    return Object.entries(map).map(([key, value]) => ({
      key,
      label: key,
      value
    }));
  });

  const loadPhoto = async (ossId) => {
    photoUrl.value = '';
    if (!ossId) return;
    try {
      const list = await listOssById(ossId);
      const row = Array.isArray(list) ? list[0] : list;
      photoUrl.value = row?.url || '';
    } catch {
      photoUrl.value = '';
    }
  };

  const loadPerson = async (id) => {
    loading.value = true;
    activeTab.value = 'basic';
    try {
      person.value = await getPerson(id);
      await loadPhoto(person.value?.photoOssId);
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
      person.value = null;
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => props.personId,
    (id) => {
      if (!id) {
        person.value = null;
        photoUrl.value = '';
        return;
      }
      loadPerson(id);
    },
    { immediate: true }
  );

  listPersonFieldDefs()
    .then((data) => {
      fieldDefs.value = data || [];
    })
    .catch(() => {});
</script>

<style scoped>
  .person-detail-layout {
    min-height: 440px;
    height: min(68vh, 500px);
    max-height: min(68vh, 500px);
  }

  .person-photo-frame {
    width: 120px;
    height: 160px;
    margin: 0 auto;
    overflow: hidden;
    background: #f7f9fc;
    border: 1px solid #e3eaf2;
    border-radius: 12px;
  }

  .person-photo-img {
    display: block;
    width: 120px;
    height: 160px;
    object-fit: cover;
  }

  .person-photo-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 160px;
    font-size: 13px;
    color: #9aa8ba;
  }

  .photo-label {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #4a5d73;
  }

  .person-edit-aside {
    flex: 0 0 148px;
    padding: 8px 4px 0;
    text-align: center;
  }

  .aside-meta {
    margin-top: 14px;
    font-size: 12px;
    line-height: 1.5;
    color: #6c7a91;
    word-break: break-all;
  }

  .meta-label {
    display: block;
    margin-bottom: 2px;
    color: #9aa8ba;
  }

  .person-edit-layout {
    display: flex;
    gap: 20px;
  }

  .person-edit-main {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .person-edit-tabs {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .person-edit-tabs :deep(.el-tabs__header) {
    flex-shrink: 0;
    margin-bottom: 8px;
  }

  .person-edit-tabs :deep(.el-tabs__content) {
    flex: 1;
    height: 0;
    min-height: 0;
    overflow: hidden;
  }

  .person-edit-tabs :deep(.el-tab-pane) {
    height: 100%;
    padding-right: 6px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .tab-section-title {
    margin: 4px 0 10px;
    padding-left: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #2c6e9e;
    border-left: 3px solid #2c6e9e;
  }

  .tab-section-title + .person-detail-desc {
    margin-bottom: 14px;
  }

  .person-detail-desc {
    margin-bottom: 8px;
  }

  .detail-text-block {
    margin-bottom: 14px;
  }

  .detail-text-label {
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #4a5d73;
  }

  .detail-text-body {
    min-height: 40px;
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.55;
    color: #1f2d3d;
    white-space: pre-wrap;
    word-break: break-word;
    background: #f9fbfe;
    border: 1px solid #eef2f8;
    border-radius: 10px;
  }
</style>

<style>
  .person-detail-modal .ele-modal-body {
    padding-top: 8px;
    padding-bottom: 4px;
    overflow: hidden;
  }
</style>
