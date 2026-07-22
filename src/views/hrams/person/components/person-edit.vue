<template>
  <ele-modal
    :form="true"
    :width="960"
    :title="isUpdate ? '编辑人员' : '新增人员'"
    :loading="loading"
    class="person-edit-modal"
    v-bind="modalProps"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px" class="person-edit-form" @submit.prevent="">
      <div class="person-edit-layout">
        <aside class="person-edit-aside">
          <div class="photo-label">证件照</div>
          <el-upload
            class="person-photo-uploader"
            :show-file-list="false"
            accept="image/*"
            :http-request="uploadPhoto"
          >
            <img v-if="photoUrl" :src="photoUrl" class="person-photo-img" alt="照片" />
            <div v-else class="person-photo-placeholder">
              <span>上传照片</span>
              <span class="photo-hint">jpg/png</span>
            </div>
          </el-upload>
          <el-button v-if="form.photoOssId" link type="primary" @click="clearPhoto">移除照片</el-button>
          <div v-if="isUpdate" class="aside-meta">
            <span class="meta-label">档案编号</span>
            <span>{{ form.archiveNo || '—' }}</span>
          </div>
        </aside>
        <div class="person-edit-main">
          <el-tabs v-model="activeTab" class="person-edit-tabs">
            <el-tab-pane label="基本信息" name="basic">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="身份证号" prop="idCard">
                    <el-input v-model="form.idCard" maxlength="18" placeholder="请输入身份证号" @blur="fillFromIdCard" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="姓名" prop="name">
                    <el-input v-model="form.name" placeholder="请输入姓名" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="性别">
                    <dict-data v-model="form.gender" code="hrams_gender" type="select" placeholder="请选择" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="出生日期" prop="birthDate">
                    <el-date-picker
                      v-model="form.birthDate"
                      type="date"
                      value-format="YYYY-MM-DD"
                      style="width:100%"
                      readonly
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="民族">
                    <dict-data v-model="form.nation" code="hrams_nation" type="select" placeholder="请选择" filterable style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="籍贯">
                    <el-input v-model="form.nativePlace" placeholder="省/市" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="出生地">
                    <el-input v-model="form.birthPlace" placeholder="出生地" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="婚姻状况">
                    <el-select v-model="form.marriageStatus" placeholder="请选择" clearable style="width:100%">
                      <el-option label="已婚" value="已婚" />
                      <el-option label="未婚" value="未婚" />
                      <el-option label="离异" value="离异" />
                      <el-option label="丧偶" value="丧偶" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="健康状况">
                    <el-input v-model="form.health" placeholder="健康/一般等" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="政治面貌">
                    <dict-data v-model="form.politicalStatus" code="hrams_political_status" type="select" placeholder="请选择" filterable style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="入党时间">
                    <el-date-picker v-model="form.partyJoinDate" type="month" value-format="YYYY-MM-DD" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="干部身份">
                    <el-input v-model="form.cadreIdentity" placeholder="吸收录用干部/转业干部等" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane label="组织与岗位" name="org">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="人员编号">
                    <el-input v-model="form.personNo" placeholder="单位内部编号" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="人员类型">
                    <dict-data v-model="form.personType" code="hrams_person_type" type="select" placeholder="请选择" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="所在部门">
                    <dept-select v-model="selectedDeptId" placeholder="请选择部门" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="人员状态" prop="personStatus">
                    <dict-data v-model="form.personStatus" code="hrams_person_status" type="select" placeholder="请选择" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="主岗">
                    <el-input v-model="form.primaryPost" placeholder="主岗名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="副岗">
                    <el-input v-model="form.secondaryPost" placeholder="副岗名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="职务">
                    <el-input v-model="form.duty" placeholder="现任职务" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="职务级别">
                    <el-input v-model="form.jobLevel" placeholder="如处级、科级" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="任现职日期">
                    <el-date-picker v-model="form.dutyStartDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="专业技术职务">
                    <el-input v-model="form.techTitle" placeholder="如经济师（中级）" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="熟悉专业/专长">
                    <el-input v-model="form.specialty" placeholder="专业技能与特长" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="参加工作时间">
                    <el-date-picker v-model="form.workStartDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="进本单位时间">
                    <el-date-picker v-model="form.enterOrgDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="合同到期日">
                    <el-date-picker v-model="form.contractEndDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="计划退休日">
                    <el-date-picker v-model="form.planRetireDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane label="学历学位" name="edu">
              <div class="tab-section-title">全日制</div>
              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="最高学历">
                    <dict-data v-model="form.educationFulltime" code="hrams_education" type="select" placeholder="学历" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="最高学位">
                    <el-input v-model="form.degreeFulltime" placeholder="如学士、硕士" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="专业">
                    <el-input v-model="form.majorFulltime" placeholder="专业" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="毕业院校">
                    <el-input v-model="form.schoolFulltime" placeholder="院校名称" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="tab-section-title">在职教育</div>
              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="最高学历">
                    <dict-data v-model="form.educationJob" code="hrams_education" type="select" placeholder="学历" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="最高学位">
                    <el-input v-model="form.degreeJob" placeholder="学位" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="专业">
                    <el-input v-model="form.majorJob" placeholder="专业" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="毕业院校">
                    <el-input v-model="form.schoolJob" placeholder="院校名称" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="tab-section-title">汇总（列表展示用）</div>
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="学历">
                    <dict-data v-model="form.education" code="hrams_education" type="select" placeholder="综合最高学历" style="width:100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="专业">
                    <el-input v-model="form.major" placeholder="综合专业" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane label="履历与发展" name="career">
              <el-form-item label="工作履历">
                <el-input v-model="form.careerSummary" type="textarea" :rows="4" maxlength="2000" show-word-limit placeholder="历任单位、职务及任职时间等" />
              </el-form-item>
              <el-form-item label="考核奖惩">
                <el-input v-model="form.assessmentSummary" type="textarea" :rows="3" maxlength="2000" show-word-limit placeholder="年度考核、表彰、处分等" />
              </el-form-item>
              <el-form-item label="培训特长">
                <el-input v-model="form.trainingSummary" type="textarea" :rows="3" maxlength="2000" show-word-limit placeholder="培训经历、专业技能与特长" />
              </el-form-item>
              <el-form-item label="家庭关系">
                <el-input v-model="form.familySummary" type="textarea" :rows="3" maxlength="2000" show-word-limit placeholder="家庭成员及主要社会关系" />
              </el-form-item>
              <el-form-item label="其他说明">
                <el-input v-model="form.extraSummary" type="textarea" :rows="2" maxlength="2000" show-word-limit placeholder="编制、军转、工资等补充说明" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit />
              </el-form-item>
            </el-tab-pane>

            <el-tab-pane label="扩展字段" name="extra">
              <person-custom-fields v-model="customFields" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-form>
    <template #footer>
      <btn-items :items="[
        { preset: 'cancel', onClick: () => closeModal() },
        { preset: 'save', onClick: () => handleSave() }
      ]" />
    </template>
  </ele-modal>
</template>

<script setup>
  import { reactive, ref, watch } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import DictData from '@/components/DictData/index.vue';
  import DeptSelect from '@/views/system/dept/components/dept-select.vue';
  import { listDept } from '@/api/system/dept';
  import { uploadOss, listOssById } from '@/api/system/oss';
  import { addPerson, updatePerson, getPerson } from '@/api/hrams/person';
  import { parseIdCardInfo } from '@/utils/hrams-id-card';
  import PersonCustomFields from './person-custom-fields.vue';

  const props = defineProps({ data: Object, onDone: Function });
  const { modalProps, closeModal } = useModal();
  const isUpdate = ref(false);
  const loadFailed = ref(false);
  const loading = ref(false);
  const formRef = ref(null);
  const form = ref({});
  const customFields = ref({});
  const activeTab = ref('basic');
  const selectedDeptId = ref();
  const deptList = ref([]);
  const photoUrl = ref('');
  let deptWatchPaused = false;

  const deptNameById = (id) => {
    if (id == null || id === '') return '';
    const row = deptList.value.find((d) => String(d.deptId) === String(id));
    return row?.deptName ?? '';
  };

  const applyDeptToForm = (id, { refreshName = true } = {}) => {
    form.value.deptId = id ?? undefined;
    if (id == null || id === '') {
      form.value.deptName = '';
      return;
    }
    if (refreshName) {
      const name = deptNameById(id);
      if (name) {
        form.value.deptName = name;
      }
    }
  };

  const setSelectedDeptId = (id, opts) => {
    deptWatchPaused = true;
    selectedDeptId.value = id ?? undefined;
    applyDeptToForm(id, opts);
    deptWatchPaused = false;
  };

  const refreshDeptNameAfterListLoaded = () => {
    const id = form.value.deptId;
    if (id != null && id !== '') {
      const name = deptNameById(id);
      if (name) {
        form.value.deptName = name;
      }
      return;
    }
    syncDeptIdFromName();
  };

  const syncDeptIdFromName = () => {
    if (form.value.deptId != null && form.value.deptId !== '') {
      setSelectedDeptId(form.value.deptId, { refreshName: false });
      return;
    }
    const name = (form.value.deptName || '').trim();
    if (!name) {
      setSelectedDeptId(undefined);
      return;
    }
    const matches = deptList.value.filter((d) => d.deptName === name);
    if (matches.length > 1) {
      EleMessage.warning({
        message: `部门名称「${name}」存在多条，请在下拉中重新选择`,
        plain: true
      });
      setSelectedDeptId(undefined, { refreshName: false });
      return;
    }
    setSelectedDeptId(matches[0]?.deptId, { refreshName: true });
  };

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

  listDept()
    .then((data) => {
      deptList.value = data || [];
      refreshDeptNameAfterListLoaded();
    })
    .catch((e) => EleMessage.error({ message: e.message, plain: true }));

  watch(selectedDeptId, (id) => {
    if (deptWatchPaused) {
      return;
    }
    applyDeptToForm(id, { refreshName: true });
  });

  const idCardRule = (_r, v, cb) => {
    if (!v) return cb();
    if (!parseIdCardInfo(v)) return cb(new Error('请输入合法的18位身份证号'));
    cb();
  };

  const birthDateRule = (_r, v, cb) => {
    if (!v) return cb();
    const today = new Date();
    const todayText = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');
    if (v > todayText) {
      return cb(new Error('出生日期不能晚于当前日期'));
    }
    const parsed = parseIdCardInfo(form.value.idCard);
    if (parsed && parsed.birthDate !== v) {
      return cb(new Error('出生日期与身份证号中的出生日期不一致'));
    }
    cb();
  };

  const rules = reactive({
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    personStatus: [{ required: true, message: '请选择人员状态', trigger: 'change' }],
    idCard: [
      { required: true, message: '请输入身份证号', trigger: 'blur' },
      { validator: idCardRule, trigger: 'blur' }
    ],
    birthDate: [
      { required: true, message: '请选择出生日期', trigger: 'change' },
      { validator: birthDateRule, trigger: 'change' }
    ]
  });

  const loadPerson = async (id) => {
    try {
      const p = await getPerson(id);
      loadFailed.value = false;
      form.value = { ...p };
      customFields.value = { ...(p.customFields || {}) };
      setSelectedDeptId(p.deptId, { refreshName: false });
      await loadPhoto(p.photoOssId);
      isUpdate.value = true;
    } catch (e) {
      loadFailed.value = true;
      isUpdate.value = true;
      form.value = { id, personStatus: '在职' };
      customFields.value = {};
      photoUrl.value = '';
      setSelectedDeptId(undefined);
      EleMessage.error({ message: e.message || '加载人员失败', plain: true });
      throw e;
    }
  };

  watch(() => props.data, async (d) => {
    activeTab.value = 'basic';
    loadFailed.value = false;
    if (d?.id) {
      try {
        await loadPerson(d.id);
      } catch {
        /* 已在 loadPerson 中提示 */
      }
    } else {
      form.value = { personStatus: '在职', ...(d || {}) };
      customFields.value = {};
      photoUrl.value = '';
      setSelectedDeptId(undefined);
      isUpdate.value = false;
    }
  }, { immediate: true });

  const fillFromIdCard = () => {
    const parsed = parseIdCardInfo(form.value.idCard);
    if (!parsed) return;
    form.value.birthDate = parsed.birthDate;
    if (!form.value.gender) {
      form.value.gender = parsed.gender;
    }
  };

  const uploadPhoto = async ({ file }) => {
    try {
      const data = await uploadOss(file);
      form.value.photoOssId = data.ossId;
      photoUrl.value = data.url || photoUrl.value;
      EleMessage.success({ message: '照片已上传', plain: true });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const clearPhoto = () => {
    form.value.photoOssId = null;
    photoUrl.value = '';
  };

  const handleSave = () => {
    if (loadFailed.value) {
      EleMessage.error({ message: '人员信息加载失败，请关闭后重试', plain: true });
      return;
    }
    formRef.value?.validate?.(async (valid) => {
      if (!valid) {
        EleMessage.warning({ message: '请完善必填项（基本信息页）', plain: true });
        activeTab.value = 'basic';
        return;
      }
      const parsedIdCard = parseIdCardInfo(form.value.idCard);
      if (!parsedIdCard || parsedIdCard.birthDate !== form.value.birthDate) {
        EleMessage.warning({ message: '出生日期与身份证号中的出生日期不一致', plain: true });
        activeTab.value = 'basic';
        return;
      }
      loading.value = true;
      const payload = { ...form.value, customFields: customFields.value };
      try {
        if (isUpdate.value) await updatePerson(payload);
        else await addPerson(payload);
        EleMessage.success({ message: '保存成功', plain: true });
        props.onDone?.();
        closeModal();
      } catch (e) {
        EleMessage.error({ message: e.message, plain: true });
      } finally {
        loading.value = false;
      }
    });
  };
</script>

<style scoped>
  .person-edit-layout {
    display: flex;
    gap: 20px;
    height: min(68vh, 500px);
    min-height: 440px;
    max-height: min(68vh, 500px);
  }

  .person-edit-aside {
    flex: 0 0 148px;
    padding: 8px 4px 0;
    text-align: center;
  }

  .photo-label {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #4a5d73;
  }

  .person-photo-uploader {
    display: block;
  }

  .person-photo-uploader :deep(.el-upload) {
    width: 120px;
    height: 160px;
    margin: 0 auto;
    overflow: hidden;
    cursor: pointer;
    border: 1px dashed #c5d3e3;
    border-radius: 12px;
    transition: border-color 0.2s;
  }

  .person-photo-uploader :deep(.el-upload:hover) {
    border-color: #2c6e9e;
  }

  .person-photo-img {
    display: block;
    width: 120px;
    height: 160px;
    object-fit: cover;
  }

  .person-photo-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 160px;
    font-size: 13px;
    color: #8a99b0;
  }

  .photo-hint {
    margin-top: 6px;
    font-size: 11px;
    color: #b0bcc9;
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
    overflow-x: hidden;
    overflow-y: auto;
    padding-right: 6px;
  }

  .tab-section-title {
    margin: 4px 0 12px;
    padding-left: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #2c6e9e;
    border-left: 3px solid #2c6e9e;
  }

  .person-custom-fields :deep(.el-form-item) {
    margin-bottom: 14px;
  }
</style>

<style>
  .person-edit-modal .ele-modal-body {
    padding-top: 8px;
    padding-bottom: 4px;
    overflow: hidden;
  }
</style>
