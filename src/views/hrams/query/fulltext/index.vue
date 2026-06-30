<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-card ft-toolbar">
        <el-input v-model="keyword" placeholder="关键字" style="max-width:360px" @keyup.enter="doFulltext" />
        <el-button type="primary" :loading="loading" v-permission="'hrams:search:fulltext'" @click="doFulltext">检索</el-button>
        <el-tag v-if="ftData" :type="ftData.esEnabled ? 'success' : 'info'">
          {{ ftData.esEnabled ? 'ES 已启用' : 'Tika+库内正文' }}
        </el-tag>
      </div>
      <el-alert v-if="ftHint" :title="ftHint" type="info" show-icon class="ft-alert" />
      <div v-if="ftData" class="ft-panels hrams-v2-card">
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
          </div>
        </div>
        <div v-show="ftCat" class="ft-panel">
          <div class="panel-title">3. 匹配内容</div>
          <div v-for="(s, i) in ftSnippets" :key="i" class="snippet">
            <span class="snippet-text" v-html="snippetHtml(s)" />
            <el-button v-if="s.materialId" link type="primary" @click="previewMaterial(s.materialId)">查看详情</el-button>
          </div>
          <div v-if="!ftSnippets.length" class="empty">请选择左侧人员与大类</div>
        </div>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { fulltextSearch } from '@/api/hrams/query';
  import { previewMaterial } from '@/api/hrams/archive';
  import { sanitizeHighlightHtml } from '@/utils/highlight-snippet';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsQueryFulltext' });
  const route = useRoute();
  const keyword = ref('');
  const ftHint = ref('');
  const ftData = ref(null);
  const ftPersonIdx = ref(null);
  const ftCat = ref(null);
  const loading = ref(false);

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

  const snippetHtml = (s) => {
    const raw = s.text || '';
    if (/<em>|<mark>/i.test(raw)) {
      return sanitizeHighlightHtml(raw);
    }
    const kw = keyword.value;
    if (!kw) return sanitizeHighlightHtml(raw);
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlighted = raw.replace(new RegExp(escaped, 'gi'), (m) => `<em>${m}</em>`);
    return sanitizeHighlightHtml(highlighted);
  };

  const selectPerson = (idx) => {
    ftPersonIdx.value = idx;
    const cats = ftData.value?.personSummaries?.[idx]?.categories || [];
    ftCat.value = cats.length ? cats[0].categoryCode : null;
  };

  const expandCategories = () => {
    const cats = ftCategories.value;
    if (cats.length && !ftCat.value) ftCat.value = cats[0].categoryCode;
  };

  const selectCategory = (code) => { ftCat.value = code; };

  const doFulltext = async () => {
    if (!keyword.value?.trim()) {
      EleMessage.warning({ message: '请输入关键字', plain: true });
      return;
    }
    loading.value = true;
    try {
      const data = await fulltextSearch(keyword.value);
      ftHint.value = data.message || '';
      ftData.value = data;
      if (data.personSummaries?.length) {
        const pid = route.query.personId;
        if (pid) {
          const idx = data.personSummaries.findIndex((p) => String(p.personId) === String(pid));
          if (idx >= 0) {
            selectPerson(idx);
          } else {
            ftPersonIdx.value = null;
            ftCat.value = null;
            EleMessage.warning({ message: '未在检索结果中找到指定人员', plain: true });
          }
        } else {
          selectPerson(0);
        }
      } else {
        ftPersonIdx.value = null;
        ftCat.value = null;
        EleMessage.info({ message: ftHint.value || '暂无检索结果', plain: true });
      }
    } catch (e) {
      EleMessage.error({ message: e.message || '检索失败', plain: true });
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    const kw = route.query.keyword;
    if (kw) {
      keyword.value = String(kw);
      doFulltext();
    }
  });
</script>

<style scoped>
  .ft-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }
  .ft-alert { margin-bottom: 16px; }
  .ft-panels {
    display: grid;
    grid-template-columns: 1fr 1fr 1.2fr;
    gap: 12px;
    min-height: 320px;
    padding: 16px;
  }
  .ft-panel { border: 1px solid #eef2f8; border-radius: 12px; padding: 12px; background: #fff; }
  .panel-title { font-weight: 600; margin-bottom: 12px; }
  .ft-item { padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; margin-bottom: 6px; }
  .ft-item.active { background: #ecf5fc; color: #1e6f9f; }
  .snippet { font-size: 13px; line-height: 1.6; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #eee; }
  .snippet-text :deep(em), .snippet-text :deep(mark) { color: #c0392b; font-weight: 600; font-style: normal; }
  .empty { color: #999; font-size: 13px; padding: 16px; }
</style>
