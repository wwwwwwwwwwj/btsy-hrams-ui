<template>
  <ele-page hide-footer>
    <ele-card header="智能问答">
      <el-input v-model="qaQuestion" type="textarea" :rows="4" placeholder="例如：当前在职干部多少人？借阅中有多少？" style="max-width:560px" />
      <div style="margin-top:12px">
        <el-button type="primary" v-permission="'hrams:qa:chat'" @click="doQa">提问</el-button>
      </div>
      <div class="qa-samples">
        <span>示例：</span>
        <el-button v-for="s in samples" :key="s" link type="primary" @click="askSample(s)">{{ s }}</el-button>
      </div>
      <el-card v-if="qaAnswer" shadow="never" style="margin-top:16px;max-width:640px">
        <div class="qa-answer">{{ qaAnswer }}</div>
        <div v-if="qaSource" class="qa-source">来源：{{ qaSource }}</div>
      </el-card>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { qaChat } from '@/api/hrams/query';

  defineOptions({ name: 'HramsQueryQa' });
  const qaQuestion = ref('');
  const qaAnswer = ref('');
  const qaSource = ref('');
  const samples = ['当前在职干部多少人？', '统计在职干部中本科以上学历人数', '近三个月新增材料最多的干部', '50岁以下硕士学历干部'];

  const askSample = (text) => {
    qaQuestion.value = text;
    doQa();
  };

  const doQa = async () => {
    const data = await qaChat(qaQuestion.value);
    qaAnswer.value = data.answer || '';
    qaSource.value = data.source || '';
  };
</script>

<style scoped>
  .qa-answer { line-height: 1.7; font-size: 14px; }
  .qa-source { margin-top: 8px; font-size: 12px; color: #888; }
  .qa-samples { margin-top: 10px; font-size: 13px; color: #666; }
</style>
