<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page">
      <div class="hrams-v2-card ft-toolbar">
        <el-input v-model="keyword" placeholder="关键字" style="max-width:360px" @keyup.enter="doFulltext" />
        <el-button type="primary" :loading="loading" v-permission="'hrams:search:fulltext'" @click="doFulltext">检索</el-button>
        <el-tag v-if="ftData" :type="ftData.esEnabled ? 'success' : 'info'">
          {{ ftData.esEnabled ? 'ES 已启用' : 'Tika+库内正文' }}
        </el-tag>
        <span v-if="ftData" class="ft-count">{{ cards.length }} 条</span>
      </div>

      <div v-if="personChips.length > 1 || categoryChips.length > 1" class="hrams-v2-card ft-filters">
        <div v-if="personChips.length > 1" class="ft-filter-row">
          <span class="ft-filter-label">人员</span>
          <el-tag
            :type="ftPersonIdx == null ? 'primary' : 'info'"
            effect="plain"
            class="ft-chip"
            @click="ftPersonIdx = null"
          >全部</el-tag>
          <el-tag
            v-for="p in personChips"
            :key="p.personIndex"
            :type="ftPersonIdx === p.personIndex ? 'primary' : 'info'"
            effect="plain"
            class="ft-chip"
            @click="ftPersonIdx = p.personIndex"
          >{{ p.personName }} {{ p.total }}</el-tag>
        </div>
        <div v-if="categoryChips.length > 1" class="ft-filter-row">
          <span class="ft-filter-label">大类</span>
          <el-tag
            :type="!ftCat ? 'primary' : 'info'"
            effect="plain"
            class="ft-chip"
            @click="ftCat = ''"
          >全部</el-tag>
          <el-tag
            v-for="c in categoryChips"
            :key="c.categoryCode"
            :type="ftCat === c.categoryCode ? 'primary' : 'info'"
            effect="plain"
            class="ft-chip"
            @click="ftCat = c.categoryCode"
          >{{ c.categoryName }} {{ c.count }}</el-tag>
        </div>
      </div>

      <div v-if="ftData" class="ft-list">
        <div v-if="!cards.length" class="hrams-v2-card empty">暂无检索结果</div>
        <article v-for="(card, i) in cards" :key="card.key || i" class="hrams-v2-card ft-hit">
          <div class="ft-hit-head">
            <div class="ft-person">
              {{ card.personName || '未知人员' }}
              <span v-if="card.archiveNo" class="ft-archive">档号 {{ card.archiveNo }}</span>
            </div>
            <div class="ft-category">{{ card.categoryName || '未分类' }}</div>
          </div>
          <div class="ft-snippet" v-html="snippetHtml(card)" />
          <div class="ft-hit-foot">
            <el-button v-if="card.materialId" link type="primary" @click="previewMaterial(card.materialId)">查看详情</el-button>
          </div>
        </article>
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
  const ftData = ref(null);
  const ftPersonIdx = ref(null);
  const ftCat = ref('');
  const loading = ref(false);

  const personChips = computed(() => ftData.value?.personSummaries || []);

  const categoryChips = computed(() => {
    const people = personChips.value;
    const source = ftPersonIdx.value == null
      ? people
      : people.filter((p) => p.personIndex === ftPersonIdx.value);
    const map = new Map();
    source.forEach((p) => {
      (p.categories || []).forEach((c) => {
        const prev = map.get(c.categoryCode);
        map.set(c.categoryCode, {
          categoryCode: c.categoryCode,
          categoryName: c.categoryName || c.categoryCode,
          count: (prev?.count || 0) + (c.count || 0)
        });
      });
    });
    return [...map.values()];
  });

  const cards = computed(() => {
    const data = ftData.value;
    if (!data?.snippets?.length) return [];
    const people = data.personSummaries || [];
    return data.snippets.map((s, i) => {
      const person = people.find((p) => p.personIndex === s.personIndex) || {};
      const cat = (person.categories || []).find((c) => c.categoryCode === s.categoryCode);
      return {
        key: `${s.personIndex}-${s.materialId || i}`,
        personIndex: s.personIndex,
        personName: person.personName,
        archiveNo: person.archiveNo,
        categoryCode: s.categoryCode,
        categoryName: cat?.categoryName || s.categoryCode,
        materialId: s.materialId,
        text: s.text
      };
    }).filter((card) => {
      if (ftPersonIdx.value != null && card.personIndex !== ftPersonIdx.value) return false;
      if (ftCat.value && card.categoryCode !== ftCat.value) return false;
      return true;
    });
  });

  const snippetHtml = (s) => {
    let raw = s.text || '';
    raw = raw.replace(/【([^】]+)】/g, '<em>$1</em>');
    if (/<em>|<mark>/i.test(raw)) {
      return sanitizeHighlightHtml(raw);
    }
    const kw = keyword.value;
    if (!kw) return sanitizeHighlightHtml(raw);
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlighted = raw.replace(new RegExp(escaped, 'gi'), (m) => `<em>${m}</em>`);
    return sanitizeHighlightHtml(highlighted);
  };

  const doFulltext = async () => {
    if (!keyword.value?.trim()) {
      EleMessage.warning({ message: '请输入关键字', plain: true });
      return;
    }
    loading.value = true;
    try {
      const data = await fulltextSearch(keyword.value);
      ftData.value = data;
      ftCat.value = '';
      if (data.personSummaries?.length) {
        const pid = route.query.personId;
        if (pid) {
          const idx = data.personSummaries.findIndex((p) => String(p.personId) === String(pid));
          ftPersonIdx.value = idx >= 0 ? idx : null;
          if (idx < 0) {
            EleMessage.warning({ message: '未在检索结果中找到指定人员', plain: true });
          }
        } else {
          ftPersonIdx.value = null;
        }
      } else {
        ftPersonIdx.value = null;
        EleMessage.info({ message: data.message || '暂无检索结果', plain: true });
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
  .ft-count {
    margin-left: auto;
    font-size: 13px;
    color: #6c7e97;
  }
  .ft-filters {
    padding: 12px 20px;
    margin-bottom: 16px;
  }
  .ft-filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .ft-filter-row + .ft-filter-row {
    margin-top: 8px;
  }
  .ft-filter-label {
    width: 36px;
    font-size: 13px;
    color: #6c7e97;
  }
  .ft-chip {
    cursor: pointer;
  }
  .ft-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    overflow: auto;
    padding-bottom: 16px;
  }
  .ft-hit {
    padding: 16px 20px 12px;
  }
  .ft-hit-head {
    margin-bottom: 10px;
  }
  .ft-person {
    font-size: 16px;
    font-weight: 600;
    color: #1f2d3d;
  }
  .ft-archive {
    margin-left: 10px;
    font-size: 13px;
    font-weight: 400;
    color: #6c7e97;
  }
  .ft-category {
    margin-top: 4px;
    font-size: 13px;
    color: #3d6f9f;
  }
  .ft-snippet {
    font-size: 14px;
    line-height: 1.7;
    color: #3d4f63;
  }
  .ft-snippet :deep(em),
  .ft-snippet :deep(mark) {
    color: #c0392b;
    font-weight: 600;
    font-style: normal;
  }
  .ft-hit-foot {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
  .empty {
    color: #999;
    font-size: 13px;
    padding: 24px 20px;
  }
</style>
