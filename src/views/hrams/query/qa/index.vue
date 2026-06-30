<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page qa-page">
      <div class="hrams-v2-card qa-card">
        <div v-if="messages.length" class="qa-messages">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="['qa-msg', msg.role === 'user' ? 'qa-msg-user' : 'qa-msg-assistant']"
          >
            <div class="qa-msg-role">{{ msg.role === 'user' ? '我' : '助手' }}</div>
            <div class="qa-msg-body">{{ msg.content }}</div>
            <div v-if="msg.source" class="qa-source">来源：{{ sourceLabel(msg.source) }}</div>
            <div v-if="msg.refs?.length" class="qa-refs">
              <el-button
                v-for="(ref, ri) in msg.refs"
                :key="ri"
                link
                type="primary"
                size="small"
                @click="openRef(ref)"
              >
                {{ refLabel(ref) }}
              </el-button>
            </div>
          </div>
        </div>
        <el-input
          v-model="qaQuestion"
          type="textarea"
          :rows="3"
          placeholder="例如：当前在职干部多少人？借阅中有多少？"
          class="qa-input"
        />
        <div class="qa-actions">
          <el-button v-if="messages.length" @click="clearSession">清空会话</el-button>
          <el-button type="primary" :loading="loading" v-permission="'hrams:qa:chat'" @click="doQa">提问</el-button>
        </div>
        <div class="qa-samples">
          <span>示例：</span>
          <el-button v-for="s in samples" :key="s" link type="primary" :disabled="loading" @click="askSample(s)">{{ s }}</el-button>
        </div>
      </div>
    </div>
  </ele-page>
</template>

<script setup>
  import { onActivated, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { EleMessage } from 'ele-admin-plus';
  import { qaChat } from '@/api/hrams/query';
  import { previewMaterial } from '@/api/hrams/archive';
  import { HRAMS_QUERY_PERSON } from '@/utils/hrams-routes';
  import '../../styles/v2.scss';

  defineOptions({ name: 'HramsQueryQa' });
  const route = useRoute();
  const router = useRouter();
  const qaQuestion = ref('');
  const messages = ref([]);
  const loading = ref(false);
  let sessionGeneration = 0;
  const samples = ['当前在职干部多少人？', '统计在职干部中本科以上学历人数', '近三个月新增材料最多的干部', '50岁以下硕士学历干部'];

  const sourceLabel = (s) => (s === 'builtin' ? '内置统计' : s === 'llm' ? '外部模型' : s);

  const refLabel = (ref) => {
    if (ref.type === 'person') return `人员 #${ref.id}`;
    if (ref.type === 'material') return `材料 #${ref.id}`;
    return String(ref.id);
  };

  const openRef = (ref) => {
    if (ref.type === 'material' && ref.id) {
      previewMaterial(ref.id);
      return;
    }
    if (ref.type === 'person' && ref.id) {
      router.push({ path: HRAMS_QUERY_PERSON, query: { personId: String(ref.id) } });
    }
  };

  const clearSession = () => {
    sessionGeneration += 1;
    messages.value = [];
    qaQuestion.value = '';
    loading.value = false;
  };

  const askSample = (text) => {
    qaQuestion.value = text;
    doQa();
  };

  const applyRoutePrefill = () => {
    const q = route.query.q || route.query.question;
    if (q) {
      qaQuestion.value = String(q);
    }
    const name = route.query.name;
    const archiveNo = route.query.archiveNo;
    if (!q && (name || archiveNo)) {
      qaQuestion.value = `关于干部 ${archiveNo || ''} ${name || ''} 的档案情况？`.trim();
    }
  };

  const doQa = async () => {
    if (loading.value) {
      return;
    }
    const text = qaQuestion.value?.trim();
    if (!text) {
      EleMessage.warning({ message: '请输入问题', plain: true });
      return;
    }
    loading.value = true;
    const turn = sessionGeneration;
    messages.value.push({ role: 'user', content: text });
    qaQuestion.value = '';
    try {
      const history = messages.value
        .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.source !== 'error'))
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));
      const data = await qaChat(text, history);
      if (turn !== sessionGeneration) {
        return;
      }
      messages.value.push({
        role: 'assistant',
        content: data.answer || '',
        source: data.source || '',
        refs: data.refs || []
      });
    } catch (e) {
      if (turn !== sessionGeneration) {
        return;
      }
      messages.value.push({
        role: 'assistant',
        content: e.message || '请求失败',
        source: 'error'
      });
      EleMessage.error({ message: e.message || '问答失败', plain: true });
    } finally {
      if (turn === sessionGeneration) {
        loading.value = false;
      }
    }
  };

  onMounted(applyRoutePrefill);
  onActivated(applyRoutePrefill);
  watch(
    () => route.query,
    () => applyRoutePrefill(),
    { deep: true }
  );
</script>

<style scoped>
  .qa-card {
    padding: 20px 24px;
    max-width: 800px;
  }
  .qa-messages {
    max-height: 360px;
    overflow-y: auto;
    margin-bottom: 16px;
    padding-right: 4px;
  }
  .qa-msg {
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #f9fbfe;
  }
  .qa-msg-user {
    background: #ecf5fc;
  }
  .qa-msg-role {
    font-size: 12px;
    color: #6c7e97;
    margin-bottom: 6px;
  }
  .qa-msg-body {
    line-height: 1.7;
    font-size: 14px;
    white-space: pre-wrap;
  }
  .qa-source {
    margin-top: 8px;
    font-size: 12px;
    color: #888;
  }
  .qa-refs {
    margin-top: 8px;
  }
  .qa-input {
    max-width: 100%;
  }
  .qa-actions {
    margin-top: 12px;
  }
  .qa-samples {
    margin-top: 10px;
    font-size: 13px;
    color: #666;
  }
</style>
