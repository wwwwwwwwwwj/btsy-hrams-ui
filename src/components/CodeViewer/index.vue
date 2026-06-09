<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="ele-code-viewer" :class="{ 'is-dark': darkTheme }">
    <div class="ele-code-viewer-lines">
      <div v-for="n in codeLines" :key="n" class="ele-code-viewer-no">
        {{ n }}
      </div>
    </div>
    <pre><code class="hljs" v-html="codeHtml"></code></pre>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import hljs from 'highlight.js';
  import './style/index';

  defineOptions({ name: 'CodeViewer' });

  const props = defineProps({
    /** 代码内容 */
    code: String,
    /** 代码语言 */
    language: String,
    /** 是否为暗色主题 */
    darkTheme: {
      type: Boolean,
      default: true
    }
  });

  /** 代码行号 */
  const codeLines = ref([1]);

  /** 高亮后的代码 */
  const codeHtml = ref('');

  /** 高亮代码 */
  watch(
    [() => props.code, () => props.language],
    () => {
      const code = props.code;
      if (!code) {
        codeLines.value = [1];
        codeHtml.value = '';
        return;
      }
      codeLines.value = code.split('\n').map((_, i) => i + 1);
      codeHtml.value = hljs.highlight(code, {
        language: (props.language === 'vue' ? 'xml' : props.language) ?? 'xml'
      }).value;
    },
    { immediate: true }
  );
</script>
