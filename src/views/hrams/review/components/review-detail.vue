<template>
  <div v-loading="loading" class="review-workspace">
    <div class="review-bar">
      <div class="review-id">
        <el-button @click="emit('back')">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
        <strong class="review-name">{{ detail.personName || '未命名' }}</strong>
        <el-tag :type="statusType(detail.status)" size="small">{{
          statusLabel(detail.status)
        }}</el-tag>
        <span class="review-meta">
          {{ detail.archiveNo || '-' }}
          <span v-if="detail.deptName"> · {{ detail.deptName }}</span>
          <span v-if="detail.duty"> · {{ detail.duty }}</span>
          <span v-if="detail.reviewNo"> · {{ detail.reviewNo }}</span>
        </span>
      </div>
      <div class="review-actions">
        <el-button
          v-if="canReject"
          v-permission="rejectPermission"
          @click="reject"
          >退回</el-button
        >
        <el-button
          v-if="primaryAction"
          type="primary"
          v-permission="primaryAction.permission"
          @click="primaryAction.run"
        >
          {{ primaryAction.label }}
        </el-button>
        <el-dropdown trigger="click" @command="onMore">
          <el-button>更多</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-if="canSave"
                command="save"
                :disabled="!hasPerm('hrams:review:edit')"
                >保存</el-dropdown-item
              >
              <el-dropdown-item
                v-if="isInitial"
                command="sync"
                :disabled="!hasPerm('hrams:review:edit')"
                >同步最新档案</el-dropdown-item
              >
              <el-dropdown-item
                v-if="!isClosed"
                command="suspend"
                :disabled="!hasPerm('hrams:review:submit')"
                >涉嫌造假暂停</el-dropdown-item
              >
              <el-dropdown-item
                v-if="!isClosed"
                command="cancel"
                :disabled="!hasPerm('hrams:review:cancel')"
                >作废</el-dropdown-item
              >
              <el-dropdown-item
                command="draft"
                :disabled="!hasPerm('hrams:review:export')"
                >预览草稿</el-dropdown-item
              >
              <el-dropdown-item
                command="blank"
                :disabled="!hasPerm('hrams:review:export')"
                >任免表空白件</el-dropdown-item
              >
              <el-dropdown-item
                v-if="detail.status === 'finished'"
                command="official"
                :disabled="!hasPerm('hrams:review:export')"
                >导出正式件</el-dropdown-item
              >
              <el-dropdown-item
                v-if="detail.status === 'finished' && canWriteback"
                command="writeback"
                >回写主数据</el-dropdown-item
              >
              <el-dropdown-item
                v-if="detail.status === 'rectification'"
                command="maintain"
                >去补材料</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <ol class="review-steps">
      <li v-for="step in steps" :key="step.key" :class="stepClass(step.key)">{{
        step.label
      }}</li>
    </ol>

    <el-alert
      v-if="detail.returnReason"
      :title="`退回原因：${detail.returnReason}`"
      type="warning"
      show-icon
      :closable="false"
      class="review-alert"
    />
    <el-alert
      v-if="detail.status === 'suspended'"
      title="涉嫌造假已暂停，不得继续人事程序"
      type="error"
      show-icon
      :closable="false"
      class="review-alert"
    />

    <div class="review-body">
      <section class="review-left">
        <div class="material-switch">
          <button
            type="button"
            :class="{ on: materialTab === 'evidence' }"
            @click="materialTab = 'evidence'"
          >
            证据材料 {{ detail.evidences?.length || 0 }}
          </button>
          <button
            type="button"
            :class="{ on: materialTab === 'suggest' }"
            @click="materialTab = 'suggest'"
          >
            其他材料 {{ detail.suggestedMaterials?.length || 0 }}
          </button>
          <span v-if="detail.careers?.length" class="career-line">
            履历 {{ detail.careers.length }} 段
          </span>
        </div>
        <el-table
          v-if="materialTab === 'evidence'"
          :data="detail.evidences || []"
          size="small"
          height="160"
          highlight-current-row
          @row-click="(row) => preview(row.materialId)"
        >
          <el-table-column prop="categoryCode" label="类号" width="56" />
          <el-table-column
            prop="materialName"
            label="名称"
            min-width="120"
            show-overflow-tooltip
          />
          <el-table-column label="" width="88">
            <template #default="{ row }">
              <el-tag v-if="row.changedFlag === '1'" type="warning" size="small"
                >已变更</el-tag
              >
              <el-button
                v-if="isInitial && row.changedFlag === '1'"
                link
                type="primary"
                @click.stop="rebind(row)"
                >重挂</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <el-table
          v-else
          :data="detail.suggestedMaterials || []"
          size="small"
          height="160"
          highlight-current-row
          @row-click="(row) => preview(row.id)"
        >
          <el-table-column prop="categoryCode" label="类号" width="56" />
          <el-table-column
            prop="materialName"
            label="材料"
            min-width="140"
            show-overflow-tooltip
          />
        </el-table>
        <div class="preview-pane">
          <iframe
            v-if="leftPreview.kind === 'pdf'"
            :src="leftPreview.url"
            class="preview-frame"
          />
          <img
            v-else-if="leftPreview.kind === 'image'"
            :src="leftPreview.url"
            class="preview-img"
            alt="预览"
          />
          <div v-else class="preview-empty">点上面材料，对照右边填写</div>
        </div>
      </section>

      <section class="review-right">
        <template v-if="isInitial">
          <article v-for="g in visibleGroups" :key="g.code" class="group-card">
            <div class="group-head">
              <strong>{{ g.label }}</strong>
              <el-tag :type="groupConclusion(g.code).type" size="small">{{
                groupConclusion(g.code).text
              }}</el-tag>
              <el-button
                v-if="hasExtras(g.code)"
                link
                type="primary"
                @click="toggleExpand(g.code)"
              >
                {{ expandedGroups[g.code] ? '收起例外' : '例外项' }}
              </el-button>
            </div>
            <div class="quad">
              <label
                >档案依据
                <el-input
                  v-for="cell in specOf(g.code).archive"
                  :key="cell.code"
                  v-model="itemOf(cell.code).archiveValue"
                  :placeholder="cell.label"
                />
              </label>
              <label
                >任免表记载
                <el-input
                  :model-value="appointmentText(specOf(g.code).appointment)"
                  placeholder="最新任免表"
                  @update:model-value="
                    (v) => setAppointment(specOf(g.code).appointment, v)
                  "
                />
              </label>
              <label
                >初审结论
                <div v-if="specOf(g.code).complete" class="mini-yn">
                  <span>材料齐全</span>
                  <el-radio-group v-model="itemOf(specOf(g.code).complete).yn">
                    <el-radio value="yes">是</el-radio>
                    <el-radio value="no">否</el-radio>
                    <el-radio value="na">不适用</el-radio>
                  </el-radio-group>
                </div>
                <el-radio-group
                  v-if="specOf(g.code).conclusion"
                  v-model="itemOf(specOf(g.code).conclusion).yn"
                >
                  <el-radio value="yes">是</el-radio>
                  <el-radio value="no">否</el-radio>
                  <el-radio value="na">不适用</el-radio>
                </el-radio-group>
              </label>
              <label
                >问题
                <el-input
                  v-model="itemOf(specOf(g.code).issue).archiveValue"
                  type="textarea"
                  :rows="2"
                  placeholder="没有则留空"
                />
              </label>
            </div>
            <div v-if="expandedGroups[g.code]" class="extra-list">
              <div
                v-for="code in specOf(g.code).extras"
                :key="code"
                class="review-field is-yn"
              >
                <div class="review-field-label">{{ labelOf(code) }}</div>
                <el-radio-group v-model="itemOf(code).yn">
                  <el-radio value="yes">是</el-radio>
                  <el-radio value="no">否</el-radio>
                  <el-radio value="na">不适用</el-radio>
                </el-radio-group>
              </div>
            </div>
          </article>
          <div class="group-card">
            <div class="group-head"><strong>审核意见</strong></div>
            <el-input
              v-model="detail.opinion"
              type="textarea"
              :rows="2"
              placeholder="初审意见，提交时一并带上"
            />
          </div>
          <section class="group-card">
            <div class="group-head">
              <strong>问题清单</strong>
              <el-tag
                :type="openIssueCount ? 'warning' : 'success'"
                size="small"
              >
                {{
                  openIssueCount ? `${openIssueCount} 条未闭环` : '暂无未闭环'
                }}
              </el-tag>
            </div>
            <el-table
              v-if="detail.issues?.length"
              :data="detail.issues"
              size="small"
              max-height="160"
            >
              <el-table-column prop="groupCode" label="项目" width="88">
                <template #default="{ row }">{{
                  groupLabel(row.groupCode)
                }}</template>
              </el-table-column>
              <el-table-column
                prop="description"
                label="描述"
                min-width="140"
                show-overflow-tooltip
              />
              <el-table-column prop="status" label="状态" width="72">
                <template #default="{ row }">{{
                  row.status === 'closed' ? '已闭环' : '未闭环'
                }}</template>
              </el-table-column>
            </el-table>
            <el-input v-model="newIssue.desc" placeholder="新增问题">
              <template #prepend>
                <el-select v-model="newIssue.group" style="width: 110px">
                  <el-option
                    v-for="g in groups"
                    :key="g.code"
                    :label="g.label"
                    :value="g.code"
                  />
                </el-select>
              </template>
              <template #append>
                <el-button @click="addIssue">添加</el-button>
              </template>
            </el-input>
          </section>
        </template>

        <template v-else-if="detail.status === 'rectification'">
          <div class="group-card">
            <div class="group-head"><strong>整改承办</strong></div>
            <p class="hint"
              >只能补充整改说明和依据，不能自行闭环。核验由初审员办理。</p
            >
            <el-table :data="detail.issues || []" size="small">
              <el-table-column prop="groupCode" label="项目" width="88">
                <template #default="{ row }">{{
                  groupLabel(row.groupCode)
                }}</template>
              </el-table-column>
              <el-table-column
                prop="description"
                label="问题"
                min-width="140"
                show-overflow-tooltip
              />
              <el-table-column label="整改说明" min-width="180">
                <template #default="{ row }">
                  <el-input
                    v-if="row.status === 'open'"
                    v-model="row.rectifyDesc"
                    type="textarea"
                    :rows="2"
                    placeholder="必填"
                  />
                  <span v-else>{{ row.rectifyDesc || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="依据" width="120">
                <template #default="{ row }">
                  <el-upload
                    v-if="row.status === 'open'"
                    :show-file-list="false"
                    :http-request="(opt) => uploadIssueFile(row, opt.file)"
                  >
                    <el-button link type="primary">{{
                      row.rectifyOssId ? '已上传' : '上传'
                    }}</el-button>
                  </el-upload>
                  <span v-else>{{ row.rectifyOssId ? '已上传' : '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <template v-else-if="detail.status === 'rectification_verify'">
          <div class="group-card">
            <div class="group-head"><strong>整改核验</strong></div>
            <el-table :data="detail.issues || []" size="small">
              <el-table-column prop="groupCode" label="项目" width="88">
                <template #default="{ row }">{{
                  groupLabel(row.groupCode)
                }}</template>
              </el-table-column>
              <el-table-column
                prop="description"
                label="问题"
                min-width="140"
                show-overflow-tooltip
              />
              <el-table-column
                prop="rectifyDesc"
                label="整改说明"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">{{
                  row.status === 'closed' ? '已闭环' : '待核验'
                }}</template>
              </el-table-column>
              <el-table-column label="" width="72">
                <template #default="{ row }">
                  <el-button
                    v-if="row.status === 'open'"
                    link
                    type="primary"
                    @click="closeIssue(row)"
                    >闭环</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <template v-else-if="detail.status === 'certification'">
          <div class="group-card">
            <div class="group-head"><strong>组织认定</strong></div>
            <p class="hint"
              >认定值仅在本节点确认。重新认定须通知干部所在单位和本人。</p
            >
            <div v-for="g in certifyGroups" :key="g.code" class="certify-row">
              <strong>{{ g.label }}</strong>
              <el-input
                v-model="itemOf(specOf(g.code).value).confirmedValue"
                :placeholder="`${g.label}认定值`"
              />
            </div>
            <el-input
              v-model="detail.certifyOpinion"
              type="textarea"
              :rows="3"
              placeholder="认定结论，必填"
            />
            <div class="notify-row">
              <el-checkbox
                :model-value="detail.notifyUnit === '1'"
                @change="(v) => (detail.notifyUnit = v ? '1' : '0')"
                >已通知所在单位</el-checkbox
              >
              <el-checkbox
                :model-value="detail.notifyPerson === '1'"
                @change="(v) => (detail.notifyPerson = v ? '1' : '0')"
                >已通知本人</el-checkbox
              >
            </div>
          </div>
        </template>

        <template v-else-if="detail.status === 'secondary_review'">
          <article v-for="g in visibleGroups" :key="g.code" class="group-card">
            <div class="group-head">
              <strong>{{ g.label }}</strong>
              <el-tag v-if="hasDiff(g.code)" type="warning" size="small"
                >档案与任免表不一致</el-tag
              >
            </div>
            <div class="readonly-grid">
              <div>档案依据：{{ archiveText(g.code) || '-' }}</div>
              <div
                >任免表：{{
                  appointmentText(specOf(g.code).appointment) || '-'
                }}</div
              >
              <div
                >初审结论：{{
                  ynText(itemOf(specOf(g.code).conclusion).yn)
                }}</div
              >
              <div
                >问题：{{
                  itemOf(specOf(g.code).issue).archiveValue || '-'
                }}</div
              >
              <div v-if="specOf(g.code).value"
                >认定值：{{
                  itemOf(specOf(g.code).value).confirmedValue ||
                  itemOf(specOf(g.code).value).archiveValue ||
                  '-'
                }}</div
              >
            </div>
          </article>
          <div class="group-card">
            <div>初审人：{{ detail.initialReviewerName || '-' }}</div>
            <div>初审意见：{{ detail.opinion || '-' }}</div>
            <div>认定结论：{{ detail.certifyOpinion || '本次无需认定' }}</div>
          </div>
        </template>

        <template v-else-if="detail.status === 'archiving'">
          <div class="group-card">
            <div class="group-head"><strong>签章归档</strong></div>
            <p class="hint"
              >先导出正式件签章，再回传。签章件归入第五类后办结。</p
            >
            <el-button
              v-permission="'hrams:review:export'"
              @click="doExport('draft')"
              >导出待签章稿</el-button
            >
            <el-upload :show-file-list="false" :http-request="doArchive">
              <el-button type="primary" v-permission="'hrams:review:archive'"
                >回传签章件并办结</el-button
              >
            </el-upload>
          </div>
        </template>

        <template v-else>
          <div class="group-card">
            <div class="group-head"><strong>办理结果</strong></div>
            <div>初审人：{{ detail.initialReviewerName || '-' }}</div>
            <div>复审人：{{ detail.secondaryReviewerName || '-' }}</div>
            <div>归档人：{{ detail.archiveUserName || '-' }}</div>
            <div>意见：{{ detail.opinion || '-' }}</div>
          </div>
        </template>
      </section>
    </div>

    <el-dialog v-model="rebindVisible" title="重挂证据" width="520px">
      <el-table
        :data="detail.suggestedMaterials || []"
        size="small"
        highlight-current-row
        @row-click="(row) => (rebindTarget = row.id)"
      >
        <el-table-column prop="categoryCode" label="类号" width="70" />
        <el-table-column prop="materialName" label="材料" min-width="180" />
      </el-table>
      <template #footer>
        <el-button @click="rebindVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRebind">确定重挂</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="writebackVisible" title="回写人员主数据" width="640px">
      <el-table :data="writebackRows" size="small" @selection-change="onWbSel">
        <el-table-column
          type="selection"
          width="42"
          :selectable="(row) => !!row.newValue"
        />
        <el-table-column prop="label" label="字段" width="120" />
        <el-table-column prop="oldValue" label="当前值" />
        <el-table-column prop="newValue" label="认定值" />
      </el-table>
      <template #footer>
        <el-button @click="skipWriteback">跳过</el-button>
        <el-button type="primary" @click="doWriteback">确认回写所选</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { ElMessageBox } from 'element-plus';
  import { Back } from '@element-plus/icons-vue';
  import {
    getReview,
    saveReview,
    syncReviewSnapshot,
    submitReview,
    submitReviewRectify,
    verifyReviewRectify,
    certifyReview,
    archiveReview,
    suspendReview,
    submitIssueRectify,
    closeReviewIssue,
    approveReview,
    cancelReview,
    exportReview,
    exportAppointmentBlank,
    writebackPreview,
    writebackReview,
    previewReviewMaterial,
    rebindReviewEvidence
  } from '@/api/hrams/review';
  import { uploadOss } from '@/api/system/oss';
  import { usePermission } from '@/utils/use-permission';
  import { HRAMS_MATERIAL_MAINTAIN_PATH } from '@/utils/hrams-routes';

  const props = defineProps({ reviewId: [Number, String] });
  const emit = defineEmits(['done', 'back']);
  const router = useRouter();
  const { hasAnyPermission } = usePermission();
  const hasPerm = (code) => hasAnyPermission([code]);
  const canWriteback = computed(() =>
    hasAnyPermission(['hrams:review:approve', 'hrams:review:edit'])
  );
  const loading = ref(false);
  const ready = ref(false);
  const detail = ref({
    items: [],
    issues: [],
    suggestedMaterials: [],
    evidences: [],
    careers: []
  });
  const materialTab = ref('evidence');
  const newIssue = ref({ group: 'work', desc: '' });
  const writebackVisible = ref(false);
  const writebackRows = ref([]);
  const selectedFields = ref([]);
  const pendingClose = ref(false);
  const leftPreview = ref({ kind: '', url: '' });
  const rebindVisible = ref(false);
  const rebindRow = ref(null);
  const rebindTarget = ref(null);
  const expandedGroups = ref({});
  let saveTimer = null;

  const groups = [
    { code: 'birth', label: '出生时间' },
    { code: 'work', label: '参加工作时间' },
    { code: 'party', label: '入党时间' },
    { code: 'edu', label: '学历学位' },
    { code: 'career', label: '工作经历' },
    { code: 'identity', label: '干部身份' },
    { code: 'nation', label: '民族' },
    { code: 'reward', label: '奖惩情况' },
    { code: 'family', label: '家庭关系' },
    { code: 'other', label: '其他' }
  ];

  const groupSpecs = {
    birth: {
      archive: [{ code: 'BIRTH_EARLIEST', label: '最早材料记载' }],
      appointment: 'BIRTH_APPOINTMENT',
      conclusion: 'BIRTH_CONSISTENT',
      extras: [
        'BIRTH_DOUBT',
        'BIRTH_ALTERED',
        'BIRTH_MATERIAL_DOUBT',
        'BIRTH_ORG_CONFIRMED',
        'BIRTH_ORG_POLICY'
      ],
      issue: 'BIRTH_ISSUE',
      value: 'BIRTH_VALUE'
    },
    work: {
      archive: [{ code: 'WORK_MATERIAL', label: '参加工作材料记载' }],
      appointment: 'WORK_APPOINTMENT',
      conclusion: 'WORK_CONSISTENT',
      complete: 'WORK_COMPLETE',
      extras: ['WORK_DOUBT', 'WORK_ORG_CONFIRMED', 'WORK_ORG_POLICY'],
      issue: 'WORK_ISSUE',
      value: 'WORK_VALUE'
    },
    party: {
      archive: [{ code: 'PARTY_VOLUNTEER', label: '入党志愿书记载' }],
      appointment: 'PARTY_APPOINTMENT',
      conclusion: 'PARTY_CONSISTENT',
      complete: 'PARTY_COMPLETE',
      extras: [
        'PARTY_REFILL',
        'PARTY_REFILL_POLICY',
        'PARTY_REFILL_EVIDENCE',
        'PARTY_DOUBT',
        'PARTY_ORG_CONFIRMED',
        'PARTY_ORG_POLICY'
      ],
      issue: 'PARTY_ISSUE',
      value: 'PARTY_VALUE'
    },
    edu: {
      archive: [
        { code: 'EDU_FT_EDU', label: '全日制学历' },
        { code: 'EDU_FT_DEGREE', label: '全日制学位' },
        { code: 'EDU_JOB_EDU', label: '在职学历' },
        { code: 'EDU_JOB_DEGREE', label: '在职学位' }
      ],
      appointment: '',
      conclusion: 'EDU_CONSISTENT',
      complete: 'EDU_COMPLETE',
      extras: [
        'EDU_TRAINING_AS_EDU',
        'EDU_LOW_AS_HIGH',
        'EDU_JOB_AS_FT',
        'EDU_NONE_AS_DEGREE',
        'EDU_DOUBT',
        'EDU_ORG_CONFIRMED',
        'EDU_ORG_POLICY'
      ],
      issue: 'EDU_ISSUE',
      value: 'EDU_VALUE'
    },
    career: {
      archive: [],
      appointment: '',
      conclusion: 'CAREER_CONSISTENT',
      complete: 'CAREER_COMPLETE',
      extras: [
        'CAREER_RESUME',
        'CAREER_APPOINT',
        'CAREER_EXCEPTIONAL',
        'CAREER_EXCEPTIONAL_COMPLETE',
        'CAREER_DOUBT'
      ],
      issue: 'CAREER_ISSUE',
      value: ''
    },
    identity: {
      archive: [{ code: 'ID_VALUE', label: '档案记载身份' }],
      appointment: '',
      conclusion: 'ID_COMPLETE',
      extras: ['ID_DOUBT', 'ID_ORG_CONFIRMED', 'ID_ORG_POLICY'],
      issue: 'ID_ISSUE',
      value: 'ID_VALUE'
    },
    nation: {
      archive: [],
      appointment: '',
      conclusion: 'NATION_CHANGED',
      extras: ['NATION_POLICY'],
      issue: 'NATION_ISSUE',
      value: ''
    },
    reward: {
      archive: [],
      appointment: '',
      conclusion: 'REWARD_ACCURATE',
      extras: ['REWARD_COMPLETE'],
      issue: 'REWARD_ISSUE',
      value: ''
    },
    family: {
      archive: [],
      appointment: '',
      conclusion: 'FAMILY_ACCURATE',
      extras: ['FAMILY_COMPLETE'],
      issue: 'FAMILY_ISSUE',
      value: ''
    },
    other: {
      archive: [],
      appointment: '',
      conclusion: '',
      extras: [],
      issue: 'OTHER_TEXT',
      value: ''
    }
  };

  const labels = {
    BIRTH_DOUBT: '真实性存疑',
    BIRTH_ALTERED: '内容涂改',
    BIRTH_MATERIAL_DOUBT: '材料真实性存疑',
    BIRTH_ORG_CONFIRMED: '组织是否认定',
    BIRTH_ORG_POLICY: '认定是否合规',
    WORK_COMPLETE: '材料齐全',
    WORK_DOUBT: '真实性存疑',
    WORK_ORG_CONFIRMED: '组织是否认定',
    WORK_ORG_POLICY: '认定是否合规',
    PARTY_COMPLETE: '材料齐全',
    PARTY_REFILL: '是否补填志愿书',
    PARTY_REFILL_POLICY: '补填是否合规',
    PARTY_REFILL_EVIDENCE: '证明是否齐全',
    PARTY_DOUBT: '真实性存疑',
    PARTY_ORG_CONFIRMED: '组织是否认定',
    PARTY_ORG_POLICY: '认定是否合规',
    EDU_COMPLETE: '材料齐全',
    EDU_TRAINING_AS_EDU: '培训当学历',
    EDU_LOW_AS_HIGH: '低学历填高',
    EDU_JOB_AS_FT: '在职填全日制',
    EDU_NONE_AS_DEGREE: '无学位填有',
    EDU_DOUBT: '真实性存疑',
    EDU_ORG_CONFIRMED: '组织是否认定',
    EDU_ORG_POLICY: '认定是否合规',
    CAREER_COMPLETE: '材料齐全',
    CAREER_RESUME: '履历材料',
    CAREER_APPOINT: '任免材料',
    CAREER_EXCEPTIONAL: '是否破格',
    CAREER_EXCEPTIONAL_COMPLETE: '破格材料齐全',
    CAREER_DOUBT: '真实性存疑',
    ID_DOUBT: '真实性存疑',
    ID_ORG_CONFIRMED: '组织是否认定',
    ID_ORG_POLICY: '认定是否合规',
    NATION_POLICY: '变更是否合规',
    REWARD_COMPLETE: '材料齐全',
    FAMILY_COMPLETE: '应填人员齐全'
  };

  const steps = [
    { key: 'initial_review', label: '初审' },
    { key: 'rectification', label: '整改' },
    { key: 'rectification_verify', label: '核验' },
    { key: 'certification', label: '认定' },
    { key: 'secondary_review', label: '复审' },
    { key: 'archiving', label: '归档' },
    { key: 'finished', label: '办结' }
  ];
  const stepOrder = steps.map((s) => s.key);

  const emptyItem = () => ({
    yn: '',
    archiveValue: '',
    appointmentValue: '',
    confirmedValue: ''
  });
  const itemOf = (code) => {
    if (!code) return emptyItem();
    return (
      (detail.value.items || []).find((i) => i.itemCode === code) || emptyItem()
    );
  };
  const specOf = (group) =>
    groupSpecs[group] || {
      archive: [],
      appointment: '',
      conclusion: '',
      extras: [],
      issue: '',
      value: '',
      complete: ''
    };
  const isInitial = computed(() =>
    ['draft', 'initial_review'].includes(detail.value.status)
  );
  const isClosed = computed(() =>
    ['finished', 'cancelled', 'suspended'].includes(detail.value.status)
  );
  const canSave = computed(
    () => isInitial.value || detail.value.status === 'certification'
  );
  const partyMember = computed(() => itemOf('PARTY_COMPLETE').yn !== 'na');
  const visibleGroups = computed(() =>
    groups.filter((g) => g.code !== 'party' || partyMember.value)
  );
  const certifyGroups = computed(() =>
    visibleGroups.value.filter((g) => specOf(g.code).value)
  );
  const openIssueCount = computed(
    () => (detail.value.issues || []).filter((i) => i.status === 'open').length
  );
  const statusLabel = (s) =>
    ({
      draft: '初审',
      initial_review: '初审',
      rectification: '整改',
      rectification_verify: '核验',
      certification: '认定',
      secondary_review: '复审',
      archiving: '归档',
      finished: '办结',
      suspended: '暂停',
      cancelled: '作废'
    })[s] || s;
  const statusType = (s) =>
    ({
      draft: 'info',
      initial_review: 'info',
      rectification: 'warning',
      rectification_verify: 'warning',
      certification: '',
      secondary_review: '',
      archiving: '',
      finished: 'success',
      suspended: 'danger'
    })[s] || 'info';
  const currentStep = computed(() =>
    detail.value.status === 'draft' ? 'initial_review' : detail.value.status
  );
  const stepClass = (key) => {
    const cur = stepOrder.indexOf(currentStep.value);
    const i = stepOrder.indexOf(key);
    if (currentStep.value === 'suspended' || currentStep.value === 'cancelled')
      return '';
    if (i < cur) {
      if (key === 'rectification' && detail.value.needRectify !== '1')
        return 'is-skip';
      if (key === 'rectification_verify' && detail.value.needRectify !== '1')
        return 'is-skip';
      if (key === 'certification' && detail.value.needCertify !== '1')
        return 'is-skip';
      return 'is-done';
    }
    if (i === cur) return 'is-on';
    return '';
  };
  const canReject = computed(() =>
    ['secondary_review', 'rectification_verify'].includes(detail.value.status)
  );
  const rejectPermission = computed(() =>
    detail.value.status === 'secondary_review'
      ? 'hrams:review:approve'
      : 'hrams:review:verify'
  );
  const primaryAction = computed(() => {
    if (isInitial.value && hasPerm('hrams:review:submit')) {
      return {
        label: '提交初审',
        permission: 'hrams:review:submit',
        run: submit
      };
    }
    if (
      detail.value.status === 'rectification' &&
      hasPerm('hrams:review:rectify')
    ) {
      return {
        label: '提交整改',
        permission: 'hrams:review:rectify',
        run: submitRectify
      };
    }
    if (
      detail.value.status === 'rectification_verify' &&
      hasPerm('hrams:review:verify')
    ) {
      return {
        label: '核验通过',
        permission: 'hrams:review:verify',
        run: () => verify(true)
      };
    }
    if (
      detail.value.status === 'certification' &&
      hasPerm('hrams:review:certify')
    ) {
      return {
        label: '提交认定',
        permission: 'hrams:review:certify',
        run: submitCertify
      };
    }
    if (
      detail.value.status === 'secondary_review' &&
      hasPerm('hrams:review:approve')
    ) {
      return {
        label: '复审通过',
        permission: 'hrams:review:approve',
        run: () => approve(true)
      };
    }
    if (detail.value.status === 'finished' && hasPerm('hrams:review:export')) {
      return {
        label: '导出正式件',
        permission: 'hrams:review:export',
        run: () => doExport('official')
      };
    }
    return null;
  });
  const groupLabel = (code) =>
    groups.find((g) => g.code === code)?.label || code;
  const labelOf = (code) => labels[code] || code;
  const ynText = (yn) => ({ yes: '是', no: '否', na: '不适用' })[yn] || '未核';
  const hasExtras = (group) => (specOf(group).extras || []).length > 0;
  const toggleExpand = (group) => {
    expandedGroups.value = {
      ...expandedGroups.value,
      [group]: !expandedGroups.value[group]
    };
  };
  const groupConclusion = (group) => {
    const yn = itemOf(specOf(group).conclusion).yn;
    if (yn === 'yes') return { text: '通过', type: 'success' };
    if (yn === 'no') return { text: '有差异', type: 'danger' };
    if (yn === 'na') return { text: '不适用', type: 'info' };
    if (itemOf(specOf(group).issue).archiveValue)
      return { text: '有问题', type: 'warning' };
    return { text: '未核', type: 'info' };
  };
  const appointmentText = (code) => {
    if (!code) return '';
    const item = itemOf(code);
    return item.appointmentValue || item.archiveValue || '';
  };
  const setAppointment = (code, val) => {
    if (!code) return;
    const item = itemOf(code);
    item.appointmentValue = val;
    item.archiveValue = val;
  };
  const archiveText = (group) =>
    specOf(group)
      .archive.map((c) => itemOf(c.code).archiveValue)
      .filter(Boolean)
      .join(' / ');
  const hasDiff = (group) => {
    const spec = specOf(group);
    if (!spec.appointment || !spec.archive.length) return false;
    return (
      archiveText(group) &&
      appointmentText(spec.appointment) &&
      archiveText(group) !== appointmentText(spec.appointment)
    );
  };

  const load = async () => {
    loading.value = true;
    ready.value = false;
    try {
      detail.value = await getReview(props.reviewId);
      detail.value.items = detail.value.items || [];
      detail.value.issues = detail.value.issues || [];
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    } finally {
      loading.value = false;
      ready.value = true;
    }
  };

  const payload = (withIssues = false) => ({
    id: detail.value.id,
    opinion: detail.value.opinion,
    certifyOpinion: detail.value.certifyOpinion,
    notifyUnit: detail.value.notifyUnit,
    notifyPerson: detail.value.notifyPerson,
    items: detail.value.items,
    issues: withIssues ? detail.value.issues : undefined
  });

  const save = (silent, withIssues = false) =>
    saveReview(payload(withIssues))
      .then(() => {
        if (!silent) EleMessage.success({ message: '已保存', plain: true });
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));

  const sync = () =>
    syncReviewSnapshot(detail.value.id)
      .then(load)
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));

  const submit = async () => {
    await saveReview(payload(true));
    submitReview(detail.value.id, detail.value.opinion)
      .then(() => {
        EleMessage.success({ message: '已提交', plain: true });
        load();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const submitRectify = async () => {
    const open = (detail.value.issues || []).filter((i) => i.status === 'open');
    for (const row of open) {
      if (!row.rectifyDesc || !row.rectifyOssId) {
        EleMessage.error({
          message: '每个未闭环问题都须填写说明并上传依据',
          plain: true
        });
        return;
      }
      await submitIssueRectify(
        detail.value.id,
        row.id,
        row.rectifyDesc,
        row.rectifyOssId
      );
    }
    submitReviewRectify(detail.value.id)
      .then(() => {
        EleMessage.success({ message: '已提交整改', plain: true });
        load();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const verify = (passed, message) =>
    verifyReviewRectify(detail.value.id, passed, message)
      .then(() => {
        EleMessage.success({
          message: passed ? '核验通过' : '已退回整改',
          plain: true
        });
        load();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));

  const submitCertify = async () => {
    await saveReview(payload());
    certifyReview(detail.value.id, {
      certifyOpinion: detail.value.certifyOpinion,
      notifyUnit: detail.value.notifyUnit,
      notifyPerson: detail.value.notifyPerson,
      items: detail.value.items
    })
      .then(() => {
        EleMessage.success({ message: '认定已提交', plain: true });
        load();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const approve = (passed, message) =>
    approveReview(detail.value.id, passed, message)
      .then(() => {
        EleMessage.success({
          message: passed ? '复审通过，待归档' : '已退回初审',
          plain: true
        });
        if (passed) {
          load();
          return;
        }
        emit('done');
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));

  const reject = () => {
    const title =
      detail.value.status === 'rectification_verify' ? '核验退回' : '复审退回';
    ElMessageBox.prompt('退回原因', title)
      .then(({ value }) => {
        if (detail.value.status === 'rectification_verify') {
          return verify(false, value);
        }
        return approve(false, value);
      })
      .catch(() => {});
  };

  const cancel = () =>
    ElMessageBox.confirm('确认作废？', '提示', { type: 'warning' })
      .then(() => cancelReview(detail.value.id).then(() => emit('done')))
      .catch(() => {});

  const suspend = () =>
    ElMessageBox.prompt('暂停原因', '涉嫌造假暂停')
      .then(({ value }) =>
        suspendReview(detail.value.id, value).then(() => {
          EleMessage.success({ message: '已暂停', plain: true });
          load();
        })
      )
      .catch(() => {});

  const doExport = (kind) =>
    exportReview(detail.value.id, kind).catch((e) =>
      EleMessage.error({ message: e.message, plain: true })
    );
  const doBlank = () =>
    exportAppointmentBlank(detail.value.id).catch((e) =>
      EleMessage.error({ message: e.message, plain: true })
    );
  const doArchive = ({ file }) =>
    archiveReview(detail.value.id, file)
      .then(() => {
        EleMessage.success({ message: '已签章归档', plain: true });
        pendingClose.value = true;
        openWriteback();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));

  const onMore = (cmd) => {
    if (cmd === 'save') return save(false, true);
    if (cmd === 'sync') return sync();
    if (cmd === 'suspend') return suspend();
    if (cmd === 'cancel') return cancel();
    if (cmd === 'draft') return doExport('draft');
    if (cmd === 'official') return doExport('official');
    if (cmd === 'blank') return doBlank();
    if (cmd === 'writeback') return openWriteback();
    if (cmd === 'maintain') return goMaintain();
    return undefined;
  };

  const closeIssue = (row) =>
    ElMessageBox.prompt('处理意见', '闭环问题')
      .then(({ value }) =>
        closeReviewIssue(detail.value.id, row.id, value).then(load)
      )
      .catch(() => {});

  const addIssue = async () => {
    if (!newIssue.value.desc) return;
    detail.value.issues = detail.value.issues || [];
    detail.value.issues.push({
      groupCode: newIssue.value.group,
      issueType: 'missing',
      description: newIssue.value.desc,
      status: 'open'
    });
    newIssue.value.desc = '';
    await save(true, true);
  };

  const uploadIssueFile = async (row, file) => {
    try {
      const oss = await uploadOss(file);
      row.rectifyOssId = oss.ossId;
      if (row.rectifyDesc) {
        await submitIssueRectify(
          detail.value.id,
          row.id,
          row.rectifyDesc,
          row.rectifyOssId
        );
      }
      EleMessage.success({ message: '依据已上传', plain: true });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const clearLeftPreview = () => {
    if (leftPreview.value.url) {
      URL.revokeObjectURL(leftPreview.value.url);
    }
    leftPreview.value = { kind: '', url: '' };
  };

  const preview = async (materialId) => {
    if (!materialId) return;
    try {
      const res = await previewReviewMaterial(detail.value.id, materialId);
      const type =
        res.headers?.['content-type'] ||
        res.data?.type ||
        'application/octet-stream';
      const url = URL.createObjectURL(new Blob([res.data], { type }));
      clearLeftPreview();
      if (/^image\//i.test(type)) {
        leftPreview.value = { kind: 'image', url };
        return;
      }
      if (/pdf/i.test(type)) {
        leftPreview.value = { kind: 'pdf', url };
        return;
      }
      URL.revokeObjectURL(url);
      EleMessage.error({ message: '该文件类型请下载后查看', plain: true });
    } catch (e) {
      EleMessage.error({ message: e.message, plain: true });
    }
  };

  const rebind = (row) => {
    if (!(detail.value.suggestedMaterials || []).length) {
      EleMessage.error({ message: '没有可重挂的建议材料', plain: true });
      return;
    }
    rebindRow.value = row;
    rebindTarget.value = null;
    rebindVisible.value = true;
  };

  const confirmRebind = () => {
    if (!rebindRow.value || !rebindTarget.value) {
      EleMessage.error({ message: '请选择材料', plain: true });
      return;
    }
    rebindReviewEvidence(
      detail.value.id,
      rebindRow.value.id,
      rebindTarget.value
    )
      .then(() => {
        EleMessage.success({ message: '已重挂', plain: true });
        rebindVisible.value = false;
        load();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const goMaintain = () => {
    router.push({
      path: HRAMS_MATERIAL_MAINTAIN_PATH,
      query: {
        personId: String(detail.value.personId),
        reviewId: String(detail.value.id),
        name: detail.value.personName || ''
      }
    });
  };

  const openWriteback = () => {
    writebackPreview(detail.value.id)
      .then((rows) => {
        writebackRows.value = rows;
        selectedFields.value = [];
        writebackVisible.value = true;
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
        if (pendingClose.value) emit('done');
      });
  };

  const onWbSel = (rows) => {
    selectedFields.value = rows.map((r) => r.field);
  };

  const doWriteback = () => {
    if (!selectedFields.value.length) {
      EleMessage.error({ message: '请勾选要回写的字段', plain: true });
      return;
    }
    writebackReview(detail.value.id, selectedFields.value)
      .then(() => {
        EleMessage.success({ message: '已回写', plain: true });
        writebackVisible.value = false;
        if (pendingClose.value) emit('done');
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const skipWriteback = () => {
    writebackVisible.value = false;
    if (pendingClose.value) emit('done');
  };

  watch(
    () => [
      detail.value.items,
      detail.value.opinion,
      detail.value.certifyOpinion
    ],
    () => {
      if (!ready.value || !canSave.value) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => save(true), 1600);
    },
    { deep: true }
  );

  onMounted(load);
  onUnmounted(() => {
    clearTimeout(saveTimer);
    clearLeftPreview();
  });
</script>

<style scoped>
  .review-workspace {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    gap: 8px;
    overflow: hidden;
  }

  .review-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    min-height: 36px;
  }

  .review-id {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .review-name {
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
  }

  .review-meta {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: #6c7e97;
  }

  .review-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
  }

  .review-steps {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-x: auto;
  }

  .review-steps li {
    padding: 4px 10px;
    border-radius: 12px;
    background: #f3f5f8;
    color: #6c7e97;
    font-size: 12px;
    white-space: nowrap;
  }

  .review-steps li.is-on {
    background: #2c6e9e;
    color: #fff;
  }

  .review-steps li.is-done {
    background: #e8f4ee;
    color: #2f7d57;
  }

  .review-steps li.is-skip {
    text-decoration: line-through;
  }

  .review-alert {
    flex-shrink: 0;
  }

  .review-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(360px, 1fr) minmax(400px, 1fr);
    gap: 12px;
    overflow: hidden;
  }

  .review-left,
  .review-right {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .review-right {
    overflow: auto;
    padding-right: 4px;
  }

  .material-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-bottom: 6px;
  }

  .material-switch button {
    height: 28px;
    padding: 0 10px;
    border: 1px solid #eef2f8;
    border-radius: 14px;
    background: #fff;
    color: #6c7e97;
    cursor: pointer;
  }

  .material-switch button.on {
    border-color: #2c6e9e;
    color: #2c6e9e;
    background: #f3f8fc;
  }

  .career-line {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: #6c7e97;
  }

  .preview-pane {
    flex: 1;
    min-height: 0;
    margin-top: 8px;
    border: 1px solid #eef2f8;
    border-radius: 12px;
    overflow: hidden;
    background: #f7f8fa;
  }

  .preview-frame,
  .preview-img {
    width: 100%;
    height: 100%;
    border: 0;
    object-fit: contain;
  }

  .preview-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 12px;
    border: 1px dashed #d5deea;
    border-radius: 8px;
    color: #6c7e97;
    font-size: 13px;
    background: #fff;
  }

  .group-card {
    margin-bottom: 10px;
    padding: 10px 12px;
    border: 1px solid #eef2f8;
    border-radius: 12px;
    background: #fff;
  }

  .group-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .quad {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .quad label {
    display: block;
    font-size: 12px;
    color: #6c7e97;
  }

  .quad .el-input,
  .quad .el-radio-group,
  .mini-yn {
    margin-top: 4px;
    width: 100%;
  }

  .mini-yn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  .hint {
    margin: 0 0 8px;
    font-size: 12px;
    color: #6c7e97;
  }

  .extra-list {
    margin-top: 8px;
  }

  .review-field.is-yn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 6px;
  }

  .review-field-label {
    font-size: 13px;
    color: #6c7e97;
  }

  .certify-row {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .notify-row {
    display: flex;
    gap: 16px;
    margin-top: 8px;
  }

  .readonly-grid {
    display: grid;
    gap: 4px;
    font-size: 13px;
    color: #1f2d3d;
  }

  @media (max-width: 1100px) {
    .review-body {
      grid-template-columns: minmax(300px, 1fr) minmax(320px, 1fr);
    }

    .quad {
      grid-template-columns: 1fr;
    }
  }
</style>
