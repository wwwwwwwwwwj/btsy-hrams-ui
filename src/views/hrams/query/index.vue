<template>
  <ele-page hide-footer flex-table="auto">
    <ele-card bordered>
      <el-tabs v-model="tab">
        <el-tab-pane label="人员档案查询" name="person">
          <el-form :inline="true" :model="where" class="ele-form-search">
            <el-form-item label="档案编号"><el-input v-model="where.archiveNo" clearable /></el-form-item>
            <el-form-item label="姓名"><el-input v-model="where.name" clearable /></el-form-item>
            <el-form-item label="性别"><el-select v-model="where.gender" clearable><el-option label="男" value="男" /><el-option label="女" value="女" /></el-select></el-form-item>
            <el-form-item label="出生年月"><el-date-picker v-model="where.birthDate" type="month" value-format="YYYY-MM-DD" /></el-form-item>
            <el-form-item label="年龄"><el-input-number v-model="where.age" :min="0" :max="120" controls-position="right" /></el-form-item>
            <el-form-item label="民族"><el-input v-model="where.nation" clearable /></el-form-item>
            <el-form-item label="政治面貌"><el-input v-model="where.politicalStatus" clearable /></el-form-item>
            <el-form-item label="学历"><el-input v-model="where.education" clearable /></el-form-item>
            <el-form-item label="身份证"><el-input v-model="where.idCard" clearable /></el-form-item>
            <el-form-item label="状态"><el-select v-model="where.status" clearable><el-option label="在职" value="在职" /><el-option label="离职" value="离职" /><el-option label="退休" value="退休" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" @click="reload(where, 1)">查询</el-button><el-button @click="resetWhere">重置</el-button></el-form-item>
          </el-form>
          <ele-pro-table ref="tableRef" row-key="id" :columns="columns" :datasource="datasource">
            <template #action="{ row }"><el-button link type="primary" @click="showDetail(row)">查看详情</el-button></template>
          </ele-pro-table>
        </el-tab-pane>
        <el-tab-pane label="全文检索" name="fulltext">
          <el-input v-model="keyword" placeholder="关键字" style="max-width:360px" />
          <el-button type="primary" style="margin-left:8px" @click="doFulltext">检索</el-button>
          <el-button v-permission="'hrams:search:reindex'" style="margin-left:8px" @click="doReindex">重建索引</el-button>
          <el-tag v-if="ftData" style="margin-left:8px" :type="ftData.esEnabled ? 'success' : 'info'">
            {{ ftData.esEnabled ? 'ES 已启用' : 'Tika+库内正文' }}
          </el-tag>
          <el-alert v-if="ftHint" :title="ftHint" type="info" show-icon style="margin:12px 0" />
          <div v-if="ftData" class="ft-panels">
            <div class="ft-panel">
              <div class="panel-title">1. 人员及大类汇总</div>
              <div v-for="(p, idx) in ftData.personSummaries" :key="idx" :class="['ft-item', ftPersonIdx === idx ? 'active' : '']" @click="selectPerson(idx)">
                档案编号 {{ p.archiveNo }} {{ p.personName }} — {{ p.total }} 条
                <el-button v-if="ftPersonIdx === idx" link type="primary" size="small" @click.stop="expandCategories">更多</el-button>
              </div>
            </div>
            <div v-show="ftPersonIdx != null" class="ft-panel">
              <div class="panel-title">2. 匹配大类</div>
              <div v-if="!ftCategories.length" class="empty">该人员无匹配大类</div>
              <div v-for="c in ftCategories" :key="c.categoryCode" :class="['ft-item', ftCat === c.categoryCode ? 'active' : '']" @click="selectCategory(c.categoryCode)">
                {{ c.categoryName }} ({{ c.count }})
                <el-button v-if="ftCat === c.categoryCode" link type="primary" size="small">更多</el-button>
              </div>
            </div>
            <div v-show="ftCat" class="ft-panel">
              <div class="panel-title">3. 匹配内容</div>
              <div v-for="(s, i) in ftSnippets" :key="i" class="snippet">
                <span class="kw">{{ keyword }}</span> {{ s.text }}
                <el-button v-if="s.materialId" link type="primary" @click="previewMaterial(s.materialId)">查看详情</el-button>
              </div>
              <div v-if="!ftSnippets.length" class="empty">请选择左侧人员与大类</div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="智能问答" name="qa">
          <el-input v-model="qaQuestion" type="textarea" :rows="3" placeholder="例如：当前在职干部多少人？借阅中有多少？" style="max-width:560px" />
          <div style="margin-top:8px">
            <el-button type="primary" v-permission="'hrams:qa:chat'" @click="doQa">提问</el-button>
          </div>
          <el-card v-if="qaAnswer" shadow="never" style="margin-top:16px;max-width:560px">
            <div class="qa-answer">{{ qaAnswer }}</div>
            <div v-if="qaSource" class="qa-source">来源：{{ qaSource }}</div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </ele-card>
    <el-drawer v-model="drawer" title="档案详情" size="58%">
      <template v-if="detail.person">
        <div class="drawer-actions">
          <el-button type="primary" link @click="goMaterialMaintain">材料维护（上传/编辑）</el-button>
        </div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="档案编号">{{ detail.person.archiveNo }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ detail.person.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ detail.person.gender }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.person.status }}</el-descriptions-item>
        </el-descriptions>
        <el-row :gutter="12" style="margin-top:16px">
          <el-col :span="8">
            <el-menu :default-active="detailCat" @select="(c) => { detailCat = c; filterDetailMaterials(); }">
              <el-menu-item v-for="c in flatCats" :key="c.code" :index="c.code">{{ c.name }} ({{ c.fileCount || 0 }})</el-menu-item>
            </el-menu>
          </el-col>
          <el-col :span="16">
            <el-table :data="detailMaterials" size="small">
              <el-table-column prop="displayNo" label="序号" width="90" />
              <el-table-column prop="materialName" label="材料名称" />
              <el-table-column prop="formDate" label="形成时间" width="110" />
              <el-table-column prop="pageCount" label="页数" width="70" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button v-if="row.fileStatus === 'uploaded'" link @click="previewMaterial(row.id)">预览</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </template>
    </el-drawer>
  </ele-page>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { pageQueryPerson, getQueryPersonDetail, fulltextSearch, reindexFulltext, qaChat } from '@/api/hrams/query';
  import { previewMaterial } from '@/api/hrams/archive';

  defineOptions({ name: 'HramsQuery' });
  const router = useRouter();
  const tab = ref('person');
  const tableRef = ref(null);
  const where = ref({});
  const keyword = ref('');
  const qaQuestion = ref('');
  const qaAnswer = ref('');
  const qaSource = ref('');
  const ftHint = ref('');
  const ftData = ref(null);
  const ftPersonIdx = ref(null);
  const ftCat = ref(null);
  const drawer = ref(false);
  const detail = ref({});
  const detailCat = ref('1');
  const detailMaterials = ref([]);

  const flatCats = computed(() => {
    const list = [];
    const walk = (nodes) => (nodes || []).forEach((n) => { list.push(n); if (n.children?.length) walk(n.children); });
    walk(detail.value.categories);
    return list;
  });

  const ftCategories = computed(() => {
    if (ftPersonIdx.value == null || !ftData.value?.personSummaries?.length) return [];
    return ftData.value.personSummaries[ftPersonIdx.value].categories || [];
  });

  const ftSnippets = computed(() => {
    if (!ftData.value?.snippets) return [];
    return ftData.value.snippets.filter((s) => {
      if (ftPersonIdx.value != null && s.personIndex !== ftPersonIdx.value) return false;
      if (ftCat.value && s.categoryCode !== ftCat.value) return false;
      return true;
    });
  });

  const columns = ref([
    { type: 'index', width: 50 },
    { prop: 'archiveNo', label: '档案编号', minWidth: 120 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'gender', label: '性别', width: 70 },
    { prop: 'birthDate', label: '出生年月', minWidth: 110 },
    { prop: 'age', label: '年龄', width: 70 },
    { prop: 'nation', label: '民族', width: 80 },
    { prop: 'education', label: '学历', minWidth: 90 },
    { prop: 'status', label: '状态', width: 90 },
    { columnKey: 'action', label: '操作', width: 110, slot: 'action' }
  ]);

  const datasource = ({ pages, where: w }) => pageQueryPerson({ ...w, ...pages });
  const reload = (w, page) => tableRef.value?.reload?.({ where: w, page });
  const resetWhere = () => { where.value = {}; reload(where.value, 1); };

  const filterDetailMaterials = () => {
    detailMaterials.value = (detail.value.materials || []).filter((m) => m.categoryCode === detailCat.value);
  };

  const showDetail = async (row) => {
    detail.value = await getQueryPersonDetail(row.id);
    detailCat.value = flatCats.value[0]?.code || '1';
    filterDetailMaterials();
    drawer.value = true;
  };

  const selectPerson = (idx) => {
    ftPersonIdx.value = idx;
    const cats = ftData.value?.personSummaries?.[idx]?.categories || [];
    ftCat.value = cats.length ? cats[0].categoryCode : null;
  };

  const expandCategories = () => {
    const cats = ftCategories.value;
    if (cats.length && !ftCat.value) {
      ftCat.value = cats[0].categoryCode;
    }
  };

  const selectCategory = (code) => { ftCat.value = code; };

  const goMaterialMaintain = () => {
    const p = detail.value.person;
    if (!p?.id) return;
    router.push({
      path: '/hrams/archive/material',
      query: { personId: p.id, archiveNo: p.archiveNo, name: p.name }
    });
  };

  const doReindex = async () => {
    await reindexFulltext();
    EleMessage.success({ message: '索引重建任务已提交', plain: true });
  };

  const doQa = async () => {
    const data = await qaChat(qaQuestion.value);
    qaAnswer.value = data.answer || '';
    qaSource.value = data.source || '';
  };

  const doFulltext = async () => {
    const data = await fulltextSearch(keyword.value);
    ftHint.value = data.message || '';
    ftData.value = data;
    if (data.personSummaries?.length) {
      selectPerson(0);
    } else {
      ftPersonIdx.value = null;
      ftCat.value = null;
    }
    if (!data.personSummaries?.length) {
      EleMessage.info({ message: ftHint.value || '暂无检索结果', plain: true });
    }
  };
</script>

<style scoped>
  .ft-panels { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 12px; min-height: 320px; }
  .ft-panel { border: 1px solid #eef2f8; border-radius: 12px; padding: 12px; background: #fff; }
  .panel-title { font-weight: 600; margin-bottom: 12px; }
  .ft-item { padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; margin-bottom: 6px; }
  .ft-item.active { background: #ecf5fc; color: #1e6f9f; }
  .snippet { font-size: 13px; line-height: 1.6; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #eee; }
  .kw { color: #c0392b; font-weight: 600; }
  .empty { color: #999; font-size: 13px; padding: 16px; }
  .drawer-actions { margin-bottom: 12px; }
  .qa-answer { line-height: 1.7; font-size: 14px; }
  .qa-source { margin-top: 8px; font-size: 12px; color: #888; }
</style>
