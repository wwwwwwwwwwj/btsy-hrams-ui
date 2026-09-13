<template>
  <ele-page hide-footer flex-table="auto">
    <div v-if="currentId" class="hrams-v2-page review-page">
      <review-detail
        :review-id="currentId"
        @done="onDetailDone"
        @back="closeDetail"
      />
    </div>
    <div v-else class="hrams-v2-page">
      <div class="review-stats">
        <button
          v-for="tab in workspaceTabs"
          :key="tab.value"
          type="button"
          class="review-stat"
          :class="{ 'is-active': workspace === tab.value }"
          @click="switchWorkspace(tab.value)"
        >
          <span class="review-stat-label">{{ tab.label }}</span>
          <strong class="review-stat-num">{{
            workspaceCount(tab.value)
          }}</strong>
          <span class="review-stat-hint">{{ tab.hint }}</span>
        </button>
      </div>

      <template v-if="workspace !== 'batch'">
        <div class="hrams-v2-card hrams-v2-filter">
          <el-form
            :inline="true"
            :model="where"
            class="ele-form-search"
            @submit.prevent="reloadList"
          >
            <el-form-item v-if="workspace === 'all'" label="节点">
              <el-select
                v-model="active"
                clearable
                placeholder="全部节点"
                style="width: 160px"
                @change="reloadList"
              >
                <el-option
                  v-for="tab in statusTabs"
                  :key="tab.value || 'all'"
                  :label="tab.label"
                  :value="tab.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="姓名">
              <el-input
                v-model="where.personName"
                clearable
                placeholder="姓名"
                @keyup.enter="reloadList"
              />
            </el-form-item>
            <el-form-item label="档案编号">
              <el-input
                v-model="where.archiveNo"
                clearable
                placeholder="档案编号"
                @keyup.enter="reloadList"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="reloadList">查询</el-button>
              <el-button @click="resetWhere">重置</el-button>
              <el-button
                type="primary"
                v-permission="'hrams:review:add'"
                @click="openCreate"
                >建单</el-button
              >
            </el-form-item>
          </el-form>
        </div>
        <div class="hrams-v2-card hrams-v2-table-card">
          <ele-pro-table
            ref="tableRef"
            row-key="id"
            :columns="columns"
            :datasource="datasource"
          >
            <template #status="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{
                statusLabel(row.status)
              }}</el-tag>
            </template>
            <template #action="{ row }">
              <el-button link type="primary" @click="openDetail(row.id)">{{
                row.nextAction || nextAction(row.status)
              }}</el-button>
              <el-button
                v-if="row.status === 'finished'"
                link
                type="primary"
                v-permission="'hrams:review:export'"
                @click="act(() => exportReview(row.id, 'official'))"
                >导出正式件</el-button
              >
            </template>
          </ele-pro-table>
        </div>
      </template>

      <template v-else>
        <div class="hrams-v2-card hrams-v2-table-card">
          <div class="hrams-v2-card-toolbar">
            <el-button
              type="primary"
              v-permission="'hrams:review:add'"
              @click="openBatch"
              >新建批次</el-button
            >
          </div>
          <ele-pro-table
            ref="batchTableRef"
            row-key="id"
            :columns="batchColumns"
            :datasource="batchDatasource"
          >
            <template #action="{ row }">
              <el-button link type="primary" @click="openBatchDetail(row.id)"
                >进度</el-button
              >
              <el-button
                link
                type="primary"
                v-permission="'hrams:review:add'"
                @click="
                  act(() =>
                    generateReviewBatch(row.id).then((n) =>
                      EleMessage.success(`已建${n}单`)
                    )
                  )
                "
                >批量建单</el-button
              >
            </template>
          </ele-pro-table>
        </div>
      </template>
    </div>

    <el-dialog v-model="createVisible" title="新建专项审核" width="480px">
      <el-form label-width="90px">
        <el-form-item label="人员" required>
          <el-select
            v-model="createForm.personId"
            filterable
            remote
            :remote-method="searchPerson"
            :loading="lookupLoading"
            style="width: 100%"
          >
            <el-option
              v-for="p in personOptions"
              :key="String(p.id)"
              :label="personLabel(p)"
              :value="String(p.id)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="createForm.reviewType" style="width: 100%">
            <el-option label="日常任前" value="pre_appointment" />
            <el-option label="专项" value="special" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="doCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchVisible" title="新建专项批次" width="480px">
      <el-form label-width="90px">
        <el-form-item label="批次名称" required>
          <el-input v-model="batchForm.batchName" />
        </el-form-item>
        <el-form-item label="起止">
          <el-date-picker
            v-model="batchRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始"
            end-placeholder="结束"
          />
        </el-form-item>
        <el-form-item label="范围人员">
          <el-select
            v-model="batchForm.personIds"
            multiple
            filterable
            remote
            :remote-method="searchPerson"
            :loading="lookupLoading"
            style="width: 100%"
            placeholder="不选则按可见人员"
          >
            <el-option
              v-for="p in personOptions"
              :key="String(p.id)"
              :label="personLabel(p)"
              :value="String(p.id)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="batchForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="doCreateBatch">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDetailVisible" title="批次进度" width="720px">
      <p
        >应审 {{ batchDetail.expectedCount || 0 }}，已建
        {{ batchDetail.createdCount || 0 }}，已办结
        {{ batchDetail.finishedCount || 0 }}，未审
        {{ batchDetail.pendingPersons?.length || 0 }}</p
      >
      <el-table
        :data="batchDetail.pendingPersons || []"
        size="small"
        max-height="360"
      >
        <el-table-column prop="archiveNo" label="档案号" width="120" />
        <el-table-column prop="personName" label="姓名" width="100" />
        <el-table-column prop="deptName" label="单位" min-width="140" />
        <el-table-column label="履历" width="110">
          <template #default="{ row }">
            <el-tag
              v-if="row.careerStructured === false"
              type="warning"
              size="small"
              >履历未结构化</el-tag
            >
            <span v-else>已结构化</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchDetailVisible = false">关闭</el-button>
        <el-button
          type="primary"
          v-permission="'hrams:review:add'"
          @click="doGenerateCurrent"
          >批量建单</el-button
        >
      </template>
    </el-dialog>
  </ele-page>
</template>

<script setup>
  import { onActivated, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import {
    pageReview,
    createReview,
    exportReview,
    searchReviewPersons,
    pageReviewBatch,
    createReviewBatch,
    generateReviewBatch,
    getReviewBatch
  } from '@/api/hrams/review';
  import ReviewDetail from './components/review-detail.vue';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsSpecialReview' });

  const route = useRoute();
  const workspace = ref('mine');
  const active = ref('');
  const tableRef = ref(null);
  const batchTableRef = ref(null);
  const createVisible = ref(false);
  const batchVisible = ref(false);
  const currentId = ref(null);
  const lookupLoading = ref(false);
  const personOptions = ref([]);
  const createForm = ref({ personId: null, reviewType: 'pre_appointment' });
  const batchForm = ref({ batchName: '', remark: '', personIds: [] });
  const batchRange = ref([]);
  const batchDetailVisible = ref(false);
  const batchDetail = ref({ pendingPersons: [] });
  const currentBatchId = ref(null);
  const where = ref({ personName: '', archiveNo: '' });
  const batchTotal = ref(0);
  const mineTotal = ref(0);
  const createdTotal = ref(0);
  const allTotal = ref(0);

  const workspaceTabs = [
    { value: 'mine', label: '我的待办', hint: '当前节点待办理' },
    { value: 'created', label: '我发起的', hint: '本人建单' },
    { value: 'all', label: '全部任务', hint: '按节点查看' },
    { value: 'batch', label: '批次管理', hint: '批量建单与进度' }
  ];

  const statusTabs = [
    { value: '', label: '全部' },
    { value: 'initial_review', label: '初审' },
    { value: 'rectification', label: '整改' },
    { value: 'rectification_verify', label: '核验' },
    { value: 'certification', label: '认定' },
    { value: 'secondary_review', label: '复审' },
    { value: 'archiving', label: '归档' },
    { value: 'finished', label: '办结' },
    { value: 'suspended', label: '暂停' }
  ];

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
      suspended: 'danger',
      cancelled: 'info'
    })[s] || 'info';

  const nextAction = (s) =>
    ({
      draft: '初审',
      initial_review: '初审',
      rectification: '整改',
      rectification_verify: '核验',
      certification: '认定',
      secondary_review: '复审',
      archiving: '归档',
      finished: '查看',
      suspended: '查看',
      cancelled: '查看'
    })[s] || '查看';

  const columns = [
    { prop: 'personName', label: '姓名', width: 100 },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'deptName', label: '单位', minWidth: 160 },
    { prop: 'reviewNo', label: '单号', minWidth: 160 },
    { prop: 'status', label: '当前节点', width: 90, slot: 'status' },
    { prop: 'assigneeName', label: '办理人', width: 100 },
    { prop: 'initialReviewerName', label: '初审人', width: 100 },
    {
      columnKey: 'action',
      label: '下一步',
      width: 160,
      slot: 'action',
      fixed: 'right'
    }
  ];

  const batchColumns = [
    { prop: 'batchName', label: '批次', minWidth: 160 },
    { prop: 'expectedCount', label: '应审', width: 80 },
    { prop: 'createdCount', label: '已建', width: 80 },
    { prop: 'finishedCount', label: '已办结', width: 90 },
    {
      columnKey: 'action',
      label: '操作',
      width: 160,
      slot: 'action',
      fixed: 'right'
    }
  ];

  const workspaceParam = () => {
    if (workspace.value === 'mine') return 'mine';
    if (workspace.value === 'created') return 'created';
    return undefined;
  };

  const datasource = ({ pages }) =>
    pageReview({
      workspace: workspaceParam(),
      status: workspace.value === 'all' ? active.value || undefined : undefined,
      personName: where.value.personName || undefined,
      archiveNo: where.value.archiveNo || undefined,
      ...pages
    }).then((res) => {
      const total = Number(res.total || 0);
      if (workspace.value === 'mine') mineTotal.value = total;
      if (workspace.value === 'created') createdTotal.value = total;
      if (workspace.value === 'all') allTotal.value = total;
      return res;
    });

  const batchDatasource = ({ pages }) =>
    pageReviewBatch(pages).then((res) => {
      batchTotal.value = Number(res.total || 0);
      return res;
    });

  const workspaceCount = (key) => {
    if (key === 'mine') return mineTotal.value;
    if (key === 'created') return createdTotal.value;
    if (key === 'all') return allTotal.value;
    return batchTotal.value;
  };

  const loadStats = () => {
    pageReview({ workspace: 'mine', pageNum: 1, pageSize: 1 })
      .then((res) => {
        mineTotal.value = Number(res.total || 0);
      })
      .catch(() => {});
    pageReview({ workspace: 'created', pageNum: 1, pageSize: 1 })
      .then((res) => {
        createdTotal.value = Number(res.total || 0);
      })
      .catch(() => {});
    pageReview({ pageNum: 1, pageSize: 1 })
      .then((res) => {
        allTotal.value = Number(res.total || 0);
      })
      .catch(() => {});
    pageReviewBatch({ pageNum: 1, pageSize: 1 })
      .then((res) => {
        batchTotal.value = Number(res.total || 0);
      })
      .catch(() => {});
  };

  const reloadList = () => tableRef.value?.reload?.({ page: 1 });
  const resetWhere = () => {
    where.value = { personName: '', archiveNo: '' };
    if (workspace.value === 'all') active.value = '';
    reloadList();
  };

  const reload = () => {
    loadStats();
    if (workspace.value === 'batch') {
      batchTableRef.value?.reload?.();
      return;
    }
    tableRef.value?.reload?.();
  };

  const switchWorkspace = (value) => {
    workspace.value = value;
    if (value === 'batch') {
      batchTableRef.value?.reload?.();
      return;
    }
    reloadList();
  };

  const act = (fn) =>
    fn()
      .then(() => {
        EleMessage.success({ message: '已处理', plain: true });
        reload();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));

  const personLabel = (p) =>
    [p.archiveNo, p.name].filter(Boolean).join(' ') || String(p.id || '');

  const queryPersonId = () => {
    const raw = route.query.personId;
    if (raw == null || String(raw).trim() === '') return '';
    return String(raw);
  };

  const seedQueryPerson = () => {
    const id = queryPersonId();
    if (!id) return;
    const name = route.query.name ? String(route.query.name) : '';
    const archiveNo = route.query.archiveNo
      ? String(route.query.archiveNo)
      : '';
    if (name || archiveNo) {
      personOptions.value = [{ id, name, archiveNo }];
    }
  };

  const openCreate = () => {
    const id = queryPersonId();
    createForm.value = { personId: id || null, reviewType: 'pre_appointment' };
    seedQueryPerson();
    createVisible.value = true;
    if (route.query.name) {
      searchPerson(String(route.query.name));
    }
  };

  const searchPerson = (q) => {
    lookupLoading.value = true;
    const seeded = personOptions.value.slice();
    searchReviewPersons({ name: q })
      .then((list) => {
        const rows = (list || []).map((p) => ({ ...p, id: String(p.id) }));
        const id = queryPersonId();
        if (
          id &&
          !rows.some((p) => p.id === id) &&
          seeded.some((p) => String(p.id) === id)
        ) {
          rows.unshift(seeded.find((p) => String(p.id) === id));
        }
        personOptions.value = rows;
      })
      .finally(() => {
        lookupLoading.value = false;
      });
  };

  const doCreate = () => {
    if (!createForm.value.personId) {
      EleMessage.error({ message: '请选择人员', plain: true });
      return;
    }
    createReview(createForm.value)
      .then((id) => {
        createVisible.value = false;
        currentId.value = id;
        reload();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const openDetail = (id) => {
    currentId.value = id;
  };

  const closeDetail = () => {
    currentId.value = null;
    reload();
  };

  const onDetailDone = () => {
    currentId.value = null;
    reload();
  };

  const openBatch = () => {
    batchForm.value = { batchName: '', remark: '', personIds: [] };
    batchRange.value = [];
    batchVisible.value = true;
  };

  const doCreateBatch = () => {
    if (!batchForm.value.batchName) return;
    createReviewBatch({
      batchName: batchForm.value.batchName,
      remark: batchForm.value.remark,
      startTime: batchRange.value?.[0] || null,
      endTime: batchRange.value?.[1] || null,
      scopeJson: batchForm.value.personIds?.length
        ? JSON.stringify({ personIds: batchForm.value.personIds })
        : null
    })
      .then(() => {
        batchVisible.value = false;
        reload();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const openBatchDetail = (id) => {
    currentBatchId.value = id;
    getReviewBatch(id)
      .then((d) => {
        batchDetail.value = d || { pendingPersons: [] };
        batchDetailVisible.value = true;
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const doGenerateCurrent = () => {
    if (!currentBatchId.value) return;
    generateReviewBatch(currentBatchId.value)
      .then((n) => {
        EleMessage.success({ message: `已建${n}单`, plain: true });
        openBatchDetail(currentBatchId.value);
        reload();
      })
      .catch((e) => EleMessage.error({ message: e.message, plain: true }));
  };

  const openExistingOrCreate = async () => {
    try {
      const res = await pageReview({
        personId: route.query.personId,
        pageNum: 1,
        pageSize: 10
      });
      const rows = res.rows || [];
      const open = rows.find(
        (r) => !['finished', 'cancelled'].includes(r.status)
      );
      if (open) {
        openDetail(open.id);
        return;
      }
    } catch {
      /* 查不到则走建单 */
    }
    openCreate();
  };

  onMounted(() => {
    loadStats();
    if (route.query.reviewId) {
      openDetail(route.query.reviewId);
      return;
    }
    if (route.query.personId) {
      openExistingOrCreate();
    }
  });
  onActivated(reload);
</script>

<style scoped>
  .review-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding-bottom: 0;
  }

  .review-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .review-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 14px 16px;
    border: 1px solid #eef2f8;
    border-radius: 16px;
    background: #fff;
    text-align: left;
    cursor: pointer;
  }

  .review-stat.is-active {
    border-color: #2c6e9e;
    box-shadow: 0 0 0 1px #2c6e9e inset;
  }

  .review-stat-label {
    font-size: 13px;
    color: #6c7e97;
  }

  .review-stat-num {
    font-size: 24px;
    line-height: 1.2;
    color: #1f2d3d;
  }

  .review-stat-hint {
    font-size: 12px;
    color: #98a6b8;
  }

  @media (max-width: 1100px) {
    .review-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
